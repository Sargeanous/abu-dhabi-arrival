import "@tanstack/react-start/server-only";

import type { InquiryRecord } from "./settleside.schemas";

export function isNotifyConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.SETTLESIDE_NOTIFY_EMAIL);
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
    ${row("Route", `${inquiry.origin || "Unknown"} to ${inquiry.destination}`)}
    ${row("Move date", inquiry.moveDate)}
    ${row("Household", inquiry.household)}
    ${row("Status", inquiry.status)}
    ${row("Pet", inquiry.pet)}
    ${row("Help with", inquiry.help.join(", "))}
    ${row("Message", inquiry.message)}
  </table>
  <p style="margin:16px 0 0;color:#666;font-size:13px;">Review it in the SettleSide admin console.</p>
</div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) {
    console.error(
      "SettleSide inquiry notification failed:",
      response.status,
      await response.text(),
    );
    return false;
  }

  return true;
}
