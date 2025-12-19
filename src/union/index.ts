import { ValidationContext } from "../context.js";
import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import { SchemaTypeAny, TypeOf, UnionAttributes } from "../types.js";

/**
 * Union schema for validating data against multiple possible schemas.
 *
 * UnionSchema allows data to be validated against a set of different schemas,
 * passing validation if it conforms to at least one of them. This is useful for
 * scenarios where input data can take multiple valid forms or types.
 *
 * Key features:
 * - Flexible validation against multiple schema types
 * - Comprehensive error reporting from all attempted schemas
 * - TypeScript type inference for union types
 * - Automatic HTML form attribute generation from constituent schemas
 *
 * @template Schemas - A tuple of SchemaType instances representing the possible valid schemas
 *
 * @example
 * // Union of string and number schemas
 * const schema = new UnionSchema([new StringSchema().minLength(3), new NumberSchema().min(0)]);
 *
 * const result1 = schema.validate('hello');
 * if (result1.success) {
 *  console.log(result1.data); // 'hello'
 * }
 *
 * const result2 = schema.validate(42);
 * if (result2.success) {
 *  console.log(result2.data); // 42
 * }
 *
 * const result3 = schema.validate(true);
 * if (!result3.success) {
 *  console.log(result3.errors); // Detailed errors from both StringSchema and NumberSchema
 * }
 */
export class UnionSchema<
  Schemas extends readonly SchemaTypeAny[]
> extends SchemaType<TypeOf<Schemas[number]>> {
  public htmlAttributes: UnionAttributes;

  constructor(private readonly schemas: Schemas) {
    super();
    this.htmlAttributes = {
      type: "union",
      required: true,
      anyOf: schemas.map((s) => s.htmlAttributes),
    };
  }

  protected validate(
    data: this["_input"] | unknown = this.htmlAttributes.defaultValue,

    ctx: ValidationContext<this>
  ): e.ValidationResult<TypeOf<Schemas[number]>> {
    const branchErrors: ValidationError[] = [];

    for (const schema of this.schemas) {
      // Use an isolated branch context so errors from failed branches
      // do not pollute the main context when another branch succeeds.
      const branchCtx = new ValidationContext(ctx.getRootData(), ctx.getPath());
      const result = schema.safeParse(data, branchCtx);
      if (result.success) {
        return e.ValidationResult.ok(result.data as TypeOf<Schemas[number]>);
      }
      branchErrors.push(...branchCtx.getErrors());
    }

    if (branchErrors.length === 0) {
      ctx.addError(
        new ValidationError(
          ctx.getPath(),
          "Invalid union input",
          "invalid_union",
          undefined,
          data,
          data
        )
      );
    } else {
      ctx.addErrors(branchErrors);
    }

    return e.ValidationResult.fail(ctx.getErrors());
  }

  toJSON() {
    return {
      type: "union" as const,
      required: this.htmlAttributes.required,
      anyOf: this.schemas.map((s) => s.toJSON()),
    };
  }
}
