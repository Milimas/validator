import { describe, it, expect } from "vitest";
import {
  string,
  email,
  url,
  password,
  uuid,
  phoneNumber,
  zipCode,
  hexColor,
} from "../src/index.js";

describe("StringSchema", () => {
  describe("Basic validation", () => {
    it("should parse valid strings", () => {
      const schema = string();
      expect(schema.parse("hello")).toBe("hello");
      expect(schema.parse("")).toBe("");
    });

    it("should throw on non-string values", () => {
      const schema = string();
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse(true)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it("should support safeParse", () => {
      const schema = string();
      const valid = schema.safeParse("hello");
      const invalid = schema.safeParse(123);

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe("hello");
      }

      expect(invalid.success).toBe(false);
    });
  });

  describe("Length constraints", () => {
    it("should validate minimum length", () => {
      const schema = string().minLength(5);
      expect(schema.parse("hello")).toBe("hello");
      expect(() => schema.parse("hi")).toThrow();
    });

    it("should validate maximum length", () => {
      const schema = string().maxLength(10);
      expect(schema.parse("hello")).toBe("hello");
      expect(() => schema.parse("this is too long")).toThrow();
    });

    it("should validate both min and max length", () => {
      const schema = string().minLength(3).maxLength(10);
      expect(schema.parse("hello")).toBe("hello");
      expect(() => schema.parse("hi")).toThrow();
      expect(() => schema.parse("this is way too long")).toThrow();
    });
  });

  describe("Pattern validation", () => {
    it("should validate against regex pattern", () => {
      const schema = string().pattern(/^[a-z]+$/);
      expect(schema.parse("hello")).toBe("hello");
      expect(() => schema.parse("Hello123")).toThrow();
    });
  });

  describe("HTML attributes", () => {
    it("should set placeholder", () => {
      const schema = string().placeholder("Enter text");
      expect(schema.toJSON().placeholder).toBe("Enter text");
    });

    it("should set default value", () => {
      const schema = string().default("default");
      expect(schema.toJSON().defaultValue).toBe("default");
    });

    it("should set datalist options", () => {
      const schema = string().datalist("options-list", ["option1", "option2"]);
      expect(schema.toJSON().dataList).toEqual(["option1", "option2"]);
      expect(schema.toJSON().list).toBe("options-list");
    });

    it("should support method chaining for HTML attributes", () => {
      const schema = string()
        .placeholder("Enter name")
        .minLength(3)
        .maxLength(50);

      const json = schema.toJSON();
      expect(json.placeholder).toBe("Enter name");
      expect(json.minLength).toBe(3);
      expect(json.maxLength).toBe(50);
    });
  });

  describe("Optional and default values", () => {
    it("should handle optional fields", () => {
      const schema = string().optional();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse("hello")).toBe("hello");
    });

    it("should handle default values", () => {
      const schema = string().default("default");
      expect(schema.parse(undefined)).toBe("default");
      expect(schema.parse(null)).toBe("default");
      expect(schema.parse("custom")).toBe("custom");
    });

    it("should handle nullable fields", () => {
      const schema = string().nullable();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse("hello")).toBe("hello");
    });
  });

  describe("Required validation", () => {
    it("should set required attribute", () => {
      const schema = string().required();
      expect(schema.toJSON().required).toBe(true);
    });

    it("should set custom required message", () => {
      const schema = string().required(true, "Custom error message");
      expect(schema.toJSON().required).toBe(true);
    });

    it("should allow disabling required", () => {
      const schema = string().required(false);
      expect(schema.toJSON().required).toBe(false);
    });
  });
});

describe("EmailSchema", () => {
  it("should validate correct email addresses", () => {
    const schema = email();
    expect(schema.parse("user@example.com")).toBe("user@example.com");
    expect(schema.parse("test.email+tag@domain.co.uk")).toBe(
      "test.email+tag@domain.co.uk"
    );
  });

  it("should reject invalid email addresses", () => {
    const schema = email();
    expect(() => schema.parse("invalid")).toThrow();
    expect(() => schema.parse("@example.com")).toThrow();
    expect(() => schema.parse("user@")).toThrow();
  });

  it("should have email input type in HTML attributes", () => {
    const schema = email();
    expect(schema.toJSON().type).toBe("email");
  });
});

describe("UrlSchema", () => {
  it("should validate correct URLs", () => {
    const schema = url();
    expect(schema.parse("https://example.com")).toBe("https://example.com");
    expect(schema.parse("http://localhost:3000/path")).toBe(
      "http://localhost:3000/path"
    );
  });

  it("should reject invalid URLs", () => {
    const schema = url();
    expect(() => schema.parse("not a url")).toThrow();
    expect(() => schema.parse("example.com")).toThrow();
  });

  it("should have url input type in HTML attributes", () => {
    const schema = url();
    expect(schema.toJSON().type).toBe("url");
  });
});

describe("PasswordSchema", () => {
  it("should validate password strings", () => {
    const schema = password();
    expect(schema.parse("password123")).toBe("password123");
  });

  it("should have password input type in HTML attributes", () => {
    const schema = password();
    expect(schema.toJSON().type).toBe("password");
  });

  it("should support length constraints", () => {
    const schema = password().minLength(8);
    expect(schema.parse("longpassword")).toBe("longpassword");
    expect(() => schema.parse("short")).toThrow();
  });
});

describe("UUIDSchema", () => {
  it("should validate correct UUIDs", () => {
    const schema = uuid();
    expect(schema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "550e8400-e29b-41d4-a716-446655440000"
    );
  });

  it("should reject invalid UUIDs", () => {
    const schema = uuid();
    expect(() => schema.parse("not-a-uuid")).toThrow();
    expect(() => schema.parse("550e8400-e29b-41d4")).toThrow();
  });
});

describe("PhoneNumberSchema", () => {
  it("should validate phone numbers", () => {
    const schema = phoneNumber();
    expect(schema.parse("+1-234-567-8900")).toBe("+1-234-567-8900");
  });

  it("should have tel input type in HTML attributes", () => {
    const schema = phoneNumber();
    expect(schema.toJSON().type).toBe("tel");
  });
});

describe("ZipCodeSchema", () => {
  it("should validate zip codes", () => {
    const schema = zipCode();
    expect(schema.parse("12345")).toBe("12345");
    expect(schema.parse("12345-6789")).toBe("12345-6789");
  });

  it("should reject invalid zip codes", () => {
    const schema = zipCode();
    expect(() => schema.parse("1234")).toThrow();
    expect(() => schema.parse("abcde")).toThrow();
  });
});

describe("HexColorSchema", () => {
  it("should validate hex color codes", () => {
    const schema = hexColor();
    expect(schema.parse("#FFFFFF")).toBe("#FFFFFF");
    expect(schema.parse("#000")).toBe("#000");
  });

  it("should reject invalid hex colors", () => {
    const schema = hexColor();
    expect(() => schema.parse("FFFFFF")).toThrow();
    expect(() => schema.parse("#GG0000")).toThrow();
  });

  it("should have color input type in HTML attributes", () => {
    const schema = hexColor();
    expect(schema.toJSON().type).toBe("color");
  });
});
