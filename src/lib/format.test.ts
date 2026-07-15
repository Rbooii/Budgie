import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatBalanceInput,
  formatDate,
  formatTime,
  formatDateTimeLocalValue,
} from "@/lib/format";

describe("formatRupiah", () => {
  it("formats zero with two decimal places", () => {
    expect(formatRupiah(0)).toBe("Rp 0.00");
  });

  it("formats a whole number with id-ID grouping then replaces commas with dots", () => {
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000.00");
  });

  it("formats a decimal value", () => {
    expect(formatRupiah(1234.5)).toBe("Rp 1.234.50");
  });

  it("formats a negative value", () => {
    expect(formatRupiah(-50000)).toBe("Rp -50.000.00");
  });

  it("always prefixes with 'Rp '", () => {
    expect(formatRupiah(10).startsWith("Rp ")).toBe(true);
  });
});

describe("formatBalanceInput", () => {
  it("returns empty string for empty input", () => {
    expect(formatBalanceInput("")).toBe("");
  });

  it("strips non-numeric characters and groups with thousand separators", () => {
    expect(formatBalanceInput("1500000")).toBe("1.500.000");
  });

  it("extracts only digits from mixed input", () => {
    expect(formatBalanceInput("Rp 1.500.000")).toBe("1.500.000");
  });

  it("returns empty string when input has no digits", () => {
    expect(formatBalanceInput("abc")).toBe("");
  });

  it("preserves a leading negative sign", () => {
    expect(formatBalanceInput("-500000")).toBe("-1.500.000".replace("1.500.000", "500.000"));
  });

  it("returns '-' for a lone negative sign with no digits", () => {
    expect(formatBalanceInput("-")).toBe("-");
  });

  it("groups multiple digits correctly", () => {
    expect(formatBalanceInput("1000")).toBe("1.000");
  });
});

describe("formatDate", () => {
  it("formats a Date object in en-GB short-month format", () => {
    expect(formatDate(new Date("2026-07-15T10:30:00Z"))).toMatch(/15 Jul 2026/);
  });

  it("accepts an ISO string", () => {
    expect(formatDate("2026-01-05T00:00:00Z")).toMatch(/05 Jan 2026/);
  });

  it("pads day to 2 digits", () => {
    expect(formatDate(new Date("2026-03-03T00:00:00"))).toMatch(/^03/);
  });
});

describe("formatTime", () => {
  it("formats time in 12-hour am/pm lowercase", () => {
    const result = formatTime(new Date("2026-07-15T14:30:00"));
    expect(result).toMatch(/2:30 pm/);
  });

  it("shows am for morning times", () => {
    const result = formatTime(new Date("2026-07-15T09:05:00"));
    expect(result).toMatch(/am/);
  });

  it("accepts an ISO string", () => {
    const result = formatTime("2026-07-15T14:30:00");
    expect(result).toMatch(/pm/);
  });
});

describe("formatDateTimeLocalValue", () => {
  it("produces YYYY-MM-DDTHH:mm with zero padding", () => {
    const d = new Date(2026, 6, 5, 9, 7);
    expect(formatDateTimeLocalValue(d)).toBe("2026-07-05T09:07");
  });

  it("pads single-digit month, day, hour, minute", () => {
    const d = new Date(2026, 0, 1, 1, 2);
    expect(formatDateTimeLocalValue(d)).toBe("2026-01-01T01:02");
  });

  it("handles double-digit values without extra padding", () => {
    const d = new Date(2026, 11, 31, 23, 59);
    expect(formatDateTimeLocalValue(d)).toBe("2026-12-31T23:59");
  });
});
