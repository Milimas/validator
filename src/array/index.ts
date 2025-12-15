import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import {
  HtmlArrayType,
  HTMLAttributes,
  SchemaTypeAny,
  TypeOf,
} from "../types.js";

/**
 * Array schema for validating collections of homogeneous typed items.
 *
 * ArraySchema provides comprehensive validation for arrays/lists by applying a single
 * item schema to every element in the array. Ensures type consistency and enables
 * validation of collections of objects, strings, numbers, or any other SchemaType.
 *
 * Key features:
 * - Type-safe array element validation
 * - Min/max length constraints on array size
 * - Individual error reporting per array element with index
 * - Support for nested arrays and complex item types
 * - Automatic HTML form attribute generation
 * - Method chaining for fluent API usage
 *
 * @template T - The SchemaType of array items (all items must conform to this schema)
 *
 * @example
 * // Array of email addresses
 * const emailListSchema = new ArraySchema(new EmailSchema());
 * const result = emailListSchema.safeParse([
 *   'user1@example.com',
 *   'user2@example.com'
 * ]);
 *
 * @example
 * // Array of user objects with constraints
 * const userListSchema = new ArraySchema(
 *   new ObjectSchema({
 *     id: new NumberSchema(),
 *     name: new StringSchema().minLength(2),
 *     email: new EmailSchema()
 *   })
 * ).minLength(1).maxLength(100);
 *
 * @example
 * // Array of tags with length requirements
 * const tagsSchema = new ArraySchema(
 *   new StringSchema().minLength(2).maxLength(20)
 * ).minLength(1).maxLength(10);
 */
export class ArraySchema<T extends SchemaTypeAny> extends SchemaType<
  TypeOf<T>[]
> {
  public htmlAttributes: HtmlArrayType<HTMLAttributes> = {
    type: "array",
    items: [],
  };

  /**
   * Initializes the ArraySchema with an item schema.
   *
   * Creates a new ArraySchema instance configured to validate arrays where each element
   * conforms to the provided item schema. The schema will validate all array items
   * and collect detailed errors for any items that fail validation.
   *
   * @param {T} itemSchema - The schema that each array item must conform to
   *
   * @example
   * const stringArray = new ArraySchema(new StringSchema());
   * const numberArray = new ArraySchema(new NumberSchema());
   * const objectArray = new ArraySchema(new EmailSchema());
   */
  constructor(private itemSchema: T) {
    super();
  }

  /**
   * Validates that the input is an array and validates all items against the item schema.
   *
   * Performs comprehensive array validation by:
   * 1. Checking the input is an actual array (not object, not null, not undefined)
   * 2. Validating array length against min/max constraints
   * 3. Iterating through each array element
   * 4. Validating each element against the item schema
   * 5. Collecting all validation errors with array index information
   * 6. Returning the validated array or all collected errors
   *
   * Error reporting includes the array index (e.g., [2]) to identify which array element
   * failed validation. For nested validation errors, the path shows the full location
   * (e.g., [0].email for an email validation error in the first object).
   *
   * @param {unknown} data - The data to validate (should be an array)
   * @returns {e.ValidationResult<TypeOf<T>[]>} A validation result containing either
   *          the validated array with all items validated or detailed error information
   *          including array indices and item-specific error details
   *
   * @example
   * const schema = new ArraySchema(new StringSchema().minLength(2));
   * const result = schema.validate(['hello', 'world']);
   *
   * if (result.success) {
   *   console.log(result.data); // ['hello', 'world']
   * } else {
   *   result.errors.forEach(error => {
   *     console.log(`${error.path.join('.')}: ${error.message}`);
   *   });
   * }
   */
  validate(data: unknown): e.ValidationResult<TypeOf<T>[]> {
    const errors: ValidationError[] = [];
    if (!Array.isArray(data)) {
      errors.push(
        new ValidationError(
          [],
          "Invalid array",
          "invalid_type",
          "array",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<TypeOf<T>[]>(errors);
    }

    if (
      this.htmlAttributes.minLength !== undefined &&
      data.length < this.htmlAttributes.minLength
    ) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("minLength") ||
            `Array must have at least ${this.htmlAttributes.minLength} items`,
          "too_small",
          "array",
          "array",
          data
        )
      );
    }

    if (
      this.htmlAttributes.maxLength !== undefined &&
      data.length > this.htmlAttributes.maxLength
    ) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("maxLength") ||
            `Array must have at most ${this.htmlAttributes.maxLength} items`,
          "too_big",
          "array",
          "array",
          data
        )
      );
    }

    const result: TypeOf<T>[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemResult = this.itemSchema.safeParse(item);
      if (!itemResult.success) {
        const itemErrors = itemResult.errors.map((err: ValidationError) => ({
          ...err,
          path: [i, ...err.path],
        }));
        errors.push(...itemErrors);
      } else {
        result.push(itemResult.data);
      }
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<TypeOf<T>[]>(errors);
    }
    return e.ValidationResult.ok<TypeOf<T>[]>(result);
  }

  /**
   * Sets the minimum number of items allowed in the array.
   *
   * Constrains the array size to contain at least the specified number of items.
   * Useful for enforcing non-empty arrays, minimum collection sizes, and ensuring
   * adequate data for operations that need multiple items.
   *
   * @param {number} min - The minimum number of items required in the array
   * @param {string} [message] - Custom error message when minimum length validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // At least one item required
   * const tagsSchema = new ArraySchema(new StringSchema())
   *   .minLength(1, 'At least one tag is required');
   *
   * @example
   * // Shopping cart must have items
   * const cartSchema = new ArraySchema(new ObjectSchema({...}))
   *   .minLength(1);
   */
  minLength(
    min: number,
    message: string = `Array must have at least ${min} items`
  ): this {
    this.htmlAttributes.minLength = min;
    if (message) {
      this.errorMap.set("minLength", message);
    }
    return this;
  }

  /**
   * Sets the maximum number of items allowed in the array.
   *
   * Constrains the array size to not exceed the specified number of items.
   * Useful for enforcing maximum collection sizes, pagination limits, and preventing
   * excessively large data submissions that could impact performance.
   *
   * @param {number} max - The maximum number of items allowed in the array
   * @param {string} [message] - Custom error message when maximum length validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Maximum 10 tags per post
   * const tagsSchema = new ArraySchema(new StringSchema())
   *   .maxLength(10, 'Maximum 10 tags allowed');
   *
   * @example
   * // Page size limit
   * const itemsSchema = new ArraySchema(new ObjectSchema({...}))
   *   .minLength(1)
   *   .maxLength(100);
   */
  maxLength(
    max: number,
    message: string = `Array must have at most ${max} items`
  ): this {
    this.htmlAttributes.maxLength = max;
    if (message) {
      this.errorMap.set("maxLength", message);
    }
    return this;
  }

  /**
   * Converts the array schema to a JSON representation of HTML form attributes.
   *
   * Generates a JSON object containing HTML form attributes for the array and its items.
   * This is useful for form builders and UI frameworks that need to render array inputs
   * with proper HTML attributes based on the validation schema definitions.
   *
   * The returned object includes:
   * - type: "array" to identify this as an array schema
   * - items: An array containing the item schema's HTML attributes
   * - minLength: The minimum array size constraint if set
   * - maxLength: The maximum array size constraint if set
   *
   * @returns {HtmlArrayType<HTMLAttributes>} A JSON representation containing array type
   *          information, item schema HTML attributes, and length constraints
   *
   * @example
   * const schema = new ArraySchema(
   *   new StringSchema().minLength(2).maxLength(50)
   * ).minLength(1).maxLength(10);
   *
   * const htmlAttrs = schema.toJSON();
   * console.log(htmlAttrs);
   * // {
   * //   type: 'array',
   * //   items: [{ type: 'text', minLength: 2, maxLength: 50 }],
   * //   minLength: 1,
   * //   maxLength: 10
   * // }
   */
  toJSON(): HtmlArrayType<HTMLAttributes> {
    const json: HtmlArrayType<HTMLAttributes> = {
      ...this.htmlAttributes,
      type: "array",
      items: [this.itemSchema.toJSON()],
    };
    return json;
  }
}
