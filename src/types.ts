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

export interface EqPayload {
  field: string;
  value: unknown;
}
export interface NumericPayload {
  field: string;
  value: number;
}
export interface InPayload {
  field: string;
  value: readonly unknown[];
}
export interface StringPayload {
  field: string;
  value: string;
}
export interface PatternPayload {
  field: string;
  value: RegExp | string;
}
export interface FieldOnlyPayload {
  field: string;
}

type OneKey<T, K extends keyof T = keyof T> = {
  [P in K]: { [Q in P]: T[P] } & Partial<Record<Exclude<K, P>, never>>;
}[K];

interface RuleMap {
  eq: EqPayload;
  ne: EqPayload;

  lt: NumericPayload;
  gt: NumericPayload;
  lte: NumericPayload;
  gte: NumericPayload;

  in: InPayload;
  notIn: InPayload;

  contains: StringPayload;
  startsWith: StringPayload;
  endsWith: StringPayload;

  exists: FieldOnlyPayload;
  notEmpty: FieldOnlyPayload;
  truthy: FieldOnlyPayload;
  falsy: FieldOnlyPayload;

  pattern: PatternPayload;

  and: [DependencyRule, ...DependencyRule[]];
  or: [DependencyRule, ...DependencyRule[]];
  not: DependencyRule;
}

export type ComparisonOperator =
  | "eq"
  | "ne"
  | "lt"
  | "gt"
  | "lte"
  | "gte"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "exists"
  | "notEmpty"
  | "truthy"
  | "falsy"
  | "pattern";

export type GroupOperator = "and" | "or" | "not";

/**
 * A dependency rule passed to {@link SchemaType.dependsOn}.
 *
 * Every rule is an object with **exactly one** top-level operator key.
 *
 * Leaf operators include equality (`eq`, `ne`), numeric comparison
 * (`lt`, `gt`, `lte`, `gte`), membership (`in`, `notIn`), string predicates
 * (`contains`, `startsWith`, `endsWith`), existence/truthiness checks
 * (`exists`, `notEmpty`, `truthy`, `falsy`), and regex (`pattern`).
 *
 * Group operators combine rules: `and`, `or`, and `not`.
 *
 * The `Root` generic is reserved for future root-based type inference; it is
 * currently unused for narrowing but kept on the signature for forward compat.
 *
 * @example
 * { eq: { field: 'role', value: 'admin' } }
 * { gte: { field: 'age', value: 18 } }
 * { and: [
 *     { eq: { field: 'role', value: 'admin' } },
 *     { not: { falsy: { field: 'verified' } } },
 *   ]
 * }
 */
export type DependencyRule<Root = unknown> = [Root] extends [unknown]
  ? OneKey<RuleMap>
  : OneKey<RuleMap>;

export type LeafPayload =
  | EqPayload
  | NumericPayload
  | InPayload
  | StringPayload
  | PatternPayload
  | FieldOnlyPayload;

/**
 * The union of all leaf variants of {@link DependencyRule} — any rule whose
 * top-level key is a {@link ComparisonOperator}.
 */
export type FieldCondition<Root = unknown> = Extract<
  DependencyRule<Root>,
  { [K in ComparisonOperator]?: unknown }
>;

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
  "data-depends-on"?: DependencyRule;
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
