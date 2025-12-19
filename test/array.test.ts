import { describe, it, expect } from "vitest";
import {
  array,
  string,
  number,
  object,
  enum as enumSchema,
} from "../src/index.js";

describe("ArraySchema", () => {
  describe("Basic validation", () => {
    it("should parse valid arrays", () => {
      const schema = array(string());
      expect(schema.parse(["a", "b", "c"])).toEqual(["a", "b", "c"]);
      expect(schema.parse([])).toEqual([]);
    });

    it("should throw on non-array values", () => {
      const schema = array(string());
      expect(() => schema.parse("not an array")).toThrow();
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse(null)).toThrow();
    });

    it("should validate array item types", () => {
      const schema = array(string());
      expect(() => schema.parse(["valid", 123, "string"])).toThrow();
      expect(() => schema.parse([1, 2, 3])).toThrow();
    });

    it("should support safeParse", () => {
      const schema = array(string());
      const valid = schema.safeParse(["a", "b"]);
      const invalid = schema.safeParse([1, 2, 3]);

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual(["a", "b"]);
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("Different item types", () => {
    it("should work with number items", () => {
      const schema = array(number());
      expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => schema.parse(["1", "2", "3"])).toThrow();
    });

    it("should work with nested arrays", () => {
      const schema = array(array(string()));
      expect(
        schema.parse([
          ["a", "b"],
          ["c", "d"],
        ])
      ).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
      expect(() =>
        schema.parse([
          [1, 2],
          [3, 4],
        ])
      ).toThrow();
    });
  });

  describe("Length constraints", () => {
    it("should validate minimum length", () => {
      const schema = array(string()).minLength(2);
      expect(schema.parse(["a", "b"])).toEqual(["a", "b"]);
      expect(schema.parse(["a", "b", "c"])).toEqual(["a", "b", "c"]);
      expect(() => schema.parse(["a"])).toThrow();
      expect(() => schema.parse([])).toThrow();
    });

    it("should validate maximum length", () => {
      const schema = array(string()).maxLength(3);
      expect(schema.parse(["a", "b", "c"])).toEqual(["a", "b", "c"]);
      expect(schema.parse(["a"])).toEqual(["a"]);
      expect(() => schema.parse(["a", "b", "c", "d"])).toThrow();
    });

    it("should validate both min and max length", () => {
      const schema = array(string()).minLength(1).maxLength(5);
      expect(schema.parse(["a", "b"])).toEqual(["a", "b"]);
      expect(() => schema.parse([])).toThrow();
      expect(() => schema.parse(["a", "b", "c", "d", "e", "f"])).toThrow();
    });
  });

  describe("HTML attributes", () => {
    it("should have array type in attributes", () => {
      const schema = array(string());
      expect(schema.toJSON().type).toBe("array");
    });

    it("should include item schema in attributes", () => {
      const schema = array(string());
      const json = schema.toJSON();
      expect(json.items).toBeDefined();
      expect(Array.isArray(json.items)).toBe(true);
    });

    it("should set minLength in attributes", () => {
      const schema = array(string()).minLength(2);
      expect(schema.toJSON().minLength).toBe(2);
    });

    it("should set maxLength in attributes", () => {
      const schema = array(string()).maxLength(10);
      expect(schema.toJSON().maxLength).toBe(10);
    });

    it("should support method chaining", () => {
      const schema = array(string()).minLength(1).maxLength(10);
      const json = schema.toJSON();
      expect(json.minLength).toBe(1);
      expect(json.maxLength).toBe(10);
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional fields", () => {
      const schema = array(string()).optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse(["a", "b"])).toEqual(["a", "b"]);
    });

    it("should handle default values", () => {
      const schema = array(string()).default(["default"]);
      expect(schema.parse(undefined)).toEqual(["default"]);
      expect(schema.parse(null)).toEqual(["default"]);
      expect(schema.parse(["custom"])).toEqual(["custom"]);
    });

    it("should handle nullable fields", () => {
      const schema = array(string()).nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(["a"])).toEqual(["a"]);
    });
  });

  describe("Required validation", () => {
    it("should set required attribute", () => {
      const schema = array(string()).required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow disabling required", () => {
      const schema = array(string()).required(false);
      expect(schema.toJSON().required).toBe(false);
    });
  });

  describe("Validation of items with constraints", () => {
    it("should validate items with string constraints", () => {
      const schema = array(string().minLength(3));
      expect(schema.parse(["hello", "world"])).toEqual(["hello", "world"]);
      expect(() => schema.parse(["hi", "yo"])).toThrow();
    });

    it("should validate items with number constraints", () => {
      const schema = array(number().min(0).max(100));
      expect(schema.parse([10, 50, 90])).toEqual([10, 50, 90]);
      expect(() => schema.parse([-1, 50, 90])).toThrow();
      expect(() => schema.parse([10, 150, 90])).toThrow();
    });
  });

  describe("Specific edge cases", () => {
    it("should handle optional array of objects", () => {
      const schema = object({
        headers: array(
          object({
            key: string(),
            value: string(),
          })
        ).optional(),
      });
      const result = schema.safeParse({
        headers: [{ key: "Content-Type", value: "application/json" }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          headers: [{ key: "Content-Type", value: "application/json" }],
        });
      }

      expect(schema.toJSON().properties.headers.items).toBeDefined();
    });
    it("", () => {
      const schema = object({
        events: array(
          enumSchema([
            "messageCreate",
            "messageUpdate",
            "messageDelete",
            "guildMemberAdd",
            "guildMemberRemove",
            "interactionCreate",
            "ready",
          ])
        ).default(["messageCreate"]),
      });

      const json = schema.toJSON();
      expect(json.properties.events.defaultValue).toEqual(["messageCreate"]);
      expect(json.properties.events.type).toBe("array");
      expect(json.properties.events.items).toBeDefined();
      expect(json.properties.events.items).toEqual([
        {
          type: "select",
          options: [
            "messageCreate",
            "messageUpdate",
            "messageDelete",
            "guildMemberAdd",
            "guildMemberRemove",
            "interactionCreate",
            "ready",
          ],
          required: true,
        },
      ]);
    });
  });
});
