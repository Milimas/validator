import { describe, it, expect } from "vitest";
import { boolean } from "../src/index.js";

describe("BooleanSchema", () => {
  describe("Basic validation", () => {
    it("should parse valid boolean values", () => {
      const schema = boolean();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });

    it("should throw on non-boolean values", () => {
      const schema = boolean();
      expect(() => schema.parse("true")).toThrow();
      expect(() => schema.parse(1)).toThrow();
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it("should support safeParse", () => {
      const schema = boolean();
      const validTrue = schema.safeParse(true);
      const validFalse = schema.safeParse(false);
      const invalid = schema.safeParse("true");

      expect(validTrue.success).toBe(true);
      if (validTrue.success) {
        expect(validTrue.data).toBe(true);
      }

      expect(validFalse.success).toBe(true);
      if (validFalse.success) {
        expect(validFalse.data).toBe(false);
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("HTML attributes", () => {
    it("should have checkbox input type", () => {
      const schema = boolean();
      expect(schema.toJSON().type).toBe("checkbox");
    });

    it("should set default value and checked state", () => {
      const schemaTrue = boolean().default(true);
      const schemaFalse = boolean().default(false);

      expect(schemaTrue.toJSON().defaultValue).toBe(true);
      expect(schemaTrue.toJSON().checked).toBe(true);

      expect(schemaFalse.toJSON().defaultValue).toBe(false);
      expect(schemaFalse.toJSON().checked).toBe(false);
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional fields", () => {
      const schema = boolean().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });

    it("should handle default values", () => {
      const schema = boolean().default(false);
      expect(schema.parse(undefined)).toBe(false);
      expect(schema.parse(null)).toBe(false);
      expect(schema.parse(true)).toBe(true);
    });

    it("should handle nullable fields", () => {
      const schema = boolean().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });
  });

  describe("Required validation", () => {
    it("should set required attribute", () => {
      const schema = boolean().required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow disabling required", () => {
      const schema = boolean().required(false);
      expect(schema.toJSON().required).toBe(false);
    });
  });
});
