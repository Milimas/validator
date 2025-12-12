import { SchemaType } from "./schema";

// ===== Core Schema Types =====
export type SchemaTypeAny = SchemaType<any, any, any>;
export type TypeOf<T extends SchemaTypeAny> = T["_output"];
export type Infer<T extends SchemaTypeAny> = TypeOf<T>;
export type ObjectShape = { [key: string]: SchemaTypeAny };

export type SchemaDef = {
  description?: string;
};

export type Condition = {
  field: string;
  condition: (field: any) => boolean;
};

// ===== HTML Attribute Types =====

// Base attributes shared across all input types
export type HtmlGenericInputAttributes = {
  name?: string;
  alt?: string;
  title?: string;
  required: boolean;
  readOnly?: boolean;
  tabIndex?: number;
  hidden?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

// String input types
export type HtmlStringInputType =
  | "text"
  | "email"
  | "password"
  | "url"
  | "date"
  | "datetime-local"
  | "color";

export type HtmlStringAttributes = {
  type: HtmlStringInputType;
  defaultValue?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  list?: string;
  dataList?: string[];
} & HtmlGenericInputAttributes;

// Checkbox/Radio input
export type HtmlCheckboxAttributes = {
  type: "checkbox" | "radio";
  checked: boolean;
  defaultValue?: boolean;
} & HtmlGenericInputAttributes;

// Number input
export type HtmlNumberInputAttributes = {
  type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
} & HtmlGenericInputAttributes;

// File input
export type HtmlFileInputAttributes = {
  type: "file";
  defaultValue?: any;
  accept?: string;
  multiple?: boolean;
} & HtmlGenericInputAttributes;

// Select input
export type HtmlSelectAttributes<T = string> = {
  type: "select";
  defaultValue?: T;
  options: readonly T[];
} & HtmlGenericInputAttributes;

// Container types (Object and Array)
export type HtmlArrayType<ItemType = any> = {
  type: "array";
  defaultValue?: ItemType[];
  items: ItemType[];
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

export type HtmlObjectType<ObjectProperties = Record<string, HTMLAttributes>> =
  {
    type: "object";
    properties: ObjectProperties;
    defaultValue?: ObjectProperties;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  };

export type HtmlContainerAttributes<R = Record<string, any>, I = any> =
  | HtmlObjectType<R>
  | HtmlArrayType<I>;

// Union of all HTML attributes with data attributes support
export type HTMLAttributes = (
  | HtmlStringAttributes
  | HtmlCheckboxAttributes
  | HtmlNumberInputAttributes
  | HtmlFileInputAttributes
  | HtmlContainerAttributes
  | HtmlSelectAttributes
) & { [k in `data-${string}`]?: unknown };
