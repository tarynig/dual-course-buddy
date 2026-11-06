import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { paramString, sign } from "./payfast.server";

describe("PayFast signature", () => {
  it("encodes spaces as + and appends the passphrase before hashing", () => {
    const fields: Array<[string, string]> = [["amount", "1000.00"], ["item_name", "Deposit: Film (Dual)"]];
    expect(paramString(fields)).toBe("amount=1000.00&item_name=Deposit%3A+Film+%28Dual%29");
    const expected = createHash("md5")
      .update("amount=1000.00&item_name=Deposit%3A+Film+%28Dual%29&passphrase=secret+pass")
      .digest("hex");
    expect(sign(fields, "secret pass")).toBe(expected);
  });

  it("leaves out empty fields", () => {
    expect(paramString([["name_last", ""], ["amount", "5.00"]])).toBe("amount=5.00");
  });
});
