import "@tanstack/react-start/server-only";

import type { InquiryRecord } from "./settleside.schemas";

export function isNotifyConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.SETTLESIDE_NOTIFY_EMAIL);
}

// Customer-facing mail needs a verified sending domain in Resend. Until
// SETTLESIDE_NOTIFY_FROM points at a verified domain, Resend only delivers to
// the account owner, so customer confirmations stay off rather than bouncing.
export function isCustomerMailConfigured() {
  const from = process.env.SETTLESIDE_NOTIFY_FROM ?? "";
  return Boolean(process.env.RESEND_API_KEY) && from.length > 0 && !from.includes("resend.dev");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function row(label: string, value: string) {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`;
}

async function sendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  label: string;
  replyTo?: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    console.error(
      `SettleSide ${payload.label} email failed:`,
      response.status,
      await response.text(),
    );
    return false;
  }

  return true;
}

/* ---------- Automated pipeline mail ---------- */

/**
 * Resend's email.received webhook carries metadata only, so the body is
 * fetched separately. Needs an API key with read access - a send-only
 * restricted key returns 401 here.
 */
export async function fetchEmailBody(emailId: string) {
  if (!process.env.RESEND_API_KEY) return "";

  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });

  if (!response.ok) {
    console.error(
      "SettleSide could not fetch inbound email body:",
      response.status,
      (await response.text()).slice(0, 200),
    );
    return "";
  }

  const email = (await response.json()) as { text?: string | null; html?: string | null };
  if (email.text) return email.text;
  if (email.html) {
    // Crude tag strip is enough: the AI reads prose, not markup.
    return email.html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
  }
  return "";
}

// Providers reply to a per-inquiry address so replies route back automatically.
export function quotesReplyAddress(inquiryId: string) {
  const domain = (process.env.SETTLESIDE_QUOTES_DOMAIN ?? "").trim();
  if (!domain) return "";
  return `quotes+${inquiryId}@${domain}`;
}

function textToHtml(text: string) {
  return escapeHtml(text).replaceAll("\n", "<br/>");
}

export async function sendProviderBrief(options: {
  to: string;
  providerName: string;
  subject: string;
  message: string;
  inquiryId: string;
}) {
  if (!isCustomerMailConfigured()) return false;

  const replyTo = quotesReplyAddress(options.inquiryId);
  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;color:#1a1a1a;font-size:14px;line-height:1.6;">
  ${textToHtml(options.message)}
  ${
    replyTo
      ? `<p style="margin:20px 0 0;font-size:12px;color:#888;">Reply to this email with your quote and it will reach the file for this move directly.</p>`
      : ""
  }
</div>`;

  return sendEmail({
    from: process.env.SETTLESIDE_NOTIFY_FROM as string,
    to: options.to,
    subject: options.subject,
    html,
    label: "provider brief",
    replyTo: replyTo || undefined,
  });
}

export async function sendReviewReady(record: InquiryRecord) {
  if (!isNotifyConfigured()) return false;

  const quotes = record.quoteComparison?.quotes ?? [];
  const rows = quotes
    .map(
      (quote) =>
        `<tr><td style="padding:4px 12px 4px 0;">${escapeHtml(quote.provider)}</td><td style="padding:4px 0;"><strong>${escapeHtml(quote.price)}</strong></td></tr>`,
    )
    .join("");

  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;color:#1a1a1a;">
  <h2 style="margin:0 0 6px;font-size:20px;">Quotes are in and the reply is drafted</h2>
  <p style="margin:0 0 16px;color:#666;">
    ${escapeHtml(record.inquiry.name)} &middot; ${escapeHtml(record.inquiry.origin || "Unknown")} to ${escapeHtml(record.inquiry.destination)} &middot; ${escapeHtml(record.id)}
  </p>
  <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">${rows}</table>
  ${
    record.recommendation
      ? `<p style="margin:0 0 8px;"><strong>Recommended: ${escapeHtml(record.recommendation.pick)}</strong></p>
         <p style="margin:0 0 16px;color:#444;font-size:14px;">${escapeHtml(record.recommendation.reasoning)}</p>
         <div style="padding:14px;background:#f7f7f5;border-left:3px solid #1a7f7f;font-size:13px;line-height:1.6;">
           ${textToHtml(record.recommendation.customerMessage)}
         </div>`
      : ""
  }
  <p style="margin:20px 0 0;font-size:14px;">
    Open the move desk in the admin console to approve and send it.
  </p>
</div>`;

  return sendEmail({
    from: process.env.SETTLESIDE_NOTIFY_FROM || "SettleSide <onboarding@resend.dev>",
    to: process.env.SETTLESIDE_NOTIFY_EMAIL as string,
    subject: `Ready to send: ${record.inquiry.name} — ${quotes.length} quote(s) in`,
    html,
    label: "review ready",
  });
}

export async function sendCustomerReply(record: InquiryRecord) {
  if (!isCustomerMailConfigured()) return false;
  if (!record.recommendation || !record.inquiry.email) return false;

  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;color:#1a1a1a;font-size:14px;line-height:1.6;">
  ${textToHtml(record.recommendation.customerMessage)}
  <p style="margin:24px 0 0;font-size:12px;color:#888;">
    Reference ${escapeHtml(record.id)} &middot; SettleSide &middot; settleside.com
  </p>
</div>`;

  return sendEmail({
    from: process.env.SETTLESIDE_NOTIFY_FROM as string,
    to: record.inquiry.email,
    subject: `Your quotes for ${record.inquiry.destination}`,
    html,
    label: "customer reply",
  });
}

export async function sendCustomerConfirmation(record: InquiryRecord) {
  if (!isCustomerMailConfigured()) return false;

  const { inquiry, plan } = record;
  const to = inquiry.email;
  if (!to) return false;

  const taskRows = plan.tasks
    .map(
      (task, index) => `
      <tr>
        <td style="padding:10px 12px 10px 0;vertical-align:top;color:#1a7f7f;font-weight:600;">${index + 1}</td>
        <td style="padding:10px 0;vertical-align:top;">
          <div style="font-weight:600;color:#1a1a1a;">${escapeHtml(task.title)}</div>
          <div style="margin-top:3px;font-size:13px;color:#666;">
            ${escapeHtml(task.timing)} &middot; ${
              task.owner === "SettleSide" ? "We handle it" : escapeHtml(task.owner)
            } &middot; ${escapeHtml(task.category)}
          </div>
        </td>
      </tr>`,
    )
    .join("");

  const services = record.matchedServices
    .map(
      (service) =>
        `<li style="margin-bottom:6px;"><strong>${escapeHtml(service.category)}</strong> &mdash; ${escapeHtml(
          service.providers,
        )}, ${escapeHtml(service.leadTime)}</li>`,
    )
    .join("");

  const html = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;color:#1a1a1a;">
  <h2 style="margin:0 0 6px;font-size:22px;">Your move plan is ready${
    inquiry.name ? `, ${escapeHtml(inquiry.name.split(" ")[0])}` : ""
  }</h2>
  <p style="margin:0 0 20px;color:#555;">${escapeHtml(plan.summary)}</p>

  <h3 style="margin:24px 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;color:#666;">Your timeline</h3>
  <table style="border-collapse:collapse;width:100%;font-size:14px;">${taskRows}</table>

  ${
    services
      ? `<h3 style="margin:28px 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;color:#666;">Vetted providers matched to your move</h3>
         <ul style="margin:0;padding-left:18px;font-size:14px;color:#333;">${services}</ul>`
      : ""
  }

  <div style="margin:28px 0 0;padding:16px;background:#f0f7f7;border-left:3px solid #1a7f7f;">
    <p style="margin:0 0 8px;font-weight:600;">Want us to run this for you?</p>
    <p style="margin:0;font-size:14px;color:#444;">
      This plan is yours to keep and use. If you'd rather not chase fifteen providers while starting
      a new job, we can collect comparable quotes, book everything, and coordinate through move-in
      day. We'll reach out within one business day with options and pricing.
    </p>
  </div>

  <p style="margin:24px 0 0;font-size:12px;color:#888;">
    Reference ${escapeHtml(record.id)} &middot; SettleSide &middot; settleside.com
  </p>
</div>`;

  return sendEmail({
    from: process.env.SETTLESIDE_NOTIFY_FROM as string,
    to,
    subject: `Your move plan for ${inquiry.destination}`,
    html,
    label: "customer confirmation",
  });
}

export async function sendInquiryNotification(record: InquiryRecord) {
  if (!isNotifyConfigured()) return false;

  const to = process.env.SETTLESIDE_NOTIFY_EMAIL as string;
  const from = process.env.SETTLESIDE_NOTIFY_FROM || "SettleSide <onboarding@resend.dev>";
  const { inquiry, adminSummary } = record;

  const subject = `New move inquiry: ${inquiry.name} to ${inquiry.destination}${
    adminSummary ? ` (${adminSummary.urgency} urgency)` : ""
  }`;

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:560px;">
  <h2 style="margin:0 0 4px;">New move inquiry</h2>
  <p style="margin:0 0 16px;color:#666;">${escapeHtml(record.id)} - ${escapeHtml(
    new Date(record.createdAt).toUTCString(),
  )}</p>
  ${
    adminSummary
      ? `<p style="margin:0 0 16px;padding:12px;background:#f0f7f7;border-left:3px solid #1a7f7f;">
          <strong>${escapeHtml(adminSummary.urgency.toUpperCase())} URGENCY.</strong>
          ${escapeHtml(adminSummary.headline)}<br/>
          <strong>Next:</strong> ${escapeHtml(adminSummary.nextAction)}
        </p>`
      : ""
  }
  <table style="border-collapse:collapse;font-size:14px;">
    ${row("Name", inquiry.name)}
    ${row("Email", inquiry.email)}
    ${row("WhatsApp", inquiry.whatsapp)}
    ${row("Prefers", inquiry.contactPreference)}
    ${row("Best time", inquiry.bestTime)}
    ${row("Route", `${inquiry.origin || "Unknown"} to ${inquiry.destination}`)}
    ${row("Area", inquiry.destinationArea)}
    ${row("Move date", [inquiry.moveDate, inquiry.dateFlexibility].filter(Boolean).join(" · "))}
    ${row(
      "Property",
      [
        inquiry.originProperty && `from ${inquiry.originProperty}`,
        inquiry.destinationProperty && `to ${inquiry.destinationProperty}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )}
    ${row("Access out", inquiry.originAccess)}
    ${row("Access in", inquiry.destinationAccess)}
    ${row("Inventory", inquiry.inventory)}
    ${row("Special items", inquiry.specialItems)}
    ${row("Packing", inquiry.packing)}
    ${row("Storage", inquiry.storage)}
    ${row(
      "Household",
      [
        inquiry.household,
        inquiry.adults && `${inquiry.adults} adult(s)`,
        inquiry.children && `${inquiry.children} child(ren)`,
        inquiry.childrenAges && `ages ${inquiry.childrenAges}`,
      ]
        .filter(Boolean)
        .join(" · "),
    )}
    ${row("Pet", [inquiry.pet, inquiry.petDetails].filter((v) => v && v !== "no").join(" · "))}
    ${row("Process", inquiry.status)}
    ${row("Visa", inquiry.visaStatus)}
    ${row("Housing", inquiry.leaseStatus)}
    ${row("Employer covers", inquiry.employerSupport)}
    ${row("Budget", inquiry.budget)}
    ${row("Priority", inquiry.priority)}
    ${row("Help with", inquiry.help.join(", "))}
    ${row("Message", inquiry.message)}
  </table>
  <p style="margin:16px 0 0;color:#666;font-size:13px;">Review it in the SettleSide admin console.</p>
</div>`;

  return sendEmail({ from, to, subject, html, label: "inquiry notification" });
}
