import { describe, it, expect } from "vitest";
import { record, string, number, object, boolean } from "validator";

describe("RecordSchema", () => {
  describe("Basic validation", () => {
    it("should validate simple record with number values", () => {
      const schema = record(number());
      const result = schema.parse({ a: 1, b: 2, c: 3 });
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should validate simple record with string values", () => {
      const schema = record(string());
      const result = schema.parse({ foo: "bar", baz: "qux" });
      expect(result).toEqual({ foo: "bar", baz: "qux" });
    });

    it("should validate empty record", () => {
      const schema = record(number());
      const result = schema.parse({});
      expect(result).toEqual({});
    });

    it("should reject non-object values", () => {
      const schema = record(number());
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse([])).toThrow();
      expect(() => schema.parse("not an object")).toThrow();
    });
  });

  describe("Value validation", () => {
    it("should validate all values against value schema", () => {
      const schema = record(number().min(0).max(100));
      expect(schema.parse({ a: 50, b: 75 })).toEqual({ a: 50, b: 75 });
      expect(() => schema.parse({ a: 50, b: 150 })).toThrow();
      expect(() => schema.parse({ a: -10, b: 50 })).toThrow();
    });

    it("should validate complex value schemas", () => {
      const schema = record(
        object({
          name: string(),
          age: number(),
        })
      );
      const result = schema.parse({
        user1: { name: "Alice", age: 30 },
        user2: { name: "Bob", age: 25 },
      });
      expect(result).toEqual({
        user1: { name: "Alice", age: 30 },
        user2: { name: "Bob", age: 25 },
      });
    });

    it("should fail when any value is invalid", () => {
      const schema = record(number());
      expect(() => schema.parse({ a: 1, b: "not a number" })).toThrow();
    });
  });

  describe("Key validation", () => {
    it("should validate keys with custom key schema", () => {
      const schema = record(string().pattern(/^[a-z_]+$/), string());
      expect(schema.parse({ user_name: "Alice", user_age: "30" })).toEqual({
        user_name: "Alice",
        user_age: "30",
      });
      expect(() => schema.parse({ UserName: "Alice" })).toThrow();
      expect(() => schema.parse({ "user-name": "Alice" })).toThrow();
    });

    it("should validate keys with min/max length", () => {
      const schema = record(string().minLength(3).maxLength(10), number());
      expect(schema.parse({ abc: 1, defs: 2 })).toEqual({ abc: 1, defs: 2 });
      expect(() => schema.parse({ ab: 1 })).toThrow(); // too short
      expect(() => schema.parse({ abcdefghijk: 1 })).toThrow(); // too long
    });
  });

  describe("safeParse", () => {
    it("should return success for valid record", () => {
      const schema = record(number());
      const result = schema.safeParse({ a: 1, b: 2 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 1, b: 2 });
      }
    });

    it("should return failure for invalid record", () => {
      const schema = record(number());
      const result = schema.safeParse({ a: 1, b: "invalid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("HTML attributes / toJSON", () => {
    it("should generate JSON with keySchema and valueSchema", () => {
      const schema = record(number().min(0).max(100));
      const json = schema.toJSON();
      expect(json.type).toBe("record");
      expect(json.keySchema).toBeDefined();
      expect(json.valueSchema).toBeDefined();
      expect(json.keySchema.type).toBe("text");
      expect(json.valueSchema.type).toBe("number");
      expect(json.valueSchema.min).toBe(0);
      expect(json.valueSchema.max).toBe(100);
    });

    it("should include custom key schema attributes", () => {
      const schema = record(
        string()
          .pattern(/^[a-z_]+$/)
          .minLength(3),
        string()
      );
      const json = schema.toJSON();
      expect(json.keySchema.type).toBe("text");
      expect(json.keySchema.pattern).toBeDefined();
      expect(json.keySchema.minLength).toBe(3);
    });

    it("should include nested schema attributes", () => {
      const schema = record(
        object({
          enabled: boolean(),
          value: string(),
        })
      );
      const json = schema.toJSON();
      expect(json.valueSchema.type).toBe("object");
      expect(json.valueSchema.properties).toHaveProperty("enabled");
      expect(json.valueSchema.properties).toHaveProperty("value");
    });
  });

  describe("Modifiers", () => {
    it("should work with optional", () => {
      const schema = record(number()).optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse({ a: 1 })).toEqual({ a: 1 });
    });

    it("should work with nullable", () => {
      const schema = record(number()).nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse({ a: 1 })).toEqual({ a: 1 });
    });

    it("should work with default", () => {
      const schema = record(number()).default({ x: 10 });
      expect(schema.parse(undefined)).toEqual({ x: 10 });
      expect(schema.parse({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe("Error reporting", () => {
    it("should report errors with key paths", () => {
      const schema = record(number().min(0));
      try {
        schema.parse({ valid: 10, invalid: -5 });
      } catch (e: any) {
        expect(e.errors[0].path).toContain("invalid");
      }
    });

    it("should report nested errors with full paths", () => {
      const schema = record(
        object({
          age: number().min(0),
        })
      );
      try {
        schema.parse({ user1: { age: -5 } });
      } catch (e: any) {
        expect(e.errors[0].path[0]).toBe("user1");
        expect(e.errors[0].path).toContain("age");
      }
    });
  });

  describe("Type inference", () => {
    it("should infer correct TypeScript types", () => {
      const schema = record(number());
      const result = schema.parse({ a: 1, b: 2 });
      // Type should be Record<string, number>
      expect(typeof result.a).toBe("number");
    });
  });

  describe("Real-world use cases", () => {
    it("should validate user scores", () => {
      const scoresSchema = record(number().min(0).max(100));
      const scores = scoresSchema.parse({
        alice: 95,
        bob: 87,
        charlie: 92,
      });
      expect(scores.alice).toBe(95);
      expect(scores.bob).toBe(87);
    });

    it("should validate configuration objects", () => {
      const configSchema = record(
        object({
          enabled: boolean(),
          value: string(),
        })
      );
      const config = configSchema.parse({
        notifications: { enabled: true, value: "all" },
        darkMode: { enabled: false, value: "auto" },
      });
      expect(config.notifications.enabled).toBe(true);
      expect(config.darkMode.enabled).toBe(false);
    });

    it("should validate feature flags", () => {
      const flagsSchema = record(boolean());
      const flags = flagsSchema.parse({
        experimentalFeature: true,
        betaAccess: false,
        darkMode: true,
      });
      expect(flags.experimentalFeature).toBe(true);
    });
  });
});
