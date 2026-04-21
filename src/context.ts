import { ValidationError } from "./error.js";
import { SchemaTypeAny, FieldCondition, DependencyRule } from "./types.js";
import { getRuleKey, LeafKey } from "./dependency-util.js";

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
 * Represents a dependency that failed evaluation.
 *
 * Tracks information about a leaf {@link FieldCondition} that was not satisfied,
 * including which condition failed and why.
 */
export interface FailedDependency {
  /** The leaf condition that failed */
  condition: FieldCondition;
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
 *  { user: { name: 'John', role: 'admin' } },
 *  []
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
 *  { field: 'userType', condition: /^business$/ }
 * );
 */
export class ValidationContext<
  S extends SchemaTypeAny = SchemaTypeAny,
  Input extends S["_input"] = S["_input"],
> {
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
  constructor(
    private data: Input,
    private path: FieldPath = [],
  ) {}

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
      value = (value as Record<string, unknown>)[segment];
    }
    return value;
  }

  private static readonly NUMERIC_SEGMENT = /^\d+$/;

  private toPathSegment(segment: string): string | number {
    if (ValidationContext.NUMERIC_SEGMENT.test(segment)) {
      return Number(segment);
    }
    return segment;
  }

  private parseRootPath(fieldPath: string): FieldPath {
    return fieldPath
      .split(".")
      .filter(Boolean)
      .map((s) => this.toPathSegment(s));
  }

  /**
   * Resolves a dependency path to an absolute FieldPath.
   *
   * - Root path: `a.b.c` — resolved from the data root.
   * - `^.x` — sibling of the current field (same containing object).
   * - `^.^.x` — one level above the containing object.
   * - `^.^.^.x` — two levels above, and so on.
   *
   * Each `^` token pops one level from the current field path, so the first
   * `^` strips the field name itself (reaching sibling scope) and each
   * subsequent `^` moves one level further up.
   */
  private resolveDependencyPath(fieldPath: string): FieldPath {
    if (!fieldPath.startsWith("^.")) {
      return this.parseRootPath(fieldPath);
    }

    const basePath: FieldPath = [...this.path];

    const tokens = fieldPath.split(".").filter(Boolean);
    let idx = 0;
    while (idx < tokens.length && tokens[idx] === "^") {
      basePath.pop();
      idx++;
    }

    for (let i = idx; i < tokens.length; i++) {
      if (tokens[i] === "^") {
        throw new Error(
          `Invalid dependency path "${fieldPath}": control characters (^) must only appear as a leading prefix.`,
        );
      }
    }

    for (; idx < tokens.length; idx++) {
      basePath.push(this.toPathSegment(tokens[idx]));
    }

    return basePath;
  }

  /**
   * Gets a dependency value using either root or relative path syntax.
   *
   * @example
   * // Root path
   * context.getDependencyValue('user.role');
   *
   * @example
   * // Relative from current field path
   * context.getDependencyValue('^.type');
   */
  getDependencyValue(fieldPath: string): unknown {
    const resolvedPath = this.resolveDependencyPath(fieldPath);
    return this.getValueAtPath(resolvedPath);
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
   * Evaluates whether a single leaf operator rule is satisfied.
   *
   * Kept as a public API for consumers that want to check a leaf directly.
   *
   * @param rule - A leaf {@link FieldCondition} (rule with a single operator key)
   * @returns true if the leaf rule is satisfied
   */
  isDependencySatisfied(rule: FieldCondition): boolean {
    const key = getRuleKey(rule as DependencyRule) as LeafKey;
    return this.evaluateLeaf(rule as DependencyRule, key);
  }

  /**
   * Recursively evaluates a {@link DependencyRule}:
   * - Leaf operator — tests the field value via {@link evaluateLeaf}
   * - `and` — every sub-rule must pass
   * - `or` — at least one sub-rule must pass
   * - `not` — sub-rule must NOT pass
   */
  private evaluateRule(rule: DependencyRule): boolean {
    const key = getRuleKey(rule);

    if (key === "and") {
      return (rule as { and: DependencyRule[] }).and.every((r) =>
        this.evaluateRule(r),
      );
    }
    if (key === "or") {
      return (rule as { or: DependencyRule[] }).or.some((r) =>
        this.evaluateRule(r),
      );
    }
    if (key === "not") {
      const snapshot = [...this.failedDependencies];
      const inner = this.evaluateRule(
        (rule as { not: DependencyRule }).not,
      );
      this.failedDependencies = snapshot;
      return !inner;
    }

    return this.evaluateLeaf(rule, key);
  }

  private evaluateLeaf(rule: DependencyRule, key: LeafKey): boolean {
    const payload = (rule as unknown as Record<LeafKey, { field: string; value?: unknown }>)[key];
    const v = this.getDependencyValue(payload.field);
    const value = payload.value;

    let ok: boolean;
    switch (key) {
      case "eq":
        ok = v === value;
        break;
      case "ne":
        ok = v !== value;
        break;
      case "lt":
        ok = typeof v === "number" && v < (value as number);
        break;
      case "gt":
        ok = typeof v === "number" && v > (value as number);
        break;
      case "lte":
        ok = typeof v === "number" && v <= (value as number);
        break;
      case "gte":
        ok = typeof v === "number" && v >= (value as number);
        break;
      case "in":
        ok =
          v !== null &&
          v !== undefined &&
          (value as readonly unknown[]).includes(v);
        break;
      case "notIn":
        ok =
          v !== null &&
          v !== undefined &&
          !(value as readonly unknown[]).includes(v);
        break;
      case "contains":
        ok = typeof v === "string" && v.includes(value as string);
        break;
      case "startsWith":
        ok = typeof v === "string" && v.startsWith(value as string);
        break;
      case "endsWith":
        ok = typeof v === "string" && v.endsWith(value as string);
        break;
      case "exists":
        ok = v !== null && v !== undefined;
        break;
      case "notEmpty": {
        if (v === null || v === undefined) {
          ok = false;
          break;
        }
        if (typeof v === "string") {
          ok = v.length > 0;
          break;
        }
        if (Array.isArray(v)) {
          ok = v.length > 0;
          break;
        }
        if (typeof v === "object") {
          ok = Object.keys(v as object).length > 0;
          break;
        }
        ok = true;
        break;
      }
      case "truthy":
        ok = Boolean(v);
        break;
      case "falsy":
        ok = !v;
        break;
      case "pattern": {
        if (v === null || v === undefined) {
          ok = false;
          break;
        }
        const re =
          typeof value === "string" ? new RegExp(value) : (value as RegExp);
        ok = re.test(String(v));
        break;
      }
      default: {
        const _exhaustive: never = key;
        void _exhaustive;
        ok = false;
      }
    }

    if (!ok) {
      this.failedDependencies.push({
        condition: rule as FieldCondition,
        actualValue: v,
        isRequired: true,
      });
    }
    return ok;
  }

  /**
   * Returns `true` when the given {@link DependencyRule} is satisfied, meaning
   * the dependent field should be validated and required.
   */
  isFieldRequired(rule: DependencyRule): boolean {
    return this.evaluateRule(rule);
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
   *  context.getPath(),
   *  'Invalid email format',
   *  'invalid_email'
   * );
   * context.addError(error);
   */
  addError(error: ValidationError): void {
    this.errors.push(error);
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
 *  maxErrors: 10,
 *  stopOnFirstError: false
 * });
 */
export function createValidationContext<
  S extends SchemaTypeAny = SchemaTypeAny,
  T extends S["_input"] = S["_input"],
>(data: T, options?: ValidationContextOptions): ValidationContext<S, T> {
  return new ValidationContext(data);
}

export interface IRefinementContext<S extends SchemaTypeAny> {
  readonly data: S["_output"];
  addIssue: (error: {
    message: string;
    code: string;
    expected?: unknown;
    received?: unknown;
    path?: string[] | number[];
    value?: S["_output"];
  }) => void;
}
export class RefinementContext<
  S extends SchemaTypeAny,
> implements IRefinementContext<S> {
  constructor(private ctx: ValidationContext<S>) {}

  get data(): S["_output"] {
    return this.ctx.getCurrentValue() as S["_output"];
  }
  public addIssue(error: {
    message: string;
    code: string;
    expected?: unknown;
    received?: unknown;
    path?: string[] | number[];
    value?: S["_output"];
  }): void {
    this.ctx.addError(
      new ValidationError(
        [...this.ctx.getPath(), ...(error.path ?? [])],
        error.message,
        error.code,
        error.expected,
        error.received,
        error.value || this.ctx.getCurrentValue(),
      ),
    );
  }
}
