import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HtmlNumberInputAttributes } from "../types";

export class NumberSchema extends SchemaType<number> {
  public htmlAttributes: HtmlNumberInputAttributes = {
    type: "number",
    defaultValue: 0,
    required: true,
  };

  validate(data: unknown): e.ValidationResult<number> {
    const errors: ValidationError[] = [];
    if (typeof data !== "number" || isNaN(data)) {
      errors.push(
        new ValidationError(
          [],
          "Invalid number",
          "invalid_type",
          "number",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<number>(errors);
    }

    if (data < (this.htmlAttributes.min ?? -Infinity)) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("min") ||
            `Number must be greater than or equal to ${this.htmlAttributes.min}`,
          "too_small",
          "number",
          "number",
          data
        )
      );
    }

    if (data > (this.htmlAttributes.max ?? Infinity)) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("max") ||
            `Number must be less than or equal to ${this.htmlAttributes.max}`,
          "too_big",
          "number",
          "number",
          data
        )
      );
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<number>(errors);
    }
    return e.ValidationResult.ok<number>(data);
  }

  min(
    value: number,
    message: string = `Number must be greater than or equal to ${value}`
  ): this {
    this.errorMap.set("min", message);
    this.htmlAttributes = { ...this.htmlAttributes, min: value };
    return this;
  }

  max(
    value: number,
    message: string = `Number must be less than or equal to ${value}`
  ): this {
    this.errorMap.set("max", message);
    this.htmlAttributes = { ...this.htmlAttributes, max: value };
    return this;
  }
}
