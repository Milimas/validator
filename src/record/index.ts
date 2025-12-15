import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import { HTMLAttributes, SchemaTypeAny, SchemaDef, TypeOf } from "../types.js";

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
  TKey extends SchemaTypeAny = SchemaType<string>,
  D extends SchemaDef = SchemaDef
> extends SchemaType<Record<string, TypeOf<TValue>>, D> {
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
      validate(data: unknown): e.ValidationResult<string> {
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
    })({}) as TKey,
    def: D
  ) {
    super(def);
    this.htmlAttributes = {
      type: "record",
      keySchema: keySchema.toJSON(),
      valueSchema: valueSchema.toJSON(),
      required: true,
    };
  }

  validate(data: unknown): e.ValidationResult<Record<string, TypeOf<TValue>>> {
    const errors: ValidationError[] = [];

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push(
        new ValidationError(
          [],
          "Invalid record type",
          "invalid_type",
          "object",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail(errors);
    }

    const result: Record<string, TypeOf<TValue>> = {};

    for (const [key, value] of Object.entries(data)) {
      // Validate key
      const keyResult = this.keySchema.validate(key);
      if (!keyResult.success) {
        keyResult.errors.forEach((err) => {
          errors.push(
            new ValidationError(
              [key, ...(err.path || [])],
              err.message,
              err.code,
              err.expected,
              err.received,
              err.value
            )
          );
        });
        continue;
      }

      // Validate value
      const valueResult = this.valueSchema.validate(value);
      if (!valueResult.success) {
        valueResult.errors.forEach((err) => {
          errors.push(
            new ValidationError(
              [key, ...(err.path || [])],
              err.message,
              err.code,
              err.expected,
              err.received,
              err.value
            )
          );
        });
      } else {
        result[key] = valueResult.data as TypeOf<TValue>;
      }
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail(errors);
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
