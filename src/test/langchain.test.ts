import { describe, it, expect } from "vitest";
import {
  string,
  number,
  boolean,
  object,
  looseObject,
  array,
  any,
  never,
  unknown,
  union,
  record,
  enum as enumSchema,
} from "../index.js";

describe("toLangchainJSON", () => {
  describe("NullableSchema", () => {
    it("wraps inner schema in anyOf with null branch", () => {
      const schema = string().nullable();
      const json = schema.toLangchainJSON();
      expect(json).toMatchObject({
        anyOf: [{ type: "string" }, { type: "null" }],
      });
    });

    it("preserves description", () => {
      const schema = string().describe("a name").nullable();
      const json = schema.toLangchainJSON();
      expect((json as any).description).toBeTruthy();
    });
  });

  describe("OptionalSchema", () => {
    it("wraps inner schema in anyOf with null branch", () => {
      const schema = string().optional();
      const json = schema.toLangchainJSON();
      expect(json).toMatchObject({
        anyOf: [{ type: "string" }, { type: "null" }],
      });
    });

    it("works with number", () => {
      const schema = number().optional();
      const json = schema.toLangchainJSON();
      expect(json).toMatchObject({
        anyOf: [{ type: "number" }, { type: "null" }],
      });
    });
  });

  describe("ObjectSchema", () => {
    it("includes all keys in required, including optional fields", () => {
      const schema = object({
        name: string(),
        age: number().optional(),
      });
      const json = schema.toLangchainJSON() as any;
      expect(json.required).toContain("name");
      expect(json.required).toContain("age");
      expect(json.required).toHaveLength(2);
    });

    it("optional field schema is anyOf+null", () => {
      const schema = object({ age: number().optional() });
      const json = schema.toLangchainJSON() as any;
      expect(json.properties.age).toMatchObject({
        anyOf: [{ type: "number" }, { type: "null" }],
      });
    });
  });

  describe("RecordSchema", () => {
    it("does not emit propertyNames", () => {
      const schema = record(number());
      const json = schema.toLangchainJSON() as any;
      expect(json.propertyNames).toBeUndefined();
    });

    it("prefixes description with dynamic key note", () => {
      const schema = record(string());
      const json = schema.toLangchainJSON() as any;
      expect(json.description).toMatch(/object with dynamic string keys/);
    });
  });

  describe("AnySchema", () => {
    it("emits anyOf over all primitive types", () => {
      const schema = any();
      const json = schema.toLangchainJSON() as any;
      expect(json.anyOf).toBeDefined();
      const types = json.anyOf.map((b: any) => b.type);
      expect(types).toContain("string");
      expect(types).toContain("number");
      expect(types).toContain("boolean");
      expect(types).toContain("object");
      expect(types).toContain("array");
      expect(types).toContain("null");
    });
  });

  describe("UnknownSchema", () => {
    it("emits anyOf over all primitive types", () => {
      const schema = unknown();
      const json = schema.toLangchainJSON() as any;
      expect(json.anyOf).toBeDefined();
      const types = json.anyOf.map((b: any) => b.type);
      expect(types).toContain("string");
      expect(types).toContain("null");
    });
  });

  describe("NeverSchema", () => {
    it("emits string type with empty enum", () => {
      const schema = never();
      const json = schema.toLangchainJSON() as any;
      expect(json.type).toBe("string");
      expect(json.enum).toEqual([]);
    });
  });

  describe("UnionSchema", () => {
    it("emits anyOf with each branch", () => {
      const schema = union([string(), number()]);
      const json = schema.toLangchainJSON() as any;
      expect(json.anyOf).toMatchObject([
        { type: "string" },
        { type: "number" },
      ]);
    });
  });

  describe("ArraySchema", () => {
    it("emits array type with items", () => {
      const schema = array(string());
      const json = schema.toLangchainJSON() as any;
      expect(json.type).toBe("array");
      expect(json.items).toMatchObject({ type: "string" });
    });
  });

  describe("BooleanSchema", () => {
    it("emits boolean type", () => {
      const json = boolean().toLangchainJSON();
      expect(json).toMatchObject({ type: "boolean" });
    });
  });

  describe("EnumSchema", () => {
    it("emits string type with enum values", () => {
      const schema = enumSchema(["a", "b", "c"]);
      const json = schema.toLangchainJSON() as any;
      expect(json.type).toBe("string");
      expect(json.enum).toEqual(["a", "b", "c"]);
    });
  });
});
