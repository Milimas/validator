import { describe, it, expect } from "vitest";
import { union, string, number, boolean, json } from "../index.js";

describe("UnionSchema (array-based)", () => {
  const schema = union([string(), number(), boolean()] as const);

  it("parses when any branch succeeds", () => {
    expect(schema.parse("hello" as any)).toBe("hello");
    expect(schema.parse(123 as any)).toBe(123);
    expect(schema.parse(true as any)).toBe(true);
    expect(() => schema.parse({} as any)).toThrow();
    expect(() => schema.parse([] as any)).toThrow();
    expect(() => schema.parse(null as any)).toThrow();
  });

  it("fails when no branch matches", () => {
    expect(() => schema.parse({} as any)).toThrow();
  });

  it("exposes union htmlAttributes with anyOf schemas", () => {
    const json = schema.toJSON();
    expect(json.type).toBe("union");
    expect(json.required).toBe(true);
    expect(json.anyOf).toBeDefined();
    expect(json.anyOf?.length).toBe(3);
  });

  it("respects optional wrapper", () => {
    const optional = schema.optional();
    const json = optional.toJSON();
    expect(json.required).toBe(false);
    expect(optional.parse(undefined)).toBeUndefined();
  });
});

describe("JSONSchema should parse all union variants", () => {
  const schema = json();

  it("parses string variant", () => {
    expect(schema.parse("hello")).toBe("hello");
  });

  it("parses number variant", () => {
    expect(schema.parse(42)).toBe(42);
  });

  it("parses boolean variant", () => {
    expect(schema.parse(false)).toBe(false);
  });

  it("parses object variant", () => {
    const obj = { key: "value" };
    expect(schema.parse(obj)).toEqual(obj);
  });

  it("parses array variant", () => {
    const arr = [1, 2, 3];
    expect(schema.parse(arr)).toEqual(arr);
  });

  it("fails for unsupported types", () => {
    expect(() => schema.parse(undefined)).toThrow();
  });
});
