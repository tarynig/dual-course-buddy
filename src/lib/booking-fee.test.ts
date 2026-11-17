import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOKING_FEE } from "./booking-fee";
import { buildCheckout } from "./payfast.server";
import { dueNowAmount, type PaymentPlan } from "@/data/courses";

test("the global online booking fee is R500", () => {
  assert.equal(BOOKING_FEE, 500);
});

test("PayFast charges the server-derived amount it is given", () => {
  const checkout = buildCheckout({
    paymentId: "test",
    itemName: "Due now payment: Sound Engineering",
    amount: 4950,
    fullName: "Test Student",
    email: "test@example.com",
    siteUrl: "https://example.com",
  });
  assert.equal(new Map(checkout.fields).get("amount"), "4950.00");
});

test("the Due now amount is the deposit for split plans and the full amount for once-off plans", () => {
  const base: PaymentPlan = { id: "p", name: "Plan", deposit: 0, instalments: 0, instalmentAmount: 0, notes: null };
  assert.equal(dueNowAmount({ ...base, deposit: 4_950, instalments: 10, instalmentAmount: 1_950 }), 4_950);
  assert.equal(dueNowAmount({ ...base, instalments: 1, instalmentAmount: 21_500 }), 21_500);
});
