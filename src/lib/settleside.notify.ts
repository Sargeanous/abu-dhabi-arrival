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
