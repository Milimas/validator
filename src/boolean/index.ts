import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import { HtmlCheckboxAttributes } from "../types.js";

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
  public htmlAttributes: HtmlCheckboxAttributes = {
    type: "checkbox",
    defaultValue: false,
    checked: false,
    required: true,
  };

  /**
   * Validates that the input is a strict boolean value (true or false).
   *
   * Performs type checking to ensure the input is exactly boolean type, not truthy/falsy
   * values like 1, 0, "true", "false", null, or undefined. Only true and false are
   * accepted values. This strict validation prevents common form submission errors where
   * checkbox values might be strings or numbers instead of actual booleans.
   *
   * @param {unknown} data - The data to validate (should be true or false)
   * @returns {e.ValidationResult<boolean>} A validation result containing the boolean value
   *          or an error if the input is not a strict boolean
   *
   * @example
   * const schema = new BooleanSchema();
   *
   * schema.validate(true);   // ✓ Success
   * schema.validate(false);  // ✓ Success
   * schema.validate(1);      // ✗ Error: invalid type
   * schema.validate('true'); // ✗ Error: invalid type
   * schema.validate(null);   // ✗ Error: invalid type
   */
  validate(data: unknown): e.ValidationResult<boolean> {
    const errors: ValidationError[] = [];
    if (typeof data !== "boolean") {
      errors.push(
        new ValidationError(
          [],
          "Invalid boolean",
          "invalid_type",
          "boolean",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<boolean>(errors);
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<boolean>(errors);
    }
    return e.ValidationResult.ok<boolean>(data);
  }
}
