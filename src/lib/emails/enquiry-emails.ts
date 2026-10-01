// The two messages a submitted enquiry produces: one into the college's
// admissions inbox, one back to the applicant. Written as plain HTML with inline
// styles so it renders the same in every mail client, each with a matching
// plain-text version.
import { contact } from "@/data/courses";

export type EnquiryEmail = { subject: string; text: string; html: string };

export type EnquiryForEmail = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  campus: string;
  interest: string;
  message: string | null;
  receivedAt: Date;
};

const PURPLE = "#441282";
const GREEN = "#24a044";
const GOLD = "#f5be37";
const INK = "#29174a";
const MUTED = "#6f6883";
const LINE = "#e6e0f2";
const FONT = "Arial, Helvetica, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}

function wrap(subject: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f2eefa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2eefa;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${LINE};">
            <tr>
              <td style="background:${PURPLE};padding:26px 30px;">
                <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${GREEN};">
                  Creative Arts College
                </p>
                <h1 style="margin:10px 0 0;font-family:${FONT};font-size:23px;line-height:1.25;font-weight:bold;color:#ffffff;">
                  ${escapeHtml(subject)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;border-top:1px solid ${LINE};font-family:${FONT};font-size:12px;line-height:1.7;color:${MUTED};">
                ${escapeHtml(contact.phone)} &middot; ${escapeHtml(contact.website)}<br />
                ${contact.campuses.map((campus) => escapeHtml(`${campus.city}: ${campus.address}`)).join("<br />")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};white-space:nowrap;padding-right:16px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:15px;font-weight:bold;color:${INK};">${escapeHtml(value)}</td>
  </tr>`;
}

function detailsTable(enquiry: EnquiryForEmail): string {
  const rows = [
    detail("Name", enquiry.fullName),
    detail("Email", enquiry.email),
    detail("Mobile", enquiry.phone),
    detail("Course", enquiry.interest),
    detail("Campus", enquiry.campus),
    detail("Received", formatDate(enquiry.receivedAt)),
    detail("Reference", enquiry.reference),
  ].join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};margin:22px 0;">${rows}</table>`;
}

/** Notification into the college's own inbox. */
export function teamEnquiryEmail(enquiry: EnquiryForEmail): EnquiryEmail {
  const subject = `New enquiry: ${enquiry.fullName} — ${enquiry.interest}`;

  const body = `
    <p style="margin:0;">A new enquiry came through on the website and is saved in the dashboard.</p>
    ${detailsTable(enquiry)}
    ${
      enquiry.message
        ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Message</p>
           <div style="background:#f7f4fd;border-left:4px solid ${GREEN};padding:14px 16px;font-family:${FONT};font-size:15px;color:${INK};">
             ${escapeHtml(enquiry.message)}
           </div>`
        : ""
    }
    <p style="margin:24px 0 0;">
      <a href="mailto:${escapeHtml(enquiry.email)}?subject=Your%20enquiry%20with%20Creative%20Arts%20College"
         style="display:inline-block;background:${PURPLE};color:#ffffff;text-decoration:none;font-family:${FONT};font-size:14px;font-weight:bold;padding:13px 24px;border-radius:999px;">
        Reply to ${escapeHtml(enquiry.fullName.split(" ")[0] || "this applicant")}
      </a>
    </p>`;

  const text = [
    "NEW ENQUIRY",
    "",
    `Name: ${enquiry.fullName}`,
    `Email: ${enquiry.email}`,
    `Mobile: ${enquiry.phone}`,
    `Course: ${enquiry.interest}`,
    `Campus: ${enquiry.campus}`,
    `Received: ${formatDate(enquiry.receivedAt)}`,
    `Reference: ${enquiry.reference}`,
    enquiry.message ? `Message: ${enquiry.message}` : "",
    "",
    `Reply to: ${enquiry.email}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: wrap(subject, body) };
}

/** Confirmation back to the applicant. */
export function applicantEnquiryEmail(enquiry: EnquiryForEmail): EnquiryEmail {
  const subject = "We've received your enquiry";
  const firstName = enquiry.fullName.split(" ")[0] || "there";

  const body = `
    <p style="margin:0;">Hi ${escapeHtml(firstName)}, thank you for getting in touch about
      <strong>${escapeHtml(enquiry.interest)}</strong> at Creative Arts College.</p>
    <p style="margin:18px 0 0;">Here's what happens next:</p>
    <ol style="margin:10px 0 0;padding-left:20px;font-family:${FONT};font-size:15px;line-height:1.7;color:${INK};">
      <li>An advisor reviews your enquiry — usually the same working day.</li>
      <li>You get the full fee sheet, intake dates and registration deposit for your course.</li>
      <li>Your seat is held until the deposit is paid. Places are limited each intake.</li>
    </ol>
    <p style="margin:26px 0 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Your enquiry</p>
    ${detailsTable(enquiry)}
    <p style="margin:0;background:${GOLD};color:${INK};padding:14px 16px;border-radius:12px;font-family:${FONT};font-size:14px;">
      In a hurry? Call <strong>${escapeHtml(contact.phone)}</strong> and quote reference
      <strong>${escapeHtml(enquiry.reference)}</strong>.
    </p>
    <p style="margin:22px 0 0;">We look forward to welcoming you.</p>
    <p style="margin:6px 0 0;font-weight:bold;">The Creative Arts College team</p>`;

  const text = [
    `Hi ${firstName},`,
    "",
    `Thank you for getting in touch about ${enquiry.interest} at Creative Arts College.`,
    "",
    "What happens next:",
    "1. An advisor reviews your enquiry - usually the same working day.",
    "2. You get the full fee sheet, intake dates and registration deposit for your course.",
    "3. Your seat is held until the deposit is paid. Places are limited each intake.",
    "",
    "YOUR ENQUIRY",
    `Name: ${enquiry.fullName}`,
    `Course: ${enquiry.interest}`,
    `Campus: ${enquiry.campus}`,
    `Received: ${formatDate(enquiry.receivedAt)}`,
    `Reference: ${enquiry.reference}`,
    "",
    `In a hurry? Call ${contact.phone} and quote reference ${enquiry.reference}.`,
    "",
    "The Creative Arts College team",
    `${contact.phone} | ${contact.website}`,
  ].join("\n");

  return { subject, text, html: wrap(subject, body) };
}
