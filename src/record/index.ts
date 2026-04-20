import { e, ValidationError } from "../error.js";
import { ValidationContext } from "../index.js";
import { SchemaType } from "../schema.js";
import { StringSchema } from "../string/index.js";
import {
  RecordDef,
  SchemaTypeAny,
  JsonSchemaFormat,
  Infer,
  StringLikeSchema,
} from "../types.js";

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
  TValue extends SchemaTypeAny = SchemaTypeAny,
  TKey extends StringLikeSchema = StringSchema,
> extends SchemaType<Record<string, Infer<TValue>>> {
  public _def: RecordDef<TKey["_def"], TValue["_def"]> = {
    type: "record" as const,
    keySchema: {} as TKey["_def"],
    valueSchema: {} as TValue["_def"],
    required: true,
  };

  constructor(
    private readonly valueSchema: TValue,
    private readonly keySchema: TKey,
  ) {
    super();
    this._def = {
      type: "record",
      keySchema: keySchema.toJSON(),
      valueSchema: valueSchema.toJSON() as TValue["_def"],
      required: true,
      defaultValue: undefined,
    };

    this.description = `Record with string keys and values of type ${valueSchema.constructor.name}`;
  }

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this>,
  ): e.ValidationResult<Record<string, Infer<TValue>>> {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          "Invalid record type",
          "invalid_type",
          "object",
          typeof data,
          data,
        ),
      );
      return e.ValidationResult.fail(ctx.getErrors());
    }

    const result: Record<string, Infer<TValue>> = {};

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
        result[key] = valueResult.data as Infer<TValue>;
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
      required: this._def.required,
    };
  }

  /**
   * Serializes the Record schema to JSON for langchain integration.
   *
   * NOTE: `additionalProperties` is intentionally omitted — it is rejected by OpenAI,
   * Anthropic strict mode, and Google Gemini. All providers treat dynamic-key objects
   * as opaque `object` in tool schemas.
   */
  toLangchainJSON(): JsonSchemaFormat {
    return {
      type: "object",
      description:
        `(object with dynamic string keys) ${this.description ?? ""}`.trim(),
    };
  }
}
