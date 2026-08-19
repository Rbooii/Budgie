import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  periodLabel,
  periodStartDate,
  nextBillingDate,
  startOfToday,
  startOfMonth,
} from "@/lib/budget";

describe("periodLabel", () => {
  it("returns Daily for 1 day", () => {
    expect(periodLabel(1)).toBe("Daily");
  });

  it("returns Weekly for 7 days", () => {
    expect(periodLabel(7)).toBe("Weekly");
  });

  it("returns Monthly for 30 days", () => {
    expect(periodLabel(30)).toBe("Monthly");
  });

  it("returns Yearly for 365 days", () => {
    expect(periodLabel(365)).toBe("Yearly");
  });

  it("returns 'Every N days' for custom periods", () => {
    expect(periodLabel(14)).toBe("Every 14 days");
    expect(periodLabel(90)).toBe("Every 90 days");
  });

  it("handles 0 days (no period selected) as custom label", () => {
    expect(periodLabel(0)).toBe("Every 0 days");
  });

  it("handles negative period days as custom label", () => {
    expect(periodLabel(-7)).toBe("Every -7 days");
  });

  it("handles fractional period days as custom label", () => {
    expect(periodLabel(365.5)).toBe("Every 365.5 days");
  });

  it("does not crash on NaN", () => {
    expect(periodLabel(NaN)).toBe("Every NaN days");
  });
});

describe("startOfToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 14, 30, 45, 123));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today at exactly midnight (00:00:00.000)", () => {
    const d = startOfToday();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});

describe("startOfMonth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 14, 30, 45, 123));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the first day of the current month at midnight", () => {
    const d = startOfMonth();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it("works on January 1 (year boundary)", () => {
    vi.setSystemTime(new Date(2026, 0, 31, 23, 59));
    const d = startOfMonth();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("works on December (month wrap)", () => {
    vi.setSystemTime(new Date(2026, 11, 25, 12));
    const d = startOfMonth();
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(1);
  });
});

describe("periodStartDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 14, 30, 45, 123));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns midnight of the date periodDays ago", () => {
    const d = periodStartDate(7);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });

  it("subtracts 30 days for a monthly window", () => {
    const d = periodStartDate(30);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(5); // June
  });

  it("crosses month boundaries correctly (daily window)", () => {
    const d = periodStartDate(1);
    expect(d.getDate()).toBe(14);
    expect(d.getMonth()).toBe(6);
  });

  it("crosses year boundaries correctly", () => {
    vi.setSystemTime(new Date(2026, 0, 5, 10));
    const d = periodStartDate(7);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11); // December
    expect(d.getDate()).toBe(29);
  });

  it("returns today's midnight when periodDays is 0", () => {
    const d = periodStartDate(0);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });
});

describe("nextBillingDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the next period boundary for a start in the past", () => {
    const start = new Date(2026, 6, 1, 0, 0, 0); // 14 days before now
    const next = nextBillingDate(start, 7);
    expect(next.getTime()).toBe(new Date(2026, 6, 22, 0, 0, 0).getTime());
  });

  it("counts elapsed periods, not elapsed days", () => {
    // 30 days elapsed, period 7 → 4 full periods → next = start + 5*7
    const start = new Date(2026, 5, 15, 0, 0, 0);
    const next = nextBillingDate(start, 7);
    expect(next.getTime()).toBe(new Date(2026, 6, 20, 0, 0, 0).getTime());
  });

  it("returns the start date unchanged when it is today or in the future", () => {
    const future = new Date(2026, 7, 1, 0, 0, 0);
    const next = nextBillingDate(future, 30);
    expect(next.getTime()).toBe(future.getTime());
  });

  it("returns the start date when it equals now", () => {
    const now = new Date(2026, 6, 15, 12, 0, 0);
    const next = nextBillingDate(now, 30);
    expect(next.getTime()).toBe(now.getTime());
  });

  it("treats an earlier-today start as a past start (billing already due)", () => {
    const start = new Date(2026, 6, 15, 6, 0, 0); // earlier today
    const next = nextBillingDate(start, 30);
    expect(next.getTime()).toBe(new Date(2026, 7, 14, 6, 0, 0).getTime());
  });

  it("accepts an ISO string and converts it", () => {
    const next = nextBillingDate("2026-07-01T00:00:00.000Z", 30);
    expect(next.getTime()).toBe(
      new Date(new Date("2026-07-01T00:00:00.000Z").getTime() + 30 * 86400000).getTime(),
    );
  });

  it("returns the start for a future ISO string", () => {
    const startISO = "2027-01-01T00:00:00.000Z";
    const next = nextBillingDate(startISO, 30);
    expect(next.getTime()).toBe(new Date(startISO).getTime());
  });

  it("crosses month boundaries (Jan 31 + monthly)", () => {
    const start = new Date(2026, 0, 31, 0, 0, 0); // Jan 31
    // Now = Jul 15 → elapsed 165 days → floor(165/30)=5 → next = Jan31 + 180d
    const next = nextBillingDate(start, 30);
    expect(next.getTime()).toBe(new Date(2026, 6, 30, 0, 0, 0).getTime());
  });

  it("crosses leap-year February when adding days", () => {
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0)); // Mar 15 2024
    const start = new Date(2024, 0, 31, 0, 0, 0); // Jan 31 2024 (leap year)
    const next = nextBillingDate(start, 60);
    // elapsed 44 days → 0 full periods → next = Jan 31 + 60d = Mar 31 2024
    expect(next.getTime()).toBe(new Date(2024, 2, 31, 0, 0, 0).getTime());
  });

  it("returns an Invalid Date for an unparseable string", () => {
    const next = nextBillingDate("not-a-date", 30);
    expect(Number.isNaN(next.getTime())).toBe(true);
  });

  it("does not mutate the input Date object", () => {
    const start = new Date(2026, 6, 1, 0, 0, 0);
    const copy = new Date(start);
    nextBillingDate(start, 7);
    expect(start.getTime()).toBe(copy.getTime());
  });

  it("handles fractional periods by flooring the count", () => {
    const start = new Date(2026, 6, 1, 0, 0, 0);
    const next = nextBillingDate(start, 7.5);
    // elapsed = 14 days → floor(14/7.5)=1 → next = start + 15 days
    expect(next.getTime()).toBe(new Date(2026, 6, 16, 0, 0, 0).getTime());
  });
});
