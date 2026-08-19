import { describe, it, expect } from "vitest";
import { UpdateUserSchema } from "@/server/schemas/user";

describe("UpdateUserSchema", () => {
  it("accepts { plus: true }", () => {
    const parsed = UpdateUserSchema.parse({ plus: true });
    expect(parsed.plus).toBe(true);
  });

  it("accepts { plus: false }", () => {
    const parsed = UpdateUserSchema.parse({ plus: false });
    expect(parsed.plus).toBe(false);
  });

  it("rejects missing plus", () => {
    expect(() => UpdateUserSchema.parse({})).toThrow();
  });

  it("rejects a non-boolean plus (string)", () => {
    expect(() => UpdateUserSchema.parse({ plus: "true" })).toThrow();
  });

  it("rejects a non-boolean plus (number)", () => {
    expect(() => UpdateUserSchema.parse({ plus: 1 })).toThrow();
  });

  it("rejects Prisma update operation objects ({ plus: { set: true } })", () => {
    expect(() =>
      UpdateUserSchema.parse({ plus: { set: true } }),
    ).toThrow();
  });

  it("rejects unknown extra fields (strict)", () => {
    expect(() =>
      UpdateUserSchema.parse({ plus: true, name: "hacker" }),
    ).toThrow();
  });
});
