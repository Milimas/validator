import { describe, it, expect } from "vitest";
import {
  any,
  array,
  boolean,
  number,
  object,
  string,
  enum as enumSchema,
  never,
  record,
  union,
} from "validator";

describe("RefineSchema", () => {
  describe("AnySchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        data: any().refine((val) => typeof val === "string", {
          message: "Data must be a string",
          code: "not_string",
        }),
      });

      const result = schema.safeParse({ data: "hello" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: "hello" });

      const failResult = schema.safeParse({ data: 123 });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("Data must be a string");
      expect(failResult.errors[0]?.code).toBe("not_string");
      expect(failResult.errors[0]?.expected).toBeUndefined();
      expect(failResult.errors[0]?.received).toBeUndefined();
      expect(failResult.errors[0]?.value).toBe(123);
    });
  });

  describe("ArraySchema", () => {
    it("should validate with custom refine function", () => {
      const schema = array(number()).refine((arr) => arr.length >= 3, {
        message: "Array must have at least 3 items",
        code: "too_small",
      });

      const result = schema.safeParse([1, 2, 3]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);

      const failResult = schema.safeParse([1]);
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe(
        "Array must have at least 3 items"
      );
      expect(failResult.errors[0]?.code).toBe("too_small");
    });
  });

  describe("BooleanSchema", () => {
    it("should validate with custom refine function", () => {
      const schemaTrue = object({
        isActive: boolean().refine((val) => val === true, {
          message: "isActive must be true",
          code: "not_active",
        }),
      });

      const result = schemaTrue.safeParse({ isActive: true });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isActive: true });

      const failResult = schemaTrue.safeParse({ isActive: false });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("isActive must be true");
      expect(failResult.errors[0]?.code).toBe("not_active");

      const schemaFalse = object({
        isActive: boolean().refine((val) => val === false, {
          message: "isActive must be false",
          code: "is_active",
        }),
      });

      const resultFalse = schemaFalse.safeParse({ isActive: false });
      expect(resultFalse.success).toBe(true);
      expect(resultFalse.data).toEqual({ isActive: false });

      const failResultFalse = schemaFalse.safeParse({ isActive: true });
      expect(failResultFalse.success).toBe(false);
      expect(failResultFalse.errors[0]?.message).toBe("isActive must be false");
      expect(failResultFalse.errors[0]?.code).toBe("is_active");
    });
  });

  describe("EnumSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        status: enumSchema(["active", "inactive"]).refine(
          (val) => val === "active",
          {
            message: "Status must be active",
            code: "not_active",
          }
        ),
      });

      const result = schema.safeParse({ status: "active" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: "active" });

      const failResult = schema.safeParse({ status: "inactive" });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("Status must be active");
      expect(failResult.errors[0]?.code).toBe("not_active");
    });
  });

  describe("NeverSchema", () => {
    it("should always fail before refine", () => {
      const schema = never().refine(() => false, {
        message: "This schema always fails",
        code: "always_fails",
      });

      const data = "any value";
      const failResult = schema.safeParse(data);
      expect(failResult.success).toBe(false);
      expect(failResult.errors.length).toBe(1);
      expect(failResult.errors[0]?.message).toBe("Value is not allowed");
      expect(failResult.errors[0]?.code).toBe("never_valid");
      expect(failResult.errors[0]?.expected).toBe("never");
      expect(failResult.errors[0]?.received).toBe(typeof data);
    });
  });

  describe("NumberSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = number().refine((val) => val % 2 === 0, {
        message: "Number must be even",
        code: "not_even",
      });

      const result = schema.safeParse(4);
      expect(result.success).toBe(true);
      expect(result.data).toBe(4);

      const failResult = schema.safeParse(3);
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("Number must be even");
      expect(failResult.errors[0]?.code).toBe("not_even");
    });

    it("should chain multiple refine functions", () => {
      const schema = number()
        .refine((val) => val % 2 === 0, {
          message: "Number must be even",
          code: "not_even",
        })
        .refine((val) => val >= 10, {
          message: "Number must be at least 10",
          code: "too_small",
        });

      const result = schema.safeParse(12);
      expect(result.success).toBe(true);
      expect(result.data).toBe(12);

      const failResult1 = schema.safeParse(11);
      expect(failResult1.success).toBe(false);
      expect(failResult1.errors.length).toBe(1);
      expect(failResult1.errors[0]?.message).toBe("Number must be even");
      expect(failResult1.errors[0]?.code).toBe("not_even");

      const failResult2 = schema.safeParse(8);
      expect(failResult2.success).toBe(false);
      expect(failResult2.errors.length).toBe(1);
      expect(failResult2.errors[0]?.message).toBe("Number must be at least 10");
      expect(failResult2.errors[0]?.code).toBe("too_small");

      const failResult3 = schema.safeParse(7);
      expect(failResult3.success).toBe(false);
      expect(failResult3.errors.length).toBe(2);
      expect(failResult3.errors[0]?.message).toBe("Number must be even");
      expect(failResult3.errors[0]?.code).toBe("not_even");
      expect(failResult3.errors[1]?.message).toBe("Number must be at least 10");
      expect(failResult3.errors[1]?.code).toBe("too_small");
    });
  });

  describe("ObjectSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        age: number(),
      }).refine((obj) => obj.age >= 18, {
        message: "Age must be at least 18",
        code: "too_young",
      });

      const result = schema.safeParse({ age: 20 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ age: 20 });

      const failResult = schema.safeParse({ age: 16 });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("Age must be at least 18");
      expect(failResult.errors[0]?.code).toBe("too_young");
    });
  });

  describe("RecordSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        scores: record(number()).refine(
          (rec) => {
            return Object.values(rec).every((val) => val >= 0 && val <= 100);
          },
          {
            message: "All scores must be between 0 and 100",
            code: "invalid_score",
            expected: "number between 0 and 100",
            received: "number out of range",
          }
        ),
      });

      const result = schema.safeParse({ scores: { math: 90, english: 85 } });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ scores: { math: 90, english: 85 } });

      const failResult = schema.safeParse({
        scores: { math: 110, english: 85 },
      });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe(
        "All scores must be between 0 and 100"
      );
      expect(failResult.errors[0]?.code).toBe("invalid_score");
      expect(failResult.errors[0]?.expected).toBe("number between 0 and 100");
      expect(failResult.errors[0]?.received).toBe("number out of range");
      expect(failResult.errors[0]?.path).toEqual(["scores"]);
      expect(failResult.errors[0]?.value).toStrictEqual({
        math: 110,
        english: 85,
      });
    });
  });

  describe("StringSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = string().refine((val) => val.length >= 5, {
        message: "String must be at least 5 characters long",
        code: "too_short",
      });

      const result = schema.safeParse("hello");
      expect(result.success).toBe(true);
      expect(result.data).toBe("hello");

      const failResult = schema.safeParse("hi");
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe(
        "String must be at least 5 characters long"
      );
      expect(failResult.errors[0]?.code).toBe("too_short");
    });

    it("should chain multiple refine functions", () => {
      const schema = string()
        .refine((val) => val.length >= 5, {
          message: "String must be at least 5 characters long",
          code: "too_short",
        })
        .refine((val) => /^[a-zA-Z]+$/.test(val), {
          message: "String must contain only letters",
          code: "invalid_characters",
        });

      const result = schema.safeParse("hello");
      expect(result.success).toBe(true);
      expect(result.data).toBe("hello");

      const failResult1 = schema.safeParse("hi");
      expect(failResult1.success).toBe(false);
      expect(failResult1.errors[0]?.message).toBe(
        "String must be at least 5 characters long"
      );
      expect(failResult1.errors[0]?.code).toBe("too_short");

      const failResult2 = schema.safeParse("hello123");
      expect(failResult2.success).toBe(false);
      expect(failResult2.errors[0]?.message).toBe(
        "String must contain only letters"
      );
      expect(failResult2.errors[0]?.code).toBe("invalid_characters");

      const failResult3 = schema.safeParse("hi12");
      expect(failResult3.success).toBe(false);
      expect(failResult3.errors.length).toBe(2);
      expect(failResult3.errors[0]?.message).toBe(
        "String must be at least 5 characters long"
      );
      expect(failResult3.errors[0]?.code).toBe("too_short");
      expect(failResult3.errors[1]?.message).toBe(
        "String must contain only letters"
      );
      expect(failResult3.errors[1]?.code).toBe("invalid_characters");
    });

    it("should support immediate refine checks", () => {
      const schema = string()
        .refine((val) => val.length >= 5, {
          message: "String must be at least 5 characters long",
          code: "too_short",
          immediate: true,
        })
        .refine((val) => /^[a-zA-Z]+$/.test(val), {
          message: "String must contain only letters",
          code: "invalid_characters",
        });

      const failResult = schema.safeParse("hi12");
      expect(failResult.success).toBe(false);
      expect(failResult.errors.length).toBe(1);
      expect(failResult.errors[0]?.message).toBe(
        "String must be at least 5 characters long"
      );
      expect(failResult.errors[0]?.code).toBe("too_short");
    });

    it("should pass validation when all refine checks succeed", () => {
      const schema = string()
        .refine((val) => val.length >= 5, {
          message: "String must be at least 5 characters long",
          code: "too_short",
        })
        .refine((val) => /^[a-zA-Z]+$/.test(val), {
          message: "String must contain only letters",
          code: "invalid_characters",
        });

      const result = schema.safeParse("ValidString");
      expect(result.success).toBe(true);
      expect(result.data).toBe("ValidString");
    });

    it("should handle non-string inputs gracefully", () => {
      const schema = string().refine((val) => val.length >= 5, {
        message: "String must be at least 5 characters long",
        code: "too_short",
      });

      const failResult = schema.safeParse(12345);
      expect(failResult.success).toBe(false);
      expect(failResult.errors.length).toBe(1);
      expect(failResult.errors[0]?.message).toBe("Invalid string");
      expect(failResult.errors[0]?.code).toBe("invalid_type");
    });
  });

  describe("UnionSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        value: union([string(), number()]).refine(
          (val) => {
            if (typeof val === "string") {
              return val.length >= 3;
            } else if (typeof val === "number") {
              return val >= 10;
            }
            return false;
          },
          {
            message:
              "Value must be a string of at least 3 characters or a number at least 10",
            code: "invalid_value",
            expected: "string >= 3 chars or number >= 10",
            received: "invalid",
          }
        ),
      });

      const result1 = schema.safeParse({ value: "hello" });
      expect(result1.success).toBe(true);
      expect(result1.data).toEqual({ value: "hello" });

      const result2 = schema.safeParse({ value: 15 });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual({ value: 15 });

      const failResult1 = schema.safeParse({ value: "hi" });
      expect(failResult1.success).toBe(false);
      expect(failResult1.errors[0]?.message).toBe(
        "Value must be a string of at least 3 characters or a number at least 10"
      );
      expect(failResult1.errors[0]?.code).toBe("invalid_value");

      const failResult2 = schema.safeParse({ value: 5 });
      expect(failResult2.success).toBe(false);
      expect(failResult2.errors[0]?.message).toBe(
        "Value must be a string of at least 3 characters or a number at least 10"
      );
      expect(failResult2.errors[0]?.code).toBe("invalid_value");
    });
  });

  describe("UnknownSchema", () => {
    it("should validate with custom refine function", () => {
      const schema = object({
        data: any().refine((val) => typeof val === "number", {
          message: "Data must be a number",
          code: "not_number",
        }),
      });

      const result = schema.safeParse({ data: 123 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 123 });

      const failResult = schema.safeParse({ data: "hello" });
      expect(failResult.success).toBe(false);
      expect(failResult.errors[0]?.message).toBe("Data must be a number");
      expect(failResult.errors[0]?.code).toBe("not_number");
    });
  });
});

describe("RefineSchema with dependent types", () => {
  it("should validate array items", () => {
    const schema = array(
      string().refine((val) => val.startsWith("A"), {
        message: "String must start with 'A'",
        code: "invalid_start",
      })
    );

    const result = schema.safeParse(["Apple", "Avocado", "Apricot"]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["Apple", "Avocado", "Apricot"]);

    const failResult = schema.safeParse(["Apple", "Banana", "Apricot"]);
    expect(failResult.success).toBe(false);
    expect(failResult.errors.length).toBe(1);
    expect(failResult.errors[0]?.message).toBe("String must start with 'A'");
    expect(failResult.errors[0]?.code).toBe("invalid_start");

    const failResult2 = schema.safeParse(["Banana", "Cherry"]);
    expect(failResult2.success).toBe(false);
    expect(failResult2.errors.length).toBe(2);
    expect(failResult2.errors[0]?.message).toBe("String must start with 'A'");
    expect(failResult2.errors[0]?.code).toBe("invalid_start");
    expect(failResult2.errors[1]?.message).toBe("String must start with 'A'");
    expect(failResult2.errors[1]?.code).toBe("invalid_start");
  });

  it("should validate nested schemas", () => {
    const schema = array(
      object({
        age: number().refine((val) => val >= 18, {
          message: "Age must be at least 18",
          code: "too_young",
        }),
        name: string().refine((val) => val.length >= 3, {
          message: "Name must be at least 3 characters long",
          code: "name_too_short",
        }),
      })
    );

    const result = schema.safeParse([
      { age: 25, name: "Alice" },
      { age: 30, name: "Bob" },
    ]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { age: 25, name: "Alice" },
      { age: 30, name: "Bob" },
    ]);

    const failResult = schema.safeParse([
      { age: 16, name: "Al" },
      { age: 20, name: "Bo" },
    ]);
    expect(failResult.success).toBe(false);
    expect(failResult.errors.length).toBe(3);
    expect(failResult.errors[0]?.message).toBe("Age must be at least 18");
    expect(failResult.errors[0]?.code).toBe("too_young");
    expect(failResult.errors[1]?.message).toBe(
      "Name must be at least 3 characters long"
    );
    expect(failResult.errors[1]?.code).toBe("name_too_short");
    expect(failResult.errors[2]?.message).toBe(
      "Name must be at least 3 characters long"
    );
    expect(failResult.errors[2]?.code).toBe("name_too_short");

    const failResult2 = schema.safeParse([
      { age: 18, name: "Ali" },
      { age: 18, name: "Bo" },
      { age: 21, name: "Cat" },
    ]);

    expect(failResult2.success).toBe(false);
    expect(failResult2.errors.length).toBe(1);
    expect(failResult2.errors[0]?.message).toBe(
      "Name must be at least 3 characters long"
    );
    expect(failResult2.errors[0]?.code).toBe("name_too_short");
  });
});
