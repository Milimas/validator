import { ArraySchema } from "../array/index.js";
import { BooleanSchema } from "../boolean/index.js";
import { NumberSchema } from "../number/index.js";
import { RecordSchema } from "../record/index.js";
import { UnknownSchema } from "../schema.js";
import { StringSchema } from "../string/index.js";
import { UnionSchema } from "../union/index.js";

export class JSONSchema extends UnionSchema<
  [
    StringSchema,
    NumberSchema,
    BooleanSchema,
    RecordSchema<UnknownSchema, StringSchema>,
    ArraySchema<UnknownSchema>,
  ]
> {
  constructor() {
    super([
      new StringSchema().required(),
      new NumberSchema().required(),
      new BooleanSchema().required(),
      new RecordSchema(new UnknownSchema(), new StringSchema()).required(),
      new ArraySchema(new UnknownSchema()).required(),
    ] as const);
    this._def.type = "json";
    this.description = "JSON value (string, number, boolean, object, or array)";
  }
}
