import { e, ValidationError } from "../error.js";
import { ValidationContext } from "../index.js";
import { SchemaType } from "../schema.js";
import { HTMLAttributes, SchemaTypeAny, TypeOf } from "../types.js";

/**
 * Record schema for validating objects with dynamic string keys and uniform value types.
 *
 * Similar to TypeScript's Record<string, T>, this validates objects where:
 * - Keys are strings (can be constrained with keySchema)
 * - All values conform to the same valueSchema
 * - Useful for dictionaries, maps, and dynamic key-value structures
 *
 * @example
 * // Simple record: user scores
 * const scoresSchema = record(number().min(0).max(100));
 * scoresSchema.parse({ alice: 95, bob: 87 }); // Valid
 *
 * @example
 * // Record with key constraints
 * const configSchema = record(string().minLength(2), string().pattern(/^[a-z]+$/));
 * configSchema.parse({ theme: "dark", lang: "en" }); // Valid
 */
export class RecordSchema<
  TValue extends SchemaTypeAny,
  TKey extends SchemaTypeAny = SchemaType<string>
> extends SchemaType<Record<string, TypeOf<TValue>>> {
  public htmlAttributes: {
    type: "record";
    keySchema: HTMLAttributes;
    valueSchema: HTMLAttributes;
    required: boolean;
  };

  constructor(
    private readonly valueSchema: TValue,
    private readonly keySchema: TKey = new (class extends SchemaType<string> {
      htmlAttributes = { type: "text" as const, required: true };
      protected validate(
        data: unknown,
        ctx: ValidationContext
      ): e.ValidationResult<string> {
        if (typeof data !== "string") {
          return e.ValidationResult.fail([
            new ValidationError(
              [],
              "Key must be a string",
              "invalid_type",
              "string",
              typeof data,
              data
            ),
          ]);
        }
        return e.ValidationResult.ok(data);
      }
    })() as unknown as TKey
  ) {
    super();
    this.htmlAttributes = {
      type: "record",
      keySchema: keySchema.toJSON(),
      valueSchema: valueSchema.toJSON(),
      required: true,
    };
  }

  protected validate(
    data: unknown,
    ctx: ValidationContext
  ): e.ValidationResult<Record<string, TypeOf<TValue>>> {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          "Invalid record type",
          "invalid_type",
          "object",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail(ctx.getErrors());
    }

    const result: Record<string, TypeOf<TValue>> = {};

    for (const [key, value] of Object.entries(data)) {
      // Validate key
      const keyResult = this.keySchema.safeParse(key, ctx.child(key));
      if (!keyResult.success) {
        ctx.addErrors(keyResult.errors);
        continue;
      }

      // Validate value
      const valueResult = this.valueSchema.safeParse(value, ctx.child(key));
      if (!valueResult.success) {
        ctx.addErrors(valueResult.errors);
      } else {
        result[key] = valueResult.data as TypeOf<TValue>;
      }
    }

    if (ctx.hasErrors()) {
      return e.ValidationResult.fail(ctx.getErrors());
    }

    return e.ValidationResult.ok(result);
  }

  /**
   * Serializes the record schema to JSON for form rendering.
   * Returns a record type with both key and value schemas for frontend validation.
   */
  toJSON() {
    return {
      type: "record" as const,
      keySchema: this.keySchema.toJSON(),
      valueSchema: this.valueSchema.toJSON(),
      required: this.htmlAttributes.required,
    };
  }
}
