import { describe, it, expect } from "vitest";
import { unknown } from "validator";

describe("UnknownSchema", () => {
  describe("Basic validation", () => {
    it("should accept any value", () => {
      const schema = unknown();
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse("hello")).toBe("hello");
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(null)).toBe(null);
      expect(schema.parse({ key: "value" })).toEqual({ key: "value" });
      expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("should support safeParse", () => {
      const schema = unknown();
      const values = [42, "hello", true, null, { key: "value" }, [1, 2, 3]];

      values.forEach((value) => {
        const result = schema.safeParse(value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(value);
        }
      });
    });
  });
});
