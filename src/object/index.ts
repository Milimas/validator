import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import {
  HTMLAttributes,
  HtmlObjectType,
  MergeShapes,
  ObjectInfer,
  PrettifyShape,
  SchemaTypeAny,
} from "../types.js";

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
  Shape extends { [key: string]: SchemaType<any, any> }
> extends SchemaType<ObjectInfer<Shape>> {
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
  constructor(public shape: Shape) {
    super();
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
   * @returns {e.ValidationResult<ObjectInfer<Shape>>} A validation result containing
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
  validate(data: unknown): e.ValidationResult<ObjectInfer<Shape>> {
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

      return e.ValidationResult.fail<ObjectInfer<Shape>>(errors);
    }

    const result: ObjectInfer<Shape> = {} as ObjectInfer<Shape>;

    for (const key in data) {
      if (!(key in this.shape)) {
        errors.push(
          new ValidationError(
            [key],
            "Unexpected property",
            "unexpected_property",
            "object",
            "object",
            data
          )
        );
      }
    }
    for (const key in this.shape) {
      const schema = this.shape[key];
      const value = (data as any)[key];
      const fieldResult = schema.safeParse(value);
      if (!fieldResult.success) {
        const fieldErrors = fieldResult.mapErrors([key]).errors;
        errors.push(...fieldErrors);
      } else {
        result[key as unknown as keyof ObjectInfer<Shape>] = fieldResult.data;
      }
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<ObjectInfer<Shape>>(errors);
    }
    return e.ValidationResult.ok<ObjectInfer<Shape>>(
      result as ObjectInfer<Shape>
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

  /**
   * Extends the current object schema with one or more additional object schemas.
   * This method merges the shapes of all provided schemas into a new schema.
   * Properties in later schemas will overwrite those in earlier ones if there are conflicts.
   *
   * @template S - A tuple of ObjectSchema types to extend with.
   * @param schemas One or more ObjectSchema instances to extend the current schema with.
   * @returns A new ObjectSchema instance containing the merged shape of all schemas.
   *
   * @example
   * const baseSchema = v.object({
   *   id: v.string().uuid(),
   *  createdAt: v.string().dateTime(),
   * });
   *
   * const userContactSchema = v.object({
   *  username: v.string().minLength(3),
   *  email: v.string().email(),
   * });
   *
   * const userProfileSchema = v.object({
   *   firstName: v.string().minLength(1),
   *   lastName: v.string().minLength(1),
   * });
   *
   * const extendedSchema = baseSchema.extend(userContactSchema, userProfileSchema);
   *
   * // The resulting schema has the combined shape of all three schemas:
   * // {
   * //   id: string (UUID),
   * //   createdAt: string (date-time),
   * //   username: string (minLength 3),
   * //   email: string (email),
   * //   firstName: string (minLength 1),
   * //   lastName: string (minLength 1)
   * // }
   */
  extend<S extends readonly ObjectSchema<any>[]>(
    ...schemas: S
  ): ObjectSchema<
    PrettifyShape<
      Shape &
        MergeShapes<{
          [K in keyof S]: S[K] extends ObjectSchema<infer U> ? U : never;
        }>
    >
  > {
    const newShape: any = { ...this.shape };
    for (const sch of schemas) {
      for (const key in sch.shape) {
        newShape[key] = sch.shape[key];
      }
    }
    return new ObjectSchema(newShape) as any;
  }

  /**
   * Creates a new ObjectSchema by omitting specified keys from the current schema's shape.
   *
   * This method allows for the creation of a derived schema that excludes certain properties
   * from the original schema. The resulting schema will validate objects that do not include
   * the omitted keys.
   *
   * @template K - The keys of the properties to omit from the schema
   * @param {K[]} keys - An array of property names to omit from the schema
   * @returns {ObjectSchema<PrettifyShape<Omit<Shape, K>>>} A new ObjectSchema instance
   *          with the specified keys omitted from its shape
   *
   * @example
   * const fullSchema = v.object({
   *   id: v.string().uuid(),
   *   username: v.string().minLength(3),
   *   email: v.string().email(),
   *   password: v.string().minLength(8)
   * });
   *
   * // Create a public schema that omits sensitive fields
   * const publicSchema = fullSchema.omit('email', 'password');
   *
   * // The resulting schema will only validate objects with 'id' and 'username'
   * // {
   * //   id: string (UUID),
   * //   username: string (minLength 3)
   * // }
   */
  omit<K extends keyof Shape>(
    ...keys: K[]
  ): ObjectSchema<PrettifyShape<Omit<Shape, K>>> {
    const newShape: any = { ...this.shape };
    for (const key of keys) {
      delete newShape[key];
    }
    return new ObjectSchema<PrettifyShape<Omit<Shape, K>>>(newShape);
  }

  /**
   * Creates a new ObjectSchema by picking specified keys from the current schema's shape.
   *
   * This method allows for the creation of a derived schema that includes only certain properties
   * from the original schema. The resulting schema will validate objects that contain only the
   * selected keys.
   *
   * @template K - The keys of the properties to include in the new schema.
   * @param keys An array of property names to include in the new schema.
   * @returns A new ObjectSchema instance with only the specified keys in its shape.
   *
   * @example
   * const userSchema = v.object({
   *   id: v.string().uuid(),
   *   username: v.string().minLength(3),
   *   email: v.string().email(),
   *   password: v.string().minLength(8)
   * });
   *
   * // Create a schema for public user info by picking specific fields
   * const publicUserSchema = userSchema.pick('id', 'username');
   *
   * // The resulting schema will only validate objects with 'id' and 'username'
   * // {
   * //   id: string (UUID),
   * //   username: string (minLength 3)
   * // }
   */
  pick<K extends keyof Shape>(
    ...keys: K[]
  ): ObjectSchema<PrettifyShape<Pick<Shape, K>>> {
    const newShape: any = {};
    for (const key of keys) {
      newShape[key] = this.shape[key];
    }
    return new ObjectSchema<PrettifyShape<Pick<Shape, K>>>(newShape);
  }
}
