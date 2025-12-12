import { SchemaType } from "./schema.js";

/**
 * Generic type alias for any SchemaType instance regardless of its type parameters.
 *
 * Useful for creating collections or functions that accept any schema type without
 * needing to specify the exact output, definition, or input types. Commonly used
 * in generic validation utilities and schema composition functions.
 *
 * @example
 * function validateMany(schemas: SchemaTypeAny[], data: unknown[]) {
 *   return schemas.map((schema, i) => schema.safeParse(data[i]));
 * }
 */
export type SchemaTypeAny = SchemaType<any, any, any>;

/**
 * Extracts the output type from a schema type.
 *
 * Retrieves the TypeScript type that a schema will produce after successful validation.
 * Essential for type inference in form builders, API handlers, and anywhere you need
 * to work with validated data types without manually duplicating type definitions.
 *
 * @template T - The schema type to extract the output type from
 *
 * @example
 * const userSchema = object({
 *   name: string(),
 *   age: number()
 * });
 * type User = TypeOf<typeof userSchema>;
 * // User is inferred as { name: string; age: number }
 */
export type TypeOf<T extends SchemaTypeAny> = T["_output"];

/**
 * Alias for TypeOf - extracts the inferred output type from a schema.
 *
 * Provides an alternative, more semantic name for TypeOf. Use this when you want
 * to emphasize that you're inferring a type from a schema definition rather than
 * just extracting it.
 *
 * @template T - The schema type to infer the output type from
 *
 * @example
 * const productSchema = object({ id: number(), name: string() });
 * type Product = Infer<typeof productSchema>;
 */
export type Infer<T extends SchemaTypeAny> = TypeOf<T>;

/**
 * Defines the shape of an object schema as a mapping of property names to schemas.
 *
 * Used to construct object schemas where each property has its own validation schema.
 * This type ensures type safety when creating complex nested object structures with
 * multiple validated properties.
 *
 * @example
 * const userShape: ObjectShape = {
 *   username: string().minLength(3),
 *   email: email(),
 *   age: number().min(18)
 * };
 * const userSchema = object(userShape);
 */
export type ObjectShape = { [key: string]: SchemaTypeAny };

/**
 * Configuration options for schema definitions.
 *
 * Base configuration that can be extended by specific schema types. Currently supports
 * an optional description field for documenting the schema's purpose and validation rules.
 *
 * @property {string} [description] - Optional human-readable description of what the schema validates
 *
 * @example
 * const def: SchemaDef = {
 *   description: "User email address field with RFC 5322 validation"
 * };
 */
export type SchemaDef = {
  description?: string;
};

/**
 * Defines a conditional validation rule based on another field's value.
 *
 * Enables dynamic validation where a field's validation rules can change based on
 * the value of another field. Useful for implementing complex form logic like
 * required fields that only apply when certain conditions are met.
 *
 * @property {string} field - The name of the field whose value determines the condition
 * @property {RegExp} condition - Regular expression that the field value must match to satisfy the condition
 *
 * @example
 * // Require business tax ID only for business accounts
 * const taxIdCondition: Condition = {
 *   field: 'accountType',
 *  condition: /^business$/
 * };
 */
export type Condition = {
  field: string;
  condition: RegExp;
};

/**
 * Base HTML input attributes shared across all input element types.
 *
 * Defines common properties that apply to all HTML form input elements, including
 * accessibility attributes, visibility controls, and interaction settings. These
 * attributes form the foundation for all specialized input type definitions.
 *
 * @property {string} [name] - The name attribute for form submission
 * @property {string} [alt] - Alternative text for accessibility
 * @property {string} [title] - Tooltip text displayed on hover
 * @property {boolean} required - Whether the field is required (must have a value)
 * @property {boolean} [readOnly] - Whether the field is read-only (cannot be edited)
 * @property {number} [tabIndex] - Tab navigation order
 * @property {boolean} [hidden] - Whether the field is hidden from view
 * @property {boolean} [disabled] - Whether the field is disabled (cannot be interacted with)
 * @property {string} [ariaLabel] - ARIA label for screen readers
 */
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

/**
 * Union type of all valid HTML5 string-based input types.
 *
 * Enumerates the HTML input types that accept and validate string values.
 * Each type provides specialized browser validation and user interface elements
 * optimized for specific kinds of string data.
 *
 * @example
 * const inputType: HtmlStringInputType = 'email'; // Valid
 * const inputType2: HtmlStringInputType = 'password'; // Valid
 * const inputType3: HtmlStringInputType = 'number'; // Error: not a string input type
 */
export type HtmlStringInputType =
  | "text"
  | "email"
  | "password"
  | "url"
  | "date"
  | "datetime-local"
  | "color"
  | "tel";

/**
 * HTML attributes for string-based input elements with validation constraints.
 *
 * Extends generic input attributes with string-specific properties like length
 * constraints, pattern matching, and autocomplete suggestions. Compatible with
 * HTML5 text, email, password, URL, date, datetime-local, and color input types.
 *
 * @property {HtmlStringInputType} type - The HTML input type
 * @property {string} [defaultValue] - Default value for the input
 * @property {string} [placeholder] - Placeholder text shown when input is empty
 * @property {number} [minLength] - Minimum number of characters required
 * @property {number} [maxLength] - Maximum number of characters allowed
 * @property {RegExp} [pattern] - Regular expression pattern for validation
 * @property {string} [list] - ID of datalist element for autocomplete suggestions
 * @property {string[]} [dataList] - Array of autocomplete suggestion values
 *
 * @example
 * const emailAttrs: HtmlStringAttributes = {
 *   type: 'email',
 *   required: true,
 *   placeholder: 'user@example.com',
 *   maxLength: 254
 * };
 */
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

/**
 * HTML attributes for checkbox and radio button input elements.
 *
 * Defines properties specific to binary choice (checkbox) and single-choice from
 * multiple options (radio) input types. Includes checked state management and
 * default value configuration.
 *
 * @property {"checkbox" | "radio"} type - The input type (checkbox or radio)
 * @property {boolean} checked - Whether the input is currently checked
 * @property {boolean} [defaultValue] - Default checked state
 *
 * @example
 * const checkboxAttrs: HtmlCheckboxAttributes = {
 *   type: 'checkbox',
 *   checked: false,
 *   defaultValue: false,
 *   required: true
 * };
 */
export type HtmlCheckboxAttributes = {
  type: "checkbox" | "radio";
  checked: boolean;
  defaultValue?: boolean;
} & HtmlGenericInputAttributes;

/**
 * HTML attributes for numeric input elements with value constraints.
 *
 * Provides properties for number input types including default values, minimum and
 * maximum bounds, and step increments. Enables browser-native numeric validation
 * and spinner controls.
 *
 * @property {"number"} type - The HTML input type (always "number")
 * @property {number} [defaultValue] - Default numeric value
 * @property {number} [min] - Minimum allowed value
 * @property {number} [max] - Maximum allowed value
 * @property {number} [step] - Increment/decrement step size for spinner controls
 *
 * @example
 * const ageAttrs: HtmlNumberInputAttributes = {
 *   type: 'number',
 *   required: true,
 *   min: 0,
 *   max: 120,
 *   step: 1,
 *   defaultValue: 18
 * };
 */
export type HtmlNumberInputAttributes = {
  type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
} & HtmlGenericInputAttributes;

/**
 * HTML attributes for file upload input elements.
 *
 * Defines properties for file input types including accepted file formats and
 * multiple file selection support. Enables file upload functionality with
 * browser-native file dialogs and validation.
 *
 * @property {"file"} type - The HTML input type (always "file")
 * @property {any} [defaultValue] - Default file value (typically not used)
 * @property {string} [accept] - Comma-separated list of accepted file types (MIME types or extensions)
 * @property {boolean} [multiple] - Whether multiple files can be selected
 *
 * @example
 * const imageUploadAttrs: HtmlFileInputAttributes = {
 *   type: 'file',
 *   required: true,
 *   accept: 'image/png, image/jpeg',
 *   multiple: false
 * };
 */
export type HtmlFileInputAttributes = {
  type: "file";
  defaultValue?: any;
  accept?: string;
  multiple?: boolean;
} & HtmlGenericInputAttributes;

/**
 * HTML attributes for select dropdown elements with typed options.
 *
 * Provides properties for select/dropdown inputs with type-safe option values.
 * The generic parameter T ensures that the default value matches one of the
 * available options.
 *
 * @template T - The type of option values (defaults to string)
 *
 * @property {"select"} type - The input type (always "select")
 * @property {T} [defaultValue] - Default selected option value
 * @property {readonly T[]} options - Array of available option values
 *
 * @example
 * const statusSelect: HtmlSelectAttributes<'active' | 'inactive'> = {
 *   type: 'select',
 *   required: true,
 *   options: ['active', 'inactive'],
 *   defaultValue: 'active'
 * };
 */
export type HtmlSelectAttributes<T = string> = {
  type: "select";
  defaultValue?: T;
  options: readonly T[];
} & HtmlGenericInputAttributes;

/**
 * HTML representation for array/list data structures.
 *
 * Defines the structure for representing arrays in HTML forms, including item
 * schemas, default values, and length constraints. Useful for dynamic form
 * fields that allow adding/removing multiple items of the same type.
 *
 * @template ItemType - The type of items in the array (defaults to any)
 *
 * @property {"array"} type - The container type (always "array")
 * @property {ItemType[]} [defaultValue] - Default array values
 * @property {ItemType[]} items - Array of item type definitions/schemas
 * @property {number} [minLength] - Minimum number of items required
 * @property {number} [maxLength] - Maximum number of items allowed
 * @property {boolean} [required] - Whether the array field is required
 *
 * @example
 * const tagsArray: HtmlArrayType<string> = {
 *   type: 'array',
 *   items: [{ type: 'text', required: true }],
 *   minLength: 1,
 *   maxLength: 10,
 *   required: true
 * };
 */
export type HtmlArrayType<ItemType = any> = {
  type: "array";
  defaultValue?: ItemType[];
  items: ItemType[];
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

/**
 * HTML representation for object/record data structures with nested properties.
 *
 * Defines the structure for representing complex objects in HTML forms, with each
 * property having its own validation schema and HTML attributes. Essential for
 * forms with grouped related fields.
 *
 * @template ObjectProperties - The type of object properties (defaults to Record<string, HTMLAttributes>)
 *
 * @property {"object"} type - The container type (always "object")
 * @property {ObjectProperties} properties - Mapping of property names to their HTML attributes
 * @property {ObjectProperties} [defaultValue] - Default values for all properties
 * @property {number} [minLength] - Minimum number of properties (rarely used)
 * @property {number} [maxLength] - Maximum number of properties (rarely used)
 * @property {boolean} [required] - Whether the object field is required
 *
 * @example
 * const addressObject: HtmlObjectType = {
 *   type: 'object',
 *   required: true,
 *   properties: {
 *     street: { type: 'text', required: true },
 *     city: { type: 'text', required: true },
 *     zipCode: { type: 'text', required: true, pattern: /^\d{5}$/ }
 *   }
 * };
 */
export type HtmlObjectType<ObjectProperties = Record<string, HTMLAttributes>> =
  {
    type: "object";
    properties: ObjectProperties;
    defaultValue?: ObjectProperties;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  };

/**
 * Union type for HTML container attributes (objects and arrays).
 *
 * Combines object and array HTML attribute types to represent complex nested
 * data structures. Used when a field can be either an object with properties
 * or an array of items.
 *
 * @template R - The type for object properties (defaults to Record<string, any>)
 * @template I - The type for array items (defaults to any)
 *
 * @example
 * function renderContainer(attrs: HtmlContainerAttributes) {
 *   if (attrs.type === 'object') {
 *     return renderObjectFields(attrs.properties);
 *   } else {
 *     return renderArrayField(attrs.items);
 *   }
 * }
 */
export type HtmlContainerAttributes<R = Record<string, any>, I = any> =
  | HtmlObjectType<R>
  | HtmlArrayType<I>;

/**
 * Union of all possible HTML form input attribute types with data attribute support.
 *
 * Comprehensive type that encompasses all HTML input types (string, number, checkbox,
 * file, select, object, array) along with support for custom data-* attributes.
 * This is the primary type used for representing form field configurations.
 *
 * Supports all standard HTML5 input types plus custom data attributes for storing
 * additional metadata on form elements.
 *
 * @example
 * const fieldAttrs: HTMLAttributes = {
 *   type: 'email',
 *   required: true,
 *   placeholder: 'user@example.com',
 *   'data-validation-group': 'contact-info'
 * };
 *
 * @example
 * // Can represent any input type
 * const numberField: HTMLAttributes = {
 *   type: 'number',
 *   min: 0,
 *   max: 100,
 *   required: true
 * };
 */
export type HTMLAttributes = (
  | HtmlStringAttributes
  | HtmlCheckboxAttributes
  | HtmlNumberInputAttributes
  | HtmlFileInputAttributes
  | HtmlContainerAttributes
  | HtmlSelectAttributes
) & { [k in `data-${string}`]?: unknown };
