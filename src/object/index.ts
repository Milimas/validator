import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HTMLAttributes, HtmlObjectType, TypeOf } from "../types";

/**
 * Composite schema for validating object structures with typed properties.
 *
 * ObjectSchema provides comprehensive validation for complex object types by composing
 * multiple property schemas together. Each property in the object is validated according
 * to its defined schema, enabling type-safe validation of nested and complex data structures.
 *
 * Key features:
 * - Type-safe property validation with full TypeScript inference
 * - Nested object support for multi-level data structures
 * - Individual error reporting per property with path information
 * - Automatic HTML form attribute generation from schema definitions
 * - Method chaining for fluent API usage
 * - Support for default values and optional properties
 *
 * @template Shape - The shape/structure type mapping property names to SchemaType instances
 *
 * @example
 * // User registration form with multiple validated properties
 * const userSchema = new ObjectSchema({
 *   username: new StringSchema().minLength(3),
 *   email: new EmailSchema(),
 *   age: new NumberSchema().min(18),
 *   newsletter: new BooleanSchema().default(false)
 * });
 *
 * const result = userSchema.safeParse({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   age: 25,
 *   newsletter: true
 * });
 *
 * @example
 * // Nested object validation for address information
 * const addressSchema = new ObjectSchema({
 *   street: new StringSchema(),
 *   city: new StringSchema(),
 *   zipCode: new ZipCodeSchema()
 * });
 *
 * const profileSchema = new ObjectSchema({
 *   name: new StringSchema(),
 *   email: new EmailSchema(),
 *   address: addressSchema
 * });
 */
export class ObjectSchema<
  Shape extends { [key: string]: SchemaType<any, any, any> }
> extends SchemaType<{ [K in keyof Shape]: TypeOf<Shape[K]> }> {
  public htmlAttributes: HtmlObjectType<{
    [K in keyof Shape]: HTMLAttributes;
  }> = {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(this.shape).map(([key, schema]) => [key, schema.toJSON()])
    ) as { [K in keyof Shape]: HTMLAttributes },
    defaultValue: undefined,
  };

  /**
   * Initializes the ObjectSchema with a shape definition.
   *
   * Creates a new ObjectSchema instance configured with a mapping of property names
   * to validation schemas. The shape object defines the expected structure and validation
   * rules for each property in the object being validated. HTML form attributes are
   * automatically generated from the schema definitions.
   *
   * @param {Shape} shape - An object mapping property names to SchemaType instances
   *                        that define validation rules for each property
   *
   * @example
   * const userSchema = new ObjectSchema({
   *   firstName: new StringSchema().minLength(2),
   *   lastName: new StringSchema().minLength(2),
   *   email: new EmailSchema(),
   *   age: new NumberSchema().min(18).max(120)
   * });
   */
  constructor(private shape: Shape) {
    super({});
  }

  /**
   * Validates that the input is an object and validates all properties according to defined schemas.
   *
   * Performs comprehensive validation by:
   * 1. Checking the input is a valid object (not null, not an array, not undefined)
   * 2. Iterating through each property defined in the shape
   * 3. Validating each property value against its corresponding schema
   * 4. Collecting all validation errors with property path information
   * 5. Returning the validated and transformed object or all collected errors
   *
   * Error reporting includes the property path (e.g., "address.street") to pinpoint
   * exactly which property failed validation and why.
   *
   * @param {unknown} data - The data to validate (should be an object)
   * @returns {e.ValidationResult<{ [K in keyof Shape]: TypeOf<Shape[K]> }>} A validation result containing
   *          either the validated object with typed properties or detailed error information with property paths
   *
   * @example
   * const schema = new ObjectSchema({
   *   name: new StringSchema().minLength(2),
   *   email: new EmailSchema()
   * });
   *
   * const result = schema.validate({
   *   name: 'John',
   *   email: 'john@example.com'
   * });
   *
   * if (result.success) {
   *   console.log(result.data); // { name: 'John', email: 'john@example.com' }
   * } else {
   *   result.errors.forEach(error => {
   *     console.log(`${error.path.join('.')}: ${error.message}`);
   *   });
   * }
   */
  validate(
    data: unknown
  ): e.ValidationResult<{ [K in keyof Shape]: TypeOf<Shape[K]> }> {
    const errors: ValidationError[] = [];
    if (data === undefined) data = this.htmlAttributes?.defaultValue;
    if (
      typeof data !== "object" ||
      data === null ||
      (data === undefined && !this.htmlAttributes?.required) ||
      Array.isArray(data)
    ) {
      errors.push(
        new ValidationError(
          [],
          "Invalid object",
          "invalid_type",
          "object",
          typeof data,
          data
        )
      );

      return e.ValidationResult.fail<{
        [K in keyof Shape]: TypeOf<Shape[K]>;
      }>(errors);
    }

    const result: Partial<{ [K in keyof Shape]: TypeOf<Shape[K]> }> = {};

    for (const key in this.shape) {
      const schema = this.shape[key];
      const value = (data as any)[key];
      const fieldResult = schema.safeParse(value);
      if (!fieldResult.success) {
        const fieldErrors = fieldResult.mapErrors([key]).errors;
        errors.push(...fieldErrors);
      } else {
        result[key] = fieldResult.data;
      }
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<{
        [K in keyof Shape]: TypeOf<Shape[K]>;
      }>(errors);
    }
    return e.ValidationResult.ok<{ [K in keyof Shape]: TypeOf<Shape[K]> }>(
      result as { [K in keyof Shape]: TypeOf<Shape[K]> }
    );
  }

  /**
   * Converts the object schema to a JSON representation of HTML form attributes.
   *
   * Generates a JSON object containing HTML form attributes for all properties in the schema.
   * This is useful for form builders and UI frameworks that need to render form fields
   * with proper HTML attributes based on the validation schema definitions.
   *
   * The returned object includes:
   * - type: "object" to identify this as an object schema
   * - properties: HTML attributes for each property (minLength, maxLength, pattern, etc.)
   * - defaultValue: The default value for the entire object if one is set
   *
   * @returns {HtmlObjectType<{ [K in keyof Shape]: HTMLAttributes }>} A JSON representation containing
   *          object type information and HTML attributes for all properties
   *
   * @example
   * const schema = new ObjectSchema({
   *   username: new StringSchema().minLength(3).maxLength(20),
   *   email: new EmailSchema()
   * });
   *
   * const htmlAttrs = schema.toJSON();
   * console.log(htmlAttrs);
   * // {
   * //   type: 'object',
   * //   properties: {
   * //     username: { type: 'text', minLength: 3, maxLength: 20 },
   * //     email: { type: 'email' }
   * //   },
   * //   defaultValue: undefined
   * // }
   */
  toJSON(): HtmlObjectType<{ [K in keyof Shape]: HTMLAttributes }> {
    const json: HtmlObjectType<{ [K in keyof Shape]: HTMLAttributes }> = {
      ...this.htmlAttributes,
      type: "object",
      defaultValue: this.htmlAttributes?.defaultValue,
    };
    return json;
  }
}
