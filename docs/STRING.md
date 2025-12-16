# StringSchema

Generic string validation schema for flexible text input validation.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
  - [Length Constraints](#length-constraints)
    - [`minLength(value: number, message?: string)`](#minlengthvalue-number-message-string)
    - [`maxLength(value: number, message?: string)`](#maxlengthvalue-number-message-string)
    - [`min(value: number, message?: string)`](#minvalue-number-message-string)
    - [`max(value: number, message?: string)`](#maxvalue-number-message-string)
  - [Pattern Matching](#pattern-matching)
    - [`pattern(regex: RegExp, message?: string, title?: string)`](#patternregex-regexp-message-string-title-string)
  - [HTML Attributes](#html-attributes)
    - [`placeholder(text: string)`](#placeholdertext-string)
    - [`datalist(listId: string, options: string[])`](#datalistlistid-string-options-string)
  - [Required/Optional](#requiredoptional)
    - [`required(isRequired?: boolean, message?: string)`](#requiredisrequired-boolean-message-string)
- [Specialized String Schemas](#specialized-string-schemas)
  - [EmailSchema](#emailschema)
  - [UrlSchema](#urlschema)
  - [PasswordSchema](#passwordschema)
  - [PhoneNumberSchema](#phonenumberschema)
  - [UUIDSchema](#uuidschema)
  - [ZipCodeSchema](#zipcodeschema)
  - [HexColorSchema](#hexcolorschema)
  - [JSONSchema](#jsonschema)
  - [XMLSchema](#xmlschema)
  - [ISODateSchema](#isodateschema)
- [Examples](#examples)
  - [Username Validation](#username-validation)
  - [Form Field with Validation](#form-field-with-validation)
- [Validation Error Codes](#validation-error-codes)
- [Related](#related)

## Overview

`StringSchema` provides comprehensive string validation with support for length constraints, pattern matching, and custom error messages. It serves as the foundation for all specialized string-based schemas like email, URL, and phone number validation.

## Features

- Type-safe string validation
- Min/max length constraints
- Regular expression pattern matching
- Placeholder text support
- Autocomplete (datalist) support
- Custom error messages
- HTML form attribute generation
- Method chaining for fluent API usage

## Basic Usage

```typescript
import { string } from 'validator';

const schema = string()
  .minLength(3)
  .maxLength(50)
  .placeholder('Enter text')
  .required();

const result = schema.parse('hello');
```

## API Methods

### Length Constraints

#### `minLength(value: number, message?: string)`
Sets the minimum allowed string length.

```typescript
const schema = string().minLength(3, 'At least 3 characters required');
schema.parse('ab');     // Throws: At least 3 characters required
schema.parse('abc');    // ✓ Valid
```

#### `maxLength(value: number, message?: string)`
Sets the maximum allowed string length.

```typescript
const schema = string().maxLength(50, 'Maximum 50 characters allowed');
schema.parse('a'.repeat(51)); // Throws
schema.parse('a'.repeat(50)); // ✓ Valid
```

#### `min(value: number, message?: string)`
Alias for `minLength`.

#### `max(value: number, message?: string)`
Alias for `maxLength`.

### Pattern Matching

#### `pattern(regex: RegExp, message?: string, title?: string)`
Enforces a regular expression pattern that the string must match.

```typescript
const schema = string()
  .pattern(/^[A-Z]{3}\d{3}$/, 'Must be format ABC123', 'Product Code Format: ABC123');

schema.parse('ABC123');  // ✓ Valid
schema.parse('abc123');  // Throws: Must be format ABC123
```

### HTML Attributes

#### `placeholder(text: string)`
Sets placeholder text for HTML input elements.

```typescript
const schema = string().placeholder('Enter your email');
const attrs = schema.toJSON();
// { type: 'text', placeholder: 'Enter your email', ... }
```

#### `datalist(listId: string, options: string[])`
Associates the input field with an HTML datalist for autocomplete suggestions.

```typescript
const schema = string().datalist('country-list', ['USA', 'Canada', 'Mexico']);
const attrs = schema.toJSON();
// { type: 'text', list: 'country-list', dataList: [...], ... }
```

### Required/Optional

#### `required(isRequired?: boolean, message?: string)`
Sets whether the field is required.

```typescript
const schema = string()
  .required(true, 'This field is mandatory')
  .minLength(3);

schema.parse('');     // Throws: This field is mandatory
schema.parse('abc');  // ✓ Valid
```

## Specialized String Schemas

The library extends `StringSchema` with specialized validators:

### EmailSchema
```typescript
import { email } from 'validator';

const schema = email().maxLength(100);
schema.parse('user@example.com'); // ✓ Valid
```

### UrlSchema
```typescript
import { url } from 'validator';

const schema = url();
schema.parse('https://example.com'); // ✓ Valid
```

### PasswordSchema
```typescript
import { password } from 'validator';

const schema = password().minLength(8);
schema.parse('SecurePass123'); // ✓ Valid
```

### PhoneNumberSchema
```typescript
import { phoneNumber } from 'validator';

const schema = phoneNumber();
schema.parse('+1-555-123-4567'); // ✓ Valid
```

### UUIDSchema
```typescript
import { uuid } from 'validator';

const schema = uuid();
schema.parse('550e8400-e29b-41d4-a716-446655440000'); // ✓ Valid
```

### ZipCodeSchema
```typescript
import { zipCode } from 'validator';

const schema = zipCode();
schema.parse('12345');      // ✓ Valid
schema.parse('12345-6789'); // ✓ Valid
```

### HexColorSchema
```typescript
import { hexColor } from 'validator';

const schema = hexColor();
schema.parse('#FF5733'); // ✓ Valid
```

### JSONSchema
```typescript
import { json } from 'validator';

const schema = json()
  .minLength(5)
  .maxLength(5000);

schema.parse('{"key":"value"}'); // ✓ Valid
schema.parse('{invalid}');       // Throws: Invalid JSON
```

### XMLSchema
```typescript
import { xml } from 'validator';

const schema = xml();
schema.parse('<root><item>data</item></root>'); // ✓ Valid
```

### ISODateSchema
```typescript
import { isoDate } from 'validator';

const schema = isoDate();
schema.parse('2024-12-25T14:30:00Z'); // ✓ Valid
```

## Examples

### Username Validation
```typescript
import { string } from 'validator';

const usernameSchema = string()
  .minLength(3, 'Username must be at least 3 characters')
  .maxLength(20, 'Username cannot exceed 20 characters')
  .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .required(true, 'Username is required');

// Valid
usernameSchema.parse('john_doe'); // ✓

// Invalid
usernameSchema.parse('ab');            // Too short
usernameSchema.parse('john-doe');      // Invalid character
```

### Form Field with Validation
```typescript
import { string } from 'validator';

const bioSchema = string()
  .maxLength(500, 'Bio must not exceed 500 characters')
  .placeholder('Tell us about yourself')
  .optional();

const attrs = bioSchema.toJSON();
// {
//   type: 'text',
//   maxLength: 500,
//   placeholder: 'Tell us about yourself',
//   required: false
// }
```

## Validation Error Codes

- `invalid_type` - Input is not a string
- `min_length` - String is too short
- `max_length` - String is too long
- `pattern` - String doesn't match the pattern
- `required` - Required field is empty

## Related

- [Array Documentation](./ARRAY.md) - For validating string arrays
- [Object Documentation](./OBJECT.md) - For objects containing strings
- [Union Documentation](./UNION.md) - For union with strings and other types
