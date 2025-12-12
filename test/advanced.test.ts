import { describe, it, expect } from "vitest";
import {
  string,
  email,
  number,
  boolean,
  array,
  object,
  enum as enumSchema,
  uuid,
  url,
  password,
  Infer,
} from "../src/index.js";

describe("Type Inference with Infer", () => {
  describe("Simple types", () => {
    it("should infer string type", () => {
      const stringSchema = string();
      type StringType = Infer<typeof stringSchema>;
      const value: StringType = "hello";
      expect(value).toBe("hello");
    });

    it("should infer number type", () => {
      const numberSchema = number();
      type NumberType = Infer<typeof numberSchema>;
      const value: NumberType = 42;
      expect(value).toBe(42);
    });

    it("should infer boolean type", () => {
      const booleanSchema = boolean();
      type BooleanType = Infer<typeof booleanSchema>;
      const value: BooleanType = true;
      expect(value).toBe(true);
    });

    it("should infer optional string", () => {
      const schema = string().optional();
      type InferredType = Infer<typeof schema>;
      const value1: InferredType = "hello";
      const value2: InferredType = undefined;
      expect(value1).toBe("hello");
      expect(value2).toBeUndefined();
    });

    it("should infer nullable string", () => {
      const schema = string().nullable();
      type InferredType = Infer<typeof schema>;
      const value1: InferredType = "hello";
      const value2: InferredType = null;
      expect(value1).toBe("hello");
      expect(value2).toBeNull();
    });
  });

  describe("Array type inference", () => {
    it("should infer array of strings", () => {
      const schema = array(string());
      type InferredType = Infer<typeof schema>;
      const value: InferredType = ["a", "b", "c"];
      expect(value).toEqual(["a", "b", "c"]);
    });

    it("should infer array of numbers", () => {
      const schema = array(number());
      type InferredType = Infer<typeof schema>;
      const value: InferredType = [1, 2, 3];
      expect(value).toEqual([1, 2, 3]);
    });

    it("should infer nested array", () => {
      const schema = array(array(string()));
      type InferredType = Infer<typeof schema>;
      const value: InferredType = [
        ["a", "b"],
        ["c", "d"],
      ];
      expect(value).toEqual([
        ["a", "b"],
        ["c", "d"],
      ]);
    });

    it("should infer optional array", () => {
      const schema = array(string()).optional();
      type InferredType = Infer<typeof schema>;
      const value1: InferredType = ["a", "b"];
      const value2: InferredType = undefined;
      expect(value1).toEqual(["a", "b"]);
      expect(value2).toBeUndefined();
    });
  });

  describe("Object type inference", () => {
    it("should infer simple object", () => {
      const schema = object({
        name: string(),
        age: number(),
      });
      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        name: "John",
        age: 30,
      };
      expect(value).toEqual({
        name: "John",
        age: 30,
      });
    });

    it("should infer nested object", () => {
      const schema = object({
        user: object({
          name: string(),
          email: email(),
        }),
        active: boolean(),
      });
      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        user: {
          name: "John",
          email: "john@example.com",
        },
        active: true,
      };
      expect(value.user.name).toBe("John");
      expect(value.user.email).toBe("john@example.com");
    });

    it("should infer object with array", () => {
      const schema = object({
        name: string(),
        tags: array(string()),
      });
      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        name: "Product",
        tags: ["tag1", "tag2"],
      };
      expect(value.tags).toEqual(["tag1", "tag2"]);
    });

    it("should infer optional object", () => {
      const schema = object({
        name: string(),
      }).optional();
      type InferredType = Infer<typeof schema>;
      const value1: InferredType = { name: "John" };
      const value2: InferredType = undefined;
      expect(value1).toEqual({ name: "John" });
      expect(value2).toBeUndefined();
    });
  });

  describe("Complex nested type inference", () => {
    it("should infer deeply nested structure", () => {
      const schema = object({
        company: object({
          name: string(),
          departments: array(
            object({
              name: string(),
              employees: array(
                object({
                  name: string(),
                  email: email(),
                  id: uuid(),
                })
              ),
            })
          ),
        }),
      });

      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        company: {
          name: "Acme Corp",
          departments: [
            {
              name: "Engineering",
              employees: [
                {
                  name: "Alice",
                  email: "alice@example.com",
                  id: "550e8400-e29b-41d4-a716-446655440000",
                },
              ],
            },
          ],
        },
      };

      expect(value.company.name).toBe("Acme Corp");
      expect(value.company.departments[0].name).toBe("Engineering");
      expect(value.company.departments[0].employees[0].name).toBe("Alice");
    });

    it("should infer array of complex objects", () => {
      const schema = array(
        object({
          id: uuid(),
          title: string(),
          content: string(),
          author: object({
            name: string(),
            email: email(),
          }),
          tags: array(string()),
          published: boolean(),
        })
      );

      type InferredType = Infer<typeof schema>;
      const value: InferredType = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Post 1",
          content: "Content 1",
          author: {
            name: "John",
            email: "john@example.com",
          },
          tags: ["tag1", "tag2"],
          published: true,
        },
      ];

      expect(value[0].title).toBe("Post 1");
      expect(value[0].author.email).toBe("john@example.com");
    });
  });

  describe("Enum type inference", () => {
    it("should infer enum type", () => {
      const schema = enumSchema(["active", "inactive", "pending"] as const);
      type InferredType = Infer<typeof schema>;
      const value: InferredType = "active";
      expect(value).toBe("active");
    });

    it("should infer enum in object", () => {
      const schema = object({
        status: enumSchema(["open", "closed", "pending"] as const),
        priority: enumSchema(["low", "medium", "high"] as const),
      });

      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        status: "open",
        priority: "high",
      };

      expect(value.status).toBe("open");
      expect(value.priority).toBe("high");
    });
  });

  describe("Optional and nullable type inference", () => {
    it("should infer optional property in object", () => {
      const schema = object({
        name: string(),
        nickname: string().optional(),
      });

      type InferredType = Infer<typeof schema>;
      const value1: InferredType = { name: "John" };
      const value2: InferredType = { name: "John", nickname: "Johnny" };

      expect(value1.name).toBe("John");
      expect(value2.nickname).toBe("Johnny");
    });

    it("should infer optional property as optional key with ? (not required)", () => {
      const schema = object({
        name: string(),
        nickname: string().optional(),
      });

      type InferredType = Infer<typeof schema>;
      // This should compile without error - nickname is optional
      const validObject: InferredType = { name: "John" };
      expect(validObject.name).toBe("John");
      expect(validObject.nickname).toBeUndefined();
    });

    it("should separate required and optional properties correctly", () => {
      const schema = object({
        id: number(),
        name: string(),
        email: string().optional(),
        phone: string().optional(),
        address: string(),
      });

      type InferredType = Infer<typeof schema>;
      const requiredOnly: InferredType = {
        id: 1,
        name: "John",
        address: "123 Main St",
      };
      expect(requiredOnly.id).toBe(1);
      expect(requiredOnly.email).toBeUndefined();
      expect(requiredOnly.phone).toBeUndefined();

      const withOptional: InferredType = {
        id: 2,
        name: "Jane",
        address: "456 Oak Ave",
        email: "jane@example.com",
        phone: "555-1234",
      };
      expect(withOptional.email).toBe("jane@example.com");
    });

    it("should infer nullable property in object", () => {
      const schema = object({
        name: string(),
        middleName: string().nullable(),
      });

      type InferredType = Infer<typeof schema>;
      const value: InferredType = {
        name: "John",
        middleName: null,
      };

      expect(value.middleName).toBeNull();
    });
  });
});

describe("Complex Nested Structures", () => {
  describe("Complex nested arrays and objects", () => {
    it("should validate deeply nested array of objects", () => {
      const schema = array(
        object({
          id: number(),
          name: string(),
          metadata: object({
            created: string(),
            tags: array(string()),
          }),
        })
      );

      const data = [
        {
          id: 1,
          name: "Item 1",
          metadata: {
            created: "2024-01-01",
            tags: ["tag1", "tag2"],
          },
        },
        {
          id: 2,
          name: "Item 2",
          metadata: {
            created: "2024-01-02",
            tags: ["tag3"],
          },
        },
      ];

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should validate array of arrays of objects", () => {
      const schema = array(
        array(
          object({
            x: number(),
            y: number(),
          })
        )
      );

      const data = [
        [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
        [
          { x: 5, y: 6 },
          { x: 7, y: 8 },
        ],
      ];

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should validate object with nested arrays of objects", () => {
      const schema = object({
        name: string(),
        categories: array(
          object({
            categoryName: string(),
            items: array(
              object({
                itemId: number(),
                itemName: string(),
                details: object({
                  description: string(),
                  price: number(),
                }),
              })
            ),
          })
        ),
      });

      const data = {
        name: "Store",
        categories: [
          {
            categoryName: "Electronics",
            items: [
              {
                itemId: 1,
                itemName: "Laptop",
                details: {
                  description: "A powerful laptop",
                  price: 999.99,
                },
              },
            ],
          },
        ],
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.categories[0].items[0].details.price).toBe(999.99);
      }
    });

    it("should validate complex user profile structure", () => {
      const schema = object({
        userId: uuid(),
        username: string().minLength(3),
        email: email(),
        profile: object({
          firstName: string(),
          lastName: string(),
          bio: string().optional(),
          avatar: url().optional(),
        }),
        preferences: object({
          theme: enumSchema(["light", "dark"] as const),
          notifications: boolean(),
          language: enumSchema(["en", "es", "fr"] as const),
        }),
        socialLinks: array(
          object({
            platform: enumSchema(["twitter", "linkedin", "github"] as const),
            url: url(),
          })
        ),
        addresses: array(
          object({
            type: enumSchema(["home", "work", "other"] as const),
            street: string(),
            city: string(),
            zipCode: string(),
            country: string(),
            isDefault: boolean(),
          })
        ),
      });

      const validData = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        username: "johndoe",
        email: "john@example.com",
        profile: {
          firstName: "John",
          lastName: "Doe",
          bio: "Software developer",
          avatar: "https://example.com/avatar.jpg",
        },
        preferences: {
          theme: "dark",
          notifications: true,
          language: "en",
        },
        socialLinks: [
          {
            platform: "github",
            url: "https://github.com/johndoe",
          },
          {
            platform: "linkedin",
            url: "https://linkedin.com/in/johndoe",
          },
        ],
        addresses: [
          {
            type: "home",
            street: "123 Main St",
            city: "Springfield",
            zipCode: "12345",
            country: "USA",
            isDefault: true,
          },
        ],
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate complex ecommerce product catalog", () => {
      const schema = object({
        catalogId: uuid(),
        storeName: string(),
        products: array(
          object({
            productId: uuid(),
            name: string(),
            description: string(),
            price: number().min(0),
            currency: enumSchema(["USD", "EUR", "GBP"] as const),
            inventory: object({
              quantity: number().min(0),
              warehouse: string(),
              lastUpdated: string(),
            }),
            variants: array(
              object({
                variantId: uuid(),
                size: enumSchema(["XS", "S", "M", "L", "XL", "XXL"] as const),
                color: string(),
                stock: number(),
              })
            ),
            reviews: array(
              object({
                reviewId: uuid(),
                author: string(),
                rating: number().min(1).max(5),
                comment: string().optional(),
                verified: boolean(),
              })
            ),
            images: array(
              object({
                imageId: uuid(),
                url: url(),
                alt: string(),
                isPrimary: boolean(),
              })
            ),
          })
        ),
      });

      const validData = {
        catalogId: "550e8400-e29b-41d4-a716-446655440000",
        storeName: "TechStore",
        products: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            name: "Wireless Headphones",
            description: "High quality wireless headphones",
            price: 79.99,
            currency: "USD",
            inventory: {
              quantity: 100,
              warehouse: "NY-01",
              lastUpdated: "2024-01-15",
            },
            variants: [
              {
                variantId: "550e8400-e29b-41d4-a716-446655440002",
                size: "M",
                color: "Black",
                stock: 50,
              },
            ],
            reviews: [
              {
                reviewId: "550e8400-e29b-41d4-a716-446655440003",
                author: "John",
                rating: 5,
                comment: "Great product!",
                verified: true,
              },
            ],
            images: [
              {
                imageId: "550e8400-e29b-41d4-a716-446655440004",
                url: "https://example.com/product.jpg",
                alt: "Product image",
                isPrimary: true,
              },
            ],
          },
        ],
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe("Complex Schema Chains", () => {
  describe("Complex string chains", () => {
    it("should validate string with multiple constraints", () => {
      const schema = string()
        .minLength(5)
        .maxLength(50)
        .pattern(/^[a-zA-Z0-9\s-]+$/)
        .default("default-value")
        .required();

      expect(schema.parse("valid-string-123")).toBe("valid-string-123");
      expect(() => schema.parse("ab")).toThrow();
      expect(() => schema.parse("invalid@string")).toThrow();
    });

    it("should validate email with constraints", () => {
      const schema = email()
        .minLength(5)
        .maxLength(100)
        .placeholder("Enter email")
        .default("default@example.com");

      const json = schema.toJSON();
      expect(json.minLength).toBe(5);
      expect(json.maxLength).toBe(100);
      expect(json.defaultValue).toBe("default@example.com");
      expect(json.placeholder).toBe("Enter email");
    });

    it("should validate password with strength requirements", () => {
      const schema = password()
        .minLength(8)
        .maxLength(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required(true, "Password is required");

      expect(schema.parse("SecurePass123")).toBe("SecurePass123");
      expect(() => schema.parse("weak")).toThrow();
      expect(() => schema.parse("nouppercase1")).toThrow();
    });
  });

  describe("Complex number chains", () => {
    it("should validate number with range and default", () => {
      const schema = number().min(0).max(100).default(50).required();

      expect(schema.parse(undefined)).toBe(50);
      expect(schema.parse(75)).toBe(75);
      expect(() => schema.parse(150)).toThrow();
    });

    it("should validate percentage field", () => {
      const schema = number().min(0).max(100).default(0);

      expect(schema.parse(undefined)).toBe(0);
      expect(schema.parse(50)).toBe(50);
      expect(schema.parse(100)).toBe(100);
    });
  });

  describe("Complex object chains", () => {
    it("should validate object with complex field chains", () => {
      const schema = object({
        username: string()
          .minLength(3)
          .maxLength(20)
          .pattern(/^[a-zA-Z0-9_]+$/)
          .required(),

        email: email().maxLength(100).default("noemail@example.com"),

        age: number().min(13).max(150).optional(),

        preferences: object({
          theme: enumSchema(["light", "dark", "auto"] as const).default("auto"),
          notifications: boolean().default(true),
          language: enumSchema(["en", "es", "fr", "de"] as const).default("en"),
        }),

        interests: array(string().minLength(2).maxLength(50))
          .minLength(0)
          .maxLength(10),
      });

      const result = schema.safeParse({
        username: "john_doe_123",
        email: "john@example.com",
        age: 25,
        preferences: {
          theme: "dark",
          notifications: false,
          language: "en",
        },
        interests: ["technology", "gaming", "music"],
      });

      expect(result.success).toBe(true);
    });

    it("should validate complex form schema", () => {
      const schema = object({
        personalInfo: object({
          firstName: string().minLength(1).maxLength(50).required(),
          lastName: string().minLength(1).maxLength(50).required(),
          middleName: string().maxLength(50).optional(),
          birthDate: string().pattern(/^\d{4}-\d{2}-\d{2}$/),
        }),

        contactInfo: object({
          email: email().required(),
          phone: string().pattern(/^\+?[\d\s\-()]+$/),
          website: url().optional(),
        }),

        address: object({
          street: string().minLength(5),
          city: string().minLength(2),
          state: enumSchema(["CA", "NY", "TX", "FL"] as const).optional(),
          zipCode: string().pattern(/^\d{5}(-\d{4})?$/),
          country: string().minLength(2),
        }),

        accountSettings: object({
          username: string()
            .minLength(3)
            .maxLength(20)
            .pattern(/^[a-zA-Z0-9_]+$/)
            .required(),

          password: password()
            .minLength(8)
            .maxLength(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required(),

          accountType: enumSchema([
            "free",
            "premium",
            "enterprise",
          ] as const).default("free"),

          twoFactorEnabled: boolean().default(false),
        }),

        preferences: array(
          object({
            category: enumSchema(["email", "push", "sms"] as const),
            enabled: boolean(),
          })
        ),
      });

      const validData = {
        personalInfo: {
          firstName: "John",
          lastName: "Doe",
          birthDate: "1990-01-15",
        },
        contactInfo: {
          email: "john@example.com",
          phone: "+1-555-123-4567",
          website: "https://johndoe.com",
        },
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
        accountSettings: {
          username: "john_doe",
          password: "SecurePass123",
          accountType: "premium",
          twoFactorEnabled: true,
        },
        preferences: [
          { category: "email", enabled: true },
          { category: "push", enabled: false },
        ],
      };

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("Complex array chains", () => {
    it("should validate array with constrained items", () => {
      const schema = array(string().minLength(2).maxLength(10))
        .minLength(1)
        .maxLength(5)
        .default(["default"]);

      expect(schema.parse(undefined)).toEqual(["default"]);
      expect(schema.parse(["aa", "bb", "cc"])).toEqual(["aa", "bb", "cc"]);
      expect(() => schema.parse(["a"])).toThrow(); // item too short
      expect(() => schema.parse([])).toThrow(); // array too short
    });

    it("should validate array of objects with constrained fields", () => {
      const schema = array(
        object({
          id: number().min(1),
          name: string().minLength(2).maxLength(50),
          email: email(),
          score: number().min(0).max(100).default(0),
        })
      )
        .minLength(1)
        .maxLength(100);

      const validData = [
        {
          id: 1,
          name: "Alice",
          email: "alice@example.com",
          score: 95,
        },
        {
          id: 2,
          name: "Bob",
          email: "bob@example.com",
        },
      ];

      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe("Real-world Complex Schemas", () => {
  it("should validate a blog API response", () => {
    const schema = object({
      statusCode: number(),
      message: string(),
      data: object({
        posts: array(
          object({
            id: uuid(),
            title: string().minLength(5).maxLength(200),
            slug: string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
            excerpt: string().maxLength(500),
            content: string(),
            author: object({
              id: uuid(),
              name: string(),
              email: email(),
              avatar: url().optional(),
            }),
            tags: array(string()).minLength(1).maxLength(10),
            category: enumSchema([
              "tech",
              "lifestyle",
              "business",
              "other",
            ] as const),
            metadata: object({
              views: number().min(0),
              likes: number().min(0),
              shares: number().min(0),
              published: boolean(),
              publishedAt: string(),
              updatedAt: string(),
            }),
            comments: array(
              object({
                id: uuid(),
                author: string(),
                email: email(),
                content: string(),
                createdAt: string(),
              })
            ),
          })
        ),
        pagination: object({
          page: number().min(1),
          pageSize: number().min(1).max(100),
          total: number().min(0),
          totalPages: number().min(0),
        }),
      }),
    });

    expect(schema).toBeDefined();
    expect(schema.toJSON().type).toBe("object");
  });

  it("should validate a complex GraphQL query result", () => {
    const schema = object({
      data: object({
        user: object({
          id: uuid(),
          email: email(),
          profile: object({
            firstName: string(),
            lastName: string(),
            avatar: url().optional(),
          }),
          posts: array(
            object({
              id: uuid(),
              title: string(),
              published: boolean(),
              author: object({
                id: uuid(),
                name: string(),
              }),
            })
          ).optional(),
          followers: array(
            object({
              id: uuid(),
              name: string(),
              email: email(),
            })
          ),
        }).optional(),
        errors: array(
          object({
            message: string(),
            extensions: object({
              code: string(),
              http: object({
                status: number(),
              }).optional(),
            }).optional(),
          })
        ).optional(),
      }),
    });

    expect(schema).toBeDefined();
    expect(schema.toJSON().type).toBe("object");
  });
});
