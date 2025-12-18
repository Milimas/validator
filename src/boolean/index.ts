import { ValidationContext } from "../context.js";
import { e, ValidationError } from "../error.js";
import { DefaultSchema, SchemaType } from "../schema.js";
import { HtmlCheckboxAttributes, HTMLAttributes } from "../types.js";

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
  public htmlAttributes: HTMLAttributes<HtmlCheckboxAttributes> = {
    type: "checkbox",
    defaultValue: false,
    checked: false,
    required: false,
  };

  constructor() {
    super();

    this.checks.push({
      type: "refine",
      check: (data: boolean) => typeof data === "boolean",
      message: () => "Invalid boolean value",
      code: "invalid_type",
      expected: "boolean",
      received: "non-boolean",
      immediate: true,
    });
  }

  protected validate(
    data: boolean | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext
  ): e.ValidationResult<boolean> {
    return e.ValidationResult.ok(data as boolean);
  }

  default(value: boolean): DefaultSchema<this> {
    this.htmlAttributes.checked = value;
    return new DefaultSchema(this, value);
  }
}
