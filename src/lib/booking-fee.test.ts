import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOKING_FEE } from "./booking-fee";
import { buildCheckout } from "./payfast.server";

test("the global online booking fee is R500", () => {
  assert.equal(BOOKING_FEE, 500);
});

test("PayFast cannot charge a course deposit instead of the booking fee", () => {
  const checkout = buildCheckout({ paymentId: "test", itemName: "Sound Engineering", fullName: "Test Student", email: "test@example.com", siteUrl: "https://example.com", amount: 30000 } as Parameters<typeof buildCheckout>[0]);
  assert.equal(new Map(checkout.fields).get("amount"), "500.00");
});