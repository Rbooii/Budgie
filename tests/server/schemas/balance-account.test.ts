import { describe, it, expect } from "vitest";
import {
  CreateBalanceAccountSchema,
  ReorderBalanceAccountsSchema,
  UpdateBalanceAccountSchema,
} from "@/server/schemas/balance-account";

describe("CreateBalanceAccountSchema", () => {
  it("accepts a valid account", () => {
    const parsed = CreateBalanceAccountSchema.parse({
      name: "BCA",
      balance: 1500000,
      currency: "IDR",
      type: "bank",
    });
    expect(parsed.name).toBe("BCA");
    expect(parsed.balance).toBe(1500000);
  });

  it("rejects missing name", () => {
    expect(() =>
      CreateBalanceAccountSchema.parse({ balance: 0, currency: "IDR", type: "cash" }),
    ).toThrow();
  });

  it("accepts missing balance (Prisma default 0)", () => {
    const parsed = CreateBalanceAccountSchema.parse({
      name: "X",
      currency: "IDR",
      type: "cash",
    });
    expect(parsed.name).toBe("X");
  });

  it("accepts missing currency (Prisma default IDR)", () => {
    const parsed = CreateBalanceAccountSchema.parse({
      name: "X",
      balance: 0,
      type: "cash",
    });
    expect(parsed.name).toBe("X");
  });

  it("rejects missing type", () => {
    expect(() =>
      CreateBalanceAccountSchema.parse({ name: "X", balance: 0, currency: "IDR" }),
    ).toThrow();
  });
});

describe("UpdateBalanceAccountSchema", () => {
  it("accepts a full update payload", () => {
    const parsed = UpdateBalanceAccountSchema.parse({
      name: "Renamed",
      balance: 2000,
      currency: "USD",
      type: "investment",
    });
    expect(parsed.name).toBe("Renamed");
    expect(parsed.currency).toBe("USD");
  });

  it("rejects a partial update (all fields required)", () => {
    expect(() => UpdateBalanceAccountSchema.parse({ name: "Only name" })).toThrow();
  });

  it("rejects missing balance on update", () => {
    expect(() =>
      UpdateBalanceAccountSchema.parse({ name: "X", currency: "IDR", type: "bank" }),
    ).toThrow();
  });
});

describe("ReorderBalanceAccountsSchema", () => {
  it("accepts a non-empty id order", () => {
    expect(
      ReorderBalanceAccountsSchema.parse({ ids: ["acc-2", "acc-1"] }),
    ).toEqual({ ids: ["acc-2", "acc-1"] });
  });

  it("rejects an empty order", () => {
    expect(() => ReorderBalanceAccountsSchema.parse({ ids: [] })).toThrow();
  });

  it("rejects empty ids", () => {
    expect(() =>
      ReorderBalanceAccountsSchema.parse({ ids: ["acc-1", ""] }),
    ).toThrow();
  });
});
