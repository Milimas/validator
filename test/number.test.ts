import { describe, it, expect } from "vitest";
import { number } from "../src/index.js";

describe("NumberSchema", () => {
  describe("Basic validation", () => {
    it("should parse valid numbers", () => {
      const schema = number();
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(-10)).toBe(-10);
      expect(schema.parse(3.14)).toBe(3.14);
    });

    it("should throw on non-number values", () => {
      const schema = number();
      expect(() => schema.parse("123")).toThrow();
      expect(() => schema.parse(true)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it("should support safeParse", () => {
      const schema = number();
      const valid = schema.safeParse(42);
      const invalid = schema.safeParse("not a number");

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe(42);
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("Range constraints", () => {
    it("should validate minimum value", () => {
      const schema = number().min(10);
      expect(schema.parse(10)).toBe(10);
      expect(schema.parse(20)).toBe(20);
      expect(() => schema.parse(5)).toThrow();
    });

    it("should validate maximum value", () => {
      const schema = number().max(100);
      expect(schema.parse(100)).toBe(100);
      expect(schema.parse(50)).toBe(50);
      expect(() => schema.parse(150)).toThrow();
    });

    it("should validate both min and max", () => {
      const schema = number().min(0).max(100);
      expect(schema.parse(50)).toBe(50);
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
    });
  });

  describe("HTML attributes", () => {
    it("should have number input type", () => {
      const schema = number();
      expect(schema.toJSON().type).toBe("number");
    });

    it("should set min in HTML attributes", () => {
      const schema = number().min(10);
      expect(schema.toJSON().min).toBe(10);
    });

    it("should set max in HTML attributes", () => {
      const schema = number().max(100);
      expect(schema.toJSON().max).toBe(100);
    });

    it("should set default value", () => {
      const schema = number().default(42);
      expect(schema.toJSON().defaultValue).toBe(42);
    });

    it("should support method chaining", () => {
      const schema = number().min(0).max(100).default(50);
      const json = schema.toJSON();
      expect(json.min).toBe(0);
      expect(json.max).toBe(100);
      expect(json.defaultValue).toBe(50);
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional fields", () => {
      const schema = number().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(42)).toBe(42);
    });

    it("should handle default values", () => {
      const schema = number().default(0);
      expect(schema.parse(undefined)).toBe(0);
      expect(schema.parse(null)).toBe(0);
      expect(schema.parse(42)).toBe(42);
    });

    it("should handle nullable fields", () => {
      const schema = number().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(42)).toBe(42);
    });
  });

  describe("Required validation", () => {
    it("should set required attribute", () => {
      const schema = number().required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow disabling required", () => {
      const schema = number().required(false);
      expect(schema.toJSON().required).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero correctly", () => {
      const schema = number().min(0);
      expect(schema.parse(0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      const schema = number().min(-100).max(0);
      expect(schema.parse(-50)).toBe(-50);
      expect(schema.parse(-100)).toBe(-100);
      expect(schema.parse(0)).toBe(0);
    });

    it("should handle decimal numbers", () => {
      const schema = number();
      expect(schema.parse(3.14)).toBe(3.14);
      expect(schema.parse(0.1)).toBe(0.1);
    });
  });
});
