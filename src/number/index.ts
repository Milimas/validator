import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HtmlNumberInputAttributes } from "../types";

/**
 * Numeric validation schema for integer and floating-point number validation.
 *
 * NumberSchema provides comprehensive validation for numeric values with support for
 * min/max constraints. Essential for form fields involving quantities, prices, ratings,
 * ages, and any numeric input. Automatically rejects NaN and enforces strict numeric type checking.
 *
 * Key features:
 * - Strict type validation (rejects strings, booleans, NaN)
 * - Min/max value constraints
 * - Support for both integers and decimals
 * - HTML5 number input compatibility
 * - Custom error messages for validation failures
 * - Method chaining for fluent API usage
 *
 * @example
 * // Age field with realistic constraints
 * const ageSchema = new NumberSchema()
 *   .min(0, 'Age cannot be negative')
 *   .max(150, 'Age seems unrealistic');
 *
 * @example
 * // Price field
 * const priceSchema = new NumberSchema()
 *   .min(0.01, 'Price must be greater than 0')
 *   .max(999999.99, 'Price is too high');
 *
 * @example
 * // Rating field (1-5 stars)
 * const ratingSchema = new NumberSchema()
 *   .min(1, 'Rating must be at least 1 star')
 *   .max(5, 'Rating cannot exceed 5 stars');
 */
export class NumberSchema extends SchemaType<number> {
  public htmlAttributes: HtmlNumberInputAttributes = {
    type: "number",
    defaultValue: 0,
    required: true,
  };

  /**
   * Validates that the input is a valid number and conforms to all constraints.
   *
   * Performs comprehensive numeric validation by:
   * 1. Checking the input is a valid number type (not NaN, string, or other types)
   * 2. Validating against the minimum value constraint if set
   * 3. Validating against the maximum value constraint if set
   * 4. Returning the validated number or detailed error information
   *
   * Strict type checking ensures only actual numbers pass, preventing common errors
   * where strings or other types might be coerced to numbers unexpectedly.
   *
   * @param {unknown} data - The data to validate (should be a number)
   * @returns {e.ValidationResult<number>} A validation result containing either the validated
   *          number or detailed error information about type or constraint violations
   *
   * @example
   * const schema = new NumberSchema().min(0).max(100);
   *
   * const result = schema.validate(50);
   * if (result.success) {
   *   console.log(result.data); // 50
   * }
   *
   * schema.validate(-5);     // ✗ Error: too small
   * schema.validate(150);    // ✗ Error: too big
   * schema.validate('123');  // ✗ Error: invalid type
   */
  validate(data: unknown): e.ValidationResult<number> {
    const errors: ValidationError[] = [];
    if (typeof data !== "number" || isNaN(data)) {
      errors.push(
        new ValidationError(
          [],
          "Invalid number",
          "invalid_type",
          "number",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<number>(errors);
    }

    if (data < (this.htmlAttributes.min ?? -Infinity)) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("min") ||
            `Number must be greater than or equal to ${this.htmlAttributes.min}`,
          "too_small",
          "number",
          "number",
          data
        )
      );
    }

    if (data > (this.htmlAttributes.max ?? Infinity)) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("max") ||
            `Number must be less than or equal to ${this.htmlAttributes.max}`,
          "too_big",
          "number",
          "number",
          data
        )
      );
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<number>(errors);
    }
    return e.ValidationResult.ok<number>(data);
  }

  /**
   * Sets the minimum allowed value for the number.
   *
   * Constrains the numeric value to be greater than or equal to the specified minimum.
   * Commonly used for enforcing valid ranges like age (0-150), ratings (1-5), or prices (0.01+).
   * Supports custom error messages to guide users when their input is too small.
   *
   * @param {number} value - The minimum allowed value (inclusive)
   * @param {string} [message] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Age must be at least 18
   * const ageSchema = new NumberSchema()
   *   .min(18, 'You must be at least 18 years old');
   *
   * @example
   * // Price must be positive
   * const priceSchema = new NumberSchema()
   *   .min(0.01, 'Price must be greater than $0');
   */
  min(
    value: number,
    message: string = `Number must be greater than or equal to ${value}`
  ): this {
    this.errorMap.set("min", message);
    this.htmlAttributes = { ...this.htmlAttributes, min: value };
    return this;
  }

  /**
   * Sets the maximum allowed value for the number.
   *
   * Constrains the numeric value to be less than or equal to the specified maximum.
   * Useful for enforcing upper bounds like maximum age, rating limits, file sizes,
   * or budget caps. Supports custom error messages to clarify constraints to users.
   *
   * @param {number} value - The maximum allowed value (inclusive)
   * @param {string} [message] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Age cannot exceed 120
   * const ageSchema = new NumberSchema()
   *   .max(120, 'Age cannot exceed 120 years');
   *
   * @example
   * // Maximum rating of 5 stars
   * const ratingSchema = new NumberSchema()
   *   .min(1)
   *   .max(5, 'Rating cannot exceed 5 stars');
   */
  max(
    value: number,
    message: string = `Number must be less than or equal to ${value}`
  ): this {
    this.errorMap.set("max", message);
    this.htmlAttributes = { ...this.htmlAttributes, max: value };
    return this;
  }
}
