import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import {
  HTMLAttributes,
  SchemaDef,
  SchemaTypeAny,
  TypeOf,
  UnionAttributes,
} from "../types.js";

/**
 * Union schema that succeeds when at least one of the provided schemas validates the input.
 *
 * Mirrors zod's union behavior: input is parsed against each schema in order until one
 * succeeds; otherwise, all collected validation errors are returned.
 */
export class UnionSchema<
  Schemas extends readonly SchemaTypeAny[],
  D extends SchemaDef = SchemaDef
> extends SchemaType<TypeOf<Schemas[number]>, D> {
  public htmlAttributes: UnionAttributes<Schemas>;

  constructor(private readonly schemas: Schemas, def: D) {
    super(def);
    this.htmlAttributes = {
      type: "union",
      required: true,
      options: schemas,
    } as UnionAttributes<Schemas>;
  }

  validate(data: unknown): e.ValidationResult<TypeOf<Schemas[number]>> {
    const collected: ValidationError[] = [];

    for (const schema of this.schemas) {
      const result = schema.validate(data);
      if (result.success) {
        return e.ValidationResult.ok(result.data as TypeOf<Schemas[number]>);
      }
      collected.push(...result.errors);
    }

    if (collected.length === 0) {
      collected.push(
        new ValidationError(
          [],
          "Invalid union input",
          "invalid_union",
          undefined,
          data,
          data
        )
      );
    }

    return e.ValidationResult.fail(collected);
  }
}
