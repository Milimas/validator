import { ArraySchema } from "./array/index.js";
import { BooleanSchema } from "./boolean/index.js";
import { NumberSchema } from "./number/index.js";
import { ObjectSchema } from "./object/index.js";
import { EnumSchema } from "./enum/index.js";
import {
  DateSchema,
  DatetimeLocalSchema,
  EmailSchema,
  GUIDSchema,
  HexColorSchema,
  HTMLSchema,
  IPAddressSchema,
  ISODateSchema,
  MacAddressSchema,
  PasswordSchema,
  PhoneNumberSchema,
  StreetAddressSchema,
  StringNumberSchema,
  StringSchema,
  UrlSchema,
  UUIDSchema,
  XMLSchema,
  ZipCodeSchema,
} from "./string/index.js";
import { HTMLAttributes, ObjectShape, SchemaTypeAny } from "./types.js";
import { SchemaType } from "./schema.js";

// export * from "./types";

export { Infer as infer } from "./types";

////////////////////////////
////        String      ////
////////////////////////////

/**
 * Initializes a generic string schema for basic text validation.
 *
 * Use this function to create a schema for validating plain text strings. The resulting
 * schema can be further customized with validation rules such as min/max length, patterns,
 * and custom error messages.
 *
 * @returns {StringSchema} A new StringSchema instance ready for validation configuration
 *
 * @example
 * const schema = string().minLength(3).maxLength(50);
 * const result = schema.safeParse('hello');
 */
export function string(): StringSchema {
  return new StringSchema({
    description: "A string field",
  });
}

/**
 * Initializes an email schema with built-in RFC 5322 email format validation.
 *
 * Creates a specialized string schema that validates email addresses according to industry
 * standards. This schema automatically enforces email format rules and can be extended with
 * additional constraints such as domain restrictions or length limits.
 *
 * @returns {EmailSchema} A new EmailSchema instance with email-specific validation rules
 *
 * @example
 * const emailSchema = email().maxLength(100);
 * const result = emailSchema.safeParse('user@example.com');
 */
export function email(): EmailSchema {
  return new EmailSchema({
    description: "An email field",
  });
}

/**
 * Initializes a URL schema for web address validation.
 *
 * Creates a specialized string schema that validates HTTP and HTTPS URLs. Automatically
 * enforces URL syntax rules including protocol requirements and hostname validation.
 * Ideal for form fields accepting website URLs or API endpoints.
 *
 * @returns {UrlSchema} A new UrlSchema instance with URL-specific validation rules
 *
 * @example
 * const urlSchema = url();
 * const result = urlSchema.safeParse('https://example.com');
 */
export function url(): UrlSchema {
  return new UrlSchema({
    description: "A URL field",
  });
}

/**
 * Initializes a date schema for HTML5 date input validation.
 *
 * Creates a specialized string schema that validates date values in YYYY-MM-DD format,
 * compatible with HTML5 `<input type="date">` elements. Enforces proper date formatting
 * and can be extended with minimum/maximum date constraints.
 *
 * @returns {DateSchema} A new DateSchema instance with date-specific validation rules
 *
 * @example
 * const dateSchema = date();
 * const result = dateSchema.safeParse('2024-12-25');
 */
export function date(): DateSchema {
  return new DateSchema({
    description: "A date field",
  });
}

/**
 * Initializes a datetime-local schema for HTML5 datetime input validation.
 *
 * Creates a specialized string schema that validates datetime values including both date
 * and time components. Compatible with HTML5 `<input type="datetime-local">` elements.
 * Enforces ISO 8601 format and can be extended with temporal constraints.
 *
 * @returns {DatetimeLocalSchema} A new DatetimeLocalSchema instance with datetime-specific rules
 *
 * @example
 * const datetimeSchema = datetime();
 * const result = datetimeSchema.safeParse('2024-12-25T14:30:00');
 */
export function datetime(): DatetimeLocalSchema {
  return new DatetimeLocalSchema({
    description: "A datetime-local field",
  });
}

/**
 * Initializes a password schema with masked input support for sensitive data.
 *
 * Creates a specialized string schema designed for password fields with HTML5 password
 * input compatibility. The schema supports security-focused validation rules and can be
 * configured with complexity requirements such as minimum length and character constraints.
 *
 * @returns {PasswordSchema} A new PasswordSchema instance with password-specific validation rules
 *
 * @example
 * const passwordSchema = password().minLength(8);
 * const result = passwordSchema.safeParse('SecurePass123');
 */
export function password(): PasswordSchema {
  return new PasswordSchema({
    description: "A password field",
  });
}

/**
 * Initializes a hexadecimal color code schema for color input validation.
 *
 * Creates a specialized string schema that validates hexadecimal color codes (#RRGGBB format).
 * Compatible with HTML5 color input elements and supports both 3-digit and 6-digit hex notation.
 * Automatically enforces valid color code formatting.
 *
 * @returns {HexColorSchema} A new HexColorSchema instance with color validation rules
 *
 * @example
 * const colorSchema = hexColor();
 * const result = colorSchema.safeParse('#FF5733');
 */
export function hexColor(): HexColorSchema {
  return new HexColorSchema({
    description: "A hex color field",
  });
}

/**
 * Initializes an ISO 8601 date schema for standardized date format validation.
 *
 * Creates a specialized string schema that strictly validates ISO 8601 compliant date strings.
 * Ideal for API communications and data interchange where standardized date formatting is critical.
 * Supports full ISO format including time zones and milliseconds.
 *
 * @returns {ISODateSchema} A new ISODateSchema instance with ISO 8601 date validation
 *
 * @example
 * const isoSchema = isoDate();
 * const result = isoSchema.safeParse('2024-12-25T14:30:00Z');
 */
export function isoDate(): ISODateSchema {
  return new ISODateSchema({
    description: "An ISO date field",
  });
}

/**
 * Initializes a postal code schema supporting multiple country formats.
 *
 * Creates a specialized string schema that validates zip codes and postal codes across different
 * regions. Supports various formats including US ZIP, ZIP+4, Canadian postal codes, and other
 * international formats. Configurable for specific region requirements.
 *
 * @returns {ZipCodeSchema} A new ZipCodeSchema instance with postal code validation rules
 *
 * @example
 * const zipSchema = zipCode();
 * const result = zipSchema.safeParse('12345');
 */
export function zipCode(): ZipCodeSchema {
  return new ZipCodeSchema({
    description: "A zip code field",
  });
}

/**
 * Initializes an XML content schema for structured markup validation.
 *
 * Creates a specialized string schema that validates XML document syntax and structure.
 * Ensures well-formed XML with proper tag matching, attribute syntax, and encoding declarations.
 * Useful for APIs and data formats that require XML validation.
 *
 * @returns {XMLSchema} A new XMLSchema instance with XML syntax validation
 *
 * @example
 * const xmlSchema = xml();
 * const result = xmlSchema.safeParse('<root><item>data</item></root>');
 */
export function xml(): XMLSchema {
  return new XMLSchema({
    description: "An XML field",
  });
}

/**
 * Initializes a UUID (Universally Unique Identifier) schema for identifier validation.
 *
 * Creates a specialized string schema that validates RFC 4122 compliant UUIDs in all versions
 * (v1, v3, v4, v5). Supports both standard and non-standard UUID formats. Essential for
 * applications using UUIDs as primary keys or unique identifiers.
 *
 * @returns {UUIDSchema} A new UUIDSchema instance with UUID format validation
 *
 * @example
 * const uuidSchema = uuid();
 * const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
 */
export function uuid(): UUIDSchema {
  return new UUIDSchema({
    description: "A UUID field",
  });
}

/**
 * Initializes a street address schema for physical address validation.
 *
 * Creates a specialized string schema that validates physical street addresses with standard
 * formatting. Supports various address formats across different countries and regions.
 * Ideal for shipping, billing, and location-based services.
 *
 * @returns {StreetAddressSchema} A new StreetAddressSchema instance with address validation rules
 *
 * @example
 * const addressSchema = streetAddress();
 * const result = addressSchema.safeParse('123 Main Street');
 */
export function streetAddress(): StreetAddressSchema {
  return new StreetAddressSchema({
    description: "A street address field",
  });
}

/**
 * Initializes a phone number schema for telecommunication number validation.
 *
 * Creates a specialized string schema that validates phone numbers in various formats including
 * international formats with country codes, area codes, and extensions. Supports E.164 format
 * and other regional phone number standards.
 *
 * @returns {PhoneNumberSchema} A new PhoneNumberSchema instance with phone validation rules
 *
 * @example
 * const phoneSchema = phoneNumber();
 * const result = phoneSchema.safeParse('+1-555-123-4567');
 */
export function phoneNumber(): PhoneNumberSchema {
  return new PhoneNumberSchema({
    description: "A phone number field",
  });
}

/**
 * Initializes a numeric string schema for number-like text validation.
 *
 * Creates a specialized string schema that validates strings containing numeric characters.
 * Useful for scenarios requiring numeric data in string format (e.g., product codes,
 * reference numbers) while maintaining string type for leading zeros or special formatting.
 *
 * @returns {StringNumberSchema} A new StringNumberSchema instance for numeric string validation
 *
 * @example
 * const numberStrSchema = stringNumber();
 * const result = numberStrSchema.safeParse('12345');
 */
export function stringNumber(): StringNumberSchema {
  return new StringNumberSchema({
    description: "A string number field",
  });
}

/**
 * Initializes a MAC address schema for network hardware identifier validation.
 *
 * Creates a specialized string schema that validates Media Access Control (MAC) addresses
 * in multiple formats (colon-separated, hyphen-separated, dot-separated). Essential for
 * network configuration, device identification, and hardware tracking applications.
 *
 * @returns {MacAddressSchema} A new MacAddressSchema instance with MAC address validation
 *
 * @example
 * const macSchema = macAddress();
 * const result = macSchema.safeParse('00:1A:2B:3C:4D:5E');
 */
export function macAddress(): MacAddressSchema {
  return new MacAddressSchema({
    description: "A MAC address field",
  });
}

/**
 * Initializes an IP address schema supporting both IPv4 and IPv6 formats.
 *
 * Creates a specialized string schema that validates Internet Protocol addresses. Supports
 * both IPv4 (dotted-decimal notation) and IPv6 (colon-hexadecimal notation) formats.
 * Essential for network configuration, server management, and connectivity validation.
 *
 * @param {\"IPV4\" | \"IPV6\"} version - The IP protocol version to validate against
 * @returns {IPAddressSchema} A new IPAddressSchema instance configured for the specified IP version
 *
 * @example
 * const ipv4Schema = ip('IPV4');
 * const result = ipv4Schema.safeParse('192.168.1.1');
 *
 * const ipv6Schema = ip('IPV6');
 * const result2 = ipv6Schema.safeParse('2001:0db8:85a3::8a2e:0370:7334');
 */
export function ip(version: "IPV4" | "IPV6"): IPAddressSchema {
  return new IPAddressSchema(version, {
    description: `An IP address field for version ${version}`,
  });
}

/**
 * Initializes an HTML content schema for markup validation.
 *
 * Creates a specialized string schema that validates HTML document syntax and structure.
 * Ensures proper tag formatting, attribute syntax, and nesting rules. Useful for content
 * management systems, rich text editors, and template validation.
 *
 * @returns {HTMLSchema} A new HTMLSchema instance with HTML markup validation
 *
 * @example
 * const htmlSchema = html();
 * const result = htmlSchema.safeParse('<div><p>Hello</p></div>');
 */
export function html(): HTMLSchema {
  return new HTMLSchema({
    description: "An HTML field",
  });
}

/**
 * Initializes a GUID (Globally Unique Identifier) schema for unique identifier validation.
 *
 * Creates a specialized string schema that validates Globally Unique Identifiers, primarily
 * used in Microsoft ecosystems. Validates the 8-4-4-4-12 hexadecimal format with optional
 * braces. Compatible with database systems and enterprise applications.
 *
 * @returns {GUIDSchema} A new GUIDSchema instance with GUID format validation
 *
 * @example
 * const guidSchema = guid();
 * const result = guidSchema.safeParse('{550e8400-e29b-41d4-a716-446655440000}');
 */
export function guid(): GUIDSchema {
  return new GUIDSchema({
    description: "A GUID field",
  });
}

////////////////////////////
////        Number      ////
////////////////////////////

/**
 * Initializes a numeric schema for integer and floating-point number validation.
 *
 * Creates a schema that validates numeric values with support for both integers and decimals.
 * Configurable with min/max constraints, precision specifications, and custom error handling.
 * Ideal for form fields, calculations, and numeric data processing.
 *
 * @returns {NumberSchema} A new NumberSchema instance ready for numeric validation configuration
 *
 * @example
 * const schema = number().min(0).max(100);
 * const result = schema.safeParse(50);
 */
export function number(): NumberSchema {
  return new NumberSchema({});
}

////////////////////////////
////       Boolean      ////
////////////////////////////

/**
 * Initializes a boolean schema for true/false value validation.
 *
 * Creates a schema that validates boolean values (true/false). Useful for checkbox inputs,
 * feature flags, and binary choice fields. Supports default values and custom error messages.
 * Type-safe with full TypeScript inference.
 *
 * @returns {BooleanSchema} A new BooleanSchema instance for boolean value validation
 *
 * @example
 * const schema = boolean().default(false);
 * const result = schema.safeParse(true);
 */
export function boolean(): BooleanSchema {
  return new BooleanSchema({});
}

////////////////////////////
////        Object      ////
////////////////////////////

/**
 * Initializes a structured object schema with defined property validation rules.
 *
 * Creates a composite schema that validates objects with a specific structure. Each property
 * in the object is validated according to its defined schema. Supports nested objects,
 * type inference, and complex validation scenarios. Essential for form data and API request validation.
 *
 * @template Shape - The shape/structure of the object being validated
 * @param {Shape} shape - An object mapping property names to their respective validation schemas
 * @returns {ObjectSchema<Shape>} A new ObjectSchema instance configured with the specified shape
 *
 * @example
 * const userSchema = object({
 *   name: string().minLength(3),
 *   email: email(),
 *   age: number().min(18)
 * });
 * const result = userSchema.safeParse({ name: 'John', email: 'john@example.com', age: 25 });
 */
export function object<Shape extends ObjectShape>(
  shape: Shape
): ObjectSchema<Shape> {
  return new ObjectSchema(shape);
}

////////////////////////////
////        Array       ////
////////////////////////////

/**
 * Initializes an array schema that validates each element against a specified item schema.
 *
 * Creates a schema that validates arrays where each element conforms to the provided item schema.
 * Supports min/max length constraints, custom error handling, and nested complex types.
 * Type-safe with full inference of array element types.
 *
 * @template T - The schema type of array elements
 * @param {T} itemSchema - The validation schema that each array element must conform to
 * @returns {ArraySchema<T>} A new ArraySchema instance configured for the specified item type
 *
 * @example
 * const tagsSchema = array(string().minLength(2));
 * const result = tagsSchema.safeParse(['tag1', 'tag2', 'tag3']);
 *
 * const userListSchema = array(object({ id: number(), name: string() }));\n * const result2 = userListSchema.safeParse([{ id: 1, name: 'John' }]);
 */
export function array<T extends SchemaTypeAny>(itemSchema: T): ArraySchema<T> {
  return new ArraySchema(itemSchema);
}

////////////////////////////
////        Enum        ////
////////////////////////////

/**
 * Initializes an enumeration schema that validates against a set of allowed values.
 *
 * Creates a schema that restricts input to one of a predefined set of string values.
 * Useful for status fields, categories, user roles, and other categorical data.
 * Provides type-safe enumeration with full TypeScript literal type inference.
 *
 * @template T - The readonly array of allowed enum values
 * @param {T} values - A readonly array of string values that are allowed
 * @returns {EnumSchema<T>} A new EnumSchema instance restricted to the specified values
 *
 * @example
 * const statusSchema = enum(['active', 'inactive', 'pending']);
 * const result = statusSchema.safeParse('active');
 *
 * const roleSchema = enum(['admin', 'user', 'guest'] as const);
 * const result2 = roleSchema.safeParse('user');
 */
function _enum<const T extends readonly string[]>(values: T): EnumSchema<T> {
  return new EnumSchema(values);
}

/**
 * Converts a SchemaType instance to its corresponding JSON representation.
 *
 * This function invokes the `toJSON` method of the provided schema instance,
 * returning the JSON-compatible representation of the schema's configuration
 * and attributes. Useful for serializing schema definitions for storage,
 * transmission, or integration with form builders.
 *
 * @template R - The expected HTMLAttributes type of the schema's JSON representation
 * @param {SchemaTypeAny} schema - The schema instance to convert to JSON
 * @returns {R} The JSON representation of the schema
 *
 * @example
 * const schema = string().minLength(3).maxLength(50);
 * const jsonSchema = toJSONSchema(schema);
 */
function toJSONSchema<R extends HTMLAttributes>(schema: SchemaTypeAny): R {
  return schema.toJSON() as R;
}

export type { SchemaTypeAny };
export { SchemaType };
export { toJSONSchema };
export { _enum as enum };
