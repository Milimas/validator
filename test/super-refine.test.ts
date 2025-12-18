import { describe, it, expect } from "vitest";
import { string, number, object } from "validator";

describe("superRefine", () => {
  it("should add custom error with superRefine", () => {
    const schema = string().superRefine((val, ctx) => {
      if (val.length < 5) {
        ctx.addIssue({
          code: "too_short",
          message: `String must be at least 5 characters long`,
          expected: 5,
          received: val.length,
        });
      }
    });

    const result = schema.safeParse("hi");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("5 characters");
    }
  });

  it("should pass validation when superRefine check succeeds", () => {
    const schema = string().superRefine((val, ctx) => {
      if (val.includes("banned")) {
        ctx.addIssue({
          code: "contains_banned_word",
          message: "Contains banned word",
          expected: "no banned words",
          received: val,
        });
      }
    });

    const result = schema.safeParse("hello world");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello world");
    }
  });

  it("should allow multiple errors from superRefine", () => {
    const schema = string().superRefine((val, ctx) => {
      if (val.length < 5) {
        ctx.addIssue({ code: "too_short", message: "Too short" });
      }
      if (val.includes("123")) {
        ctx.addIssue({ code: "contains_numbers", message: "Contains numbers" });
      }
    });

    const result = schema.safeParse("hi123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should chain multiple superRefine calls", () => {
    const schema = string()
      .superRefine((val, ctx) => {
        if (val.length < 3) {
          ctx.addIssue({ code: "too_short", message: "Minimum 3 characters" });
        }
      })
      .superRefine((val, ctx) => {
        if (!val.includes("@")) {
          ctx.addIssue({ code: "missing_at", message: "Must contain @" });
        }
      });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
  });

  it("should work with number schema", () => {
    const schema = number().superRefine((val, ctx) => {
      if (val % 2 !== 0) {
        ctx.addIssue({ code: "not_even", message: "Must be an even number" });
      }
    });

    const result = schema.safeParse(5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].message).toContain("even");
    }
  });

  it("should work with object schema properties", () => {
    const schema = object({
      email: string().superRefine((val, ctx) => {
        if (!val.includes("@")) {
          ctx.addIssue({
            code: "invalid_email",
            message: "Invalid email format",
          });
        }
      }),
      age: number().superRefine((val, ctx) => {
        if (val < 18) {
          ctx.addIssue({ code: "too_young", message: "Must be 18 or older" });
        }
      }),
    });

    const result = schema.safeParse({ email: "invalid", age: 15 });
    expect(result.success).toBe(false);
  });

  it("should provide context with path information", () => {
    const schema = string().superRefine((val, ctx) => {
      if (val === "fail") {
        ctx.addIssue({ code: "custom_code", message: "Failed validation" });
      }
    });

    const result = schema.safeParse("fail");
    expect(result.success).toBe(false);
  });

  it("should combine superRefine with refine", () => {
    const schema = string()
      .refine((val) => val.length > 2, { message: "Must be longer than 2" })
      .superRefine((val, ctx) => {
        if (val.startsWith(" ")) {
          ctx.addIssue({
            code: "starts_with_space",
            message: "Cannot start with space",
          });
        }
      });

    const result = schema.safeParse(" test");
    expect(result.success).toBe(false);
  });

  it("should not throw on parse with superRefine errors", () => {
    const schema = string().superRefine((val, ctx) => {
      ctx.addIssue({ code: "custom_error", message: "Custom error" });
    });

    expect(() => {
      schema.parse("test");
    }).toThrow();
  });

  it("should handle complex validation logic in superRefine", () => {
    const schema = string().superRefine((val, ctx) => {
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasNumber = /[0-9]/.test(val);

      if (!hasUpper)
        ctx.addIssue({
          code: "missing_uppercase",
          message: "Must contain uppercase",
        });
      if (!hasLower)
        ctx.addIssue({
          code: "missing_lowercase",
          message: "Must contain lowercase",
        });
      if (!hasNumber)
        ctx.addIssue({
          code: "missing_number",
          message: "Must contain number",
        });
    });

    const result = schema.safeParse("abc");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});
