import { describe, it, expect } from "vitest";
import { number, object, ValidationAggregateError } from "../index.js";

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

  describe("SafeParse with constraints", () => {
    it("should return success for valid number within constraints", () => {
      const schema = number().min(10).max(100);
      const result = schema.safeParse(50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(50);
      }
    });

    it("should return failure for number below minimum", () => {
      const schema = number().min(10);
      const invalid = schema.safeParse(5);
      expect(invalid.success).toBe(false);
    });

    it("should return failure for number above maximum", () => {
      const schema = number().max(100);
      const invalid = schema.safeParse(150);
      expect(invalid.success).toBe(false);
    });
  });

  describe("Type inference", () => {
    it("should infer number type", () => {
      const schema = number();
      const result = schema.parse(42);
      // TypeScript should infer result as number
      expect(result).toBe(42);
    });
  });

  describe("Chained constraints", () => {
    it("should apply multiple constraints correctly", () => {
      const schema = number().min(0).max(100);
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(50)).toBe(50);
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
    });
  });

  describe("Error messages", () => {
    it("should provide meaningful error messages", () => {
      const schema = number().min(10).max(100);
      try {
        schema.parse(5);
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("greater than or equal to 10");
      }

      try {
        schema.parse(150);
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("less than or equal to 100");
      }

      try {
        schema.parse("not a number");
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("Invalid number");
      }
    });
  });

  describe("Integration with other schemas", () => {
    it("should work within an object schema", () => {
      const objSchema = object({
        age: number().min(0).max(120),
      });

      const parsed = objSchema.parse({ age: 30 });
      expect(parsed.age).toBe(30);

      expect(() => objSchema.parse({ age: -5 })).toThrow();
      expect(() => objSchema.parse({ age: 150 })).toThrow();
      expect(() => objSchema.parse({ age: "thirty" })).toThrow();
    });
  });

  describe("Large numbers", () => {
    it("should handle large numbers correctly", () => {
      const schema = number()
        .min(Number.MIN_SAFE_INTEGER)
        .max(Number.MAX_SAFE_INTEGER);
      expect(schema.parse(Number.MAX_SAFE_INTEGER)).toBe(
        Number.MAX_SAFE_INTEGER
      );
      expect(schema.parse(Number.MIN_SAFE_INTEGER)).toBe(
        Number.MIN_SAFE_INTEGER
      );
    });
  });

  describe("Special number values", () => {
    it("should reject NaN", () => {
      const schema = number();
      expect(() => schema.parse(NaN)).toThrow();
    });

    it("should reject Infinity and -Infinity", () => {
      const schema = number();
      expect(() => schema.parse(Infinity)).toThrow();
      expect(() => schema.parse(-Infinity)).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should allow chaining methods", () => {
      const schema = number().min(0).max(100).default(50).optional();
      const json = schema.toJSON();
      expect(json.min).toBe(0);
      expect(json.max).toBe(100);
      expect(json.defaultValue).toBe(50);
    });
  });
  describe("toJSON output", () => {
    it("should produce correct JSON representation", () => {
      const schema = number().min(10).max(100).default(50);
      const json = schema.toJSON();
      expect(json).toEqual({
        type: "number",
        min: 10,
        max: 100,
        required: true,
        defaultValue: 50,
      });
    });
  });

  describe("Chained optional and default", () => {
    it("should handle optional followed by default", () => {
      const schema = number().optional().default(25);
      expect(schema.parse(undefined)).toBe(25);
      expect(schema.parse(10)).toBe(10);
    });

    it("should handle default followed by optional", () => {
      const schema = number().default(30).optional();
      expect(schema.parse(undefined)).toBe(30);
      expect(schema.parse(15)).toBe(15);
    });
  });

  describe("Chained nullable and default", () => {
    it("should handle nullable followed by default", () => {
      const schema = number().nullable().default(40);
      expect(schema.parse(null)).toBe(40);
      expect(schema.parse(20)).toBe(20);
    });

    it("should handle default followed by nullable", () => {
      const schema = number().default(35).nullable();
      expect(schema.parse(undefined)).toBe(35);
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(25)).toBe(25);
    });
  });

  describe("Zero as boundary value", () => {
    it("should correctly handle zero in min and max constraints", () => {
      const schema = number().min(0).max(0);
      expect(schema.parse(0)).toBe(0);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(1)).toThrow();
    });
  });

  describe("Negative boundaries", () => {
    it("should correctly handle negative min and max constraints", () => {
      const schema = number().min(-100).max(-10);
      expect(schema.parse(-50)).toBe(-50);
      expect(() => schema.parse(-5)).toThrow();
      expect(() => schema.parse(-150)).toThrow();
    });
  });

  describe("Decimal boundaries", () => {
    it("should correctly handle decimal min and max constraints", () => {
      const schema = number().min(0.5).max(9.5);
      expect(schema.parse(5.5)).toBe(5.5);
      expect(() => schema.parse(0.4)).toThrow();
      expect(() => schema.parse(9.6)).toThrow();
    });
  });

  describe("Integer validation with int()", () => {
    it("should accept valid integers", () => {
      const schema = number().int();
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(-10)).toBe(-10);
      expect(schema.parse(1000)).toBe(1000);
    });

    it("should reject decimal numbers", () => {
      const schema = number().int();
      expect(() => schema.parse(3.14)).toThrow();
      expect(() => schema.parse(0.1)).toThrow();
      expect(() => schema.parse(-5.5)).toThrow();
      expect(() => schema.parse(42.999)).toThrow();
    });

    it("should work with safeParse for integers", () => {
      const schema = number().int();
      const validResult = schema.safeParse(10);
      const invalidResult = schema.safeParse(10.5);

      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe(10);
      }

      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.errors[0].message).toContain("integer");
      }
    });

    it("should work with min/max constraints", () => {
      const schema = number().int().min(0).max(100);
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(50)).toBe(50);
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
      expect(() => schema.parse(50.5)).toThrow();
    });

    it("should provide meaningful error messages", () => {
      const schema = number().int();
      try {
        schema.parse(3.14);
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("integer");
      }
    });

    it("should work with optional and default", () => {
      const optionalSchema = number().int().optional();
      expect(optionalSchema.parse(undefined)).toBeUndefined();
      expect(optionalSchema.parse(42)).toBe(42);
      expect(() => optionalSchema.parse(42.5)).toThrow();

      const defaultSchema = number().int().default(10);
      expect(defaultSchema.parse(undefined)).toBe(10);
      expect(defaultSchema.parse(20)).toBe(20);
      expect(() => defaultSchema.parse(20.5)).toThrow();
    });

    it("should work with nullable", () => {
      const schema = number().int().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(10)).toBe(10);
      expect(() => schema.parse(10.5)).toThrow();
    });

    it("should handle large integers", () => {
      const schema = number().int();
      expect(schema.parse(Number.MAX_SAFE_INTEGER)).toBe(
        Number.MAX_SAFE_INTEGER
      );
      expect(schema.parse(Number.MIN_SAFE_INTEGER)).toBe(
        Number.MIN_SAFE_INTEGER
      );
    });

    it("should work in object schemas", () => {
      const objSchema = object({
        count: number().int().min(0),
        rating: number().int().min(1).max(5),
      });

      const parsed = objSchema.parse({ count: 10, rating: 4 });
      expect(parsed.count).toBe(10);
      expect(parsed.rating).toBe(4);

      expect(() => objSchema.parse({ count: 10.5, rating: 4 })).toThrow();
      expect(() => objSchema.parse({ count: 10, rating: 4.2 })).toThrow();
    });

    it("should chain with other methods", () => {
      const schema = number().min(0).int().max(100).default(50);
      expect(schema.parse(25)).toBe(25);
      expect(schema.parse(undefined)).toBe(50);
      expect(() => schema.parse(25.5)).toThrow();
      expect(() => schema.parse(-5)).toThrow();
      expect(() => schema.parse(150)).toThrow();
    });

    it("should handle zero as an integer", () => {
      const schema = number().int();
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(-0)).toBe(-0);
    });

    it("should reject NaN and Infinity even with int()", () => {
      const schema = number().int();
      expect(() => schema.parse(NaN)).toThrow();
      expect(() => schema.parse(Infinity)).toThrow();
      expect(() => schema.parse(-Infinity)).toThrow();
    });

    it("should handle custom error messages", () => {
      const schema = number().int();
      try {
        schema.parse(12.34);
      } catch (e: ValidationAggregateError | any) {
        expect(e.errors[0].code).toBe("not_integer");
        expect(e.message).toContain("integer");
      }
    });
  });

  describe("Multiple validations", () => {
    it("should accumulate multiple validation errors", () => {
      const schema = number().min(10).max(20);
      try {
        schema.parse(5);
      } catch (e: ValidationAggregateError | any) {
        expect(e.errors.length).toBeGreaterThan(0);
      }

      try {
        schema.parse(25);
      } catch (e: ValidationAggregateError | any) {
        expect(e.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Custom error messages", () => {
    it("should allow custom error messages for min and max", () => {
      const schema = number()
        .min(10, "Value must be at least 10")
        .max(100, "Value must be at most 100");

      try {
        schema.parse(5);
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("Value must be at least 10");
      }

      try {
        schema.parse(150);
      } catch (e: ValidationAggregateError | any) {
        expect(e.message).toContain("Value must be at most 100");
      }
    });
  });

  describe("Integration with arrays", () => {
    it("should validate numbers within an array schema", () => {
      const arraySchema = object({
        scores: number().min(0).max(100).optional(),
      });

      const parsed = arraySchema.parse({ scores: 85 });
      expect(parsed.scores).toBe(85);

      expect(() => arraySchema.parse({ scores: -10 })).toThrow();
      expect(() => arraySchema.parse({ scores: 150 })).toThrow();
    });
  });

  describe("Number edge cases", () => {
    it("should handle very small numbers", () => {
      const schema = number().min(-1e10).max(1e10);
      expect(schema.parse(-1e10)).toBe(-1e10);
      expect(schema.parse(1e10)).toBe(1e10);
    });

    it("should handle very large numbers", () => {
      const schema = number().min(-1e15).max(1e15);
      expect(schema.parse(-1e15)).toBe(-1e15);
      expect(schema.parse(1e15)).toBe(1e15);
    });
  });
});
