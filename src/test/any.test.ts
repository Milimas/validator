import { describe, it, expect } from "vitest";
import { never } from "validator";

describe("NeverSchema", () => {
  describe("Basic validation", () => {
    it("should always throw on parse", () => {
      const schema = never();
      expect(() => schema.parse(true)).toThrow();
      expect(() => schema.parse(false)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse(42)).toThrow();
      expect(() => schema.parse("string")).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it("should support safeParse", () => {
      const schema = never();
      const result = schema.safeParse("any value");

      expect(result.success).toBe(false);
    });
  });

  describe("HTML attributes", () => {
    it("should have type 'never'", () => {
      const schema = never();
      expect(schema.toJSON().type).toBe("never");
    });
  });
});
