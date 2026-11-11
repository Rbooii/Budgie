import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_DIR = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

const FILES = sourceFiles(SRC_DIR);

const BANNED = [
  "Sparkles",
  "<Badge",
  "@/components/badge",
  "typingPulse",
  "uppercase",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "bg-gradient",
  "w-1.5 h-1.5 rounded-full",
  "w-2 h-2 rounded-full",
  "w-[7px] h-[7px] rounded-full",
];

const PULSE_EXCEPTIONS = new Set(["src/components/page-skeleton.tsx"]);

const RAW_HEX_EXCEPTIONS = new Set(["src/app/profile/page.tsx"]);

describe("global anti-slop guard", () => {
  it("does not reintroduce AI symbols, badges, uppercase labels, or status dots", () => {
    for (const file of FILES) {
      const source = readFileSync(file, "utf8");
      const name = relative(process.cwd(), file);
      for (const token of BANNED) {
        expect(source, `${name} contains ${token}`).not.toContain(token);
      }
    }
  });

  it("only allows the loading skeleton to pulse", () => {
    for (const file of FILES) {
      const name = relative(process.cwd(), file);
      if (PULSE_EXCEPTIONS.has(name)) continue;
      expect(readFileSync(file, "utf8"), `${name} contains animate-pulse`).not.toContain(
        "animate-pulse",
      );
    }
  });

  it("does not hardcode raw hex utilities outside always-dark surfaces", () => {
    for (const file of FILES) {
      const name = relative(process.cwd(), file);
      if (RAW_HEX_EXCEPTIONS.has(name)) continue;
      expect(readFileSync(file, "utf8"), `${name} contains a raw hex utility`).not.toMatch(
        /\[#[0-9a-f]{3,8}\]/i,
      );
    }
  });
});
