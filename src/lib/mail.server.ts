// Mail leaves the site over plain SMTP using the college's own mail account on
// their hosting. Nothing here is tied to a particular provider or to this
// platform: point the SMTP_* settings at any mail server and the same code keeps
// working. Sending is never allowed to break a feature — a failed send is
// reported back and logged, it is never thrown.
import nodemailer from "nodemailer";

const SITE_NAME = "Creative Arts College";

export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "send_failed" };

type Settings = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
};

function settings(): Settings | null {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  if (!host || !user || !pass) return null;

  const port = Number(process.env["SMTP_PORT"] ?? 465);
  const secureFlag = process.env["SMTP_SECURE"];

  return {
    host,
    port,
    secure: secureFlag ? secureFlag === "true" : port === 465,
    auth: { user, pass },
    from: process.env["SMTP_FROM"] ?? `"${SITE_NAME}" <${user}>`,
  };
}

/** True once the mail account settings are present. */
export function mailConfigured(): boolean {
  return settings() !== null;
}

/**
 * Who gets team notifications: active staff ticked "Email notifications" on the
 * Staff screen. ADMISSIONS_EMAIL is only a fallback when nobody is ticked.
 */
export async function teamRecipients(): Promise<Array<string>> {
  try {
    const { callData } = await import("./data.server");
    const selected = (await callData<string[]>("app_list_notification_recipients")) ?? [];
    if (selected.length > 0) return selected;
  } catch (error) {
    console.error("[mail] couldn't read notification recipients:", error);
  }
  return (process.env["ADMISSIONS_EMAIL"] ?? "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
}

export async function sendMail(mail: OutgoingMail): Promise<SendResult> {
  const config = settings();

  if (!config) {
    console.warn("[mail] SMTP is not configured — skipped:", mail.subject);
    return { sent: false, reason: "not_configured" };
  }

  // One short-lived connection per message: nothing is pooled between requests.
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
  });

  try {
    await transport.sendMail({ from: config.from, ...mail });
    return { sent: true };
  } catch (error) {
    console.error("[mail] send failed:", error);
    return { sent: false, reason: "send_failed" };
  } finally {
    transport.close();
  }
}
