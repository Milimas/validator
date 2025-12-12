import { describe, it, expect } from "vitest";
import { object, string, number, email, boolean, array } from "../src/index.js";

describe("ObjectSchema", () => {
  describe("Basic validation", () => {
    it("should parse valid objects", () => {
      const schema = object({
        name: string(),
        age: number(),
      });

      const result = schema.parse({
        name: "John",
        age: 30,
      });

      expect(result).toEqual({
        name: "John",
        age: 30,
      });
    });

    it("should throw on non-object values", () => {
      const schema = object({
        name: string(),
      });

      expect(() => schema.parse("not an object")).toThrow();
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse([])).toThrow();
    });

    it("should validate property types", () => {
      const schema = object({
        name: string(),
        age: number(),
      });

      expect(() =>
        schema.parse({
          name: 123,
          age: 30,
        })
      ).toThrow();

      expect(() =>
        schema.parse({
          name: "John",
          age: "30",
        })
      ).toThrow();
    });

    it("should support safeParse", () => {
      const schema = object({
        name: string(),
        age: number(),
      });

      const valid = schema.safeParse({
        name: "John",
        age: 30,
      });

      const invalid = schema.safeParse({
        name: "John",
        age: "invalid",
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual({ name: "John", age: 30 });
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("Complex objects", () => {
    it("should validate nested objects", () => {
      const schema = object({
        user: object({
          name: string(),
          email: email(),
        }),
        metadata: object({
          createdAt: string(),
        }),
      });

      const result = schema.parse({
        user: {
          name: "John",
          email: "john@example.com",
        },
        metadata: {
          createdAt: "2024-01-01",
        },
      });

      expect(result.user.name).toBe("John");
      expect(result.user.email).toBe("john@example.com");
    });

    it("should validate objects with arrays", () => {
      const schema = object({
        name: string(),
        tags: array(string()),
      });

      const result = schema.parse({
        name: "Product",
        tags: ["tag1", "tag2"],
      });

      expect(result.tags).toEqual(["tag1", "tag2"]);
    });

    it("should validate objects with mixed types", () => {
      const schema = object({
        name: string(),
        age: number(),
        active: boolean(),
        email: email(),
      });

      const result = schema.parse({
        name: "John",
        age: 30,
        active: true,
        email: "john@example.com",
      });

      expect(result).toEqual({
        name: "John",
        age: 30,
        active: true,
        email: "john@example.com",
      });
    });
  });

  describe("Property constraints", () => {
    it("should validate property constraints", () => {
      const schema = object({
        username: string().minLength(3).maxLength(20),
        age: number().min(18).max(100),
      });

      expect(() =>
        schema.parse({
          username: "ab",
          age: 25,
        })
      ).toThrow();

      expect(() =>
        schema.parse({
          username: "validuser",
          age: 15,
        })
      ).toThrow();

      expect(
        schema.parse({
          username: "validuser",
          age: 25,
        })
      ).toEqual({
        username: "validuser",
        age: 25,
      });
    });
  });

  describe("Optional properties", () => {
    it("should handle optional properties", () => {
      const schema = object({
        name: string(),
        nickname: string().optional(),
      });

      expect(
        schema.parse({
          name: "John",
        })
      ).toEqual({
        name: "John",
      });

      expect(
        schema.parse({
          name: "John",
          nickname: "Johnny",
        })
      ).toEqual({
        name: "John",
        nickname: "Johnny",
      });
    });

    it("should handle properties with defaults", () => {
      const schema = object({
        name: string(),
        status: string().default("active"),
      });

      const result = schema.parse({
        name: "John",
      });

      expect(result.status).toBe("active");
    });
  });

  describe("HTML attributes", () => {
    it("should have object type in attributes", () => {
      const schema = object({
        name: string(),
      });
      expect(schema.toJSON().type).toBe("object");
    });

    it("should include properties in attributes", () => {
      const schema = object({
        name: string(),
        age: number(),
      });

      const json = schema.toJSON();
      expect(json.properties).toBeDefined();
      expect(json.properties.name).toBeDefined();
      expect(json.properties.age).toBeDefined();
    });

    it("should preserve nested property attributes", () => {
      const schema = object({
        user: object({
          name: string().placeholder("Enter name"),
          age: number().min(0),
        }),
      });

      const json = schema.toJSON();
      const userProps = json.properties.user as any;
      expect(userProps.properties.name.placeholder).toBe("Enter name");
      expect(userProps.properties.age.min).toBe(0);
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional objects", () => {
      const schema = object({
        name: string(),
      }).optional();

      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
    });

    it("should handle nullable objects", () => {
      const schema = object({
        name: string(),
      }).nullable();

      expect(schema.parse(null)).toBeNull();
      expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
    });
  });

  describe("Error reporting", () => {
    it("should report errors with property paths", () => {
      const schema = object({
        user: object({
          name: string(),
          age: number(),
        }),
      });

      const result = schema.safeParse({
        user: {
          name: "John",
          age: "invalid",
        },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].path).toEqual(["user", "age"]);
      }
    });
  });
});
