import { v } from "../src/index";
import { describe, it, expect } from "vitest";

describe("StringSchema", () => {
  it("should parse valid strings", () => {
    const schema = v.string();
    expect(schema.parse("hello")).toBe("hello");
  });

  it("should throw on non-string values", () => {
    const schema = v.string();
    expect(() => schema.parse(123)).toThrowError();
    expect(() => schema.parse(null)).toThrowError();
  });

  it("should set default value", () => {
    const schema = v.string().default("test");
    expect(schema.toJSON().defaultValue).toBe("test");
  });

  it("should set placeholder", () => {
    const schema = v.string().placeholder("Enter text");
    expect(schema.toJSON().placeholder).toBe("Enter text");
  });

  it("should set max", () => {
    const schema = v.string().maxLength(50);
    expect(schema.toJSON().maxLength).toBe(50);
  });

  it("should set min", () => {
    const schema = v.string().minLength(5);
    expect(schema.toJSON().minLength).toBe(5);
  });

  it("should set pattern", () => {
    const pattern = /^[a-z]+$/;
    const schema = v.string().pattern(pattern);
    expect(schema.toJSON().pattern).toBe(pattern.source);
  });

  it("should support method chaining", () => {
    const schema = v.string().placeholder("test").maxLength(100).minLength(10);
    const json = schema.toJSON();
    expect(json.placeholder).toBe("test");
    expect(json.maxLength).toBe(100);
    expect(json.minLength).toBe(10);
  });
});

describe("EmailSchema", () => {
  it("should parse valid email strings", () => {
    const schema = v.email();
    expect(schema.parse("test@example.com")).toBe("test@example.com");
  });

  it("should have email HTML attributes", () => {
    const schema = v.email();
    const json = schema.toJSON();
    expect(json.type).toBe("email");
  });

  it("should set default value", () => {
    const schema = v.email().default("test@example.com");
    expect(schema.toJSON().defaultValue).toBe("test@example.com");
  });

  it("should throw on non-string values", () => {
    const schema = v.email();
    expect(() => schema.parse(123)).toThrowError();
    expect(() => schema.parse(null)).toThrowError();
  });

  it("should throw on missing @ symbol", () => {
    const schema = v.email();
    expect(() => schema.parse("test-example.com")).toThrowError();
  });

  it("should throw on missing domain", () => {
    const schema = v.email();
    expect(() => schema.parse("test@")).toThrowError();
  });

  it("should throw on missing username", () => {
    const schema = v.email();
    expect(() => schema.parse("@example.com")).toThrowError();
  });

  it("should throw on invalid domain format", () => {
    const schema = v.email();
    expect(() => schema.parse("test@.com")).toThrowError();
    expect(() => schema.parse("test@example")).toThrowError();
  });

  it("should throw on invalid email strings", () => {
    const schema = v.email();
    expect(() => schema.parse("invalid-email")).toThrowError();
  });
});

describe("NumberSchema", () => {
  it("should parse valid numbers", () => {
    const schema = v.number();
    expect(schema.parse(42)).toBe(42);
    expect(schema.parse(0)).toBe(0);
    expect(schema.parse(-10)).toBe(-10);
  });

  it("should throw on non-number values", () => {
    const schema = v.number();
    expect(() => schema.parse("123")).toThrowError("Invalid number");
    expect(() => schema.parse(null)).toThrowError("Invalid number");
  });
});

describe("BooleanSchema", () => {
  it("should parse valid booleans", () => {
    const schema = v.boolean();
    expect(schema.parse(true)).toBe(true);
    expect(schema.parse(false)).toBe(false);
  });

  it("should throw on non-boolean values", () => {
    const schema = v.boolean();
    expect(() => schema.parse(1)).toThrowError("Invalid boolean");
    expect(() => schema.parse("true")).toThrowError("Invalid boolean");
  });
});

describe("ObjectSchema", () => {
  it("should parse valid objects", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
    });
    const result = schema.parse({ name: "John", age: 30 });
    expect(result).toEqual({ name: "John", age: 30 });
  });

  it("should throw on non-object values", () => {
    const schema = v.object({ name: v.string() });
    expect(() => schema.parse("not an object")).toThrowError("Invalid object");
    expect(() => schema.parse(null)).toThrowError("Invalid object");
  });

  it("should validate nested objects", () => {
    const schema = v.object({
      user: v.object({ name: v.string(), age: v.number() }),
    });
    const result = schema.parse({ user: { name: "Jane", age: 25 } });
    expect(result.user.name).toBe("Jane");
  });

  it("should throw on invalid nested objects", () => {
    const schema = v.object({
      user: v.object({ name: v.string(), age: v.number() }),
    });
    expect(() =>
      schema.parse({ user: { name: "Jane", age: "not a number" } })
    ).toThrowError("Invalid number");
  });

  it("should generate correct JSON representation", () => {
    const schema = v.object({
      email: v.string(),
      active: v.boolean(),
    });
    const json = schema.toJSON();
    expect(json.type).toBe("object");
    expect(json.properties).toBeDefined();
  });
});

describe("ArraySchema", () => {
  it("should parse valid arrays", () => {
    const schema = v.array(v.string());
    const result = schema.parse(["a", "b", "c"]);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("should parse array of numbers", () => {
    const schema = v.array(v.number());
    const result = schema.parse([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should parse nested arrays", () => {
    const schema = v.array(v.array(v.string()));
    const result = schema.parse([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(result).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("should parse array of objects", () => {
    const schema = v.array(
      v.object({
        id: v.string(),
        value: v.number(),
      })
    );
    const result = schema.parse([
      { id: "item1", value: 10 },
      { id: "item2", value: 20 },
    ]);
    expect(result).toEqual([
      { id: "item1", value: 10 },
      { id: "item2", value: 20 },
    ]);
  });

  it("should throw on non-array values", () => {
    const schema = v.array(v.string());
    expect(() => schema.parse("not an array")).toThrowError();
    expect(() => schema.parse(null)).toThrowError();
  });

  it("should validate array items", () => {
    const schema = v.array(v.number());
    expect(() => schema.parse([1, "two", 3])).toThrowError();
  });

  it("should generate correct JSON representation", () => {
    const schema = v.array(v.string());
    const json = schema.toJSON();
    expect(json.type).toBe("array");
    expect(json.items).toBeDefined();
  });

  it("should handle empty arrays", () => {
    const schema = v.array(v.string());
    const result = schema.parse([]);
    expect(result).toEqual([]);
  });
});

describe("Type inference", () => {
  it("should infer string type", () => {
    const schema = v.string();
    type Inferred = v.Infer<typeof schema>;
    const value: Inferred = "test";
    expect(value).toBe("test");
  });

  it("should infer object type", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    type Inferred = v.Infer<typeof schema>;
    const value: Inferred = { name: "John", age: 30 };
    expect(value).toEqual({ name: "John", age: 30 });
  });

  it("should infer array type", () => {
    const schema = v.array(v.string());
    type Inferred = v.Infer<typeof schema>;
    const value: Inferred = ["a", "b"];
    expect(value).toEqual(["a", "b"]);
  });
});
