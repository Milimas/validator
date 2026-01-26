import { ValidationContext } from "../context.js";
import { e, ValidationError } from "../error.js";
import { DefaultSchema, SchemaType } from "../schema.js";
import { CheckboxDef } from "../types.js";

/**
 * Boolean schema for validating true/false values and checkbox inputs.
 *
 * BooleanSchema provides validation for boolean values with HTML5 checkbox input type
 * attributes. Essential for feature toggles, agreement checkboxes, and any binary choice
 * fields in forms. Supports default values and integrates seamlessly with form builders.
 *
 * Key features:
 * - Strict type validation (only true/false allowed, not truthy/falsy values)
 * - HTML5 checkbox input compatibility
 * - Support for checked/unchecked states
 * - Default value configuration
 * - Lightweight validation with minimal overhead
 *
 * @example
 * // Terms and conditions checkbox
 * const termsSchema = new BooleanSchema().required(true, 'You must agree to the terms');
 * const result = termsSchema.safeParse(true);
 *
 * @example
 * // Feature toggle with default disabled
 * const featureSchema = new BooleanSchema().default(false);
 *
 * @example
 * // Newsletter subscription (optional)
 * const newsletterSchema = new BooleanSchema().required(false);
 */
export class BooleanSchema extends SchemaType<boolean> {
  public _def: CheckboxDef = {
    type: "checkbox",
    defaultValue: undefined,
    checked: false,
    required: true,
  };

  constructor() {
    super();

    this.checks.push({
      type: "refine",
      check: (data: boolean) => data === true || data === false,
      message: () => "Value must be a boolean",
      code: "invalid_type",
      expected: "boolean",
      received: "non-boolean",
      immediate: true,
    });
    this.checks.push({
      type: "refine",
      check: (data: boolean) => typeof data === "boolean",
      message: () => "Invalid boolean value",
      code: "invalid_type",
      expected: "boolean",
      received: "non-boolean",
      immediate: true,
    });

    this.description = `Boolean value (true/false)`;
  }

  protected validate(
    data: boolean | unknown = this._def.defaultValue,
    ctx: ValidationContext,
  ): e.ValidationResult<boolean> {
    return e.ValidationResult.ok(data as boolean);
  }

  default(value: boolean): DefaultSchema<this> {
    this._def.checked = value;
    this.description += ` (default: ${value})`;
    return new DefaultSchema(this, value);
  }
}
