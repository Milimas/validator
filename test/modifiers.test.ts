import { describe, it, expect } from "vitest";
import { string, number, object, array, boolean } from "../src/index.js";

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
      expect(schema.parse(undefined)).toBe("");
      expect(schema.parse(null)).toBe("");
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

  describe("dependsOn()", () => {
    it("should set data-dependsOn attribute", () => {
      const schema = string().dependsOn([
        { field: "type", condition: /business/ },
      ]);

      const json = schema.toJSON() as any;
      expect(json.required).toBe(true);
      expect(json["data-depends-on"]).toBeDefined();
    });

    it("should support multiple conditions", () => {
      const schema = string().dependsOn([
        { field: "type", condition: /business/ },
        { field: "country", condition: /US/ },
      ]);

      const json = schema.toJSON() as any;
      expect(json["data-depends-on"]).toHaveLength(2);
    });

    it("should work with other modifiers", () => {
      const schema = string()
        .minLength(5)
        .dependsOn([{ field: "required", condition: /true/ }]);

      const json = schema.toJSON() as any;
      expect(json.minLength).toBe(5);
      expect(json["data-depends-on"]).toBeDefined();
    });

    it("should skip validation when dependency is not satisfied", () => {
      const schema = object({
        flag: boolean().required(),
        value: string()
          .minLength(3)
          .dependsOn([{ field: "flag", condition: /true/ }]),
      });

      const result = schema.safeParse({ flag: false, value: "x" });

      expect(result.success).toBe(true);
      expect(result.data?.value).toBeUndefined();
    });

    it("should require the field when dependency is satisfied", () => {
      const schema = object({
        flag: boolean(),
        value: string().dependsOn([{ field: "flag", condition: /true/ }]),
      });

      const result = schema.safeParse({ flag: true });

      expect(result.success).toBe(false);
      expect(result.errors[0]?.path).toEqual(["value"]);
      expect(result.errors[0]?.code).toBe("required");
    });

    it("should validate when dependency is satisfied and value is present", () => {
      const schema = object({
        flag: boolean(),
        value: string()
          .minLength(3)
          .dependsOn([{ field: "flag", condition: /true/ }]),
      });

      const result = schema.safeParse({ flag: true, value: "hello" });

      expect(result.success).toBe(true);
      expect(result.data?.value).toBe("hello");
    });

    it("should work with default values", () => {
      const schema = object({
        flag: boolean().default(false),
        value: string()
          .minLength(3)
          .default("default")
          .dependsOn([{ field: "flag", condition: /true/ }]),
      });

      const result = schema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data?.flag).toBe(false);
      // When dependency is not satisfied, field is not applicable and returns undefined
      // (not the default, since it wasn't needed)
      expect(result.data?.value).toBeUndefined();
    });
  });
});
