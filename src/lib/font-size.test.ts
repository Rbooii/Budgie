import { describe, it, expect } from "vitest";
import { dynamicFontSize } from "@/lib/font-size";

describe("dynamicFontSize", () => {
  it("returns text-6xl for short text (<=7 chars)", () => {
    expect(dynamicFontSize("123")).toBe("text-6xl");
  });

  it("returns text-6xl at the 7-char boundary", () => {
    expect(dynamicFontSize("1234567")).toBe("text-6xl");
  });

  it("returns text-5xl for 8-11 chars", () => {
    expect(dynamicFontSize("12345678")).toBe("text-5xl");
  });

  it("returns text-5xl at the 11-char boundary", () => {
    expect(dynamicFontSize("12345678901")).toBe("text-5xl");
  });

  it("returns text-4xl for 12-14 chars", () => {
    expect(dynamicFontSize("123456789012")).toBe("text-4xl");
  });

  it("returns text-4xl at the 14-char boundary", () => {
    expect(dynamicFontSize("12345678901234")).toBe("text-4xl");
  });

  it("returns text-3xl for >14 chars", () => {
    expect(dynamicFontSize("123456789012345")).toBe("text-3xl");
  });

  it("strips hyphens before counting length", () => {
    expect(dynamicFontSize("-------")).toBe("text-6xl");
  });

  it("counts only non-hyphen characters", () => {
    expect(dynamicFontSize("--1234567--")).toBe("text-6xl");
  });

  it("treats empty string as <=7 chars", () => {
    expect(dynamicFontSize("")).toBe("text-6xl");
  });
});
