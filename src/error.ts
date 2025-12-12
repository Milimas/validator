/**
 * Represents a single validation error with detailed context information.
 *
 * ValidationError extends the native Error class to provide rich context about
 * validation failures, including the property path, error code, expected/received values,
 * and custom error messages. Essential for debugging validation issues and providing
 * clear feedback to users.
 *
 * @extends Error
 *
 * @example
 * // Simple validation error
 * const error = new ValidationError(
 *   ['email'],
 *   'Invalid email format',
 *   'invalid_email'
 * );
 *
 * @example
 * // Nested object validation error with full context
 * const error = new ValidationError(
 *   ['user', 'address', 'zipCode'],
 *   'ZIP code must be 5 digits',
 *   'pattern',
 *   /^\d{5}$/,
 *   'abc12',
 *   'abc12'
 * );
 */
export class ValidationError extends Error {
  /**
   * Creates a new ValidationError instance with detailed error context.
   *
   * @param {(string | number)[]} path - Array representing the path to the invalid property (e.g., ['user', 'email'])
   * @param {string} message - Human-readable error message describing the validation failure
   * @param {string} [code] - Error code for programmatic error handling (e.g., 'invalid_email', 'too_short')
   * @param {unknown} [expected] - The expected value, type, or pattern (useful for debugging)
   * @param {unknown} [received] - The actual value received that failed validation
   * @param {unknown} [value] - The full value being validated (may differ from received in nested structures)
   *
   * @example
   * const error = new ValidationError(
   *   ['age'],
   *   'Age must be at least 18',
   *   'min',
   *   18,
   *   15,
   *   15
   * );
   */
  constructor(
    public path: (string | number)[],
    message: string,
    public code?: string,
    public expected?: unknown,
    public received?: unknown,
    public value?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Aggregates multiple ValidationError instances into a single comprehensive error.
 *
 * ValidationAggregateError extends the native Error class to collect and format
 * multiple validation errors into a single error object. Provides formatted error
 * messages with indented tree structure showing property paths and error details.
 * Essential for handling validation of complex objects with multiple failing properties.
 *
 * @extends Error
 *
 * @example
 * // Collect multiple validation errors
 * const errors = [
 *   new ValidationError(['email'], 'Invalid email format', 'invalid_email'),
 *   new ValidationError(['age'], 'Age must be at least 18', 'min')
 * ];
 * const aggregateError = new ValidationAggregateError(errors);
 *
 * @example
 * // Use in validation result
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ValidationAggregateError) {
 *     error.errors.forEach(err => {
 *       console.log(`${err.path.join('.')}: ${err.message}`);
 *     });
 *   }
 * }
 */
export class ValidationAggregateError extends Error {
  /**
   * Creates a new ValidationAggregateError with an array of validation errors.
   *
   * Automatically compiles all errors into a formatted error message showing
   * the total number of errors and details for each one.
   *
   * @param {ValidationError[]} errors - Array of ValidationError instances to aggregate
   *
   * @example
   * const errors = [
   *   new ValidationError(['name'], 'Name is required'),
   *   new ValidationError(['email'], 'Email is invalid')
   * ];
   * const aggregateError = new ValidationAggregateError(errors);
   * console.log(aggregateError.message);
   * // ValidationAggregateError: Validation failed with 2 error(s)
   * // - name: Name is required
   * // - email: Email is invalid
   */
  constructor(public readonly errors: ValidationError[]) {
    super(ValidationAggregateError.compile(errors));
    this.name = "ValidationAggregateError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Compiles multiple validation errors into a formatted error message string.
   *
   * Generates a multi-line error message showing the total number of errors
   * and a formatted list of each error with its path and message.
   *
   * @param {ValidationError[]} errors - Array of validation errors to compile
   * @returns {string} A formatted multi-line error message
   *
   * @example
   * const errors = [
   *   new ValidationError(['email'], 'Invalid email'),
   *   new ValidationError(['password'], 'Password too short')
   * ];
   * const message = ValidationAggregateError.compile(errors);
   * // Returns:
   * // "ValidationAggregateError: Validation failed with 2 error(s)
   * //  - email: Invalid email
   * //  - password: Password too short"
   */
  static compile(errors: ValidationError[]): string {
    return (
      `${this.name}: Validation failed with ${errors.length} error(s)\n` +
      errors.map((e) => this.prototype.compileError(e)).join("\n")
    );
  }

  /**
   * Generates a pretty-printed, stack-like tree representation of all validation errors.
   *
   * Creates a human-readable string representation showing the error name, summary,
   * and an indented list of all validation errors with their paths and messages.
   * Useful for logging and debugging complex validation failures.
   *
   * @returns {string} A formatted multi-line string with tree-like error representation
   *
   * @example
   * const error = new ValidationAggregateError([...]);
   * console.log(error.toString());
   * // ValidationAggregateError: Validation failed with 3 error(s)
   * // - user.email: Invalid email format
   * // - user.age: Must be at least 18
   * // - user.address.zipCode: Invalid ZIP code
   */
  toString(): string {
    this.message =
      `${this.name}: ${this.message}\n` +
      this.errors.map((e) => this.compileError(e)).join("\n");
    return this.message;
  }

  /**
   * Compiles a single validation error into a formatted string with indentation.
   *
   * Formats a validation error with appropriate indentation for nested structures,
   * showing the property path and error message. Used internally by toString() and
   * compile() methods to create consistent error formatting.
   *
   * @param {ValidationError} err - The validation error to format
   * @param {number} [indent=0] - The indentation level (number of 2-space indents)
   * @returns {string} A formatted error string with path and message
   * @private
   *
   * @example
   * // Internal usage only
   * const formatted = this.compileError(error, 2);
   * // Returns: "    - user.email: Invalid email format"
   */
  private compileError(err: ValidationError, indent = 0): string {
    const pad = "  ".repeat(indent);

    const path = err.path.length ? err.path.join(".") : "(root)";
    let out = `${pad}- ${path}: ${err.message}`;

    return out;
  }
}

/**
 * Error handling namespace containing validation result types and utilities.
 *
 * Provides a type-safe way to handle validation results without throwing exceptions.
 * The namespace includes the ValidationResult class which wraps validation outcomes,
 * allowing for both success and failure states with comprehensive error information.
 *
 * @namespace e
 */
export namespace e {
  /**
   * Represents the result of a validation operation in a type-safe manner.
   *
   * ValidationResult provides a discriminated union type that wraps either a successful
   * validation with data or a failed validation with detailed error information. This
   * approach allows handling validation results without throwing exceptions, enabling
   * more predictable error handling and better developer experience.
   *
   * Key features:
   * - Type-safe success/failure discrimination via the `success` property
   * - Detailed error collection with property paths
   * - Path mapping for nested validation contexts
   * - Conversion to throwable aggregate errors when needed
   * - Method chaining for error transformation
   *
   * @template T - The type of the successfully validated data
   *
   * @example
   * // Using safeParse for non-throwing validation
   * const schema = string().email();
   * const result = schema.safeParse('user@example.com');
   *
   * if (result.success) {
   *   console.log('Valid email:', result.data);
   * } else {
   *   result.errors.forEach(err => {
   *     console.error(`${err.path.join('.')}: ${err.message}`);
   *   });
   * }
   *
   * @example
   * // Pattern matching on validation results
   * const processUser = (result: ValidationResult<User>) => {
   *   return result.success
   *     ? `Created user: ${result.data.name}`
   *     : `Validation failed: ${result.errors.length} errors`;
   * };
   */
  export class ValidationResult<T> {
    /**
     * Creates a new ValidationResult instance.
     *
     * Generally, you should use the static factory methods `ok()` and `fail()`
     * instead of calling this constructor directly, as they provide better
     * type safety and clearer intent.
     *
     * @param {boolean} success - Whether the validation succeeded
     * @param {T} [data] - The validated data (present only if success is true)
     * @param {ValidationError[]} [errors=[]] - Array of validation errors (present only if success is false)
     *
     * @example
     * // Prefer using static factory methods:
     * const successResult = ValidationResult.ok(data);
     * const failureResult = ValidationResult.fail([error]);
     */
    constructor(
      public success: boolean,
      public data?: T,
      public errors: ValidationError[] = []
    ) {}

    /**
     * Creates a successful validation result containing the validated data.
     *
     * Factory method for creating a ValidationResult representing successful
     * validation. The result will have `success = true` and contain the validated
     * data with no errors.
     *
     * @template T - The type of the validated data
     * @param {T} data - The successfully validated data
     * @returns {ValidationResult<T>} A successful validation result
     *
     * @example
     * const result = ValidationResult.ok({ name: 'John', age: 30 });
     * console.log(result.success); // true
     * console.log(result.data);    // { name: 'John', age: 30 }
     * console.log(result.errors);  // []
     */
    static ok<T>(data: T): ValidationResult<T> {
      return new ValidationResult(true, data, []);
    }

    /**
     * Creates a failed validation result containing validation errors.
     *
     * Factory method for creating a ValidationResult representing failed validation.
     * The result will have `success = false`, no data, and contain an array of
     * detailed validation errors explaining what went wrong.
     *
     * @template T - The expected type (not present in the result)
     * @param {ValidationError[]} errors - Array of validation errors describing the failures
     * @returns {ValidationResult<T>} A failed validation result
     *
     * @example
     * const errors = [
     *   new ValidationError(['email'], 'Invalid email format', 'invalid_email'),
     *   new ValidationError(['age'], 'Must be at least 18', 'min')
     * ];
     * const result = ValidationResult.fail<User>(errors);
     * console.log(result.success); // false
     * console.log(result.data);    // undefined
     * console.log(result.errors);  // [ValidationError, ValidationError]
     */
    static fail<T>(errors: ValidationError[]): ValidationResult<T> {
      return new ValidationResult(
        false,
        undefined,
        errors
      ) as ValidationResult<T>;
    }

    /**
     * Transforms error paths by adding a prefix to all validation errors.
     *
     * Maps over all errors in the validation result and prepends the specified
     * path prefix to each error's path. This is essential for nested validation
     * where errors from child schemas need to be contextualized with their parent
     * property paths.
     *
     * Preserves the success state and data while creating new ValidationError
     * instances with updated paths.
     *
     * @param {(string | number)[]} pathPrefix - Array of path segments to prepend to each error's path
     * @returns {ValidationResult<T>} A new ValidationResult with transformed error paths
     *
     * @example
     * // Original error path: ['zipCode']
     * const result = ValidationResult.fail([
     *   new ValidationError(['zipCode'], 'Invalid ZIP code')
     * ]);
     *
     * // Add context that this is from the 'address' property
     * const mappedResult = result.mapErrors(['address']);
     * // New error path: ['address', 'zipCode']
     *
     * @example
     * // Useful in nested object validation
     * const userResult = addressSchema.safeParse(data.address);
     * const contextualResult = userResult.mapErrors(['user', 'address']);
     * // Errors now show full path like: user.address.street
     */
    mapErrors(pathPrefix: (string | number)[]): ValidationResult<T> {
      return new ValidationResult(
        this.success,
        this.data,
        this.errors.map(
          (err) =>
            new ValidationError(
              [...pathPrefix, ...err.path],
              err.message,
              err.code,
              err.expected,
              err.received,
              err.value
            )
        )
      );
    }

    /**
     * Converts the validation result into a throwable ValidationAggregateError.
     *
     * Transforms the validation result's error array into a single aggregate error
     * that can be thrown. This is useful when you want to convert from a non-throwing
     * safeParse pattern to the traditional throwing parse pattern.
     *
     * Typically used internally by parse() methods that throw on validation failure,
     * but can also be used by application code that needs to convert validation
     * results into exceptions.
     *
     * @returns {ValidationAggregateError} An aggregate error containing all validation errors
     *
     * @example
     * const result = schema.safeParse(data);
     * if (!result.success) {
     *   throw result.intoError();
     *   // Equivalent to using schema.parse(data) which throws automatically
     * }
     *
     * @example
     * // Used internally in parse() method
     * parse(data: unknown): T {
     *   const result = this.safeParse(data);
     *   if (!result.success) {
     *     throw result.intoError();
     *   }
     *   return result.data;
     * }
     */
    intoError(): ValidationAggregateError {
      return new ValidationAggregateError(this.errors);
    }
  }
}
