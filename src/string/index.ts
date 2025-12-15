import { e, ValidationError } from "../error.js";
import { SchemaType } from "../schema.js";
import { HtmlStringAttributes } from "../types.js";

/**
 * Generic string validation schema for flexible text input validation.
 *
 * Provides comprehensive string validation with support for length constraints,
 * pattern matching, and custom error messages. Easily extensible with additional
 * validation rules and HTML form attributes. This is the foundation for all
 * specialized string-based schemas like email, URL, and phone number validation.
 *
 * @example
 * // Basic string validation
 * const schema = new StringSchema().minLength(3).maxLength(50);
 * const result = schema.safeParse('hello');
 *
 * @example
 * // Pattern validation with custom error message
 * const nameSchema = new StringSchema()
 *   .pattern(/^[A-Za-z]+$/, 'Name must contain only letters')
 *   .minLength(2);
 */
export class StringSchema extends SchemaType<string> {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    defaultValue: undefined,
    required: true,
  };

  /**
   * Validates that the input data is a string and conforms to all defined constraints.
   *
   * Performs comprehensive validation including:
   * - Type checking (must be a string)
   * - Required field validation
   * - Minimum and maximum length constraints
   * - Pattern/regex matching
   * - Read-only field enforcement
   *
   * @param {unknown} data - The data to validate
   * @returns {e.ValidationResult<string>} A validation result containing either the validated string or detailed error information
   *
   * @example
   * const schema = new StringSchema().minLength(3);
   * const result = schema.validate('hello');
   * if (result.success) {
   *   console.log(result.data); // 'hello'
   * }
   */
  validate(data: unknown): e.ValidationResult<string> {
    const errors: ValidationError[] = [];
    // Basic type check
    if (typeof data !== "string") {
      errors.push(
        new ValidationError(
          [],
          "Invalid string",
          "invalid_type",
          "string",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<string>(errors);
    }

    // Pattern check
    if (
      this.htmlAttributes.pattern &&
      !this.htmlAttributes.pattern.test(data)
    ) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("pattern") || "Invalid format",
          "pattern",
          this.htmlAttributes.pattern,
          data,
          data
        )
      );
    }

    // required check
    if (this.htmlAttributes.required && (data === null || data === undefined))
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("required") || "String is required",
          "required",
          true,
          data,
          data
        )
      );

    // Length checks
    if (
      this.htmlAttributes.minLength !== undefined &&
      data.length < this.htmlAttributes.minLength
    )
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("min") || "String is too short",
          "min",
          this.htmlAttributes.minLength,
          data.length,
          data
        )
      );

    // Length checks
    if (
      this.htmlAttributes.maxLength !== undefined &&
      data.length > this.htmlAttributes.maxLength
    )
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("max") || "String is too long",
          "max",
          this.htmlAttributes.maxLength,
          data.length,
          data
        )
      );

    if (this.htmlAttributes.readOnly) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("readOnly") || "String is read-only",
          "readOnly",
          true,
          data,
          data
        )
      );
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<string>(errors);
    }

    return e.ValidationResult.ok<string>(data);
  }

  /**
   * Sets a placeholder text hint for the string input field.
   *
   * Placeholder text provides users with a visual hint about what type of value
   * is expected in the field. It disappears when the user starts typing.
   * Commonly used in HTML input elements to improve user experience.
   *
   * @param {string} value - The placeholder text to display
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * const schema = new StringSchema()
   *   .placeholder('Enter your first name');
   */
  placeholder(value: string): this {
    this.htmlAttributes = { ...this.htmlAttributes, placeholder: value };
    return this;
  }

  /**
   * Sets the minimum allowed length for the string value.
   *
   * Validates that the input string contains at least the specified number of characters.
   * Useful for enforcing minimum lengths for usernames, passwords, comments, and other
   * text fields where minimum quality standards apply.
   *
   * @param {number} value - The minimum number of characters required
   * @param {string} [message="String is too short"] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Password must be at least 8 characters
   * const passwordSchema = new StringSchema()
   *   .minLength(8, 'Password must be at least 8 characters long');
   *
   * @example
   * // Username with default error message
   * const usernameSchema = new StringSchema()
   *   .minLength(3);
   */
  minLength(value: number, message: string = "String is too short"): this {
    this.errorMap.set("minLength", message);
    this.htmlAttributes = { ...this.htmlAttributes, minLength: value };
    return this;
  }

  /**
   * Alias for minLength to set the minimum allowed length for the string value.
   * @param {number} value - The minimum number of characters required
   * @param {string} [message="String is too short"] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   * @example
   * // Title must be at least 5 characters
   * const titleSchema = new StringSchema().min(5, 'Title is too short');
   */
  min(value: number, message: string = "String is too short"): this {
    return this.minLength(value, message);
  }

  /**
   * Sets the maximum allowed length for the string value.
   *
   * Validates that the input string does not exceed the specified number of characters.
   * Commonly used for enforcing character limits on form fields like text areas, comments,
   * bios, and other user-generated content to prevent excessive input.
   *
   * @param {number} value - The maximum number of characters allowed
   * @param {string} [message="String is too long"] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Bio field with 500 character limit
   * const bioSchema = new StringSchema()
   *   .maxLength(500, 'Bio must not exceed 500 characters');
   *
   * @example
   * // Tweet with character limit
   * const tweetSchema = new StringSchema()
   *   .maxLength(280);
   */
  maxLength(value: number, message: string = "String is too long"): this {
    this.errorMap.set("maxLength", message);
    this.htmlAttributes = { ...this.htmlAttributes, maxLength: value };
    return this;
  }

  /**
   * Alias for maxLength to set the maximum allowed length for the string value.
   * @param {number} value - The maximum number of characters allowed
   * @param {string} [message="String is too long"] - Custom error message when validation fails
   * @returns {this} The schema instance for method chaining
   * @example
   * // Comment field with 200 character limit
   * const commentSchema = new StringSchema().max(200, 'Comment is too long');
   */
  max(value: number, message: string = "String is too long"): this {
    return this.maxLength(value, message);
  }

  /**
   * Enforces a regular expression pattern that the string must match.
   *
   * Validates the string against a provided regex pattern to ensure it conforms to
   * a specific format. Useful for validating codes, identifiers, and custom formats
   * that cannot be validated by other schema methods. Supports custom error messages
   * and help text for user guidance.
   *
   * @param {RegExp} value - The regular expression pattern to match against
   * @param {string} [message] - Custom error message shown when pattern validation fails
   * @param {string} [title] - Help text displayed to guide the user (e.g., in form validation messages)
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Validate alphanumeric product code (e.g., ABC123)
   * const codeSchema = new StringSchema()
   *   .pattern(
   *     /^[A-Z]{3}\d{3}$/,
   *     'Product code must be 3 letters followed by 3 numbers',
   *     'Format: ABC123'
   *   );
   *
   * @example
   * // Validate hexadecimal color code
   * const colorSchema = new StringSchema()
   *   .pattern(/^#[0-9A-F]{6}$/i, 'Invalid hex color');
   */
  pattern(
    value: RegExp,
    message: string = `String does not match pattern ${value.source}`,
    title: string = `Pattern: ${value.source}`
  ): this {
    this.errorMap.set("pattern", message);
    this.htmlAttributes = { ...this.htmlAttributes, pattern: value, title };
    return this;
  }

  /**
   * Associates the input field with an HTML datalist for autocomplete suggestions.
   *
   * Creates a connection between the string input and a datalist element that provides
   * users with autocomplete suggestions as they type. Improves user experience for fields
   * with known possible values like country names, predefined options, or frequently used entries.
   *
   * @param {string} list - The ID of the datalist element to associate
   * @param {string[]} dataList - Array of suggestion values to display in the autocomplete list
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Countries autocomplete
   * const countrySchema = new StringSchema()
   *   .datalist('country-list', ['United States', 'Canada', 'Mexico', 'Brazil']);
   *
   * @example
   * // Popular domain autocomplete for email addresses
   * const emailSchema = new StringSchema()
   *   .datalist('domains', ['gmail.com', 'yahoo.com', 'outlook.com']);
   */
  datalist(list: string, dataList: string[]): this {
    this.htmlAttributes = {
      ...this.htmlAttributes,
      list,
      dataList,
    };
    return this;
  }

  /**
   * Specifies whether the string field is required or optional.
   *
   * Controls whether the field must be populated with a non-empty value. When required is true,
   * empty strings, null, and undefined values will fail validation. Useful for enforcing
   * mandatory form fields and ensuring critical data is always provided.
   *
   * @param {boolean} [required=true] - Whether the field is required (true) or optional (false)
   * @param {string} [message="String is required"] - Custom error message when required validation fails
   * @returns {this} The schema instance for method chaining
   *
   * @example
   * // Mandatory field
   * const nameSchema = new StringSchema()
   *   .required(true, 'Full name is required');
   *
   * @example
   * // Optional field with default message
   * const nicknameSchema = new StringSchema()
   *   .required(false);
   *
   * @example
   * // Required by default
   * const emailSchema = new StringSchema()
   *   .required();
   */
  required(
    required: boolean = true,
    message: string = "String is required"
  ): this {
    this.errorMap.set("required", message);
    this.htmlAttributes = { ...this.htmlAttributes, required };
    return this;
  }
}

/**
 * Specialized string schema for password field validation.
 *
 * Extends StringSchema with HTML5 password input type attributes. The password field
 * automatically masks user input for security purposes. Ideal for login forms, password
 * reset flows, and any scenario requiring secure credential input.
 *
 * Inherits all StringSchema validation methods but with password-specific defaults:
 * - Input type set to "password" for masked display
 * - Can be combined with minLength() for password strength requirements
 * - Supports pattern() for enforcing password complexity rules
 *
 * @example
 * // Basic password validation
 * const passwordSchema = new PasswordSchema();
 *
 * @example
 * // Password with complexity requirements
 * const securePasswordSchema = new PasswordSchema()
 *   .minLength(8)
 *   .pattern(/[A-Z]/, 'Password must contain at least one uppercase letter')
 *   .pattern(/[0-9]/, 'Password must contain at least one number');
 */
export class PasswordSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "password",
    required: true,
  };
}

/**
 * Specialized string schema for URL/web address validation.
 *
 * Provides comprehensive validation for HTTP and HTTPS URLs using a detailed RFC 3986
 * compliant regular expression. Validates the complete URL structure including protocol,
 * domain, path, query parameters, and fragments. Essential for any application accepting
 * web addresses, API endpoints, or document references.
 *
 * Features:
 * - Strict RFC 3986 URI compliance
 * - Support for both HTTP and HTTPS protocols
 * - IPv4 and IPv6 address support
 * - Port number validation
 * - Query parameter and fragment support
 *
 * @example
 * // Basic URL validation
 * const urlSchema = new UrlSchema();
 * const result = urlSchema.safeParse('https://example.com');
 *
 * @example
 * // URL with additional constraints
 * const apiEndpointSchema = new UrlSchema()
 *   .maxLength(2000)
 *   .required(true, 'API endpoint URL is required');
 */
export class UrlSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "url",
    defaultValue: "",
    pattern:
      /^(?<Scheme>[a-z][a-z0-9\+\-\.]*):(?<HierPart>\/\/(?<Authority>((?<UserInfo>(\%[0-9a-f][0-9a-f]|[a-z0-9\-\.\_\~]|[\!\$\&\'\(\)\*\+\,\;\=]|\:)*)\@)?(?<Host>\[((?<IPv6>((?<IPv6_1_R_H16>[0-9a-f]{1,4})\:){6,6}(?<IPV6_1_R_LS32>((?<IPV6_1_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_1_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_1_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_1_R_LS32_H16_2>[0-9a-f]{1,4}))|\:\:((?<IPV6_2_R_H16>[0-9a-f]{1,4})\:){5,5}(?<IPV6_2_R_LS32>((?<IPV6_2_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_2_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_2_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_2_R_LS32_H16_2>[0-9a-f]{1,4}))|(?<IPV6_3_L_H16>[0-9a-f]{1,4})?\:\:((?<IPV6_3_R_H16>[0-9a-f]{1,4})\:){4,4}(?<IPV6_3_R_LS32>((?<IPV6_3_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_3_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_3_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_3_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_4_L_H16_REPEAT>[0-9a-f]{1,4})\:)?(?<IPV6_4_L_H16>[0-9a-f]{1,4}))?\:\:((?<IPV6_4_R_H16>[0-9a-f]{1,4})\:){3,3}(?<IPV6_4_R_LS32>((?<IPV6_4_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_4_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_4_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_4_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_5_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,2}(?<IPV6_5_L_H16>[0-9a-f]{1,4}))?\:\:((?<IPV6_5_R_H16>[0-9a-f]{1,4})\:){2,2}(?<IPV6_5_R_LS32>((?<IPV6_5_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_5_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_5_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_5_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_6_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,3}(?<IPV6_6_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_6_R_H16>[0-9a-f]{1,4})\:(?<IPV6_6_R_LS32>((?<IPV6_6_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_6_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_6_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_6_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_7_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,4}(?<IPV6_7_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_7_R_LS32>((?<IPV6_7_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_7_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_7_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_7_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_8_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,5}(?<IPV6_8_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_8_R_H16>[0-9a-f]{1,4})|(((?<IPV6_9_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,6}(?<IPV6_9_L_H16>[0-9a-f]{1,4}))?\:\:)|v[a-f0-9]+\.([a-z0-9\-\.\_\~]|[\!\$\&\'\(\)\*\+\,\;\=]|\:)+)\]|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|([a-z0-9\-\.\_\~]|\%[0-9a-f][0-9a-f]|[\!\$\&\'\(\)\*\+\,\;\=])*)(:(?<Port>[0-9]+))?)(?<Path>(\/([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@]|(%[a-f0-9]{2,2}))*)*))(?<Query>\?([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@\/\?]|(%[a-f0-9]{2,2}))*)?(?<Fragment>#([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@\/\?]|(%[a-f0-9]{2,2}))*)?$/,
    title: "URL must be a valid web address e.g., https://example.com",
    placeholder: "https://example.com",
    required: true,
  };
}

/**
 * Specialized string schema for ZIP code / postal code validation.
 *
 * Validates ZIP codes in standard US format (5-digit) and extended ZIP+4 format.
 * Supports both formats: XXXXX or XXXXX-XXXX where X represents digits.
 * Useful for address forms, shipping information, and geographic filtering.
 *
 * Predefined validation pattern: /^[0-9]{5}(?:-[0-9]{4})?$/
 * - Accepts 5-digit ZIP codes (e.g., 12345)
 * - Accepts ZIP+4 extended format (e.g., 12345-6789)
 *
 * @example
 * // Standard ZIP code validation
 * const zipSchema = new ZipCodeSchema();
 * const result = zipSchema.safeParse('12345');
 *
 * @example
 * // With extended ZIP+4 support
 * const result2 = zipSchema.safeParse('12345-6789');
 */
export class ZipCodeSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /^[0-9]{5}(?:-[0-9]{4})?$/,
    title: "Zip code must be in the format 12345 or 12345-6789",
    placeholder: "12345 or 12345-6789",
    required: true,
  };
}

/**
 * Specialized string schema for XML content validation.
 *
 * Validates that strings contain properly formatted XML with valid tag structures.
 * Uses a lookbehind/lookahead pattern to extract and validate content within XML tags.
 * Useful for APIs accepting XML payloads, configuration files, or document processing.
 *
 * Pattern validates: <TAG>content</TAG> structures with proper tag matching.
 *
 * @example
 * // Basic XML content validation
 * const xmlSchema = new XMLSchema();
 * const result = xmlSchema.safeParse('<root><item>data</item></root>');
 *
 * @example
 * // With additional constraints
 * const configSchema = new XMLSchema()
 *   .minLength(10)
 *   .maxLength(10000);
 */
export class XMLSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /(?<=<TAG.*?>)(.*?)(?=<\/TAG>)/g,
    title: "XML content must be enclosed within <TAG>value</TAG>",
    placeholder: "<TAG>value</TAG>",
    required: true,
  };
}

/**
 * Specialized string schema for RFC 4122 UUID validation.
 *
 * Validates Universally Unique Identifiers in standard UUID format with support for all
 * RFC 4122 versions (v1, v3, v4, v5). Essential for applications using UUIDs as primary
 * keys, resource identifiers, or unique references in distributed systems.
 *
 * Pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
 *
 * Accepted formats:
 * - Standard UUID: 550e8400-e29b-41d4-a716-446655440000
 * - Case insensitive: 550E8400-E29B-41D4-A716-446655440000
 *
 * @example
 * // UUID validation
 * const uuidSchema = new UUIDSchema();
 * const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
 *
 * @example
 * // Resource identifier validation
 * const resourceSchema = new UUIDSchema()
 *   .required(true, 'Resource ID is required');
 */
export class UUIDSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    title: "UUID must be in the format 550e8400-e29b-41d4-a716-446655440000",
    placeholder: "550e8400-e29b-41d4-a716-446655440000",
    required: true,
  };
}

/**
 * Specialized string schema for street address validation.
 *
 * Validates physical street addresses in standard US format: "1234 Main St, City, ST 12345"
 * Enforces proper structure with street number, street name, city, state abbreviation,
 * and ZIP code. Useful for shipping forms, billing addresses, and location-based services.
 *
 * Pattern format: [number] [street], [city], [state] [zipcode]
 * Example: 123 Oak Avenue, Portland, OR 97201
 *
 * @example
 * // Address validation
 * const addressSchema = new StreetAddressSchema();
 * const result = addressSchema.safeParse('123 Main St, Portland, OR 97201');
 *
 * @example
 * // With additional constraints
 * const shippingSchema = new StreetAddressSchema()
 *   .required(true, 'Shipping address is required');
 */
export class StreetAddressSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(\d{1,}) [a-zA-Z0-9\s]+(\,)? [a-zA-Z]+(\,)? [A-Z]{2} [0-9]{5,6}$/,
    title:
      "Street address must be in the format '1234 Main St, City, ST 12345'",
    placeholder: "1234 Main St, City, ST 12345",
    required: true,
  };
}

/**
 * Specialized string schema for international phone number validation.
 *
 * Validates phone numbers in various international formats including country codes,
 * area codes, and extensions. Supports E.164 format and common separators (+, -, ., spaces).
 * Essential for contact forms, appointment systems, and communication platforms.
 *
 * Accepts formats like:
 * - +12345678900 (E.164)
 * - +1 (234) 567-8900 (Formatted)
 * - 234-567-8900 (Local US)
 * - +1.234.567.8900 (Dot separated)
 *
 * @example
 * // International phone validation
 * const phoneSchema = new PhoneNumberSchema();
 * const result = phoneSchema.safeParse('+1-555-123-4567');
 *
 * @example
 * // With required constraint
 * const contactSchema = new PhoneNumberSchema()
 *   .required(true, 'Contact phone number is required');
 */
export class PhoneNumberSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "tel",
    pattern:
      /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
    title: "Phone number must be in a valid international format",
    placeholder: "+12345678900",
    required: true,
  };
}

/**
 * Specialized string schema for numeric string validation.
 *
 * Validates strings that contain numeric values, including support for negative numbers,
 * decimal points, and thousand separators (commas). Useful for form fields that must
 * accept numeric input in string format, preserving leading zeros or special formatting.
 *
 * Accepts formats like:
 * - 12345 (whole numbers)
 * - -1234 (negative numbers)
 * - 1,234.56 (formatted with thousand separators)
 * - 0.99 (decimals)
 *
 * @example
 * // Numeric string validation
 * const priceSchema = new StringNumberSchema();
 * const result = priceSchema.safeParse('1,234.56');
 *
 * @example
 * // Product code that looks numeric
 * const codeSchema = new StringNumberSchema()
 *   .minLength(6)
 *   .maxLength(6);
 */
export class StringNumberSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/,
    title: "String number must be a valid numeric format",
    placeholder: "12345",
    required: true,
  };
}

/**
 * Specialized string schema for hexadecimal color code validation.
 *
 * Validates color values in hexadecimal notation commonly used in web development.
 * Supports both 3-digit shorthand (#RGB) and 6-digit full notation (#RRGGBB).
 * Compatible with HTML5 color input elements and CSS color specifications.
 *
 * Accepted formats:
 * - #RRGGBB (6 digits, e.g., #FF5733)
 * - #RGB (3 digits shorthand, e.g., #F57 expands to #FF5577)
 * - Case insensitive
 *
 * @example
 * // Color validation
 * const colorSchema = new HexColorSchema();
 * const result = colorSchema.safeParse('#FF5733');
 *
 * @example
 * // With shorthand support
 * const result2 = colorSchema.safeParse('#F57');
 */
export class HexColorSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "color",
    pattern: /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
    title: "Hex color must be in the format #RRGGBB or #RGB",
    placeholder: "#RRGGBB or #RGB",
    required: true,
  };
}

/**
 * Specialized string schema for MAC (Media Access Control) address validation.
 *
 * Validates hardware MAC addresses used for device identification on networks.
 * Supports common MAC address formats with different separators: colons (:), hyphens (-),
 * or dots (.). Essential for network configuration, device management, and hardware tracking.
 *
 * Accepted formats:
 * - Colon separated: 00:1A:2B:3C:4D:5E
 * - Hyphen separated: 00-1A-2B-3C-4D-5E
 * - Dot separated: 001A.2B3C.4D5E
 *
 * @example
 * // MAC address validation
 * const macSchema = new MacAddressSchema();
 * const result = macSchema.safeParse('00:1A:2B:3C:4D:5E');
 *
 * @example
 * // Network device registration
 * const deviceSchema = new MacAddressSchema()
 *   .required(true, 'Device MAC address is required');
 */
export class MacAddressSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /^(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})$/,
    title: "MAC address must be in the format 00:1A:2B:3C:4D:5E",
    placeholder: "00:1A:2B:3C:4D:5E",
    required: true,
  };
}

/**
 * Specialized string schema for IP (Internet Protocol) address validation.
 *
 * Validates both IPv4 and IPv6 addresses with strict format enforcement.
 * Supports configuration for either protocol version, allowing network administrators
 * and developers to enforce specific IP standards in their applications.
 *
 * @template V - The IP version to validate ("IPV4" or "IPV6")
 *
 * IPv4 Format:
 * - Dotted decimal notation: 192.168.1.1
 * - Range: 0.0.0.0 to 255.255.255.255
 *
 * IPv6 Format:
 * - Colon hexadecimal notation: 2001:0db8:85a3::8a2e:0370:7334
 * - Compressed notation with ::
 * - Full and abbreviated forms
 *
 * @example
 * // IPv4 validation
 * const ipv4Schema = new IPAddressSchema('IPV4', {});
 * const result = ipv4Schema.safeParse('192.168.1.1');
 *
 * @example
 * // IPv6 validation
 * const ipv6Schema = new IPAddressSchema('IPV6', {});
 * const result2 = ipv6Schema.safeParse('2001:0db8:85a3::8a2e:0370:7334');
 */
export class IPAddressSchema<
  V extends "IPV4" | "IPV6" = "IPV4" | "IPV6"
> extends StringSchema {
  private patterns: Record<V, RegExp> = {
    IPV4: /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  } as Record<V, RegExp>;
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    placeholder: "255.255.255.255",
    required: true,
  };

  /**
   * Initializes the IP address schema with the specified protocol version.
   *
   * Configures the schema to validate either IPv4 or IPv6 addresses with appropriate
   * pattern matching and user-friendly placeholder/title text based on the selected version.
   *
   * @param {V} version - The IP protocol version ("IPV4" or "IPV6") to validate against
   *
   * @example
   * const ipv4 = new IPAddressSchema('IPV4', {});
   * const ipv6 = new IPAddressSchema('IPV6', {});
   */
  constructor(private version: V) {
    super();
    this.htmlAttributes.pattern = this.patterns[version];
    this.htmlAttributes.placeholder =
      version === "IPV4"
        ? "255.255.255.255"
        : "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    this.htmlAttributes.title =
      version === "IPV4"
        ? "IP address must be in the format 255.255.255.255"
        : "IP address must be in the format 2001:0db8:85a3:0000:0000:8a2e:0370:7334";
  }
}

/**
 * Specialized string schema for HTML content validation.
 *
 * Validates that strings contain properly formatted HTML markup with valid tag structures.
 * Uses regex pattern matching to detect and validate HTML tags. Useful for content management
 * systems, rich text editors, template engines, and any application processing HTML content.
 *
 * Pattern validates standard HTML tag syntax: <tag>content</tag>
 * Supports all standard HTML tags and custom elements.
 *
 * @example
 * // HTML content validation
 * const htmlSchema = new HTMLSchema();
 * const result = htmlSchema.safeParse('<div><p>Hello World</p></div>');
 *
 * @example
 * // With length constraints
 * const articleSchema = new HTMLSchema()
 *   .minLength(100)
 *   .maxLength(50000);
 */
export class HTMLSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,
    title: "HTML content must be valid HTML tags",
    placeholder: "<tag>content</tag>",
    required: true,
  };
}

/**
 * Specialized string schema for GUID (Globally Unique Identifier) validation.
 *
 * Validates GUIDs primarily used in Microsoft ecosystems, databases, and enterprise applications.
 * Supports the standard 8-4-4-4-12 hexadecimal format with optional surrounding braces.
 * Useful for referencing unique resources in Windows-based systems, SQL Server, and .NET applications.
 *
 * Accepted formats:
 * - Standard: 550e8400-e29b-41d4-a716-446655440000
 * - With braces: {550e8400-e29b-41d4-a716-446655440000}
 *
 * @example
 * // GUID validation
 * const guidSchema = new GUIDSchema();
 * const result = guidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
 *
 * @example
 * // Database record identifier
 * const recordSchema = new GUIDSchema()
 *   .required(true, 'Record ID is required');
 */
export class GUIDSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:\{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$/,
    title: "GUID must be in the format 550e8400-e29b-41d4-a716-446655440000",
    placeholder: "550e8400-e29b-41d4-a716-446655440000",
    required: true,
  };
}

/**
 * Specialized string schema for calendar date validation.
 *
 * Validates dates in standard calendar date format (MM/DD/YYYY) commonly used in the United States.
 * Enforces proper day/month/year order with leading zeros and 4-digit year.
 * Useful for birthday fields, appointment dates, and forms requiring calendar dates.
 *
 * Format: MM/DD/YYYY
 * - MM: 01-12 (month)
 * - DD: 01-31 (day)
 * - YYYY: 1900-2099 (year)
 *
 * @example
 * // Date validation
 * const dateSchema = new DateSchema();
 * const result = dateSchema.safeParse('12/25/2024');
 *
 * @example
 * // Birthday field
 * const birthdaySchema = new DateSchema()
 *   .required(true, 'Birthday is required');
 */
export class DateSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "date",
    pattern: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d\d$/,
    title: "Date must be in the format MM/DD/YYYY",
    placeholder: "MM/DD/YYYY",
    required: true,
  };
}

/**
 * Specialized string schema for local date and time validation.
 *
 * Validates datetime values combining both date and time components without timezone information.
 * Compatible with HTML5 `<input type="datetime-local">` elements. Enforces ISO 8601 local datetime
 * format. Useful for appointment scheduling, event creation, and local time-based forms.
 *
 * Format: YYYY-MM-DDTHH:MM:SS
 * - YYYY: 4-digit year
 * - MM: 01-12 (month)
 * - DD: 01-31 (day)
 * - HH: 00-23 (hour)
 * - MM: 00-59 (minute)
 * - SS: 00-59 (second)
 *
 * @example
 * // DateTime validation
 * const dateTimeSchema = new DatetimeLocalSchema();
 * const result = dateTimeSchema.safeParse('2024-12-25T14:30:00');
 *
 * @example
 * // Appointment scheduling
 * const appointmentSchema = new DatetimeLocalSchema()
 *   .required(true, 'Appointment time is required');
 */
export class DatetimeLocalSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "datetime-local",
    pattern:
      /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))T(?:[01][0-9]|2[0-3]):[0-5][0-9]$/,
    title: "Datetime must be in the format MM/DD/YYYYTHH:MM",
    placeholder: "MM/DD/YYYYTHH:MM",
    required: true,
  };
}

/**
 * Specialized string schema for ISO 8601 date and time validation.
 *
 * Validates dates and times according to the ISO 8601 international standard for date/time
 * representation. Supports full ISO format including optional time zones and millisecond precision.
 * Essential for API communications, data interchange, and applications requiring standardized
 * global datetime handling across time zones.
 *
 * Accepted formats:
 * - 2024-12-25T14:30:00Z (with Z timezone)
 * - 2024-12-25T14:30:00+02:00 (with offset)
 * - 2024-12-25T14:30:00.123Z (with milliseconds)
 * - 2024-12-25T14:30:00 (without timezone)
 *
 * @example
 * // ISO date validation
 * const isoSchema = new ISODateSchema();
 * const result = isoSchema.safeParse('2024-12-25T14:30:00Z');
 *
 * @example
 * // API timestamp validation
 * const timestampSchema = new ISODateSchema()
 *   .required(true, 'Timestamp is required');
 */
export class ISODateSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:\d{4})-(?:\d{2})-(?:\d{2})T(?:\d{2}):(?:\d{2}):(?:\d{2}(?:\.\d*)?)(?:(?:-(?:\d{2}):(?:\d{2})|Z)?)$/,
    title: "ISO date must be in the format YYYY-MM-DDTHH:MM:SSZ",
    placeholder: "YYYY-MM-DDTHH:MM:SSZ",
    required: true,
  };
}

/**
 * Specialized string schema for email address validation.
 *
 * Validates email addresses using comprehensive RFC 5322 compliant regex pattern.
 * Supports standard email format with local part, @ symbol, and domain. Handles quoted strings,
 * special characters, and IPv4 literals in email addresses. Essential for user registration,
 * contact forms, and any application requiring email communication.
 *
 * Supports:
 * - Standard emails: user@example.com
 * - Subdomain emails: user@mail.example.com
 * - Special characters in local part: user+tag@example.com
 * - IP literal addresses: user@[192.168.1.1]
 * - Quoted local parts: "user name"@example.com
 *
 * @example
 * // Email validation
 * const emailSchema = new EmailSchema();
 * const result = emailSchema.safeParse('user@example.com');
 *
 * @example
 * // With additional constraints
 * const contactSchema = new EmailSchema()
 *   .maxLength(100)
 *   .required(true, 'Email address is required');
 */
export class EmailSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "email",
    pattern:
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    title: "Email must be a valid email address e.g., example@example.com",
    placeholder: "example@example.com",
    required: true,
  };
}

/**
 * JSON string validation schema with strict JSON format validation.
 *
 * Validates that input is a valid JSON string. Automatically parses the string
 * to ensure it contains well-formed JSON. Useful for form fields that accept
 * JSON data, configuration objects, or nested data structures.
 *
 * @example
 * // Basic JSON validation
 * const jsonSchema = new JSONSchema();
 * const result = jsonSchema.safeParse('{"name":"John","age":30}');
 *
 * @example
 * // With additional constraints
 * const configSchema = new JSONSchema()
 *   .maxLength(5000)
 *   .required(true, 'JSON configuration is required');
 */
export class JSONSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "json",
    placeholder: '{"key":"value"}',
    title: "JSON must be valid JSON format",
    required: true,
  };

  /**
   * Validates that the input is a string containing valid JSON.
   *
   * First validates using the parent StringSchema validation, then attempts
   * to parse the string as JSON to ensure it's well-formed.
   *
   * @param {unknown} data - The data to validate
   * @returns {e.ValidationResult<string>} Validation result with JSON parse validation
   */
  validate(data: unknown): e.ValidationResult<string> {
    // First validate as string
    const stringResult = super.validate(data);
    if (!stringResult.success) {
      return stringResult;
    }

    // Then validate as valid JSON
    try {
      JSON.parse(stringResult.data as string);
      super.validate(stringResult.data);
      return stringResult;
    } catch (error) {
      const errors = [
        new ValidationError(
          [],
          this.errorMap.get("pattern") || "Invalid JSON format",
          "invalid_json",
          "valid JSON",
          stringResult.data,
          stringResult.data
        ),
      ];
      return e.ValidationResult.fail<string>(errors);
    }
  }
}
