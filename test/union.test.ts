import { describe, it, expect } from "vitest";
import { union, string, number, boolean } from "../src/index.js";

describe("UnionSchema (array-based)", () => {
  const schema = union([string(), number(), boolean()] as const);

  it("parses when any branch succeeds", () => {
    expect(schema.parse("hello" as any)).toBe("hello");
    expect(schema.parse(123 as any)).toBe(123);
    expect(schema.parse(true as any)).toBe(true);
  });

  it("fails when no branch matches", () => {
    expect(() => schema.parse({} as any)).toThrow();
  });

  it("exposes json htmlAttributes", () => {
    const json = schema.toJSON();
    expect(json.type).toBe("json");
    expect(json.required).toBe(true);
  });

  it("respects optional wrapper", () => {
    const optional = schema.optional();
    const json = optional.toJSON();
    expect(json.required).toBe(false);
    expect(optional.parse(undefined)).toBeUndefined();
  });
});
