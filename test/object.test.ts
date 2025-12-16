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

    it("should validate required properties", () => {
      const schema = object({
        name: string().required(),
        age: number().required(),
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

    it("should throw when extra properties are present", () => {
      const schema = object({
        name: string(),
      });

      expect(() =>
        schema.parse({
          name: "John",
          extra: "not allowed",
        })
      ).toThrow();
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

  describe("Schema composition", () => {
    it("extend should merge shapes and validate", () => {
      const object1 = object({ firstName: string() });
      const object2 = object({ age: number() });

      const object3 = object1.extend(object2);

      // Valid when both properties provided
      expect(object3.parse({ firstName: "John", age: 30 })).toEqual({
        firstName: "John",
        age: 30,
      });

      // toJSON should include both properties
      const json = object3.toJSON();
      expect(json.properties.firstName).toBeDefined();
      expect(json.properties.age).toBeDefined();
    });

    it("extend should merge multiple schemas at once", () => {
      const object1 = object({ firstName: string() });
      const object2 = object({ lastName: string() });
      const object3 = object({ age: number().min(0) });
      const object4 = object({ email: email() });

      const merged = object1.extend(object2, object3, object4);

      // Valid when all properties provided
      const result = merged.parse({
        firstName: "John",
        lastName: "Doe",
        age: 30,
        email: "john@example.com",
      });
      expect(result).toEqual({
        firstName: "John",
        lastName: "Doe",
        age: 30,
        email: "john@example.com",
      });

      // toJSON should include all properties
      const json = merged.toJSON();
      expect(json.properties.firstName).toBeDefined();
      expect(json.properties.lastName).toBeDefined();
      expect(json.properties.age).toBeDefined();
      expect(json.properties.email).toBeDefined();

      // Validation should still work for all fields
      expect(() =>
        merged.parse({
          firstName: "John",
          lastName: "Doe",
          age: -5, // min(0) constraint
          email: "john@example.com",
        })
      ).toThrow();

      expect(() =>
        merged.parse({
          firstName: "John",
          lastName: "Doe",
          age: 30,
          email: "invalid", // email validation
        })
      ).toThrow();
    });

    it("omit should drop keys and forbid them thereafter", () => {
      const base = object({ firstName: string(), age: number() });
      const withoutAge = base.omit("age");

      // Valid when omitted key is not present
      expect(withoutAge.parse({ firstName: "Jane" })).toEqual({
        firstName: "Jane",
      });

      // Including the omitted key should fail (unexpected property)
      expect(() => withoutAge.parse({ firstName: "Jane", age: 25 })).toThrow();

      // toJSON should only include remaining keys
      const json = withoutAge.toJSON();
      expect(json.properties.firstName).toBeDefined();
      expect((json.properties as any).age).toBeUndefined();
    });

    it("pick should select only specified keys and forbid the rest", () => {
      const base = object({
        firstName: string(),
        age: number(),
        email: string(),
      });

      const onlyFirst = base.pick("firstName");

      // Valid with only picked key
      expect(onlyFirst.parse({ firstName: "Alex" })).toEqual({
        firstName: "Alex",
      });

      // Any other key should be rejected as unexpected
      expect(() => onlyFirst.parse({ firstName: "Alex", age: 20 })).toThrow();
      expect(() => onlyFirst.parse({ email: "a@b.com" } as any)).toThrow();

      // toJSON includes only the picked key
      const json = onlyFirst.toJSON();
      expect(json.properties.firstName).toBeDefined();
      expect((json.properties as any).age).toBeUndefined();
      expect((json.properties as any).email).toBeUndefined();
    });
  });

  describe("Complex composition", () => {
    it("extend with nested objects/arrays enforces all inner checks", () => {
      const base = object({
        user: object({
          username: string().minLength(3),
          age: number().min(18).int(),
        }),
      });

      const extras = object({
        address: object({
          street: string().minLength(3),
          zip: string().pattern(/^[0-9]{5}(?:-[0-9]{4})?$/),
        }),
        tags: array(string().minLength(2)).minLength(1).maxLength(5),
      });

      const schema = base.extend(extras);

      // Valid case
      const ok = schema.parse({
        user: { username: "alice", age: 22 },
        address: { street: "Main St", zip: "12345" },
        tags: ["aa", "bb"],
      });
      expect(ok.user.username).toBe("alice");

      // Invalid: inner item too short and array too short
      const res1 = schema.safeParse({
        user: { username: "al", age: 22 }, // too short username
        address: { street: "St", zip: "12" }, // street too short, zip invalid
        tags: [], // minLength(1)
      });
      expect(res1.success).toBe(false);
      if (!res1.success) {
        const paths = res1.errors.map((e) => e.path.join("."));
        expect(paths).toContain("user.username");
        expect(paths).toContain("address.street");
        expect(paths).toContain("address.zip");
        // Ensure there is at least one error under tags (size or item)
        expect(paths.some((p) => p === "tags" || p.startsWith("tags"))).toBe(
          true
        );
      }

      // Unexpected properties should be caught against the extended shape
      const res2 = schema.safeParse({
        user: { username: "alice", age: 22 },
        address: { street: "Main St", zip: "12345" },
        tags: ["aa"],
        extra: true,
      } as any);
      expect(res2.success).toBe(false);
      if (!res2.success) {
        const unexpected = res2.errors.find((e) => e.path[0] === "extra");
        expect(unexpected).toBeDefined();
      }
    });

    it("omit removes keys before validating and forbids them thereafter", () => {
      const base = object({
        profile: object({
          name: string().minLength(2),
          bio: string().maxLength(10),
        }),
        settings: object({
          theme: string().minLength(3),
        }),
      });

      const withoutSettings = base.omit("settings");

      // Valid without settings
      expect(
        withoutSettings.parse({ profile: { name: "Jo", bio: "short bio" } })
      ).toEqual({ profile: { name: "Jo", bio: "short bio" } });

      // Provided omitted key becomes unexpected (and not validated)
      const res = withoutSettings.safeParse({
        profile: { name: "Jo", bio: "short bio" },
        settings: { theme: "dk" }, // would fail minLength(3) if validated
      } as any);
      expect(res.success).toBe(false);
      if (!res.success) {
        // Ensure error is unexpected_property on settings rather than theme length
        const hasUnexpectedSettings = res.errors.some(
          (e) =>
            e.path.join(".") === "settings" && e.code === "unexpected_property"
        );
        expect(hasUnexpectedSettings).toBe(true);
      }
    });

    it("pick keeps only selected keys but preserves their inner checks", () => {
      const base = object({
        user: object({
          username: string().minLength(4),
          email: email(),
        }),
        tags: array(string().minLength(3)).minLength(1),
        meta: object({ createdAt: string() }),
      });

      const onlyUserAndTags = base.pick("user", "tags");

      // Other keys should be unexpected
      expect(() =>
        onlyUserAndTags.parse({
          user: { username: "john", email: "john@example.com" },
          tags: ["dev"],
          meta: { createdAt: "2024-01-01" },
        } as any)
      ).toThrow();

      // Inner checks still apply
      const r = onlyUserAndTags.safeParse({
        user: { username: "jon", email: "x@y.z" }, // username too short
        tags: ["ok"], // item too short for minLength(3)
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const paths = r.errors.map((e) => e.path.join("."));
        expect(paths).toContain("user.username");
        // Could be tags (length) or tags.0 (item), accept either
        expect(paths.some((p) => p === "tags" || p.startsWith("tags."))).toBe(
          true
        );
      }
    });

    it("composition chaining (extend → omit → pick) produces expected validation", () => {
      const a = object({ id: number().int(), role: string().minLength(4) });
      const b = object({
        profile: object({ name: string().minLength(2) }),
        flags: array(string()).maxLength(2),
      });

      const chained = a
        .extend(b) // id, role, profile, flags
        .omit("role") // remove role
        .pick("id", "profile", "flags"); // keep these three

      // Valid
      expect(
        chained.parse({
          id: 1,
          profile: { name: "Al" },
          flags: ["x", "y"],
        })
      ).toEqual({ id: 1, profile: { name: "Al" }, flags: ["x", "y"] });

      // Invalid due to int(), minLength(2), and maxLength(2)
      const bad = chained.safeParse({
        id: 1.5, // not integer
        profile: { name: "A" }, // too short
        flags: ["x", "y", "z"], // too many
      });
      expect(bad.success).toBe(false);
      if (!bad.success) {
        const paths = bad.errors.map((e) => e.path.join("."));
        expect(paths).toContain("id");
        expect(paths).toContain("profile.name");
        expect(paths).toContain("flags");
      }
    });
  });
});
