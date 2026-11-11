import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LANDING_DIR = join(process.cwd(), "src/components/landing");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const BANNED = [
  "—",
  "–",
  "·",
  "uppercase",
  "Sparkles",
  "Badge",
  "Fig.",
  "Sample data",
  "Sample ledger",
  "Optional",
  "By the numbers",
  "Updating live",
  "quiet place",
  "ledger",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-[12px]",
  "bg-gradient",
  "See it in motion",
  "A sixty-second walkthrough",
];

describe("landing anti-slop guard", () => {
  it("does not reintroduce badges, dashes, or the old Claude chrome", () => {
    for (const file of tsxFiles(LANDING_DIR)) {
      const source = readFileSync(file, "utf8");
      for (const token of BANNED) {
        expect(source, `${file} contains ${token}`).not.toContain(token);
      }
    }
  });

  it("does not hardcode raw hex colors in landing components", () => {
    for (const file of tsxFiles(LANDING_DIR)) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} contains a raw hex`).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });

  it("does not render decorative SVG illustration plates", () => {
    for (const file of tsxFiles(LANDING_DIR)) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} contains an illustration plate`).not.toMatch(
        /Plate[A-Z]|illustrations\//,
      );
    }
  });
});
