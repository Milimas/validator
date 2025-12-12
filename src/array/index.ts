import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HtmlArrayType, HTMLAttributes, SchemaTypeAny, TypeOf } from "../types";

export class ArraySchema<T extends SchemaTypeAny> extends SchemaType<
  TypeOf<T>[]
> {
  public htmlAttributes: HtmlArrayType<HTMLAttributes> = {
    type: "array",
    items: [],
  };
  constructor(private itemSchema: T) {
    super({});
  }

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

  toJSON(): HtmlArrayType<HTMLAttributes> {
    const json: HtmlArrayType<HTMLAttributes> = {
      ...this.htmlAttributes,
      type: "array",
      items: [this.itemSchema.toJSON()],
    };
    return json;
  }
}
