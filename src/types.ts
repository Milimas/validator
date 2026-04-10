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

/**
 * A leaf condition: checks that a single field's value matches a pattern.
 *
 * Used as the base building block of a {@link DependencyRule}.
 *
 * @example
 * { field: '@.role', condition: /admin/ }
 * { field: 'user.status', condition: 'active' }
 */
export interface FieldCondition {
  /**
   * Path to the field whose value is tested.
   *
   * Supported syntaxes:
   * - **Root path** — absolute from the validated root: `user.role`, `settings.flags.0`
   * - **`@.x`** — sibling of the current field (same containing object): `@.type`
   * - **`^.x`** — one level above the containing object: `^.enabled`
   * - **`^.^.x`** — two levels above: `^.^.status`
   */
  field: string;
  /**
   * Pattern the field's string representation must match.
   * A `RegExp` is tested directly; a `string` is compiled into a `RegExp` first.
   *
   * @example
   * condition: /^admin$/   // RegExp literal
   * condition: '^admin$'   // equivalent string pattern
   */
  condition: RegExp | string;
}

/**
 * AND group: **every** sub-rule must be satisfied for this group to pass.
 *
 * Sub-rules can be {@link FieldCondition}s or nested {@link OrGroup}s, allowing
 * arbitrarily complex logic trees.
 *
 * @example
 * {
 *   operator: 'and',
 *   conditions: [
 *     { field: '@.plan',   condition: /business/ },
 *     { field: '@.region', condition: /EU/ },
 *   ]
 * }
 */
export interface AndGroup {
  operator: "and";
  /**
   * All of these rules must pass for the group to be satisfied.
   * At least one rule is required.
   */
  conditions: [DependencyRule, ...DependencyRule[]];
}

/**
 * OR group: **at least one** sub-rule must be satisfied for this group to pass.
 *
 * Sub-rules can be {@link FieldCondition}s or nested {@link AndGroup}s, allowing
 * arbitrarily complex logic trees.
 *
 * @example
 * {
 *   operator: 'or',
 *   conditions: [
 *     { field: '@.plan',   condition: /premium/ },
 *     { field: '@.role',   condition: /admin/ },
 *   ]
 * }
 */
export interface OrGroup {
  operator: "or";
  /**
   * At least one of these rules must pass for the group to be satisfied.
   * At least one rule is required.
   */
  conditions: [DependencyRule, ...DependencyRule[]];
}

/**
 * A dependency rule passed to {@link SchemaType.dependsOn}.
 *
 * Three forms are supported:
 *
 * **1. Leaf condition** — checks a single field:
 * ```ts
 * { field: '@.enabled', condition: /true/ }
 * ```
 *
 * **2. AND group** — every condition must match:
 * ```ts
 * { operator: 'and', conditions: [condA, condB] }
 * ```
 *
 * **3. OR group** — any condition must match:
 * ```ts
 * { operator: 'or', conditions: [condA, condB] }
 * ```
 *
 * Groups nest freely, so you can express any boolean combination:
 * ```ts
 * // (plan=business AND region=EU) OR role=admin
 * {
 *   operator: 'or',
 *   conditions: [
 *     { operator: 'and', conditions: [
 *       { field: '@.plan',   condition: /business/ },
 *       { field: '@.region', condition: /EU/ },
 *     ]},
 *     { field: '@.role', condition: /admin/ },
 *   ]
 * }
 * ```
 */
export type DependencyRule = FieldCondition | AndGroup | OrGroup;

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
