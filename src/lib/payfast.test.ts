import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { paramString, sign } from "./payfast.server";

test("PayFast signature encodes spaces as + and appends the passphrase", () => {
  const fields: Array<[string, string]> = [["amount", "1000.00"], ["item_name", "Deposit: Film (Dual)"]];
  assert.equal(paramString(fields), "amount=1000.00&item_name=Deposit%3A+Film+%28Dual%29");
  const expected = createHash("md5")
    .update("amount=1000.00&item_name=Deposit%3A+Film+%28Dual%29&passphrase=secret+pass")
    .digest("hex");
  assert.equal(sign(fields, "secret pass"), expected);
});

test("PayFast signature leaves out empty fields", () => {
  assert.equal(paramString([["name_last", ""], ["amount", "5.00"]]), "amount=5.00");
});
