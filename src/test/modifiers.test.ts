import { describe, it, expect } from "vitest";
import { string, number, object, array, boolean, record } from "../index.js";
import type { DependencyRule } from "../index.js";

describe("Schema Modifiers", () => {
  describe("optional()", () => {
    it("should make string schema optional", () => {
      const schema = string().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse("value")).toBe("value");
      expect(schema.toJSON().required).toBe(false);
    });

    it("should make number schema optional", () => {
      const schema = number().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(42)).toBe(42);
    });

    it("should make object schema optional", () => {
      const schema = object({ name: string() }).optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
    });

    it("should make array schema optional", () => {
      const schema = array(string()).optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(["a"])).toEqual(["a"]);
    });

    it("should allow null when optional", () => {
      const schema = string().optional();
      expect(schema.parse(null)).toBeUndefined();
    });

    it("should allow empty string when optional", () => {
      const schema = string().optional();
      expect(schema.parse("")).toBe("");
    });
  });

  describe("nullable()", () => {
    it("should make string schema nullable", () => {
      const schema = string().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse("value")).toBe("value");
    });

    it("should make number schema nullable", () => {
      const schema = number().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(42)).toBe(42);
    });

    it("should make object schema nullable", () => {
      const schema = object({ name: string() }).nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
    });

    it("should make array schema nullable", () => {
      const schema = array(string()).nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(["a"])).toEqual(["a"]);
    });

    it("should throw on undefined when nullable but not optional", () => {
      const schema = string().nullable();
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe("default()", () => {
    it("should set default value for strings", () => {
      const schema = string().default("default");
      expect(schema.parse(undefined)).toBe("default");
      expect(schema.parse(null)).toBe("default");
      expect(schema.parse("custom")).toBe("custom");
      expect(schema.toJSON().defaultValue).toBe("default");
    });

    it("should set default value for numbers", () => {
      const schema = number().default(42);
      expect(schema.parse(undefined)).toBe(42);
      expect(schema.parse(null)).toBe(42);
      expect(schema.parse(100)).toBe(100);
      expect(schema.toJSON().defaultValue).toBe(42);
    });

    it("should set default value for arrays", () => {
      const schema = array(string()).default(["default"]);
      expect(schema.parse(undefined)).toEqual(["default"]);
      expect(schema.parse(null)).toEqual(["default"]);
      expect(schema.parse(["custom"])).toEqual(["custom"]);
    });

    it("should work with zero as default", () => {
      const schema = number().default(0);
      expect(schema.parse(undefined)).toBe(0);
      expect(schema.parse(null)).toBe(0);
    });

    it("should work with empty string as default", () => {
      const schema = string().default("");
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse(null)).toThrow();
    });
  });

  describe("required()", () => {
    it("should set required to true by default", () => {
      const schema = string().required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow setting required to false", () => {
      const schema = string().required(false);
      expect(schema.toJSON().required).toBe(false);
    });

    it("should accept custom error message", () => {
      const schema = string().required(true, "Custom message");
      expect(schema.toJSON().required).toBe(true);
    });

    it("should work with numbers", () => {
      const schema = number().required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should work with objects", () => {
      const schema = object({ name: string() }).required();
      expect(schema.toJSON().required).toBe(true);
    });
  });

  describe("Chaining modifiers", () => {
    it("should support optional and default together", () => {
      const schema = string().optional().default("default");
      expect(schema.parse(undefined)).toBe("default");
      expect(schema.toJSON().required).toBe(false);
    });

    it("should support nullable and default together", () => {
      const schema = string().nullable().default("default");
      expect(schema.parse(null)).toBe("default");
      expect(schema.parse(undefined)).toBe("default");
    });

    it("should apply default before optional", () => {
      const schema = string().default("default").optional();
      expect(schema.parse(undefined)).toBe("default");
    });

    it("should work with complex chains", () => {
      const schema = string().minLength(3).maxLength(50).default("default");

      const json = schema.toJSON();
      expect(json.minLength).toBe(3);
      expect(json.maxLength).toBe(50);
      expect(json.defaultValue).toBe("default");
    });

    it("should validate with modifiers applied", () => {
      const schema = string().minLength(5).default("defaults");
      expect(schema.parse(undefined)).toBe("defaults");
      expect(() => schema.parse("hi")).toThrow();
    });
  });

  describe("Modifier interaction with validation", () => {
    it("should validate default value", () => {
      const schema = number().min(10).default(15);
      expect(schema.parse(undefined)).toBe(15);
    });

    it("should not validate when optional and undefined", () => {
      const schema = string().minLength(5).optional();
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it("should validate non-undefined values even when optional", () => {
      const schema = string().minLength(5).optional();
      expect(() => schema.parse("hi")).toThrow();
      expect(schema.parse("hello")).toBe("hello");
    });

    it("should not validate null when nullable", () => {
      const schema = string().minLength(5).nullable();
      expect(schema.parse(null)).toBeNull();
    });
  });

  describe("dependsOn() — operator leaves", () => {
    describe("eq / ne", () => {
      it("matches and mismatches strings with eq", () => {
        const schema = object({
          role: string(),
          value: string().dependsOn({
            eq: { field: "role", value: "admin" },
          }),
        });
        expect(schema.safeParse({ role: "admin" }).success).toBe(false);
        expect(schema.safeParse({ role: "user" }).success).toBe(true);
      });

      it("matches numbers, booleans with eq", () => {
        const nSchema = object({
          n: number(),
          value: string().dependsOn({ eq: { field: "n", value: 7 } }),
        });
        expect(nSchema.safeParse({ n: 7 }).success).toBe(false);
        expect(nSchema.safeParse({ n: 8 }).success).toBe(true);

        const bSchema = object({
          b: boolean(),
          value: string().dependsOn({ eq: { field: "b", value: true } }),
        });
        expect(bSchema.safeParse({ b: true }).success).toBe(false);
        expect(bSchema.safeParse({ b: false }).success).toBe(true);
      });

      it("uses reference equality for objects", () => {
        const obj = { a: 1 };
        const schema = object({
          o: string().dependsOn({ eq: { field: "o", value: obj } }),
          value: string(),
        });
        expect(schema.safeParse({ o: "x", value: "y" }).success).toBe(true);
      });

      it("ne flips eq semantics", () => {
        const schema = object({
          role: string(),
          value: string().dependsOn({
            ne: { field: "role", value: "admin" },
          }),
        });
        expect(schema.safeParse({ role: "admin" }).success).toBe(true);
        expect(schema.safeParse({ role: "user" }).success).toBe(false);
      });
    });

    describe("lt / gt / lte / gte", () => {
      const build = (rule: DependencyRule) =>
        object({
          n: number(),
          value: string().dependsOn(rule),
        });

      it("lt: boundary cases", () => {
        const s = build({ lt: { field: "n", value: 10 } });
        expect(s.safeParse({ n: 9 }).success).toBe(false);
        expect(s.safeParse({ n: 10 }).success).toBe(true);
        expect(s.safeParse({ n: 11 }).success).toBe(true);
      });

      it("gt: boundary cases", () => {
        const s = build({ gt: { field: "n", value: 10 } });
        expect(s.safeParse({ n: 11 }).success).toBe(false);
        expect(s.safeParse({ n: 10 }).success).toBe(true);
        expect(s.safeParse({ n: 9 }).success).toBe(true);
      });

      it("lte: boundary cases", () => {
        const s = build({ lte: { field: "n", value: 10 } });
        expect(s.safeParse({ n: 10 }).success).toBe(false);
        expect(s.safeParse({ n: 11 }).success).toBe(true);
      });

      it("gte: boundary cases", () => {
        const s = build({ gte: { field: "n", value: 10 } });
        expect(s.safeParse({ n: 10 }).success).toBe(false);
        expect(s.safeParse({ n: 9 }).success).toBe(true);
      });

      it("non-number field returns false for numeric ops", () => {
        const s = object({
          n: string(),
          value: string().dependsOn({ gt: { field: "n", value: 0 } }),
        });
        expect(s.safeParse({ n: "abc" }).success).toBe(true);
      });
    });

    describe("in / notIn", () => {
      it("in: element present, absent, empty array", () => {
        const s = object({
          role: string(),
          value: string().dependsOn({
            in: { field: "role", value: ["admin", "mod"] },
          }),
        });
        expect(s.safeParse({ role: "admin" }).success).toBe(false);
        expect(s.safeParse({ role: "user" }).success).toBe(true);

        const empty = object({
          role: string(),
          value: string().dependsOn({
            in: { field: "role", value: [] },
          }),
        });
        expect(empty.safeParse({ role: "admin" }).success).toBe(true);
      });

      it("in: field absent returns false", () => {
        const s = object({
          role: string().optional(),
          value: string().dependsOn({
            in: { field: "role", value: ["admin"] },
          }),
        });
        expect(s.safeParse({}).success).toBe(true);
      });

      it("notIn: flips in", () => {
        const s = object({
          role: string(),
          value: string().dependsOn({
            notIn: { field: "role", value: ["admin", "mod"] },
          }),
        });
        expect(s.safeParse({ role: "admin" }).success).toBe(true);
        expect(s.safeParse({ role: "user" }).success).toBe(false);
      });

      it("notIn: field absent returns false", () => {
        const s = object({
          role: string().optional(),
          value: string().dependsOn({
            notIn: { field: "role", value: ["admin"] },
          }),
        });
        expect(s.safeParse({}).success).toBe(true);
      });
    });

    describe("contains / startsWith / endsWith", () => {
      it("contains: match, non-match, empty string value", () => {
        const s = object({
          text: string(),
          value: string().dependsOn({
            contains: { field: "text", value: "oo" },
          }),
        });
        expect(s.safeParse({ text: "foobar" }).success).toBe(false);
        expect(s.safeParse({ text: "bar" }).success).toBe(true);

        const empty = object({
          text: string(),
          value: string().dependsOn({
            contains: { field: "text", value: "" },
          }),
        });
        expect(empty.safeParse({ text: "anything" }).success).toBe(false);
      });

      it("startsWith", () => {
        const s = object({
          text: string(),
          value: string().dependsOn({
            startsWith: { field: "text", value: "foo" },
          }),
        });
        expect(s.safeParse({ text: "foobar" }).success).toBe(false);
        expect(s.safeParse({ text: "barfoo" }).success).toBe(true);
      });

      it("endsWith", () => {
        const s = object({
          text: string(),
          value: string().dependsOn({
            endsWith: { field: "text", value: "bar" },
          }),
        });
        expect(s.safeParse({ text: "foobar" }).success).toBe(false);
        expect(s.safeParse({ text: "barfoo" }).success).toBe(true);
      });

      it("non-string field returns false", () => {
        const s = object({
          n: number(),
          value: string().dependsOn({
            contains: { field: "n", value: "1" },
          }),
        });
        expect(s.safeParse({ n: 123 }).success).toBe(true);
      });
    });

    describe("exists", () => {
      it("true for empty string, zero, false", () => {
        const s = object({
          x: string().optional(),
          value: string().dependsOn({ exists: { field: "x" } }),
        });
        expect(s.safeParse({ x: "" }).success).toBe(false);

        const sZero = object({
          x: number().optional(),
          value: string().dependsOn({ exists: { field: "x" } }),
        });
        expect(sZero.safeParse({ x: 0 }).success).toBe(false);

        const sFalse = object({
          x: boolean().optional(),
          value: string().dependsOn({ exists: { field: "x" } }),
        });
        expect(sFalse.safeParse({ x: false }).success).toBe(false);
      });

      it("false for absent or null fields", () => {
        const s = object({
          x: string().optional(),
          value: string().dependsOn({ exists: { field: "x" } }),
        });
        expect(s.safeParse({}).success).toBe(true);

        const nullable = object({
          x: string().nullable(),
          value: string().dependsOn({ exists: { field: "x" } }),
        });
        expect(nullable.safeParse({ x: null }).success).toBe(true);
      });
    });

    describe("notEmpty", () => {
      it("empty string is empty", () => {
        const s = object({
          x: string().optional(),
          value: string().dependsOn({ notEmpty: { field: "x" } }),
        });
        expect(s.safeParse({ x: "" }).success).toBe(true);
        expect(s.safeParse({ x: "a" }).success).toBe(false);
      });

      it("empty array is empty", () => {
        const s = object({
          xs: array(string()),
          value: string().dependsOn({ notEmpty: { field: "xs" } }),
        });
        expect(s.safeParse({ xs: [] }).success).toBe(true);
        expect(s.safeParse({ xs: ["a"] }).success).toBe(false);
      });

      it("empty object is empty", () => {
        const s = object({
          o: record(string()),
          value: string().dependsOn({ notEmpty: { field: "o" } }),
        });
        expect(s.safeParse({ o: {} }).success).toBe(true);
        expect(s.safeParse({ o: { a: "b" } }).success).toBe(false);
      });

      it("null / undefined are empty; numbers and booleans are not", () => {
        const s = object({
          x: string().optional(),
          value: string().dependsOn({ notEmpty: { field: "x" } }),
        });
        expect(s.safeParse({}).success).toBe(true);

        const sN = object({
          x: number(),
          value: string().dependsOn({ notEmpty: { field: "x" } }),
        });
        expect(sN.safeParse({ x: 0 }).success).toBe(false);

        const sB = object({
          x: boolean(),
          value: string().dependsOn({ notEmpty: { field: "x" } }),
        });
        expect(sB.safeParse({ x: false }).success).toBe(false);
      });
    });

    describe("truthy / falsy", () => {
      const build = (rule: DependencyRule) =>
        object({
          x: boolean().optional(),
          y: number().optional(),
          z: string().optional(),
          value: string().dependsOn(rule),
        });

      it("truthy: passes for truthy values", () => {
        const s = build({ truthy: { field: "x" } });
        expect(s.safeParse({ x: true }).success).toBe(false);
        expect(s.safeParse({ x: false }).success).toBe(true);

        const sN = build({ truthy: { field: "y" } });
        expect(sN.safeParse({ y: 0 }).success).toBe(true);
        expect(sN.safeParse({ y: 1 }).success).toBe(false);

        const sS = build({ truthy: { field: "z" } });
        expect(sS.safeParse({ z: "" }).success).toBe(true);
        expect(sS.safeParse({ z: "ok" }).success).toBe(false);
      });

      it("falsy: inverts truthy", () => {
        const s = build({ falsy: { field: "x" } });
        expect(s.safeParse({ x: true }).success).toBe(true);
        expect(s.safeParse({ x: false }).success).toBe(false);
        expect(s.safeParse({}).success).toBe(false);
      });
    });

    describe("pattern", () => {
      it("RegExp literal and string pattern", () => {
        const sRe = object({
          email: string(),
          value: string().dependsOn({
            pattern: { field: "email", value: /@co\.com$/ },
          }),
        });
        expect(sRe.safeParse({ email: "a@co.com" }).success).toBe(false);
        expect(sRe.safeParse({ email: "a@foo.com" }).success).toBe(true);

        const sStr = object({
          email: string(),
          value: string().dependsOn({
            pattern: { field: "email", value: "@co\\.com$" },
          }),
        });
        expect(sStr.safeParse({ email: "a@co.com" }).success).toBe(false);
        expect(sStr.safeParse({ email: "a@foo.com" }).success).toBe(true);
      });

      it("non-string field is coerced via String()", () => {
        const s = object({
          n: number(),
          value: string().dependsOn({
            pattern: { field: "n", value: /^42$/ },
          }),
        });
        expect(s.safeParse({ n: 42 }).success).toBe(false);
        expect(s.safeParse({ n: 41 }).success).toBe(true);
      });

      it("null / undefined field returns false", () => {
        const s = object({
          x: string().nullable(),
          value: string().dependsOn({
            pattern: { field: "x", value: /.+/ },
          }),
        });
        expect(s.safeParse({ x: null }).success).toBe(true);
      });
    });

    describe("and / or / not", () => {
      it("and: all pass vs one fails", () => {
        const s = object({
          role: string(),
          country: string(),
          value: string().dependsOn({
            and: [
              { eq: { field: "role", value: "admin" } },
              { eq: { field: "country", value: "US" } },
            ],
          }),
        });
        expect(
          s.safeParse({ role: "admin", country: "US" }).success,
        ).toBe(false);
        expect(
          s.safeParse({ role: "admin", country: "CA" }).success,
        ).toBe(true);
      });

      it("or: any pass", () => {
        const s = object({
          role: string(),
          plan: string(),
          value: string().dependsOn({
            or: [
              { eq: { field: "role", value: "admin" } },
              { eq: { field: "plan", value: "pro" } },
            ],
          }),
        });
        expect(s.safeParse({ role: "admin", plan: "free" }).success).toBe(
          false,
        );
        expect(s.safeParse({ role: "user", plan: "pro" }).success).toBe(
          false,
        );
        expect(s.safeParse({ role: "user", plan: "free" }).success).toBe(
          true,
        );
      });

      it("not: wrapping a leaf", () => {
        const s = object({
          role: string(),
          value: string().dependsOn({
            not: { eq: { field: "role", value: "admin" } },
          }),
        });
        expect(s.safeParse({ role: "admin" }).success).toBe(true);
        expect(s.safeParse({ role: "user" }).success).toBe(false);
      });

      it("not: wrapping an and-group", () => {
        const s = object({
          role: string(),
          country: string(),
          value: string().dependsOn({
            not: {
              and: [
                { eq: { field: "role", value: "admin" } },
                { eq: { field: "country", value: "US" } },
              ],
            },
          }),
        });
        expect(
          s.safeParse({ role: "admin", country: "US" }).success,
        ).toBe(true);
        expect(
          s.safeParse({ role: "admin", country: "CA" }).success,
        ).toBe(false);
      });

      it("not: wrapping an or-group", () => {
        const s = object({
          role: string(),
          value: string().dependsOn({
            not: {
              or: [
                { eq: { field: "role", value: "admin" } },
                { eq: { field: "role", value: "mod" } },
              ],
            },
          }),
        });
        expect(s.safeParse({ role: "admin" }).success).toBe(true);
        expect(s.safeParse({ role: "user" }).success).toBe(false);
      });

      it("nested not-not cancels out", () => {
        const s = object({
          role: string(),
          value: string().dependsOn({
            not: { not: { eq: { field: "role", value: "admin" } } },
          }),
        });
        expect(s.safeParse({ role: "admin" }).success).toBe(false);
        expect(s.safeParse({ role: "user" }).success).toBe(true);
      });
    });

    describe("mixed groups", () => {
      it("and containing pattern + eq + gte leaves", () => {
        const s = object({
          email: string(),
          role: string(),
          age: number(),
          value: string().dependsOn({
            and: [
              { pattern: { field: "email", value: /@co\.com$/ } },
              { eq: { field: "role", value: "admin" } },
              { gte: { field: "age", value: 18 } },
            ],
          }),
        });
        expect(
          s.safeParse({ email: "a@co.com", role: "admin", age: 19 }).success,
        ).toBe(false);
        expect(
          s.safeParse({ email: "a@co.com", role: "admin", age: 17 }).success,
        ).toBe(true);
      });

      it("or containing not + and", () => {
        const s = object({
          role: string(),
          age: number(),
          value: string().dependsOn({
            or: [
              { not: { eq: { field: "role", value: "admin" } } },
              {
                and: [
                  { eq: { field: "role", value: "admin" } },
                  { gte: { field: "age", value: 21 } },
                ],
              },
            ],
          }),
        });
        expect(s.safeParse({ role: "admin", age: 21 }).success).toBe(false);
        expect(s.safeParse({ role: "admin", age: 19 }).success).toBe(true);
        expect(s.safeParse({ role: "user", age: 5 }).success).toBe(false);
      });
    });

    describe("relative paths", () => {
      it("^.x resolves for a leaf inside nested object", () => {
        const schema = object({
          items: array(
            object({
              type: boolean(),
              value: string().dependsOn({
                eq: { field: "^.type", value: true },
              }),
            }),
          ),
        });

        const skipped = schema.safeParse({
          items: [{ type: false, value: "ignored" }],
        });
        expect(skipped.success).toBe(true);
        expect(skipped.data?.items[0]?.value).toBeUndefined();

        const required = schema.safeParse({
          items: [{ type: true }],
        });
        expect(required.success).toBe(false);
        expect(required.errors[0]?.path).toEqual(["items", 0, "value"]);
      });

      it("^.x resolves inside an and-group", () => {
        const schema = object({
          items: array(
            object({
              type: boolean(),
              country: string(),
              value: string().dependsOn({
                and: [
                  { eq: { field: "^.type", value: true } },
                  { eq: { field: "^.country", value: "US" } },
                ],
              }),
            }),
          ),
        });

        const skipped = schema.safeParse({
          items: [{ type: false, country: "US", value: "x" }],
        });
        expect(skipped.success).toBe(true);

        const required = schema.safeParse({
          items: [{ type: true, country: "US" }],
        });
        expect(required.success).toBe(false);
      });

      it("^.^. traverses up from nested object inside array item", () => {
        const schema = object({
          sections: array(
            object({
              enabled: boolean(),
              details: object({
                comment: string().dependsOn({
                  eq: { field: "^.^.enabled", value: true },
                }),
              }),
            }),
          ),
        });

        const required = schema.safeParse({
          sections: [{ enabled: true, details: {} }],
        });
        expect(required.success).toBe(false);
        expect(required.errors[0]?.path).toEqual([
          "sections",
          0,
          "details",
          "comment",
        ]);
      });
    });

    describe("serialization — toJSON round-trip", () => {
      const check = (rule: DependencyRule, expected: unknown) => {
        const schema = string().dependsOn(rule);
        const json = schema.toJSON() as { "data-depends-on": unknown };
        expect(json["data-depends-on"]).toEqual(expected);
      };

      it("eq / ne", () => {
        check(
          { eq: { field: "a", value: 1 } },
          { eq: { field: "a", value: 1 } },
        );
        check(
          { ne: { field: "a", value: "x" } },
          { ne: { field: "a", value: "x" } },
        );
      });

      it("numeric comparisons", () => {
        check(
          { lt: { field: "a", value: 1 } },
          { lt: { field: "a", value: 1 } },
        );
        check(
          { gt: { field: "a", value: 1 } },
          { gt: { field: "a", value: 1 } },
        );
        check(
          { lte: { field: "a", value: 1 } },
          { lte: { field: "a", value: 1 } },
        );
        check(
          { gte: { field: "a", value: 1 } },
          { gte: { field: "a", value: 1 } },
        );
      });

      it("in / notIn preserve arrays", () => {
        check(
          { in: { field: "a", value: [1, 2] } },
          { in: { field: "a", value: [1, 2] } },
        );
        check(
          { notIn: { field: "a", value: ["x"] } },
          { notIn: { field: "a", value: ["x"] } },
        );
      });

      it("string predicates", () => {
        check(
          { contains: { field: "a", value: "x" } },
          { contains: { field: "a", value: "x" } },
        );
        check(
          { startsWith: { field: "a", value: "x" } },
          { startsWith: { field: "a", value: "x" } },
        );
        check(
          { endsWith: { field: "a", value: "x" } },
          { endsWith: { field: "a", value: "x" } },
        );
      });

      it("field-only operators", () => {
        check({ exists: { field: "a" } }, { exists: { field: "a" } });
        check({ notEmpty: { field: "a" } }, { notEmpty: { field: "a" } });
        check({ truthy: { field: "a" } }, { truthy: { field: "a" } });
        check({ falsy: { field: "a" } }, { falsy: { field: "a" } });
      });

      it("pattern — RegExp is lowered to source string", () => {
        check(
          { pattern: { field: "a", value: /@co\.com$/ } },
          { pattern: { field: "a", value: "@co\\.com$" } },
        );
        check(
          { pattern: { field: "a", value: "foo" } },
          { pattern: { field: "a", value: "foo" } },
        );
      });

      it("and / or / not groups recurse", () => {
        check(
          {
            and: [
              { eq: { field: "a", value: 1 } },
              { gte: { field: "b", value: 2 } },
            ],
          },
          {
            and: [
              { eq: { field: "a", value: 1 } },
              { gte: { field: "b", value: 2 } },
            ],
          },
        );
        check(
          {
            or: [
              { eq: { field: "a", value: 1 } },
              { not: { pattern: { field: "b", value: /^x$/ } } },
            ],
          },
          {
            or: [
              { eq: { field: "a", value: 1 } },
              { not: { pattern: { field: "b", value: "^x$" } } },
            ],
          },
        );
      });
    });

    describe("type-level constraints", () => {
      it("accepts valid rules", () => {
        const _ok1: DependencyRule = { eq: { field: "a", value: 1 } };
        const _ok2: DependencyRule = {
          and: [{ gte: { field: "a", value: 1 } }],
        };
        void _ok1;
        void _ok2;
      });

      it("rejects ill-formed rules", () => {
        // @ts-expect-error — two top-level operator keys
        const _bad1: DependencyRule = { eq: { field: "a", value: 1 }, gte: { field: "a", value: 1 } };
        // @ts-expect-error — lt expects a number value
        const _bad2: DependencyRule = { lt: { field: "a", value: "not a number" } };
        // @ts-expect-error — startsWith expects string value
        const _bad3: DependencyRule = { startsWith: { field: "a", value: 42 } };
        // @ts-expect-error — in expects a readonly array
        const _bad4: DependencyRule = { in: { field: "a", value: "not an array" } };
        // @ts-expect-error — exists has no value field
        const _bad5: DependencyRule = { exists: { field: "a", value: true } };
        // @ts-expect-error — empty rule
        const _bad6: DependencyRule = {};
        // @ts-expect-error — unknown operator key
        const _bad7: DependencyRule = { unknownOp: { field: "a" } };
        // @ts-expect-error — old { field, condition } shape no longer compiles
        const _bad8: DependencyRule = { field: "a", condition: /x/ };

        void _bad1;
        void _bad2;
        void _bad3;
        void _bad4;
        void _bad5;
        void _bad6;
        void _bad7;
        void _bad8;
      });
    });
  });
});
