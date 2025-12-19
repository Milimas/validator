import { ValidationContext } from "../context.js";
import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import { HtmlSelectAttributes } from "../types.js";

/**
 * Enumeration schema for validating against a fixed set of allowed values.
 *
 * EnumSchema provides type-safe validation that restricts input to one of a predefined
 * set of string values. Ideal for dropdowns, radio buttons, status fields, and any
 * categorical data with a finite set of valid options. Generates HTML select element
 * attributes for form rendering.
 *
 * Key features:
 * - Type-safe enumeration with full TypeScript literal type inference
 * - Efficient lookup using Set-based validation
 * - HTML5 select element compatibility
 * - Automatic options generation for form builders
 * - Clear error messages showing expected values
 * - Const generics for strict type checking
 *
 * @template T - A readonly array of string values representing allowed enum values
 *
 * @example
 * // User role selection
 * const roleSchema = new EnumSchema(['admin', 'user', 'guest'] as const);
 * const result = roleSchema.safeParse('admin');
 *
 * @example
 * // Order status enumeration
 * const statusSchema = new EnumSchema(['pending', 'processing', 'shipped', 'delivered'] as const);
 *
 * @example
 * // Product category with type inference
 * const categories = ['electronics', 'clothing', 'food', 'books'] as const;
 * const categorySchema = new EnumSchema(categories);
 * // Type is automatically inferred as 'electronics' | 'clothing' | 'food' | 'books'
 */
export class EnumSchema<const T extends readonly string[]> extends SchemaType<
  T[number]
> {
  private valuesSet: Set<string>;
  public htmlAttributes: HtmlSelectAttributes<T[number]> = {
    type: "select",
    options: [],
    required: true,
  };

  /**
   * Initializes the EnumSchema with an array of allowed values.
   *
   * Creates a new EnumSchema instance that validates input against the provided array
   * of allowed string values. Uses a Set internally for efficient O(1) validation lookup.
   * Automatically configures HTML select element options for form rendering.
   *
   * @param {T} values - A readonly array of string values that are allowed (use 'as const' for type safety)
   *
   * @example
   * const priorities = ['low', 'medium', 'high'] as const;
   * const prioritySchema = new EnumSchema(priorities);
   *
   * @example
   * const daySchema = new EnumSchema(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const);
   */
  constructor(private readonly values: T) {
    super();
    this.valuesSet = new Set(values);
    this.htmlAttributes.options = values;
    this.checks.push({
      type: "refine",
      check: (data: string) => this.valuesSet.has(data),
      message: () => "Invalid enum value",
      code: "invalid_enum_value",
      expected: this.values,
      received: "invalid_value",
      immediate: true,
    });
  }

  /**
   * Validates that the input is one of the allowed enumeration values.
   *
   * Checks that the input is a string and exists in the set of allowed enum values.
   * Uses efficient Set-based lookup for O(1) validation performance. Returns a detailed
   * error message listing all allowed values if validation fails.
   *
   * @param {unknown} data - The data to validate (should be one of the enum values)
   * @returns {e.ValidationResult<T[number]>} A validation result containing either the validated
   *     enum value or an error listing the expected allowed values
   *
   * @example
   * const schema = new EnumSchema(['active', 'inactive', 'pending'] as const);
   *
   * schema.validate('active');  // ✓ Success
   * schema.validate('unknown'); // ✗ Error: invalid enum value
   * schema.validate(123);    // ✗ Error: invalid type (not string)
   *
   * @example
   * // With form submission
   * const result = schema.safeParse(formData.status);
   * if (!result.success) {
   *  console.log('Valid statuses are:', ['active', 'inactive', 'pending']);
   * }
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext
  ): e.ValidationResult<T[number]> {
    return e.ValidationResult.ok<T[number]>(data as T[number]);
  }
}
