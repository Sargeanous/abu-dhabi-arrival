import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { inboundQuoteSchema } from "@/lib/settleside.schemas";
import { ingestInboundQuote } from "@/lib/settleside.server";

/**
 * Receives a provider's emailed quote and runs the rest of the pipeline
 * automatically: normalise, compare, redraft the customer reply, notify.
 *
 * Provider-agnostic on purpose - point any inbound email service
 * (Cloudflare Email Workers, Mailgun/Postmark inbound routes, a mailbox
 * poller) at this endpoint with a JSON body:
 *   { "to": "quotes+ss-2026...@settleside.com", "from": "...", "subject": "...", "text": "..." }
 * Either `to` (carrying the inquiry id after the +) or an explicit
 * `inquiryId` identifies the move.
 *
 * Protected by a shared secret so the endpoint cannot be used to inject
 * quotes: send it as `x-settleside-secret` (or `?secret=`).
 */
function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function inquiryIdFromAddress(address: string) {
  // quotes+ss-20260824-abc123@settleside.com -> ss-20260824-abc123
  const match = address.match(/\+([^@\s>]+)@/);
  return match ? match[1] : "";
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

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("Body must be valid JSON.", 400);
        }

        try {
          const parsed = inboundQuoteSchema.parse(body);
          const inquiryId = parsed.inquiryId || inquiryIdFromAddress(parsed.to ?? "");

          if (!inquiryId) {
            return jsonError("Could not determine which move this quote belongs to.", 422);
          }

          const result = await ingestInboundQuote({
            inquiryId,
            from: parsed.from,
            subject: parsed.subject,
            text: parsed.text,
          });

          if (!result.ok) {
            return jsonError(`Inquiry "${inquiryId}" was not found.`, 404);
          }

          return Response.json({
            ok: true,
            id: result.inquiry.id,
            stage: result.inquiry.stage,
            quotes: result.inquiry.quoteComparison?.quotes.length ?? 0,
          });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid inbound payload.");
          }

          console.error(error);
          return jsonError("Unable to ingest that quote right now.", 500);
        }
      },
    },
  },
});
