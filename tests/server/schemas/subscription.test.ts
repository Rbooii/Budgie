import { describe, it, expect } from "vitest";
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
} from "@/server/schemas/subscription";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

const VALID_CREATE = {
  name: "Netflix",
  amount: 149000,
  category: "Entertainment",
  periodDays: 30,
  startDate: "2026-01-01T00:00:00.000Z",
};

describe("CreateSubscriptionSchema", () => {
  it("accepts a valid subscription", () => {
    const parsed = CreateSubscriptionSchema.parse(VALID_CREATE);
    expect(parsed.name).toBe("Netflix");
    expect(parsed.amount).toBe(149000);
    expect(parsed.periodDays).toBe(30);
    expect(parsed.startDate).toBeInstanceOf(Date);
  });

  it("defaults currency to IDR", () => {
    const parsed = CreateSubscriptionSchema.parse(VALID_CREATE);
    expect(parsed.currency).toBe("IDR");
  });

  it("defaults active to true", () => {
    const parsed = CreateSubscriptionSchema.parse(VALID_CREATE);
    expect(parsed.active).toBe(true);
  });

  it("accepts an explicit currency and active flag", () => {
    const parsed = CreateSubscriptionSchema.parse({
      ...VALID_CREATE,
      currency: "USD",
      active: false,
    });
    expect(parsed.currency).toBe("USD");
    expect(parsed.active).toBe(false);
  });

  it("accepts a Date object for startDate", () => {
    const parsed = CreateSubscriptionSchema.parse({
      ...VALID_CREATE,
      startDate: new Date("2026-01-01"),
    });
    expect(parsed.startDate).toBeInstanceOf(Date);
  });

  it("coerces a date-only string for startDate", () => {
    const parsed = CreateSubscriptionSchema.parse({
      ...VALID_CREATE,
      startDate: "2026-01-01",
    });
    expect(parsed.startDate).toBeInstanceOf(Date);
  });

  it("rejects a missing name", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, name: undefined }),
    ).toThrow();
  });

  it("rejects an empty name", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, name: "" }),
    ).toThrow();
  });

  it("rejects a missing amount", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, amount: undefined }),
    ).toThrow();
  });

  it("rejects non-positive amounts", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, amount: 0 }),
    ).toThrow();
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, amount: -1 }),
    ).toThrow();
  });

  it("rejects NaN amounts", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, amount: NaN }),
    ).toThrow();
  });

  it("rejects a non-string amount", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, amount: "149000" }),
    ).toThrow();
  });

  it("rejects a missing category", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, category: undefined }),
    ).toThrow();
  });

  it("rejects an income category (e.g. Salary)", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, category: "Salary" }),
    ).toThrow();
  });

  it("rejects an arbitrary category not in the enum", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, category: "Hobbies" }),
    ).toThrow();
  });

  it("accepts every expense category", () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(() =>
        CreateSubscriptionSchema.parse({ ...VALID_CREATE, category }),
      ).not.toThrow();
    }
  });

  it("rejects missing periodDays", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, periodDays: undefined }),
    ).toThrow();
  });

  it("rejects non-positive periodDays", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, periodDays: 0 }),
    ).toThrow();
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, periodDays: -7 }),
    ).toThrow();
  });

  it("rejects non-integer periodDays", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, periodDays: 30.5 }),
    ).toThrow();
  });

  it("rejects a missing startDate", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, startDate: undefined }),
    ).toThrow();
  });

  it("rejects an unparseable startDate", () => {
    expect(() =>
      CreateSubscriptionSchema.parse({ ...VALID_CREATE, startDate: "not-a-date" }),
    ).toThrow();
  });

  it("rejects a completely empty payload", () => {
    expect(() => CreateSubscriptionSchema.parse({})).toThrow();
  });
});

describe("UpdateSubscriptionSchema", () => {
  const VALID_UPDATE = {
    name: "Netflix",
    amount: 149000,
    currency: "IDR",
    category: "Entertainment",
    periodDays: 30,
    startDate: "2026-01-01T00:00:00.000Z",
    active: true,
  };

  it("accepts a full update payload", () => {
    const parsed = UpdateSubscriptionSchema.parse(VALID_UPDATE);
    expect(parsed.name).toBe("Netflix");
    expect(parsed.active).toBe(true);
  });

  it("has no defaults — missing active is rejected", () => {
    const { active: _active, ...withoutActive } = VALID_UPDATE;
    expect(() => UpdateSubscriptionSchema.parse(withoutActive)).toThrow();
  });

  it("has no defaults — missing currency is rejected", () => {
    const { currency: _currency, ...withoutCurrency } = VALID_UPDATE;
    expect(() => UpdateSubscriptionSchema.parse(withoutCurrency)).toThrow();
  });

  it("has no defaults — missing startDate is rejected", () => {
    const { startDate: _startDate, ...withoutStartDate } = VALID_UPDATE;
    expect(() => UpdateSubscriptionSchema.parse(withoutStartDate)).toThrow();
  });

  it("rejects an empty name on update", () => {
    expect(() =>
      UpdateSubscriptionSchema.parse({ ...VALID_UPDATE, name: "" }),
    ).toThrow();
  });

  it("rejects non-positive amount on update", () => {
    expect(() =>
      UpdateSubscriptionSchema.parse({ ...VALID_UPDATE, amount: 0 }),
    ).toThrow();
  });

  it("rejects a non-expense category on update", () => {
    expect(() =>
      UpdateSubscriptionSchema.parse({ ...VALID_UPDATE, category: "Salary" }),
    ).toThrow();
  });

  it("rejects non-integer periodDays on update", () => {
    expect(() =>
      UpdateSubscriptionSchema.parse({ ...VALID_UPDATE, periodDays: 1.5 }),
    ).toThrow();
  });
});
