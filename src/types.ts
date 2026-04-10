import { RefinementContext } from "./context.js";
import { SchemaType } from "./schema.js";
import { Prettify, TypeOf } from "./util.js";

/**
 *
 */
export type SchemaTypeAny = SchemaType<any, any>;

/**
 * Schema defs that can represent object keys.
 */
export type StringLikeDef = StringDef | SelectDef<string>;

/**
 * Schemas that are valid for record keys.
 *
 * A record key schema must parse to a string-like key so it can be used
 * with JavaScript object keys (including enum schemas with string literals).
 */
export type StringLikeSchema<
  Output extends string = string,
  Input extends string = Output,
  Def extends StringLikeDef = StringLikeDef,
> = SchemaType<Output, Input> & { _def: Def };

export type Infer<T extends SchemaTypeAny> = Prettify<TypeOf<T>>;

export type ObjectShape = { [key: string]: SchemaTypeAny };

export type Condition = {
  field: string;
  condition: RegExp | string;
};

export type RefinementCheck<
  S extends SchemaTypeAny = SchemaTypeAny,
  Output = S["_output"],
> =
  | {
      type: "refine";
      check: (value: Output) => boolean;
      immediate?: boolean;
      message: () => string;
      code?: string;
      expected?: unknown;
      received?: unknown;
    }
  | {
      type: "superRefine";
      check: (value: Output, ctx: RefinementContext<S>) => void;
    };

export interface StringDef extends BaseDef<string> {
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  list?: string;
  dataList?: string[];
}
export interface CodeDef extends StringDef {
  language?: CodeLanguages;
}

export type CodeLanguages = "javascript" | "json" | "xml" | "html";

export interface CheckboxDef extends BaseDef<boolean> {
  checked: boolean;
}

export interface NumberDef extends BaseDef<number> {
  min?: number;
  max?: number;
  step?: number;
}

export interface FileDef extends BaseDef<
  Base64URLString | ArrayBufferLike | null
> {
  accept?: string;
  multiple?: boolean;
}

export interface SelectDef<T = string> extends BaseDef<T> {
  // defaultValue?: T;
  options: readonly T[];
}

export interface ArrayDef<ItemType extends AnyDef> extends BaseDef<ItemType[]> {
  // defaultValue?: ItemType[];
  items: ItemType[];
  minLength?: number;
  maxLength?: number;
}

export interface ObjectDef<
  Shape extends { [key: string]: SchemaTypeAny },
  DefaultType extends {
    [K in keyof Shape]: any; // TODO: change any to inferred type
  } = { [K in keyof Shape]: any },
  TProperties extends {
    [K in keyof Shape]: Shape[K]["_def"];
  } = {
    [K in keyof Shape]: Shape[K]["_def"];
  },
> extends BaseDef<DefaultType> {
  properties: TProperties;
  minLength?: number;
  maxLength?: number;
}

export interface UnionDef<
  T extends readonly any[] = readonly any[],
> extends BaseDef<T[number]> {
  anyOf?: T;
}

export interface RecordDef<
  K extends StringLikeDef,
  D extends BaseDef<any>,
> extends BaseDef<Record<string, D>> {
  keySchema: K;
  valueSchema: D;
}

export interface AnyDef extends BaseDef<any> {
  [key: string]: any;
}

export interface NeverDef extends BaseDef<never> {}

export interface UnknownDef extends BaseDef<unknown> {}

export interface BaseDef<T> {
  type:
    | "text"
    | "email"
    | "password"
    | "url"
    | "date"
    | "datetime-local"
    | "color"
    | "tel"
    | "json"
    | "code"
    | "checkbox"
    | "radio"
    | "number"
    | "file"
    | "select"
    | "array"
    | "object"
    | "union"
    | "record"
    | "any"
    | "never"
    | "unknown";
  defaultValue?: T;
  name?: string;
  alt?: string;
  title?: string;
  required: boolean;
  readOnly?: boolean;
  tabIndex?: number;
  hidden?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  metadata?: Record<string, unknown>;
  description?: string;
  "data-depends-on"?: Condition[];
}

export type RefineFunction<T> = (data: T) => boolean | Promise<boolean>;

export type RefineAsyncFunction<T> = (data: T) => Promise<boolean>;

export type JsonSchemaFormat = (
  | {
      type:
        | "null"
        | "boolean"
        | "object"
        | "array"
        | "number"
        | "string"
        | "integer";
      properties?: Record<string, unknown>;
      required?: string[];
      additionalProperties?: Record<string, unknown> | boolean;
      description?: string | undefined;
      [key: string]: unknown;
    }
  | {
      anyOf: JsonSchemaFormat[];
      description?: string | undefined;
    }
) & {
  __brand?: never;
};
