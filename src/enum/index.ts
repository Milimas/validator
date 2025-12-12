import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HtmlSelectAttributes } from "../types";

export class EnumSchema<
  T extends readonly [string, ...string[]]
> extends SchemaType<T[number]> {
  private valuesSet: Set<string>;
  public htmlAttributes: HtmlSelectAttributes<T[number]> = {
    type: "select",
    options: [],
    required: true,
  };

  constructor(private values: T) {
    super({});
    this.valuesSet = new Set(values);
    this.htmlAttributes.options = values;
  }

  validate(data: unknown): e.ValidationResult<T[number]> {
    const errors: ValidationError[] = [];
    if (typeof data !== "string" || !this.valuesSet.has(data)) {
      errors.push(
        new ValidationError(
          [],
          "Invalid enum value",
          "invalid_enum_value",
          this.values,
          data,
          data
        )
      );
      return e.ValidationResult.fail<T[number]>(errors);
    }

    return e.ValidationResult.ok<T[number]>(data);
  }
}
