// PayFast (South Africa) — the only file that knows how PayFast works.
// Plain HTTPS form posts and an MD5 signature; no SDK. Settings come from the
// server's own environment:
//   PAYFAST_MODE         "live" for real payments, anything else = test (sandbox)
//   PAYFAST_MERCHANT_ID  PAYFAST_MERCHANT_KEY  PAYFAST_PASSPHRASE
// In test mode with no settings, PayFast's public sandbox account is used.
import { createHash } from "node:crypto";
import { BOOKING_FEE } from "./booking-fee";

const SANDBOX = { merchantId: "10000100", merchantKey: "46f0cd694581a", passphrase: "jt7NOE43FZPn" };

export function payfastConfig() {
  const live = process.env["PAYFAST_MODE"] === "live";
  const merchantId = process.env["PAYFAST_MERCHANT_ID"];
  const merchantKey = process.env["PAYFAST_MERCHANT_KEY"];
  const passphrase = process.env["PAYFAST_PASSPHRASE"] ?? "";
  const own = merchantId && merchantKey ? { merchantId, merchantKey, passphrase } : null;
  if (live && !own) return null;
  return {
    live,
    host: live ? "www.payfast.co.za" : "sandbox.payfast.co.za",
    ...(own ?? SANDBOX),
  };
}

// PHP urlencode style, which is what PayFast signs against.
function encode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");
}

export function paramString(fields: Array<[string, string]>): string {
  return fields
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encode(v)}`)
    .join("&");
}

export function sign(fields: Array<[string, string]>, passphrase: string): string {
  let s = paramString(fields);
  if (passphrase) s += `&passphrase=${encode(passphrase)}`;
  return createHash("md5").update(s).digest("hex");
}

export type CheckoutInput = {
  paymentId: string;
  itemName: string;
  fullName: string;
  email: string;
  siteUrl: string;
};

/** Fields the browser posts to PayFast's payment page. */
export function buildCheckout(input: CheckoutInput) {
  const config = payfastConfig();
  if (!config) throw new Error("PayFast live settings are missing");
  const [first, ...rest] = input.fullName.trim().split(/\s+/);
  const fields: Array<[string, string]> = [
    ["merchant_id", config.merchantId],
    ["merchant_key", config.merchantKey],
    ["return_url", `${input.siteUrl}/payment/success?ref=${input.paymentId}`],
    ["cancel_url", `${input.siteUrl}/payment/cancelled`],
    ["notify_url", `${input.siteUrl}/api/public/payfast/notify`],
    ["name_first", (first ?? "").slice(0, 100)],
    ["name_last", rest.join(" ").slice(0, 100)],
    ["email_address", input.email],
    ["m_payment_id", input.paymentId],
    ["amount", BOOKING_FEE.toFixed(2)],
    ["item_name", `Booking fee: ${input.itemName}`.slice(0, 100)],
  ];
  const signature = sign(fields, config.passphrase);
  return {
    action: `https://${config.host}/eng/process`,
    fields: [...fields.filter(([, v]) => v !== ""), ["signature", signature]] as Array<[string, string]>,
  };
}

/** Checks an incoming payment notification really came from PayFast. */
export async function verifyNotification(body: string): Promise<Record<string, string> | null> {
  const config = payfastConfig();
  if (!config) return null;
  const pairs = [...new URLSearchParams(body).entries()];
  const data = Object.fromEntries(pairs);
  const unsigned = pairs.filter(([k]) => k !== "signature");
  if (sign(unsigned, config.passphrase) !== data["signature"]) return null;

  // Ask PayFast to confirm the notification is genuine.
  try {
    const res = await fetch(`https://${config.host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramString(unsigned),
    });
    if ((await res.text()).trim() !== "VALID") return null;
  } catch (error) {
    console.error("[payfast] validate call failed:", error);
    return null;
  }
  return data;
}
