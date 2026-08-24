import { createFileRoute } from "@tanstack/react-router";

import { fetchEmailBody, htmlToText } from "@/lib/settleside.notify";
import { ingestInboundQuote } from "@/lib/settleside.server";

/**
 * Receives a provider's emailed quote and runs the rest of the pipeline
 * automatically: normalise, compare, redraft the customer reply, notify.
 *
 * Accepts two shapes:
 *
 * 1. Resend's `email.received` webhook. It carries metadata only, so the body
 *    is fetched with `GET /emails/{id}` (needs an API key with read access -
 *    a send-only key cannot do this).
 * 2. A plain `{ to | inquiryId, from, subject, text }` body, so any other
 *    inbound service or a manual forward works too.
 *
 * The move is identified by the `+` part of the recipient address
 * (quotes+ss-2026...@settleside.com) or an explicit `inquiryId`.
 *
 * Protected by a shared secret - send `x-settleside-secret`, or append
 * `?secret=` to the webhook URL where the provider cannot set headers.
 */
function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function inquiryIdFromAddress(address: string) {
  // quotes+ss-20260824-abc123@settleside.com -> ss-20260824-abc123
  const match = address.match(/\+([^@\s>]+)@/);
  return match ? match[1] : "";
}

type Normalized = { inquiryId: string; from: string; subject: string; text: string };

async function normalizePayload(body: Record<string, unknown>): Promise<Normalized | null> {
  // Resend: { type: "email.received", data: { email_id, from, to[], subject, ... } }
  if (body.type === "email.received" && body.data && typeof body.data === "object") {
    const data = body.data as Record<string, unknown>;
    const recipients = [
      ...(Array.isArray(data.to) ? (data.to as string[]) : []),
      ...(Array.isArray(data.received_for) ? (data.received_for as string[]) : []),
    ];

    const inquiryId = recipients.map(inquiryIdFromAddress).find(Boolean) ?? "";

    // Resend inlines the body on some plans and sends metadata only on others,
    // so read it from the payload first and only call back for it when absent.
    const inline = ["text", "plain", "body", "stripped_text"]
      .map((key) => (typeof data[key] === "string" ? (data[key] as string) : ""))
      .find((value) => value.trim());

    let text = inline ?? "";
    if (!text.trim() && typeof data.html === "string" && data.html.trim()) {
      text = htmlToText(data.html);
    }
    if (!text.trim() && typeof data.email_id === "string") {
      text = await fetchEmailBody(data.email_id);
    }

    if (!text.trim()) {
      // Log the shape (keys only - the values carry customer data) so an
      // unexpected payload is diagnosable without another deploy.
      console.error(
        "SettleSide inbound payload had no body. data keys:",
        Object.keys(data).join(","),
        "| email_id:",
        typeof data.email_id === "string" ? data.email_id : "(none)",
      );
    }

    return {
      inquiryId,
      from: typeof data.from === "string" ? data.from : "",
      subject: typeof data.subject === "string" ? data.subject : "",
      text,
    };
  }

  // Any other inbound service, or a manual forward.
  const text = typeof body.text === "string" ? body.text : "";
  const to = typeof body.to === "string" ? body.to : "";
  const explicit = typeof body.inquiryId === "string" ? body.inquiryId : "";

  return {
    inquiryId: explicit || inquiryIdFromAddress(to),
    from: typeof body.from === "string" ? body.from : "",
    subject: typeof body.subject === "string" ? body.subject : "",
    text,
  };
}

export const Route = createFileRoute("/api/inbound/quotes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SETTLESIDE_INBOUND_SECRET;
        if (!expected) {
          return jsonError("Inbound quotes are not enabled on this server.", 503);
        }

        const url = new URL(request.url);
        const provided =
          request.headers.get("x-settleside-secret") ?? url.searchParams.get("secret") ?? "";
        if (provided !== expected) {
          return jsonError("Invalid inbound secret.", 401);
        }

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonError("Body must be valid JSON.", 400);
        }

        try {
          const payload = await normalizePayload(body);

          if (!payload?.inquiryId) {
            return jsonError("Could not determine which move this quote belongs to.", 422);
          }

          if (!payload.text.trim()) {
            // Nothing to read: acknowledge so the sender does not retry forever.
            console.error("SettleSide inbound quote had no readable body:", payload.inquiryId);
            return Response.json({ ok: false, reason: "empty-body", id: payload.inquiryId });
          }

          const result = await ingestInboundQuote(payload);

          if (!result.ok) {
            return jsonError(`Inquiry "${payload.inquiryId}" was not found.`, 404);
          }

          return Response.json({
            ok: true,
            id: result.inquiry.id,
            stage: result.inquiry.stage,
            quotes: result.inquiry.quoteComparison?.quotes.length ?? 0,
          });
        } catch (error) {
          console.error(error);
          return jsonError("Unable to ingest that quote right now.", 500);
        }
      },
    },
  },
});
