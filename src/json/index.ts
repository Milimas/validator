import { ArraySchema } from "../array";
import { BooleanSchema } from "../boolean";
import { NumberSchema } from "../number";
import { RecordSchema } from "../record";
import { UnknownSchema } from "../schema";
import { StringSchema } from "../string";
import { UnionSchema } from "../union";

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
