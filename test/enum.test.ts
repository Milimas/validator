import { describe, it, expect } from "vitest";
import { enum as enumSchema } from "../src/index.js";

describe("EnumSchema", () => {
  describe("Basic validation", () => {
    it("should parse valid enum values", () => {
      const schema = enumSchema(["active", "inactive", "pending"] as const);
      expect(schema.parse("active")).toBe("active");
      expect(schema.parse("inactive")).toBe("inactive");
      expect(schema.parse("pending")).toBe("pending");
    });

    it("should throw on invalid enum values", () => {
      const schema = enumSchema(["active", "inactive"] as const);
      expect(() => schema.parse("invalid")).toThrow();
      expect(() => schema.parse("")).toThrow();
      expect(() => schema.parse("ACTIVE")).toThrow();
    });

    it("should throw on non-string values", () => {
      const schema = enumSchema(["option1", "option2"] as const);
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse(true)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it("should support safeParse", () => {
      const schema = enumSchema(["red", "green", "blue"] as const);
      const valid = schema.safeParse("red");
      const invalid = schema.safeParse("yellow");

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe("red");
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("Different enum types", () => {
    it("should work with number-like strings", () => {
      const schema = enumSchema(["1", "2", "3"] as const);
      expect(schema.parse("1")).toBe("1");
      expect(() => schema.parse(1)).toThrow();
    });

    it("should work with single option", () => {
      const schema = enumSchema(["only"] as const);
      expect(schema.parse("only")).toBe("only");
      expect(() => schema.parse("other")).toThrow();
    });

    it("should work with many options", () => {
      const options = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
      ] as const;
      const schema = enumSchema(options);
      expect(schema.parse("a")).toBe("a");
      expect(schema.parse("j")).toBe("j");
      expect(() => schema.parse("k")).toThrow();
    });
  });

  describe("HTML attributes", () => {
    it("should have select type in attributes", () => {
      const schema = enumSchema(["option1", "option2"] as const);
      expect(schema.toJSON().type).toBe("select");
    });

    it("should include options in attributes", () => {
      const schema = enumSchema(["active", "inactive", "pending"] as const);
      const json = schema.toJSON();
      expect(json.options).toEqual(["active", "inactive", "pending"]);
    });

    it("should set default value", () => {
      const schema = enumSchema(["small", "medium", "large"] as const).default(
        "medium"
      );
      expect(schema.toJSON().defaultValue).toBe("medium");
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional enums", () => {
      const schema = enumSchema(["yes", "no"] as const).optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse("yes")).toBe("yes");
    });

    it("should handle default values", () => {
      const schema = enumSchema(["low", "medium", "high"] as const).default(
        "medium"
      );
      expect(schema.parse(undefined)).toBe("medium");
      expect(schema.parse(null)).toBe("medium");
      expect(schema.parse("high")).toBe("high");
    });

    it("should handle nullable enums", () => {
      const schema = enumSchema(["option1", "option2"] as const).nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse("option1")).toBe("option1");
    });
  });

  describe("Required validation", () => {
    it("should set required attribute", () => {
      const schema = enumSchema(["yes", "no"] as const).required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow disabling required", () => {
      const schema = enumSchema(["yes", "no"] as const).required(false);
      expect(schema.toJSON().required).toBe(false);
    });
  });

  describe("Type inference", () => {
    it("should infer literal types", () => {
      const schema = enumSchema(["admin", "user", "guest"] as const);
      const result = schema.parse("admin");
      // TypeScript should infer result as "admin" | "user" | "guest"
      expect(result).toBe("admin");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string as valid option", () => {
      const schema = enumSchema(["", "option1", "option2"] as const);
      expect(schema.parse("")).toBe("");
    });

    it("should be case sensitive", () => {
      const schema = enumSchema(["Active", "Inactive"] as const);
      expect(schema.parse("Active")).toBe("Active");
      expect(() => schema.parse("active")).toThrow();
      expect(() => schema.parse("ACTIVE")).toThrow();
    });

    it("should handle options with special characters", () => {
      const schema = enumSchema(["option-1", "option_2", "option.3"] as const);
      expect(schema.parse("option-1")).toBe("option-1");
      expect(schema.parse("option_2")).toBe("option_2");
      expect(schema.parse("option.3")).toBe("option.3");
    });
  });
});
