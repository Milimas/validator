import {
  createValidationContext,
  RefinementContext,
  ValidationContext,
} from "./context.js";
import { e, ValidationError } from "./error.js";
import {
  HTMLAttributes,
  Condition,
  HtmlAnyAttributes,
  HtmlNeverAttributes,
  HtmlUnknownAttributes,
  RefinementCheck,
  SchemaTypeAny,
} from "./types.js";

/**
 * Abstract base class for all schema types in the validation system.
 *
 * Provides core validation functionality, HTML attribute generation, and type inference
 * for building type-safe validation schemas. All specific schema types (string, number,
 * object, etc.) extend this base class to inherit common validation methods and behaviors.
 *
 * @template Output - The TypeScript type produced after successful validation
 * @template Input - The TypeScript type accepted as input (defaults to Output)
 *
 * @example
 * class CustomSchema extends SchemaType<string, unknown> {
 *   htmlAttributes = { type: 'text', required: true };
 *   validate(data: unknown) {
 *     // Custom validation logic
 *   }
 * }
 */
export abstract class SchemaType<Output = any, Input = Output> {
  /**
   * HTML attributes for rendering the schema as a form input element.
   * Must be implemented by all concrete schema classes.
   */
  public abstract htmlAttributes: HTMLAttributes;

  /**
   * Map of custom error messages for different validation scenarios.
   * Allows customization of validation error messages per schema instance.
   */
  protected errorMap: Map<string, string> = new Map();

  /**
   * Array of custom refinement checks for advanced validation logic.
   * Populated by refine() and superRefine() methods.
   */
  protected checks: RefinementCheck<any>[] = [];

  /**
   * Phantom type property for TypeScript type inference of the output type.
   * Not available at runtime - used only for compile-time type checking.
   */
  readonly _output!: Output;

  /**
   * Phantom type property for TypeScript type inference of the input type.
   * Not available at runtime - used only for compile-time type checking.
   */
  readonly _input!: Input;

  /**
   * Validates the provided data against this schema's rules.
   *
   * This abstract method must be implemented by all concrete schema classes.
   * It performs the actual validation logic and returns a ValidationResult
   * indicating success or failure with detailed error information.
   *
   * @param data - The unknown data to validate
   * @returns A ValidationResult containing either the validated data or validation errors
   */
  protected abstract validate(
    data: this["_input"] | unknown,
    ctx: ValidationContext
  ): e.ValidationResult<Output>;

  #validateWithRefinements(
    data: this["_input"] | unknown,
    ctx: ValidationContext
  ): e.ValidationResult<Output> {
    const result = this.validate(data, ctx);

    // If base validation fails, skip refinements and return immediately
    if (!result.success) {
      return result;
    }

    for (const refinement of this.checks) {
      if (refinement.type === "refine") {
        const checkPassed = refinement.check(result.data as Output);
        if (!checkPassed) {
          const error = new ValidationError(
            ctx.getPath(),
            refinement.message() || "Custom validation failed",
            "custom_validation"
          );
          ctx.addError(error);
          if (refinement.immediate) {
            break;
          }
        }
      } else if (refinement.type === "superRefine") {
        // superRefine checks add errors directly via ctx
        refinement.check(result.data as Output, new RefinementContext(ctx));
      }
    }

    // If refinements added errors, surface them as a failed result
    if (ctx.hasErrors()) {
      return e.ValidationResult.fail<Output>(ctx.getErrors());
    }

    return result;
  }

  // merge<S extends SchemaType<Output, Input>[] = SchemaType<Output, Input>[]>(
  //   ...others: S
  // ): S {
  //   const merged = Object.create(Object.getPrototypeOf(this), {});
  //   Object.assign(merged, this, ...others);
  //   return merged;
  // }

  /**
   * Parses and validates data, throwing an error if validation fails.
   *
   * This method applies default values and optional field handling before validation.
   * If validation fails, it throws a ValidationAggregateError with all validation errors.
   * Use this when you want validation failures to be exceptional (throw errors).
   *
   * @param data - The data to parse and validate
   * @returns The validated and typed data
   * @throws {ValidationAggregateError} If validation fails
   *
   * @example
   * const emailSchema = email();
   * const validEmail = emailSchema.parse('user@example.com'); // Returns 'user@example.com'
   * emailSchema.parse('invalid'); // Throws ValidationAggregateError
   */
  parse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"]
    )
  ): Output {
    const result = this.#validateWithRefinements(data, ctx);
    if (!result.success) {
      throw result.intoError();
    }

    return result.data as Output;
  }

  /**
   * Safely parses and validates data, returning a result object instead of throwing.
   *
   * This method applies default values and optional field handling before validation.
   * Unlike parse(), it never throws errors - instead it returns a ValidationResult
   * that you can inspect to determine success or failure. Prefer this method when
   * validation failures are expected and should be handled gracefully.
   *
   * @param data - The data to parse and validate
   * @returns A ValidationResult with success status and either validated data or errors
   *
   * @example
   * const emailSchema = email();
   * const result = emailSchema.safeParse('user@example.com');
   * if (result.success) {
   *   console.log(result.data); // 'user@example.com'
   * } else {
   *   console.log(result.errors); // Array of validation errors
   * }
   */
  safeParse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"]
    )
  ): e.ValidationResult<Output> {
    // Run base validation first
    const result = this.#validateWithRefinements(data, ctx);

    // If base validation failed, return the error result
    if (!result.success) {
      return result;
    }

    // If any refinement checks added errors, return failure
    if (ctx.hasErrors()) {
      return e.ValidationResult.fail<Output>(ctx.getErrors());
    }

    return result;
  }

  /**
   * Marks this schema as optional, allowing undefined values.
   *
   * Creates a new OptionalSchema wrapper that permits undefined, null, or empty
   * string values to pass validation. Sets the required HTML attribute to false.
   * Useful for form fields that users don't have to fill in.
   *
   * @returns A new OptionalSchema wrapping this schema
   *
   * @example
   * const optionalEmail = email().optional();
   * optionalEmail.parse(undefined); // Returns undefined (valid)
   * optionalEmail.parse('user@example.com'); // Returns 'user@example.com'
   * optionalEmail.parse('invalid'); // Throws error (invalid email)
   */
  optional(): OptionalSchema<this> {
    this.htmlAttributes = { ...this.htmlAttributes, required: false };
    return new OptionalSchema(this);
  }

  /**
   * Marks this schema as nullable, allowing null values.
   *
   * Creates a new NullableSchema wrapper that permits null values to pass
   * validation while still validating non-null values against the original schema.
   * Useful when a field can be explicitly set to null.
   *
   * @returns A new NullableSchema wrapping this schema
   *
   * @example
   * const nullableNumber = number().nullable();
   * nullableNumber.parse(null); // Returns null (valid)
   * nullableNumber.parse(42); // Returns 42 (valid)
   * nullableNumber.parse('text'); // Throws error (not a number)
   */
  nullable(): NullableSchema<this> {
    return new NullableSchema(this);
  }

  /**
   * Provides a default value for this schema when input is undefined or null.
   *
   * Creates a new DefaultSchema wrapper that automatically substitutes the provided
   * default value when the input is undefined or null. Sets the defaultValue HTML
   * attribute and handles special cases like checkbox checked state.
   *
   * @param value - The default value to use when input is undefined or null
   * @returns A new DefaultSchema wrapping this schema with the default value
   *
   * @example
   * const nameSchema = string().default('Anonymous');
   * nameSchema.parse(undefined); // Returns 'Anonymous'
   * nameSchema.parse('John'); // Returns 'John'
   */
  default(value: this["_input"]): DefaultSchema<this> {
    return new DefaultSchema(this, value);
  }

  /**
   * Makes this schema conditionally required based on other field values.
   *
   * Creates a new DependsOnSchema wrapper that adds conditional validation logic.
   * The field becomes required only when the specified conditions are met. Adds
   * data-depends-on HTML attributes for client-side conditional field visibility.
   *
   * @param conditions - Non-empty array of conditions that determine when this field is required
   * @returns A new DependsOnSchema wrapping this schema with conditional logic
   *
   * @example
   * const taxIdSchema = string().dependsOn([
   *   { field: 'accountType', condition: /^business$/ }
   * ]);
   * // Tax ID is only required when accountType is business
   *
   * @example
   * const emailSchema = string().dependsOn([
   *  { field: 'subscribe', condition: /true/ }
   * ]);
   * // Email is only required when subscribe is true
   */
  dependsOn(conditions: [Condition, ...Condition[]]): DependsOnSchema<this> {
    return new DependsOnSchema(this, conditions);
  }

  /**
   * Sets whether this field is required and customizes the required error message.
   *
   * Updates the required HTML attribute and stores a custom error message for
   * required field validation failures. By default, marks the field as required
   * with a standard error message.
   *
   * @param required - Whether the field should be required (defaults to true)
   * @param message - Custom error message for required validation failures
   * @returns This schema instance for method chaining
   *
   * @example
   * const nameSchema = string().required(true, 'Name is mandatory');
   * const optionalField = string().required(false);
   */
  required(
    required: boolean = true,
    message: string = "This field is required"
  ): this {
    this.errorMap.set("required", message);
    this.htmlAttributes = { ...this.htmlAttributes, required };
    return this;
  }

  /**
   * Adds custom metadata to the schema's HTML attributes.
   *
   * Attaches arbitrary key-value pairs as metadata in the HTML attributes.
   * Useful for storing additional information about the schema that can be
   * utilized by form builders or UI frameworks.
   *
   * @param metadata - A record of key-value pairs to attach as metadata
   * @returns This schema instance for method chaining
   *
   * @example
   * const schema = string().metadata({ info: 'This is a username field' });
   * console.log(schema.toJSON().metadata); // { info: 'This is a username field' }
   */
  metadata(metadata: Record<string, unknown>): this {
    this.htmlAttributes = { ...this.htmlAttributes, metadata };
    return this;
  }

  /**
   * Adds a custom validation refinement with a simple boolean check.
   *
   * Use this method to add custom validation logic that returns true if the value
   * is valid or false if it's invalid. The check runs after the schema's base
   * validation succeeds. If the check returns false, a validation error is added
   * with the provided message.
   *
   * @param check - Function that returns true if value is valid, false otherwise
   * @param message - Error message to display when check returns false
   * @returns This schema instance for method chaining
   *
   * @example
   * const schema = string().refine(
   *   (val) => !val.includes('banned'),
   *   'Value contains banned words'
   * );
   * schema.parse('hello'); // OK
   * schema.parse('banned word'); // Throws error: Value contains banned words
   */
  refine(
    check: (value: Output) => boolean,
    params: {
      message?: string;
      code?: string;
      expected?: unknown;
      received?: unknown;
      immediate?: boolean;
    }
  ): this {
    const { message, code, expected, received, immediate } = params;
    this.checks.push({
      type: "refine",
      check,
      immediate: immediate || false,
      message: () => message || "Custom validation failed",
      code,
      expected,
      received,
    });
    return this;
  }

  /**
   * Adds a custom validation refinement with access to the validation context.
   *
   * Use this method for complex validation logic that needs access to the validation
   * context. The check function receives the validated value and the context, allowing
   * you to add custom errors, access sibling values, check dependencies, and more.
   * Unlike refine(), this method doesn't automatically add errors - you must call
   * ctx.addError() explicitly within the check function.
   *
   * @param check - Function that validates value with context access
   * @returns This schema instance for method chaining
   *
   * @example
   * const schema = string().superRefine((val, ctx) => {
   *   if (val.length < 10) {
   *     ctx.addError(new ValidationError(
   *       ctx.getPath(),
   *       'Value must be at least 10 characters',
   *       'too_short'
   *     ));
   *   }
   * });
   *
   * @example
   * // Check against sibling field
   * const passwordConfirm = string().superRefine((val, ctx) => {
   *   const password = ctx.getSiblingValue('password');
   *   if (val !== password) {
   *     ctx.addError(new ValidationError(
   *       ctx.getPath(),
   *       'Passwords must match',
   *       'passwords_mismatch'
   *     ));
   *   }
   * });
   */
  superRefine(
    check: (value: Output, ctx: RefinementContext<this>) => void
  ): this {
    this.checks.push({
      type: "superRefine",
      check,
    });
    return this;
  }

  /**
   * Converts the schema's HTML attributes to a JSON-serializable format.
   *
   * This method can be overridden by subclasses to customize serialization.
   * By default, it returns the htmlAttributes property as is.
   *
   * @returns JSON-serializable HTML attributes
   * @example
   * const schema = string().minLength(3).maxLength(50);
   * const json = schema.toJSON();
   * console.log(json.minLength); // 3
   * console.log(json.maxLength); // 50
   */
  toJSON(): this["htmlAttributes"] {
    return this.htmlAttributes;
  }
}

/**
 * Schema wrapper that allows undefined values to pass validation.
 *
 * Makes any schema optional by permitting undefined, null, or empty string values
 * while still validating non-empty values against the wrapped schema. Automatically
 * sets the HTML required attribute to false for form rendering.
 *
 * @template T - The wrapped schema type
 *
 * @example
 * const optionalEmail = new OptionalSchema(email());
 * optionalEmail.parse(undefined); // Returns undefined
 * optionalEmail.parse('user@example.com'); // Returns 'user@example.com'
 * optionalEmail.parse('invalid'); // Throws error
 */
export class OptionalSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | undefined,
  T["_input"] | undefined
> {
  /**
   * Creates a new optional schema wrapper.
   *
   * @param inner - The schema to make optional
   */
  constructor(private inner: T) {
    super();
    this.htmlAttributes = { ...inner.htmlAttributes, required: false };
  }

  /**
   * HTML attributes with required set to false.
   */
  public htmlAttributes: T["htmlAttributes"];

  /**
   * Validates data, allowing undefined/null/empty string values.
   *
   * Returns success with undefined for empty values when no default is set.
   * Otherwise delegates to the inner schema's validation logic.
   *
   * @param data - The data to validate
   * @returns ValidationResult with undefined or the validated inner type
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"] | undefined> {
    if (data === undefined || data === null) {
      return e.ValidationResult.ok<undefined>(data as undefined);
    }
    return this.inner.safeParse(data, ctx);
  }

  /**
   * Parses data, returning undefined for empty values or throwing on validation failure.
   *
   * @param data - The data to parse
   * @returns Undefined for empty values, or the validated data from inner schema
   * @throws {ValidationAggregateError} If inner schema validation fails
   */
  parse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): T["_output"] | undefined {
    if (data === undefined || data === null) {
      if (this.htmlAttributes.defaultValue !== undefined)
        return this.htmlAttributes.defaultValue as T["_output"];
      return undefined as T["_output"] | undefined;
    }
    return this.inner.parse(data, ctx);
  }

  /**
   * Safely parses data, returning a result object instead of throwing.
   *
   * @param data - The data to parse
   * @returns ValidationResult with undefined for empty values or inner schema result
   */
  safeParse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"] | undefined> {
    if (data === undefined || data === null) {
      return e.ValidationResult.ok<undefined>(data as undefined);
    }
    return this.inner.safeParse(data, ctx);
  }
}

/**
 * Schema wrapper that allows null values to pass validation.
 *
 * Makes any schema nullable by permitting null values while still validating
 * non-null values against the wrapped schema. Useful for fields that can be
 * explicitly set to null versus undefined.
 *
 * @template T - The wrapped schema type
 *
 * @example
 * const nullableNumber = new NullableSchema(number());
 * nullableNumber.parse(null); // Returns null
 * nullableNumber.parse(42); // Returns 42
 * nullableNumber.parse('text'); // Throws error
 */
export class NullableSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | null,
  T["_input"] | null
> {
  /**
   * Creates a new nullable schema wrapper.
   *
   * @param inner - The schema to make nullable
   */
  constructor(private inner: T) {
    super();
    this.htmlAttributes = inner.htmlAttributes;
  }

  /**
   * HTML attributes inherited from the inner schema.
   */
  public htmlAttributes: T["htmlAttributes"];

  /**
   * Validates data, allowing null values to pass.
   *
   * Returns success with null when data is null and no default is set.
   * Otherwise delegates to the inner schema's validation logic.
   *
   * @param data - The data to validate
   * @returns ValidationResult with null or the validated inner type
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"] | null> {
    if (data === null) {
      return e.ValidationResult.ok<null>(null);
    }
    return this.inner.safeParse(data, ctx);
  }

  /**
   * Parses data, returning null for null values or throwing on validation failure.
   *
   * @param data - The data to parse
   * @returns Null for null input, or the validated data from inner schema
   * @throws {ValidationAggregateError} If inner schema validation fails
   */
  parse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): T["_output"] | null {
    if (data === null) {
      return null as T["_output"] | null;
    }
    return this.inner.parse(data, ctx);
  }

  /**
   * Safely parses data, returning a result object instead of throwing.
   *
   * @param data - The data to parse
   * @returns ValidationResult with null for null input or inner schema result
   */
  safeParse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"] | null> {
    if (data === null) {
      return e.ValidationResult.ok<null>(null);
    }
    return this.inner.safeParse(data, ctx);
  }
}

/**
 * Schema wrapper that provides a default value for undefined or null inputs.
 *
 * Automatically substitutes a specified default value when the input is undefined
 * or null. Updates HTML attributes with the default value and handles special cases
 * like checkbox checked state. Useful for ensuring fields always have a valid value.
 *
 * @template T - The wrapped schema type
 *
 * @example
 * const nameSchema = new DefaultSchema(string(), 'Anonymous');
 * nameSchema.parse(undefined); // Returns 'Anonymous'
 * nameSchema.parse('John'); // Returns 'John'
 */
export class DefaultSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"],
  T["_input"]
> {
  /**
   * HTML attributes with defaultValue set.
   */
  public htmlAttributes: T["htmlAttributes"];

  /**
   * Creates a new default schema wrapper.
   *
   * @param inner - The schema to add default value to
   * @param defaultValue - The default value to use for undefined/null inputs
   */
  constructor(
    private inner: T,
    private defaultValue: T["htmlAttributes"]["defaultValue"]
  ) {
    super();
    this.htmlAttributes = {
      ...inner.htmlAttributes,
      defaultValue: defaultValue,
    };
  }

  /**
   * Validates data, substituting the default value for undefined or null inputs.
   *
   * When data is undefined or null, replaces it with the configured default value
   * before validating. Otherwise validates the data against the inner schema.
   *
   * @param data - The data to validate
   * @returns ValidationResult from the inner schema
   */
  protected validate(
    data: this["_input"] | unknown = this.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"]> {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.safeParse(data, ctx);
  }

  /**
   * Parses data, using the default value for undefined or null inputs.
   *
   * @param data - The data to parse
   * @returns The validated data or default value
   * @throws {ValidationAggregateError} If validation fails
   */
  parse(
    data: this["_input"] | unknown = this.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): T["_output"] {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.parse(data, ctx);
  }

  /**
   * Safely parses data, using the default value for undefined or null inputs.
   *
   * @param data - The data to parse
   * @returns ValidationResult with the validated data or default value
   */
  safeParse(
    data: this["_input"] | unknown = this.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<T["_output"]> {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.safeParse(data, ctx);
  }

  /**
   * Marks this schema as read-only with a custom error message.
   *
   * Sets the readOnly HTML attribute to true and stores a custom error message
   * for read-only validation failures. Useful for displaying pre-filled values
   * that users should not modify.
   *
   * @param message - Custom error message for read-only violations
   * @returns This schema instance for method chaining
   *
   * @example
   * const idField = string().default('AUTO').readOnly('ID cannot be changed');
   */
  readOnly(message: string = "String is read-only"): this {
    this.errorMap.set("readOnly", message);
    this.htmlAttributes = { ...this.htmlAttributes, readOnly: true };
    return this;
  }
}

/**
 * Schema wrapper that makes a field conditionally required based on other field values.
 *
 * Adds conditional validation logic where the field is only required when specified
 * conditions are met. Sets the HTML required attribute to false and adds data-depends-on
 * attributes for client-side conditional field visibility and validation.
 *
 * @template T - The wrapped schema type
 *
 * @example
 * const taxIdSchema = new DependsOnSchema(
 *   string(),
 *   [{ field: 'accountType', condition: (type) => type === 'business' }]
 * );
 * // Tax ID is only required when accountType is 'business'
 */
export class DependsOnSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | undefined,
  T["_input"] | undefined
> {
  /**
   * Creates a new conditional schema wrapper.
   *
   * @param inner - The schema to make conditional
   * @param _dependsOn - Non-empty array of conditions that determine when this field is required
   */
  constructor(
    private inner: T,
    public _dependsOn: [Condition, ...Condition[]]
  ) {
    super();
    this.htmlAttributes = {
      ...inner.htmlAttributes,
      "data-depends-on": this._dependsOn.map((cond) => ({
        field: cond.field,
        condition:
          typeof cond.condition === "string"
            ? cond.condition
            : cond.condition.toString(),
      })),
    };
  }

  /**
   * HTML attributes with required set to false and data-depends-on conditions.
   */
  public htmlAttributes: T["htmlAttributes"];

  /**
   * Validates data using the inner schema's validation logic.
   *
   * Note: Conditional logic is typically evaluated at the form/object level,
   * not within this validate method. This method delegates to the inner schema.
   *
   * @param data - The data to validate
   * @returns ValidationResult from the inner schema
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<this["_output"]> {
    const isRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isRequired) {
      // When dependency conditions are not satisfied, skip validation entirely
      // and treat the field as not applicable.
      return e.ValidationResult.ok<undefined>(undefined);
    }

    // When dependency is satisfied, check if value is missing and add required error
    if (data === undefined || data === null || data === "") {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required"
        )
      );
      return e.ValidationResult.fail<this["_output"]>(ctx.getErrors());
    }

    return this.inner.safeParse(data, ctx);
  }

  /**
   * Parses data using the inner schema.
   *
   * @param data - The data to parse
   * @returns The validated data from inner schema
   * @throws {ValidationAggregateError} If validation fails
   */
  parse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): this["_output"] {
    const isRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isRequired) {
      // Not required: ignore value and return undefined
      return undefined;
    }

    // When dependency is satisfied, check if value is missing and throw required error
    if (data === undefined || data === null || data === "") {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required"
        )
      );
      throw e.ValidationResult.fail<this["_output"]>(
        ctx.getErrors()
      ).intoError();
    }

    return this.inner.parse(data as T["_input"], ctx);
  }

  /**
   * Safely parses data using the inner schema.
   *
   * @param data - The data to parse
   * @returns ValidationResult from the inner schema
   */
  safeParse(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<this["_output"]> {
    const isRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isRequired) {
      return e.ValidationResult.ok<undefined>(undefined);
    }

    // When dependency is satisfied, check if value is missing and add required error
    if (data === undefined || data === null || data === "") {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required"
        )
      );
      return e.ValidationResult.fail<this["_output"]>(ctx.getErrors());
    }

    return this.inner.safeParse(data, ctx);
  }
}

export class AnySchema extends SchemaType<any> {
  public htmlAttributes: HTMLAttributes<HtmlAnyAttributes> = {
    type: "any",
    defaultValue: undefined,
    required: true,
  };

  /**
   * Validates that the input is of any type (always succeeds).
   *
   * This schema accepts any input value without restrictions.
   * It always returns a successful validation result containing the input data.
   *
   * @param {unknown} data - The data to validate (can be of any type)
   * @returns {e.ValidationResult<any>} A validation result containing the input data
   *
   * @example
   * const schema = new AnySchema();
   *
   * schema.validate(42);            // ✓ Success
   * schema.validate('Hello');       // ✓ Success
   * schema.validate({ key: 'value' }); // ✓ Success
   * schema.validate(null);         // ✓ Success
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<any> {
    return e.ValidationResult.ok<any>(data);
  }
}

export class NeverSchema extends SchemaType<never> {
  public htmlAttributes: HTMLAttributes<HtmlNeverAttributes> = {
    type: "never",
    required: true,
  };

  /**
   * Validates that the input is never valid (always fails).
   *
   * This schema rejects all input values without exception.
   * It always returns a failed validation result with an appropriate error message.
   *
   * @param {unknown} data - The data to validate (can be of any type)
   * @returns {e.ValidationResult<never>} A validation result indicating failure
   *
   * @example
   * const schema = new NeverSchema();
   *
   * schema.validate(42);            // ✗ Error: value is not allowed
   * schema.validate('Hello');       // ✗ Error: value is not allowed
   * schema.validate({ key: 'value' }); // ✗ Error: value is not allowed
   * schema.validate(null);         // ✗ Error: value is not allowed
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"]
    )
  ): e.ValidationResult<never> {
    ctx.addError(
      new ValidationError(
        [],
        "Value is not allowed",
        "never_valid",
        "never",
        typeof data,
        data
      )
    );
    return e.ValidationResult.fail<never>(ctx.getErrors());
  }
}

export class UnknownSchema extends SchemaType<unknown> {
  public htmlAttributes: HTMLAttributes<HtmlUnknownAttributes> = {
    type: "unknown",
    defaultValue: undefined,
    required: true,
  };

  /**
   * Validates that the input is of unknown type (always succeeds).
   *
   * This schema accepts any input value without restrictions.
   * It always returns a successful validation result containing the input data.
   *
   * @param {unknown} data - The data to validate (can be of any type)
   * @returns {e.ValidationResult<unknown>} A validation result containing the input data
   *
   * @example
   * const schema = new UnknownSchema();
   *
   * schema.validate(42);            // ✓ Success
   * schema.validate('Hello');       // ✓ Success
   * schema.validate({ key: 'value' }); // ✓ Success
   * schema.validate(null);         // ✓ Success
   */
  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data)
  ): e.ValidationResult<unknown> {
    return e.ValidationResult.ok<unknown>(data);
  }
}
