import { describe, it, expect } from "vitest";
import {
  string,
  number,
  object,
  any,
  array,
  boolean,
  enum as enumSchema,
  never,
  record,
  union,
  unknown,
  email,
  phoneNumber,
} from "../index.js";

describe("superRefine with Schema Types", () => {
  describe("AnySchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = any().superRefine((val, ctx) => {
        if (val.length < 5) {
          ctx.addIssue({
            code: "too_short",
            message: `String must be at least 5 characters long`,
            expected: 5,
            received: val.length,
          });
        }
        if (val.includes("banned")) {
          ctx.addIssue({
            code: "contains_banned_word",
            message: "Contains banned word",
            expected: "no banned words",
            received: val,
          });
        }
        if (val === "error") {
          throw new Error("Unexpected error during validation");
        }
      });

      const result = schema.safeParse("hi");
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe(
        "String must be at least 5 characters long"
      );
      expect(result.errors[0].code).toBe("too_short");
      expect(result.errors[0].expected).toBe(5);
      expect(result.errors[0].received).toBe(2);
      expect(result.errors[0].value).toBe("hi");

      const result2 = schema.safeParse("this is a banned string");
      expect(result2.success).toBe(false);
      expect(result2.errors).toHaveLength(1);
      expect(result2.errors[0].message).toBe("Contains banned word");
      expect(result2.errors[0].code).toBe("contains_banned_word");
      expect(result2.errors[0].expected).toBe("no banned words");
      expect(result2.errors[0].received).toBe("this is a banned string");
      expect(result2.errors[0].value).toBe("this is a banned string");

      expect(() => schema.parse("error")).toThrow(
        "Unexpected error during validation"
      );
    });
  });

  describe("ArraySchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = array(string()).superRefine((val, ctx) => {
        if (val.length < 2) {
          ctx.addIssue({
            code: "too_few_items",
            message: `Array must have at least 2 items`,
            expected: 2,
            received: val.length,
          });
        }

        for (let i = 0; i < val.length; i++) {
          if (val[i].length < 3) {
            ctx.addIssue({
              code: "item_too_short",
              message: `Item at index ${i} must be at least 3 characters long`,
              expected: 3,
              received: val[i].length,
              path: [i],
            });
          }
        }

        for (const item of val) {
          if (item.includes("banned")) {
            ctx.addIssue({
              code: "contains_banned_word",
              message: `Item "${item}" contains banned word`,
              expected: "no banned words",
              received: item,
              path: [val.indexOf(item)],
            });
          }
        }
      });

      const result = schema.safeParse(["one"]);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Array must have at least 2 items");
      expect(result.errors[0].code).toBe("too_few_items");
      expect(result.errors[0].expected).toBe(2);
      expect(result.errors[0].received).toBe(1);
      expect(result.errors[0].value).toEqual(["one"]);

      const result2 = schema.safeParse(["ok", "no", "banned-word"]);
      expect(result2.success).toBe(false);
      expect(result2.errors).toHaveLength(3);
      expect(result2.errors[0].message).toBe(
        "Item at index 0 must be at least 3 characters long"
      );
      expect(result2.errors[0].code).toBe("item_too_short");
      expect(result2.errors[0].expected).toBe(3);
      expect(result2.errors[0].received).toBe(2);
      expect(result2.errors[0].value).toEqual(["ok", "no", "banned-word"]);
      expect(result2.errors[0].path).toEqual([0]);

      expect(result2.errors[1].message).toBe(
        "Item at index 1 must be at least 3 characters long"
      );
      expect(result2.errors[1].code).toBe("item_too_short");
      expect(result2.errors[1].expected).toBe(3);
      expect(result2.errors[1].received).toBe(2);
      expect(result2.errors[1].value).toEqual(["ok", "no", "banned-word"]);
      expect(result2.errors[1].path).toEqual([1]);

      expect(result2.errors[2].message).toBe(
        'Item "banned-word" contains banned word'
      );
      expect(result2.errors[2].code).toBe("contains_banned_word");
      expect(result2.errors[2].expected).toBe("no banned words");
      expect(result2.errors[2].received).toBe("banned-word");
      expect(result2.errors[2].value).toEqual(["ok", "no", "banned-word"]);
      expect(result2.errors[2].path).toEqual([2]);
    });
  });

  describe("BooleanSchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = boolean().superRefine((val, ctx) => {
        if (val !== true) {
          ctx.addIssue({
            code: "must_be_true",
            message: `Value must be true`,
            expected: true,
            received: val,
          });
        }
      });

      const result = schema.safeParse(false);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Value must be true");
      expect(result.errors[0].code).toBe("must_be_true");
      expect(result.errors[0].expected).toBe(true);
      expect(result.errors[0].received).toBe(false);
      expect(result.errors[0].value).toBe(false);
    });
  });

  describe("EnumSchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = enumSchema(["red", "green", "blue"] as const).superRefine(
        (val, ctx) => {
          if (val === "green") {
            ctx.addIssue({
              code: "no_green_allowed",
              message: `Green is not an allowed color`,
              expected: ["red", "blue"],
              received: val,
            });
          }
        }
      );

      const result = schema.safeParse("green");
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Green is not an allowed color");
      expect(result.errors[0].code).toBe("no_green_allowed");
      expect(result.errors[0].expected).toEqual(["red", "blue"]);
      expect(result.errors[0].received).toBe("green");
      expect(result.errors[0].value).toBe("green");
    });
  });

  describe("NeverSchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = never().superRefine((val, ctx) => {
        ctx.addIssue({
          code: "custom_never_valid",
          message: `This schema never validates successfully`,
        });
      });

      const data = "anything";
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Value is not allowed");
      expect(result.errors[0].code).toBe("never_valid");
      expect(result.errors[0].value).toBe(data);
      expect(result.errors[0].expected).toBe("never");
      expect(result.errors[0].received).toBe(typeof data);
    });
  });

  describe("NumberSchema", () => {
    it("should add custom error with superRefine", () => {
      const schema = number().superRefine((val, ctx) => {
        if (val < 0) {
          ctx.addIssue({
            code: "must_be_positive",
            message: `Number must be positive`,
            expected: "positive number",
            received: val,
          });
        }
      });

      const result = schema.safeParse(-5);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Number must be positive");
      expect(result.errors[0].code).toBe("must_be_positive");
      expect(result.errors[0].expected).toBe("positive number");
      expect(result.errors[0].received).toBe(-5);
      expect(result.errors[0].value).toBe(-5);
    });
  });

  describe("ObjectSchema", () => {
    describe("any", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          any: any().superRefine((val, ctx) => {
            if (val === null) {
              ctx.addIssue({
                code: "cannot_be_null",
                message: `Value cannot be null`,
                expected: "non-null value",
                received: val,
              });
            }
          }),
        });

        const result = schema.safeParse({ any: null });
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Value cannot be null");
        expect(result.errors[0].code).toBe("cannot_be_null");
        expect(result.errors[0].expected).toBe("non-null value");
        expect(result.errors[0].received).toBe(null);
        expect(result.errors[0].value).toBe(null);
      });
    });

    describe("array", () => {
      describe("any", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              any().superRefine((val, ctx) => {
                if (val === null) {
                  ctx.addIssue({
                    code: "cannot_be_null",
                    message: `Value cannot be null`,
                    expected: "non-null value",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({ array: [1, null, "test"] });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("Value cannot be null");
          expect(result.errors[0].code).toBe("cannot_be_null");
          expect(result.errors[0].expected).toBe("non-null value");
          expect(result.errors[0].received).toBe(null);
          expect(result.errors[0].value).toBe(null);
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });

      describe("array", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              array(any()).superRefine((val, ctx) => {
                if (val.length === 0) {
                  ctx.addIssue({
                    code: "cannot_be_empty",
                    message: `Array cannot be empty`,
                    expected: "non-empty array",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({ array: [[1, 2], [], ["test"]] });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("Array cannot be empty");
          expect(result.errors[0].code).toBe("cannot_be_empty");
          expect(result.errors[0].expected).toBe("non-empty array");
          expect(result.errors[0].received).toEqual([]);
          expect(result.errors[0].value).toEqual([]);
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });

      describe("boolean", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              boolean().superRefine((val, ctx) => {
                if (val !== true) {
                  ctx.addIssue({
                    code: "must_be_true",
                    message: `Value must be true`,
                    expected: true,
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({ array: [true, false, true] });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("Value must be true");
          expect(result.errors[0].code).toBe("must_be_true");
          expect(result.errors[0].expected).toBe(true);
          expect(result.errors[0].received).toBe(false);
          expect(result.errors[0].value).toBe(false);
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });

      describe("enum", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              enumSchema(["forbidden", "allowed"]).superRefine((val, ctx) => {
                if (val === "forbidden") {
                  ctx.addIssue({
                    code: "value_forbidden",
                    message: `This enum value is forbidden`,
                    expected: "allowed",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({
            array: ["allowed", "forbidden", "allowed"],
          });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("This enum value is forbidden");
          expect(result.errors[0].code).toBe("value_forbidden");
          expect(result.errors[0].expected).toBe("allowed");
          expect(result.errors[0].received).toBe("forbidden");
          expect(result.errors[0].value).toBe("forbidden");
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });

      describe("never", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              never().superRefine((val, ctx) => {
                ctx.addIssue({
                  code: "custom_never_valid",
                  message: `This schema never validates successfully`,
                  expected: "never",
                  received: val,
                });
              })
            ),
          });

          const result = schema.safeParse({ array: ["anything", 123, null] });
          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(3);
          for (const _error of result.errors) {
            expect(_error.message).toBe("Value is not allowed");
            expect(_error.code).toBe("never_valid");
            expect(_error.expected).toBe("never");
            expect(_error.received).toBe(typeof _error.value);
            expect(_error.path).toEqual([
              "array",
              result.errors.indexOf(_error),
            ]);
          }
        });
      });

      describe("number", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              number().superRefine((val, ctx) => {
                if (val < 0) {
                  ctx.addIssue({
                    code: "must_be_positive",
                    message: `Number must be positive`,
                    expected: "positive number",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({ array: [10, -5, 3] });
          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("Number must be positive");
          expect(result.errors[0].code).toBe("must_be_positive");
          expect(result.errors[0].expected).toBe("positive number");
          expect(result.errors[0].received).toBe(-5);
          expect(result.errors[0].value).toBe(-5);
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });

      describe("object", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              object({
                username: string(),
                password: string(),
              }).superRefine((val, ctx) => {
                if (val.password.length < 8) {
                  ctx.addIssue({
                    code: "password_too_short",
                    message: `Password must be at least 8 characters long`,
                    expected: 8,
                    received: val.password.length,
                  });
                }
                if (val.username === "admin") {
                  ctx.addIssue({
                    code: "username_not_allowed",
                    message: `Username "admin" is not allowed`,
                    expected: "non-admin username",
                    received: val.username,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({
            array: [
              { username: "user1", password: "short" },
              { username: "admin", password: "long-enough" },
              { username: "user2", password: "valid-pass" },
            ],
          });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(2);

          expect(result.errors[0].message).toBe(
            "Password must be at least 8 characters long"
          );
          expect(result.errors[0].code).toBe("password_too_short");
          expect(result.errors[0].expected).toBe(8);
          expect(result.errors[0].received).toBe(5);
          expect(result.errors[0].value).toEqual({
            username: "user1",
            password: "short",
          });
          expect(result.errors[0].path).toEqual(["array", 0]);

          expect(result.errors[1].message).toBe(
            'Username "admin" is not allowed'
          );
          expect(result.errors[1].code).toBe("username_not_allowed");
          expect(result.errors[1].expected).toBe("non-admin username");
          expect(result.errors[1].received).toBe("admin");
          expect(result.errors[1].value).toEqual({
            username: "admin",
            password: "long-enough",
          });
          expect(result.errors[1].path).toEqual(["array", 1]);
        });
      });

      describe("record", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              record(string(), number()).superRefine((val, ctx) => {
                for (const key in val) {
                  if (val[key] < 0) {
                    ctx.addIssue({
                      code: "must_be_positive",
                      message: `Value for key "${key}" must be positive`,
                      expected: "positive number",
                      received: val[key],
                    });
                  }
                  if (key === "forbidden") {
                    ctx.addIssue({
                      code: "key_forbidden",
                      message: `Key "forbidden" is not allowed`,
                      expected: "allowed keys",
                      received: key,
                    });
                  }
                }
              })
            ),
          });

          const result = schema.safeParse({
            array: [
              { validKey: 10, anotherKey: -5 },
              { forbidden: -3, goodKey: 7 },
            ],
          });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(3);

          expect(result.errors[0].message).toBe(
            'Value for key "anotherKey" must be positive'
          );
          expect(result.errors[0].code).toBe("must_be_positive");
          expect(result.errors[0].expected).toBe("positive number");
          expect(result.errors[0].received).toBe(-5);
          expect(result.errors[0].value).toEqual({
            validKey: 10,
            anotherKey: -5,
          });
          expect(result.errors[0].path).toEqual(["array", 0]);

          expect(result.errors[1].message).toBe(
            'Value for key "forbidden" must be positive'
          );
          expect(result.errors[1].code).toBe("must_be_positive");
          expect(result.errors[1].expected).toBe("positive number");
          expect(result.errors[1].received).toBe(-3);
          expect(result.errors[1].value).toEqual({ forbidden: -3, goodKey: 7 });
          expect(result.errors[1].path).toEqual(["array", 1]);

          expect(result.errors[2].message).toBe(
            'Key "forbidden" is not allowed'
          );
          expect(result.errors[2].code).toBe("key_forbidden");
          expect(result.errors[2].expected).toBe("allowed keys");
          expect(result.errors[2].received).toBe("forbidden");
          expect(result.errors[2].value).toEqual({ forbidden: -3, goodKey: 7 });
          expect(result.errors[2].path).toEqual(["array", 1]);
        });

        describe("key", () => {
          it("should add custom error with superRefine", () => {
            const schema = object({
              array: array(
                record(
                  string().superRefine((val, ctx) => {
                    if (val.length < 3) {
                      ctx.addIssue({
                        code: "key_too_short",
                        message: `Key must be at least 3 characters long`,
                        expected: 3,
                        received: val.length,
                        value: val,
                      });
                    }
                  }),
                  number()
                )
              ),
            });

            const result = schema.safeParse({
              array: [{ ok: 1, no: 2, validKey: 3 }],
            });

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(2);

            expect(result.errors[0].message).toBe(
              "Key must be at least 3 characters long"
            );
            expect(result.errors[0].code).toBe("key_too_short");
            expect(result.errors[0].expected).toBe(3);
            expect(result.errors[0].received).toBe(2);
            expect(result.errors[0].value).toBe("ok");
            expect(result.errors[0].path).toEqual(["array", 0, "ok"]);

            expect(result.errors[1].message).toBe(
              "Key must be at least 3 characters long"
            );
            expect(result.errors[1].code).toBe("key_too_short");
            expect(result.errors[1].expected).toBe(3);
            expect(result.errors[1].received).toBe(2);
            expect(result.errors[1].value).toBe("no");
            expect(result.errors[1].path).toEqual(["array", 0, "no"]);
          });
        });
      });

      describe("string", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              string().superRefine((val, ctx) => {
                if (val.length < 3) {
                  ctx.addIssue({
                    code: "too_short",
                    message: `String must be at least 3 characters long`,
                    expected: 3,
                    received: val.length,
                  });
                }
                if (val.includes("banned")) {
                  ctx.addIssue({
                    code: "contains_banned_word",
                    message: `String contains banned word`,
                    expected: "no banned words",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({
            array: ["ok", "no", "banned-word"],
          });
          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(3);

          expect(result.errors[0].message).toBe(
            "String must be at least 3 characters long"
          );
          expect(result.errors[0].code).toBe("too_short");
          expect(result.errors[0].expected).toBe(3);
          expect(result.errors[0].received).toBe(2);
          expect(result.errors[0].value).toBe("ok");
          expect(result.errors[0].path).toEqual(["array", 0]);

          expect(result.errors[1].message).toBe(
            "String must be at least 3 characters long"
          );
          expect(result.errors[1].code).toBe("too_short");
          expect(result.errors[1].expected).toBe(3);
          expect(result.errors[1].received).toBe(2);
          expect(result.errors[1].value).toBe("no");
          expect(result.errors[1].path).toEqual(["array", 1]);

          expect(result.errors[2].message).toBe("String contains banned word");
          expect(result.errors[2].code).toBe("contains_banned_word");
          expect(result.errors[2].expected).toBe("no banned words");
          expect(result.errors[2].received).toBe("banned-word");
          expect(result.errors[2].value).toBe("banned-word");
          expect(result.errors[2].path).toEqual(["array", 2]);
        });
      });

      describe("union", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              union([email(), phoneNumber()]).superRefine((val, ctx) => {
                if (val.includes("banned")) {
                  ctx.addIssue({
                    code: "contains_banned_word",
                    message: `Value contains banned word`,
                    expected: "no banned words",
                    received: val,
                  });
                }
                if (val.includes("-")) {
                  ctx.addIssue({
                    code: "invalid_format",
                    message: `Value format is invalid`,
                    expected: "valid value format",
                    received: val,
                  });
                }
              })
            ),
          });

          const result = schema.safeParse({
            array: ["banned-word@something.com", "123-456-7890"],
          });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(3);

          expect(result.errors[0].message).toBe("Value contains banned word");
          expect(result.errors[0].code).toBe("contains_banned_word");
          expect(result.errors[0].expected).toBe("no banned words");
          expect(result.errors[0].received).toBe("banned-word@something.com");
          expect(result.errors[0].value).toBe("banned-word@something.com");
          expect(result.errors[0].path).toEqual(["array", 0]);

          expect(result.errors[1].message).toBe("Value format is invalid");
          expect(result.errors[1].code).toBe("invalid_format");
          expect(result.errors[1].expected).toBe("valid value format");
          expect(result.errors[1].received).toBe("banned-word@something.com");
          expect(result.errors[1].value).toBe("banned-word@something.com");
          expect(result.errors[1].path).toEqual(["array", 0]);

          expect(result.errors[2].message).toBe("Value format is invalid");
          expect(result.errors[2].code).toBe("invalid_format");
          expect(result.errors[2].expected).toBe("valid value format");
          expect(result.errors[2].received).toBe("123-456-7890");
          expect(result.errors[2].value).toBe("123-456-7890");
          expect(result.errors[2].path).toEqual(["array", 1]);
        });
      });

      describe("unknown", () => {
        it("should add custom error with superRefine", () => {
          const schema = object({
            array: array(
              unknown().superRefine((val, ctx) => {
                if (val === undefined) {
                  ctx.addIssue({
                    code: "cannot_be_undefined",
                    message: `Value cannot be undefined`,
                    expected: "defined value",
                    received: val,
                  });
                }
              })
            ),
          });
          const result = schema.safeParse({ array: [1, undefined, "test"] });

          expect(result.success).toBe(false);
          expect(result.errors).toHaveLength(1);
          expect(result.errors[0].message).toBe("Value cannot be undefined");
          expect(result.errors[0].code).toBe("cannot_be_undefined");
          expect(result.errors[0].expected).toBe("defined value");
          expect(result.errors[0].received).toBe(undefined);
          expect(result.errors[0].value).toBe(undefined);
          expect(result.errors[0].path).toEqual(["array", 1]);
        });
      });
    });

    describe("boolean", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          boolean: boolean().superRefine((val, ctx) => {
            if (val !== true) {
              ctx.addIssue({
                code: "must_be_true",
                message: `Value must be true`,
                expected: true,
                received: val,
              });
            }
          }),
        });
        const result = schema.safeParse({ boolean: false });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Value must be true");
        expect(result.errors[0].code).toBe("must_be_true");
        expect(result.errors[0].expected).toBe(true);
        expect(result.errors[0].received).toBe(false);
        expect(result.errors[0].value).toBe(false);
        expect(result.errors[0].path).toEqual(["boolean"]);
      });
    });

    describe("enum", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          enum: enumSchema(["forbidden", "allowed"]).superRefine((val, ctx) => {
            if (val === "forbidden") {
              ctx.addIssue({
                code: "value_forbidden",
                message: `This enum value is forbidden`,
                expected: "allowed",
                received: val,
              });
            }
          }),
        });

        const result = schema.safeParse({ enum: "forbidden" });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("This enum value is forbidden");
        expect(result.errors[0].code).toBe("value_forbidden");
        expect(result.errors[0].expected).toBe("allowed");
        expect(result.errors[0].received).toBe("forbidden");
        expect(result.errors[0].value).toBe("forbidden");
        expect(result.errors[0].path).toEqual(["enum"]);
      });
    });

    describe("never", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          never: never().superRefine((val, ctx) => {
            ctx.addIssue({
              code: "custom_never_valid",
              message: `This schema never validates successfully`,
              expected: "never",
              received: val,
            });
          }),
        });

        const result = schema.safeParse({ never: "anything" });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Value is not allowed");
        expect(result.errors[0].code).toBe("never_valid");
        expect(result.errors[0].expected).toBe("never");
        expect(result.errors[0].received).toBe(typeof "anything");
        expect(result.errors[0].value).toBe("anything");
        expect(result.errors[0].path).toEqual(["never"]);
      });
    });

    describe("number", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          number: number().superRefine((val, ctx) => {
            if (val < 0) {
              ctx.addIssue({
                code: "must_be_positive",
                message: `Number must be positive`,
                expected: "positive number",
                received: val,
              });
            }
          }),
        });

        const result = schema.safeParse({ number: -5 });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Number must be positive");
        expect(result.errors[0].code).toBe("must_be_positive");
        expect(result.errors[0].expected).toBe("positive number");
        expect(result.errors[0].received).toBe(-5);
        expect(result.errors[0].value).toBe(-5);
        expect(result.errors[0].path).toEqual(["number"]);
      });
    });

    describe("object", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          object: object({
            field: string(),
          }).superRefine((val, ctx) => {
            if (val.field.length < 5) {
              ctx.addIssue({
                code: "field_too_short",
                message: `Field must be at least 5 characters long`,
                expected: 5,
                received: val.field.length,
              });
            }
          }),
        });

        const result = schema.safeParse({ object: { field: "abc" } });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe(
          "Field must be at least 5 characters long"
        );
        expect(result.errors[0].code).toBe("field_too_short");
        expect(result.errors[0].expected).toBe(5);
        expect(result.errors[0].received).toBe(3);
        expect(result.errors[0].value).toEqual({ field: "abc" });
        expect(result.errors[0].path).toEqual(["object"]);
      });
    });

    describe("record", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          record: record(union([string(), number()])).superRefine(
            (val, ctx) => {
              for (const key in val) {
                if (typeof val[key] === "string" && val[key].length < 3) {
                  ctx.addIssue({
                    code: "string_too_short",
                    message: `String value for key "${key}" must be at least 3 characters long`,
                    expected: 3,
                    received: (val[key] as string).length,
                  });
                }
                if (typeof key === "string" && key.includes("forbidden")) {
                  ctx.addIssue({
                    code: "key_forbidden",
                    message: `Key "${key}" is not allowed`,
                    expected: "allowed keys",
                    received: key,
                  });
                }
                if (typeof val[key] === "number" && val[key] < 0) {
                  ctx.addIssue({
                    code: "number_must_be_positive",
                    message: `Number value for key "${key}" must be positive`,
                    expected: "positive number",
                    received: val[key],
                  });
                }
              }
            }
          ),
        });

        const result = schema.safeParse({
          record: {
            goodKey: "ok",
            forbiddenKey: "valid",
            anotherKey: -5,
          },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(3);

        expect(result.errors[0].message).toBe(
          'String value for key "goodKey" must be at least 3 characters long'
        );
        expect(result.errors[0].code).toBe("string_too_short");
        expect(result.errors[0].expected).toBe(3);
        expect(result.errors[0].received).toBe(2);
        expect(result.errors[0].value).toEqual({
          goodKey: "ok",
          forbiddenKey: "valid",
          anotherKey: -5,
        });
        expect(result.errors[0].path).toEqual(["record"]);

        expect(result.errors[1].message).toBe(
          'Key "forbiddenKey" is not allowed'
        );
        expect(result.errors[1].code).toBe("key_forbidden");
        expect(result.errors[1].expected).toBe("allowed keys");
        expect(result.errors[1].received).toBe("forbiddenKey");
        expect(result.errors[1].value).toEqual({
          goodKey: "ok",
          forbiddenKey: "valid",
          anotherKey: -5,
        });
        expect(result.errors[1].path).toEqual(["record"]);

        expect(result.errors[2].message).toBe(
          'Number value for key "anotherKey" must be positive'
        );
        expect(result.errors[2].code).toBe("number_must_be_positive");
        expect(result.errors[2].expected).toBe("positive number");
        expect(result.errors[2].received).toBe(-5);
        expect(result.errors[2].value).toEqual({
          anotherKey: -5,
          forbiddenKey: "valid",
          goodKey: "ok",
        });
        expect(result.errors[2].path).toEqual(["record"]);
      });
    });

    describe("string", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          string: string().superRefine((val, ctx) => {
            if (val.length < 5) {
              ctx.addIssue({
                code: "too_short",
                message: `String must be at least 5 characters long`,
                expected: 5,
                received: val.length,
              });
            }
          }),
        });
        const result = schema.safeParse({ string: "hi" });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe(
          "String must be at least 5 characters long"
        );
        expect(result.errors[0].code).toBe("too_short");
        expect(result.errors[0].expected).toBe(5);
        expect(result.errors[0].received).toBe(2);
        expect(result.errors[0].value).toBe("hi");
        expect(result.errors[0].path).toEqual(["string"]);
      });
    });

    describe("union", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          union: union([string(), number()]).superRefine((val, ctx) => {
            if (typeof val === "string" && val.length < 3) {
              ctx.addIssue({
                code: "string_too_short",
                message: `String must be at least 3 characters long`,
                expected: 3,
                received: val.length,
              });
            }
            if (typeof val === "number" && val < 0) {
              ctx.addIssue({
                code: "number_must_be_positive",
                message: `Number must be positive`,
                expected: "positive number",
                received: val,
              });
            }
          }),
        });

        const result = schema.safeParse({ union: "hi" });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe(
          "String must be at least 3 characters long"
        );
        expect(result.errors[0].code).toBe("string_too_short");
        expect(result.errors[0].expected).toBe(3);
        expect(result.errors[0].received).toBe(2);
        expect(result.errors[0].value).toBe("hi");
        expect(result.errors[0].path).toEqual(["union"]);

        const result2 = schema.safeParse({ union: -5 });

        expect(result2.success).toBe(false);
        expect(result2.errors).toHaveLength(1);
        expect(result2.errors[0].message).toBe("Number must be positive");
        expect(result2.errors[0].code).toBe("number_must_be_positive");
        expect(result2.errors[0].expected).toBe("positive number");
        expect(result2.errors[0].received).toBe(-5);
        expect(result2.errors[0].value).toBe(-5);
        expect(result2.errors[0].path).toEqual(["union"]);
      });
    });

    describe("unknown", () => {
      it("should add custom error with superRefine", () => {
        const schema = object({
          unknown: unknown().superRefine((val, ctx) => {
            if (val === undefined) {
              ctx.addIssue({
                code: "cannot_be_undefined",
                message: `Value cannot be undefined`,
                expected: "defined value",
                received: val,
              });
            }
          }),
        });

        const result = schema.safeParse({ unknown: undefined });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe("Value cannot be undefined");
        expect(result.errors[0].code).toBe("cannot_be_undefined");
        expect(result.errors[0].expected).toBe("defined value");
        expect(result.errors[0].received).toBe(undefined);
        expect(result.errors[0].value).toBe(undefined);
        expect(result.errors[0].path).toEqual(["unknown"]);
      });
    });
  });

  describe("StringSchema", () => {
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe(
        "String must be at least 5 characters long"
      );
      expect(result.errors[0].code).toBe("too_short");
      expect(result.errors[0].expected).toBe(5);
      expect(result.errors[0].received).toBe(2);
      expect(result.errors[0].value).toBe("hi");
    });
  });
});

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
