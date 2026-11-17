import { test } from "node:test";
import assert from "node:assert/strict";
import { fromIsMonthly, fromPrice, type PaymentPlan } from "@/data/courses";

const plan = (over: Partial<PaymentPlan>): PaymentPlan => ({
  id: "p",
  name: "Plan",
  deposit: 0,
  instalments: 0,
  instalmentAmount: 0,
  notes: null,
  ...over,
});

test("from price is the lowest instalment, not the lowest total", () => {
  const plans = [
    // Cheapest total, but the highest monthly amount.
    plan({ id: "upfront", instalmentAmount: 21_500 }),
    // Split pay: lower monthly instalment.
    plan({ id: "split", deposit: 3_950, instalments: 10, instalmentAmount: 1_950 }),
  ];
  assert.equal(fromPrice(plans), 1_950);
  assert.equal(fromIsMonthly(plans), true);
});

test("once-off plans count as their full amount", () => {
  const plans = [plan({ id: "upfront", instalmentAmount: 19_500 })];
  assert.equal(fromPrice(plans), 19_500);
  assert.equal(fromIsMonthly(plans), false);
});

test("no plans means no from price", () => {
  assert.equal(fromPrice([]), null);
  assert.equal(fromIsMonthly([]), false);
});
