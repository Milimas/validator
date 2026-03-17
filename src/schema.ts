import {
  createValidationContext,
  RefinementContext,
  ValidationContext,
} from "./context.js";
import { e, ValidationError } from "./error.js";
import {
  Condition,
  AnyDef,
  NeverDef,
  UnknownDef,
  RefinementCheck,
  SchemaTypeAny,
  JsonSchemaFormat,
} from "./types.js";
import { DeepReplace } from "./util.js";

export abstract class SchemaType<Output = any, Input = Output> {
  public abstract _def: AnyDef;

  protected errorMap: Map<string, string> = new Map();

  protected checks: RefinementCheck<any>[] = [];

  readonly _output!: Output;

  readonly _input!: Input;

  public description?: string;

  protected abstract validate(
    data: this["_input"] | unknown,
    ctx: ValidationContext,
  ): e.ValidationResult<Output>;

  #validateWithRefinements(
    data: this["_input"] | unknown,
    ctx: ValidationContext,
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
            refinement.message() || "Refine validation failed",
            refinement.code || "refine_validation_failed",
            refinement.expected,
            refinement.received,
            result.data,
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

  parse(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"],
    ),
  ): Output {
    const result = this.#validateWithRefinements(data, ctx);
    if (!result.success) {
      throw result.intoError();
    }

    return result.data as Output;
  }

  safeParse(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"],
    ),
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

  optional(): OptionalSchema<this> {
    this._def = { ...this._def, required: false };
    return new OptionalSchema(this);
  }

  nullable(): NullableSchema<this> {
    return new NullableSchema(this);
  }

  default(value: this["_input"]): DefaultSchema<this> {
    return new DefaultSchema(this, value);
  }

  dependsOn(conditions: [Condition, ...Condition[]]): DependsOnSchema<this> {
    return new DependsOnSchema(this, conditions);
  }

  required(
    required: boolean = true,
    message: string = "This field is required",
  ): this {
    this.errorMap.set("required", message);
    this._def = { ...this._def, required };
    return this;
  }

  metadata(metadata: Record<string, unknown>): this {
    this._def = { ...this._def, metadata };
    return this;
  }

  readOnly(message: string = "String is read-only"): this {
    this.errorMap.set("readOnly", message);
    this._def = { ...this._def, readOnly: true };
    return this;
  }

  refine(
    check: (value: Output) => boolean,
    params: {
      message?: string;
      code?: string;
      expected?: unknown;
      received?: unknown;
      immediate?: boolean;
    },
  ): this {
    const { message, code, expected, received, immediate } = params;
    this.checks.push({
      type: "refine",
      check,
      immediate: immediate || false,
      message: () => message || "Refine validation failed",
      code,
      expected,
      received,
    });
    return this;
  }

  superRefine(
    check: (value: Output, ctx: RefinementContext<this>) => void,
  ): this {
    this.checks.push({
      type: "superRefine",
      check,
    });
    return this;
  }

  abstract toJSON(): this["_def"];
  abstract toLangchainJSON(): JsonSchemaFormat;

  // toLangchainJSON(): JsonSchemaFormat {
  //   const jsonSchemaFormat: JsonSchemaFormat = {
  //     type: "string",
  //     description: this.description || undefined,
  //   };

  //   if (this.toLangchainJSON) return this.toLangchainJSON();

  //   if (this._def.properties) {
  //     jsonSchemaFormat.properties ??= {};
  //     for (const [key, value] of Object.entries(this._def.properties) as [
  //       string,
  //       SchemaTypeAny,
  //     ][]) {
  //       jsonSchemaFormat.properties[key] = value.toLangchainJSON();
  //     }
  //   }

  //   switch (this._def.type) {
  //     case "number":
  //       jsonSchemaFormat.type = "number";
  //       break;
  //     case "checkbox":
  //     case "radio":
  //       jsonSchemaFormat.type = "boolean";
  //       break;
  //     case "select":
  //       jsonSchemaFormat.type = "string";
  //       break;
  //     case "array":
  //       jsonSchemaFormat.type = "array";
  //       break;
  //     case "object":
  //     case "record":
  //       jsonSchemaFormat.type = "object";
  //       break;
  //     default:
  //       jsonSchemaFormat.type = "string";
  //   }
  //   return jsonSchemaFormat;
  // }

  describe(description: string): this {
    this.description = description;
    this._def = { ...this._def, description };
    return this;
  }
}

export class OptionalSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | undefined,
  T["_input"] | undefined
> {
  constructor(private inner: T) {
    super();
    this._def = { ...inner._def, required: false };
    this.description = `Optional ${
      inner.description || inner.constructor.name
    }`;
  }

  public _def: T["_def"];

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"] | undefined> {
    if (data === undefined || data === null) {
      return e.ValidationResult.ok<undefined>(data as undefined);
    }
    return this.inner.safeParse(data, ctx);
  }

  parse(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): T["_output"] | undefined {
    if (data === undefined || data === null) {
      if (this._def.defaultValue !== undefined)
        return this._def.defaultValue as T["_output"];
      return undefined as T["_output"] | undefined;
    }
    return this.inner.parse(data, ctx);
  }

  safeParse(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"] | undefined> {
    if (data === undefined || data === null) {
      return e.ValidationResult.ok<undefined>(data as undefined);
    }
    return this.inner.safeParse(data, ctx);
  }

  toLangchainJSON(): JsonSchemaFormat {
    const baseFormat = this.inner.toLangchainJSON();
    return {
      ...baseFormat,
      description: this.description || baseFormat.description,
    };
  }

  toJSON() {
    return this.inner.toJSON();
  }
}

export class NullableSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | null,
  T["_input"] | null
> {
  constructor(private inner: T) {
    super();
    this._def = {
      ...inner._def,
    };
    this.inner._def = this._def; // Ensure inner schema's _def is consistent with nullable wrapper
    this.description = `Nullable ${
      inner.description || inner.constructor.name
    }`;
  }

  public _def: T["_def"];

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"] | null> {
    if (data === null) {
      return e.ValidationResult.ok<null>(null);
    }
    return this.inner.safeParse(data, ctx);
  }

  parse(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): T["_output"] | null {
    if (data === null) {
      return null as T["_output"] | null;
    }
    return this.inner.parse(data, ctx);
  }

  safeParse(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"] | null> {
    if (data === null) {
      return e.ValidationResult.ok<null>(null);
    }
    return this.inner.safeParse(data, ctx);
  }

  toJSON(): ReturnType<typeof this.inner.toJSON> {
    return this.inner.toJSON();
  }

  toLangchainJSON(): JsonSchemaFormat {
    const baseFormat = this.inner.toLangchainJSON();
    return {
      ...baseFormat,
      description: this.description || baseFormat.description,
    };
  }
}

export class DefaultSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"],
  T["_input"]
> {
  public _def: T["_def"];

  constructor(
    private inner: T,
    private defaultValue: T["_def"]["defaultValue"],
  ) {
    super();
    this._def = {
      ...inner._def,
      defaultValue: defaultValue,
    };
    this.inner._def = this._def; // Ensure inner schema's _def is updated with the default value
    this.description = `Default ${inner.description || inner.constructor.name}`;
  }

  protected validate(
    data: this["_input"] | unknown = this.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"]> {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.safeParse(data, ctx);
  }

  parse(
    data: this["_input"] | unknown = this.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): T["_output"] {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.parse(data, ctx);
  }

  safeParse(
    data: this["_input"] | unknown = this.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<T["_output"]> {
    if (data === undefined || data === null) {
      data = this.defaultValue;
    }
    return this.inner.safeParse(data, ctx);
  }

  toJSON(): ReturnType<typeof this.inner.toJSON> {
    return this.inner.toJSON();
  }

  toLangchainJSON(): JsonSchemaFormat {
    const baseFormat = this.inner.toLangchainJSON();
    return {
      ...baseFormat,
      description: this.description || baseFormat.description,
    };
  }
}

export class DependsOnSchema<T extends SchemaTypeAny> extends SchemaType<
  T["_output"] | undefined,
  T["_input"] | undefined
> {
  constructor(
    private inner: T,
    public _dependsOn: [Condition, ...Condition[]],
  ) {
    super();
    this._def = {
      ...inner._def,
      "data-depends-on": this._dependsOn.map((cond) => ({
        field: cond.field,
        condition:
          typeof cond.condition === "string"
            ? cond.condition
            : cond.condition.source,
      })),
    };
    this.inner._def = this._def; // Ensure inner schema's _def is consistent with dependsOn wrapper
    this.description = `Conditionally Required ${
      inner.description || inner.constructor.name
    }`;
  }

  public _def: T["_def"];

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<this["_output"]> {
    if ((data === undefined || data === null) && !this._def.required) {
      // Not required and no data: skip validation and return undefined
      return e.ValidationResult.ok<undefined>(undefined);
    }
    const isFieldRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isFieldRequired) {
      // When dependency conditions are not satisfied, skip validation entirely
      // and treat the field as not applicable.
      return e.ValidationResult.ok<undefined>(undefined);
    }

    // When dependency is satisfied, check if value is missing and add required error
    if (data === undefined || data === null) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required",
        ),
      );
      return e.ValidationResult.fail<this["_output"]>(ctx.getErrors());
    }

    return this.inner.safeParse(data, ctx);
  }

  parse(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): this["_output"] {
    if ((data === undefined || data === null) && !this._def.required) {
      // Not required and no data: skip validation and return undefined
      return undefined as this["_output"];
    }

    const isFieldRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isFieldRequired) {
      // Not required: ignore value and return undefined
      return undefined;
    }

    // When dependency is satisfied, check if value is missing and throw required error
    if (data === undefined || data === null) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required",
        ),
      );
      throw e.ValidationResult.fail<this["_output"]>(
        ctx.getErrors(),
      ).intoError();
    }

    return this.inner.parse(data as T["_input"], ctx);
  }

  safeParse(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<this["_output"]> {
    if ((data === undefined || data === null) && !this._def.required) {
      // Not required and no data: skip validation and return undefined
      return e.ValidationResult.ok<undefined>(undefined);
    }
    const isFieldRequired = ctx.isFieldRequired(this._dependsOn);

    if (!isFieldRequired) {
      return e.ValidationResult.ok<undefined>(undefined);
    }

    // When dependency is satisfied, check if value is missing and add required error
    if (data === undefined || data === null) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          this.errorMap.get("required") || "This field is required",
          "required",
        ),
      );
      return e.ValidationResult.fail<this["_output"]>(ctx.getErrors());
    }

    return this.inner.safeParse(data, ctx);
  }

  toJSON(): ReturnType<typeof this.inner.toJSON> {
    return this.inner.toJSON();
  }

  toLangchainJSON(): JsonSchemaFormat {
    const baseFormat = this.inner.toLangchainJSON();
    return {
      ...baseFormat,
      description: this.description || baseFormat.description,
    };
  }
}

export class AnySchema extends SchemaType<any> {
  public _def: AnyDef = {
    type: "any",
    defaultValue: undefined,
    required: true,
  };

  public description?: string | undefined = "Anything";

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<any> {
    return e.ValidationResult.ok<any>(data);
  }

  toJSON() {
    return this._def;
  }

  toLangchainJSON(): JsonSchemaFormat {
    const jsonSchemaFormat: JsonSchemaFormat = {
      type: "string",
      description: this.description || undefined,
    };
    return jsonSchemaFormat;
  }
}

export class NeverSchema extends SchemaType<never, any> {
  public _def: NeverDef = {
    type: "never",
    required: true,
  };

  public description?: string | undefined = "Never Valid";

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,
    ctx: ValidationContext<this> = createValidationContext<this>(
      data as this["_input"],
    ),
  ): e.ValidationResult<never> {
    ctx.addError(
      new ValidationError(
        [...ctx.getPath()],
        "Value is not allowed",
        "never_valid",
        "never",
        typeof data,
        data,
      ),
    );
    return e.ValidationResult.fail<never>(ctx.getErrors());
  }

  toJSON() {
    return this._def;
  }

  toLangchainJSON(): JsonSchemaFormat {
    const jsonSchemaFormat: JsonSchemaFormat = {
      type: "string",
      description: this.description || undefined,
    };
    return jsonSchemaFormat;
  }
}

export class UnknownSchema extends SchemaType<unknown> {
  public _def: UnknownDef = {
    type: "unknown",
    defaultValue: undefined,
    required: true,
  };

  public description?: string | undefined = "Unknown Type";

  protected validate(
    data: this["_input"] | unknown = this._def.defaultValue,

    ctx: ValidationContext<this> = createValidationContext<this>(data),
  ): e.ValidationResult<unknown> {
    return e.ValidationResult.ok<unknown>(data);
  }

  toJSON() {
    return this._def;
  }

  toLangchainJSON(): JsonSchemaFormat {
    const jsonSchemaFormat: JsonSchemaFormat = {
      type: "string",
      description: this.description || undefined,
    };
    return jsonSchemaFormat;
  }
}
