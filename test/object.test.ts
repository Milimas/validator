import { describe, it, expect } from "vitest";
import {
  object,
  string,
  number,
  email,
  boolean,
  array,
  enum as enumSchema,
  html,
} from "../src/index.js";

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

    it("should parse multiple nested objects", () => {
      const fileAttachmentSchema = object({
        "@odata.type": string()
          .default("#microsoft.graph.fileAttachment")
          .readOnly(),
        name: string().default("Attached File"),
        contentType: string().default("text/plain"),
        contentBytes: string(),
      });

      const eventAttachmentSchema = object({
        "@odata.type": string()
          .default("#microsoft.graph.eventAttachment")
          .readOnly(),
        name: string().default("Attached Event"),
        event: object({
          subject: string(),
          body: object({
            contentType: enumSchema([
              "None",
              "Text",
              "HTML",
            ] as const).optional(),
            text: string().dependsOn([
              {
                field: "eventAttachmentSchema.event.body.contentType",
                condition: /Text/,
              },
            ]),
            html: html().dependsOn([
              {
                field: "eventAttachmentSchema.event.body.contentType",
                condition: /HTML/,
              },
            ]),
          }).optional(),
          start: string().optional(),
          end: string().optional(),
          location: object({
            displayName: string().optional(),
          }).optional(),
          attendees: array(
            object({
              emailAddress: object({
                address: string(),
                name: string().optional(),
              }),
              type: enumSchema([
                "required",
                "optional",
                "resource",
              ] as const).default("required"),
            })
          ).optional(),
          isAllDay: boolean().optional().default(false),
          sensitivity: enumSchema([
            "normal",
            "personal",
            "private",
            "confidential",
          ] as const)
            .optional()
            .default("normal"),
        }).optional(),
      });
      const schema = object({
        name: string().minLength(2).maxLength(50).required(),
        age: number().min(0).max(120).required(),
        email: string()
          .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
          .required(),
        preferences: object({
          newsletter: boolean().default(false),
          notifications: enumSchema([
            "all",
            "mentions",
            "none",
          ] as const).default("all"),
        }).required(),
        tags: array(string().minLength(1).maxLength(20))
          .minLength(0)
          .maxLength(10),
        fileAttachmentSchema: fileAttachmentSchema.required(true),
        eventAttachmentSchema: eventAttachmentSchema.required(true),
      });

      const result = schema.parse({
        name: "Alice",
        age: 28,
        email: "alice@example.com",
        preferences: { newsletter: true },
        tags: ["friend", "colleague"],
        fileAttachmentSchema: {
          contentBytes: "SGVsbG8gd29ybGQ=",
        },
        eventAttachmentSchema: {
          event: {
            subject: "Team Meeting",
            body: {
              contentType: "Text",
              text: "Don't forget our meeting tomorrow at 10 AM.",
            },
            start: "2024-07-01T10:00:00Z",
            end: "2024-07-01T11:00:00Z",
          },
        },
      });

      expect(result.name).toBe("Alice");
      expect(result.age).toBe(28);
      expect(result.email).toBe("alice@example.com");
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

    it("should report detailed errors for invalid nested properties", () => {
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

    it("should report detailed errors for invalid array items", () => {
      const schema = object({
        tags: array(string()),
      });

      const result = schema.safeParse({
        tags: ["valid", 123, "string"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].path).toEqual(["tags", 1]);
      }
    });

    it("should throw when required properties are missing", () => {
      const schema = object({
        name: string(),
        age: number(),
      });

      expect(() =>
        schema.parse({
          name: "John",
        })
      ).toThrow();

      expect(() =>
        schema.parse({
          age: 30,
        })
      ).toThrow();
    });

    it("should throw when nested object properties are required", () => {
      const schema = object({
        user: object({
          name: string(),
          age: number(),
        }),
      });

      expect(() =>
        schema.parse({
          user: {
            name: "John",
          },
        })
      ).toThrow();

      expect(() =>
        schema.parse({
          user: {
            age: 30,
          },
        })
      ).toThrow();
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
