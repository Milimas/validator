import { ValidationError } from "./error.js";
import { Condition } from "./types.js";

/**
 * Represents the path to a field in a nested data structure.
 * Path segments are strings (object keys) or numbers (array indices).
 *
 * @example
 * const path: FieldPath = ['user', 'address', 'zipCode'];
 * const path: FieldPath = ['items', 0, 'name'];
 */
export type FieldPath = (string | number)[];

/**
 * Represents a single dependency condition for conditional field validation.
 *
 * Specifies that a field depends on another field matching a particular pattern.
 * Used to determine if a field should be required based on other field values.
 */
export interface DependencyCondition {
  /** The field name that this field depends on */
  field: string;
  /** RegExp pattern that must match the dependency field's value */
  condition: RegExp;
}

/**
 * Represents a dependency that failed evaluation.
 *
 * Tracks information about a dependency condition that was not satisfied,
 * including which condition failed and why.
 */
export interface FailedDependency {
  /** The dependency condition that failed */
  condition: DependencyCondition;
  /** The actual value of the dependency field */
  actualValue: unknown;
  /** Whether the field is required based on this failed condition */
  isRequired: boolean;
}

/**
 * Parsing context that holds state during validation of a data structure.
 *
 * The context maintains:
 * - The current field path (for nested structures)
 * - The complete root data being validated
 * - Accumulated validation errors
 * - Information about dependency conditions
 *
 * This allows schemas to:
 * - Track their location in nested data structures
 * - Access sibling/parent fields to evaluate dependencies
 * - Report errors with precise paths
 * - Handle conditional field requirements based on other field values
 *
 * @example
 * // Creating a parsing context for object validation
 * const context = new ValidationContext(
 *   { user: { name: 'John', role: 'admin' } },
 *   []
 * );
 *
 * @example
 * // Pushing a field path for nested validation
 * const nestedContext = context.push('user');
 * nestedContext.path; // ['user']
 *
 * @example
 * // Checking if a dependency is satisfied
 * const isSatisfied = context.isDependencySatisfied(
 *   { field: 'userType', condition: /^business$/ }
 * );
 */
export class ValidationContext {
  /**
   * Accumulated validation errors collected during parsing.
   * Will be reported at the end of validation.
   */
  private errors: ValidationError[] = [];

  /**
   * Failed dependency conditions, tracked for debugging and error reporting.
   */
  private failedDependencies: FailedDependency[] = [];

  /**
   * Creates a new ValidationContext for parsing a data structure.
   *
   * @param data - The complete root data being validated
   * @param path - The current path in the data structure (empty for root)
   */
  constructor(private data: unknown, private path: FieldPath = []) {}

  /**
   * Gets the current field path.
   *
   * Represents the location of the current validation in nested data structures.
   * Empty array means validation is at the root level.
   *
   * @returns The current field path
   */
  getPath(): FieldPath {
    return [...this.path];
  }

  /**
   * Gets the complete root data being validated.
   *
   * @returns The root data object/array
   */
  getRootData(): unknown {
    return this.data;
  }

  /**
   * Gets the current value at the context's path in the root data.
   *
   * @returns The value at the current path, or undefined if not found
   */
  getCurrentValue(): unknown {
    return this.getValueAtPathInternal(this.data, this.path);
  }

  /**
   * Gets a value at a specific path from the root data.
   *
   * Traverses the root data structure to find the value at the given path.
   * Returns undefined if the path doesn't exist.
   *
   * @param path - The field path to retrieve
   * @returns The value at the path, or undefined
   *
   * @example
   * const context = new ValidationContext({ user: { name: 'John' } });
   * context.getValueAtPath(['user', 'name']); // 'John'
   * context.getValueAtPath(['user', 'age']); // undefined
   */
  getValueAtPath(path: FieldPath): unknown {
    return this.getValueAtPathInternal(this.data, path);
  }

  /**
   * Internal helper to recursively get a value at a path.
   *
   * @private
   */
  private getValueAtPathInternal(current: unknown, path: FieldPath): unknown {
    let value = current;
    for (const segment of path) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = (value as any)[segment];
    }
    return value;
  }

  /**
   * Gets the value of a sibling field at the same nesting level.
   *
   * Useful for evaluating dependencies on adjacent fields.
   *
   * @param fieldName - The name of the sibling field
   * @returns The value of the sibling field, or undefined
   *
   * @example
   * // In context at path ['user', 'phone']
   * context.getSiblingValue('email'); // Gets value at ['user', 'email']
   */
  getSiblingValue(fieldName: string): unknown {
    const siblingPath = [...this.path.slice(0, -1), fieldName];
    return this.getValueAtPath(siblingPath);
  }

  /**
   * Gets the value of a parent field in a nested structure.
   *
   * @param levels - How many levels up to go (default: 1)
   * @returns The parent data at that level, or undefined
   *
   * @example
   * // In context at path ['user', 'address', 'zipCode']
   * context.getParentValue(); // Gets value at ['user', 'address']
   * context.getParentValue(2); // Gets value at ['user']
   */
  getParentValue(levels: number = 1): unknown {
    const parentPath = this.path.slice(0, -levels);
    return this.getValueAtPath(parentPath);
  }

  /**
   * Creates a child context for nested validation.
   *
   * Used when validating nested objects or array items to maintain
   * the correct path and error tracking.
   *
   * @param fieldName - The name/index of the nested field
   * @returns A new ValidationContext with extended path
   *
   * @example
   * const context = new ValidationContext(data);
   * const userContext = context.child('user');
   * userContext.getPath(); // ['user']
   */
  child(fieldName: string | number): ValidationContext {
    return new ValidationContext(this.data, [...this.path, fieldName]);
  }

  /**
   * Evaluates whether a dependency condition is satisfied.
   *
   * Checks if the field referenced by the condition matches the condition's pattern.
   * Used to determine if a field is conditionally required.
   *
   * @param condition - The dependency condition to check
   * @returns true if the condition is satisfied, false otherwise
   *
   * @example
   * // Checking if taxId is required based on accountType
   * const isSatisfied = context.isDependencySatisfied({
   *   field: 'accountType',
   *   condition: /^business$/
   * });
   */
  isDependencySatisfied(condition: DependencyCondition): boolean {
    const fieldValue = this.getSiblingValue(condition.field);
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    const stringValue = String(fieldValue);
    const isSatisfied = condition.condition.test(stringValue);

    // Track failed dependencies for error reporting
    if (!isSatisfied) {
      this.failedDependencies.push({
        condition,
        actualValue: fieldValue,
        isRequired: true,
      });
    }

    return isSatisfied;
  }

  /**
   * Evaluates whether a field should be required based on its dependency conditions.
   *
   * A field is required if ANY of its dependency conditions are satisfied
   * (OR logic for dependencies).
   *
   * @param conditions - Array of dependency conditions
   * @returns true if the field is required, false if all conditions failed
   *
   * @example
   * const conditions = [
   *   { field: 'userType', condition: /^business$/ }
   * ];
   * context.isFieldRequired(conditions); // true or false
   */
  isFieldRequired(conditions: DependencyCondition[]): boolean {
    return conditions.some((condition) =>
      this.isDependencySatisfied(condition)
    );
  }

  /**
   * Adds a validation error to the context.
   *
   * Errors are accumulated during validation and reported together
   * at the end. The field path is automatically attached to the error.
   *
   * @param error - The validation error to add
   *
   * @example
   * const error = new ValidationError(
   *   context.getPath(),
   *   'Invalid email format',
   *   'invalid_email'
   * );
   * context.addError(error);
   */
  addError(error: ValidationError): void {
    this.errors.unshift(error);
  }

  /**
   * Adds multiple validation errors to the context.
   *
   * @param errors - Array of validation errors to add
   */
  addErrors(errors: ValidationError[]): void {
    this.errors.push(...errors);
  }

  /**
   * Gets all accumulated validation errors.
   *
   * @returns Array of validation errors collected so far
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Checks if there are any accumulated errors.
   *
   * @returns true if there are errors, false otherwise
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Clears all accumulated errors.
   *
   * Useful when retrying validation or isolating error contexts.
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Gets information about failed dependency conditions.
   *
   * Useful for debugging and providing more detailed error messages
   * about why conditional fields were required.
   *
   * @returns Array of failed dependency information
   */
  getFailedDependencies(): FailedDependency[] {
    return [...this.failedDependencies];
  }

  /**
   * Clears failed dependency tracking.
   *
   * Useful when resetting context state between validations.
   */
  clearFailedDependencies(): void {
    this.failedDependencies = [];
  }

  /**
   * Creates a snapshot of the current context state.
   *
   * Useful for check pointing before attempting risky operations
   * that might accumulate errors.
   *
   * @returns A snapshot of the current state
   */
  snapshot(): ValidationContextSnapshot {
    return {
      path: [...this.path],
      errors: [...this.errors],
      failedDependencies: [...this.failedDependencies],
    };
  }

  /**
   * Restores the context to a previous snapshot state.
   *
   * @param snapshot - The snapshot to restore
   */
  restore(snapshot: ValidationContextSnapshot): void {
    this.path = [...snapshot.path];
    this.errors = [...snapshot.errors];
    this.failedDependencies = [...snapshot.failedDependencies];
  }
}

/**
 * Represents a snapshot of ValidationContext state at a point in time.
 *
 * Used for check pointing context state before attempting operations
 * that might accumulate errors or change the path.
 */
export interface ValidationContextSnapshot {
  /** The field path at the time of snapshot */
  path: FieldPath;
  /** The accumulated errors at the time of snapshot */
  errors: ValidationError[];
  /** The failed dependencies at the time of snapshot */
  failedDependencies: FailedDependency[];
}

/**
 * Configuration options for validation context creation.
 *
 * Allows customizing how the validation context behaves.
 */
export interface ValidationContextOptions {
  /** Whether to stop validation on first error (default: false) */
  stopOnFirstError?: boolean;
  /** Maximum number of errors to collect (default: Infinity) */
  maxErrors?: number;
  /** Whether to track failed dependencies (default: true) */
  trackDependencies?: boolean;
}

/**
 * Factory function to create a new ValidationContext with optional configuration.
 *
 * @param data - The root data to validate
 * @param options - Configuration options for the context
 * @returns A new ValidationContext instance
 *
 * @example
 * const context = createValidationContext(userData, {
 *   maxErrors: 10,
 *   stopOnFirstError: false
 * });
 */
export function createValidationContext(
  data: unknown,
  options?: ValidationContextOptions
): ValidationContext {
  return new ValidationContext(data);
}
