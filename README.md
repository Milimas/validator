# Validator

A powerful, type-safe TypeScript validation library for schema definition and data validation. Designed to work seamlessly with form builders, Validator provides an intuitive API for defining schemas and validating data structures.

## Features

- 🎯 **Type-Safe**: Full TypeScript support with type inference from schemas
- 📋 **Schema-Driven**: Define reusable schemas for form validation and data parsing
- 🏗️ **Multiple Data Types**: Built-in support for strings, numbers, booleans, arrays, objects, and enums
- 🎨 **HTML Form Integration**: Generate HTML attributes directly from schemas
- ✅ **Detailed Error Messages**: Comprehensive validation error reporting with error codes
- 🔄 **Safe Parsing**: Both throwing (`parse`) and non-throwing (`safeParse`) methods
- 🛡️ **Conditional Validation**: Define complex validation rules based on field conditions
- 📝 **Chainable API**: Fluent interface for building schemas with method chaining

## Installation

```bash
npm install validator
# or
pnpm add validator
# or
## Development

```bash
pnpm install
pnpm build   # type-check and emit
pnpm test    # run unit tests
```

During development you can run `pnpm dev` to start the local playground if configured.
yarn add validator
```

## Import Styles

Validator supports multiple import patterns:

```typescript
// Named imports (recommended for tree-shaking)
import { string, email, number, object, array, union, any, never, unknown, record } from 'validator';

// Default import (namespace-like)
import validator from 'validator';
const schema = validator.string();

// Namespace import (ES modules)
import * as v from 'validator';
const another = v.string();
```

## Quick Start

```typescript
import { string, email, number, boolean, object } from 'validator';

// Define a schema
const userSchema = object({
  name: string().minLength(2),
  email: email(),
  age: number().min(18).max(120),
  subscribe: boolean().default(false),
});

// Parse and validate data
const userInput = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  subscribe: true,
};

const user = userSchema.parse(userInput);

// Or safely parse without throwing
const result = userSchema.safeParse(userInput);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.errors);
}
```

## API Reference

### String Validation

```typescript
import { string } from 'validator';

const schema = string()
  .minLength(3) // alias: .min(3)
  .maxLength(50) // alias: .max(50)
  .pattern(/^[A-Z]/)
  .placeholder('Enter text')
  .required();
```

### Email Validation

```typescript
import { email } from 'validator';

const schema = email()
  .placeholder('user@example.com')
  .required();
```

### Number Validation

```typescript
import { number } from 'validator';

const schema = number()
  .min(0)
  .max(100)
  .default(0);
```

### Boolean Validation

```typescript
import { boolean } from 'validator';

const schema = boolean()
  .default(false);
```

### Array Validation

```typescript
import { array, string } from 'validator';

const schema = array(string())
  .minLength(1)
  .maxLength(10);
```

### Object Validation

```typescript
import { object, string, number, email } from 'validator';

const schema = object({
  name: string(),
  age: number(),
  email: email(),
});
```

#### Object Schema Composition

Object schemas support powerful composition methods for building schemas from existing ones:

```typescript
import { object, string, number, boolean, email } from 'validator';

// Base schemas
const userBase = object({
  id: number().int(),
  username: string().minLength(3),
});

const contactInfo = object({
  email: email(),
  phone: string().pattern(/^\+?[0-9]{10,}$/),
});

// extend() - merge multiple schemas
const userSchema = userBase.extend(contactInfo);
// Result: { id, username, email, phone }

// extend with multiple schemas at once
const preferences = object({ newsletter: boolean() });
const metadata = object({ createdAt: string() });

const fullSchema = userBase.extend(contactInfo, preferences, metadata);
// Result: { id, username, email, phone, newsletter, createdAt }

// omit() - remove specific keys
const withoutEmail = userSchema.omit('email');
// Result: { id, username, phone }

// pick() - keep only specific keys
const onlyCredentials = userSchema.pick('username', 'email');
// Result: { username, email }

// Chain composition methods
const customSchema = userBase
  .extend(contactInfo, preferences)
  .omit('phone')
  .pick('username', 'email', 'newsletter');
// Result: { username, email, newsletter }

// All validation rules are preserved after composition
const extended = object({ name: string().minLength(2) })
  .extend(object({ age: number().min(18) }));

extended.parse({ name: 'Jo', age: 20 }); // Valid
extended.parse({ name: 'J', age: 20 }); // Throws: name too short
```

### Record Validation

```typescript
import { record, number, string, object, boolean } from 'validator';

// Simple record: dynamic keys with uniform value type
const scoresSchema = record(string(), number().min(0).max(100));
scoresSchema.parse({ alice: 95, bob: 87, charlie: 92 }); // Valid
// Type: Record<string, number>

// Record with key constraints
const configSchema = record(
  string().pattern(/^[a-z_]+$/),
  string().minLength(2)
);
configSchema.parse({ theme_color: "dark", user_lang: "en" }); // Valid
configSchema.parse({ "Theme-Color": "dark" }); // Fails: invalid key

// Complex nested records
const settingsSchema = record(
  string(),
  object({
    enabled: boolean(),
    value: string()
  })
);
const settings = settingsSchema.parse({
  notifications: { enabled: true, value: "all" },
  darkMode: { enabled: false, value: "auto" }
});

// HTML attributes for form rendering
const html = scoresSchema.toJSON();
// {
//   type: 'record',
//   keySchema: { type: 'text', required: true },
//   valueSchema: { type: 'number', min: 0, max: 100, required: true },
//   required: true
// }

// With custom key schema
const customSchema = record(
  string().pattern(/^[a-z_]+$/).minLength(3),
  string()
);
const customHtml = customSchema.toJSON();
// {
//   type: 'record',
//   keySchema: { type: 'text', pattern: '[a-z_]+', minLength: 3, required: true },
//   valueSchema: { type: 'text', required: true },
//   required: true
// }

// Frontend can use both schemas for validation:
// - Validate each key against keySchema constraints (pattern, length, etc.)
// - Validate each value against valueSchema constraints
// - Render appropriate input elements for both keys and values
```

### Enum Validation

```typescript
import { enum as enumSchema } from 'validator';

const schema = enumSchema(['active', 'inactive', 'pending'] as const);
```

### JSON Validation

```typescript
import { json } from 'validator';

const schema = json()
  .minLength(5)
  .maxLength(5000)
  .pattern(/^\{.*\}$/) // Must be a JSON object
  .placeholder('{"key":"value"}')
  .required();

// Parse valid JSON strings
const result = schema.parse('{"status":"ok"}'); // Returns: '{"status":"ok"}'

// Automatically validates JSON format
schema.parse('{invalid}'); // Throws: Invalid JSON format

// Use with safeParse for non-throwing validation
const result = schema.safeParse('{"name":"John","age":30}');
if (result.success) {
  console.log(result.data); // '{"name":"John","age":30}'
}
```

## Schema Methods

### Common Methods

- `parse(data)` - Parse data and throw on validation error
- `safeParse(data)` - Parse data and return validation result
- `validate(data)` - Validate data and return ValidationResult
- `toJSON()` - Convert schema to JSON-serializable HTML attributes
- `default(value)` - Set a default value
- `optional()` - Make field optional (allows undefined)
- `nullable()` - Make field nullable (allows null)
- `required(isRequired, message)` - Set required state and custom error message
- `dependsOn(conditions)` - Make field conditionally required based on other fields
- `metadata(metadata)` - Adds custom data-* attributes to the schema's HTML attributes.

### String-Specific Methods

- `minLength(n)` - Minimum string length
- `min(n)` - Alias for minLength
- `maxLength(n)` - Maximum string length
- `max(n)` - Alias for maxLength
- `pattern(regex)` - Match against regex pattern
- `placeholder(text)` - Set placeholder text for HTML input
- `datalist(options)` - Set autocomplete options

### Specialized String Schemas

- `email()` - Email validation with RFC 5322 compliance
- `url()` - URL validation
- `password()` - Password field schema
- `date()` - Date input schema
- `datetime()` - Datetime-local input schema
- `uuid()` - UUID validation
- `guid()` - GUID validation
- `phoneNumber()` - Phone number validation
- `zipCode()` - ZIP code validation
- `hexColor()` - Hex color code validation
- `ip(version)` - IP address validation (`"IPV4" | "IPV6"`)
### Union Validation

```typescript
import { union, string, number, boolean } from 'validator';

// Union schema succeeds if any branch validates the input
const schema = union([string(), number(), boolean()] as const);

schema.parse('hello'); // 'hello'
schema.parse(42); // 42
schema.parse(true); // true

// HTML attributes for front-end form rendering
const html = schema.toJSON();
// { type: 'union', required: true, anyOf: [ { type: 'text', ... }, { type: 'number', ... }, { type: 'checkbox', ... } ] }

// Type inference
type Value = Infer<typeof schema>; // string | number | boolean
```

- `macAddress()` - MAC address validation
- `isoDate()` - ISO 8601 date validation
- `json()` - JSON string validation

### Any / Never / Unknown

```typescript
import { any, never, unknown } from 'validator';

// any(): accepts any value without validation
const anySchema = any();
anySchema.parse(123); // 123
anySchema.parse('hello'); // 'hello'
anySchema.parse({ x: 1 }); // { x: 1 }

// never(): rejects all values
const neverSchema = never();
// neverSchema.parse('anything'); // throws ValidationAggregateError

// unknown(): accepts any value, typed as unknown
const unknownSchema = unknown();
const value = unknownSchema.parse({ a: 1 }); // type: unknown

// HTML attributes
anySchema.toJSON(); // { type: 'any', required: true }
neverSchema.toJSON(); // { type: 'never', required: true }
unknownSchema.toJSON(); // { type: 'unknown', required: true }
```

### Helpers

The library exports several helper functions and types for working with schemas:

#### Type Inference

```typescript
import { Infer, infer } from 'validator';

const userSchema = object({
  name: string(),
  age: number().min(18),
  email: email(),
});

type User = infer<typeof userSchema>;
// User: { name: string; age: number; email: string }
```

#### Schema to JSON Conversion

```typescript
import { toJSONSchema } from 'validator';

const schema = string().minLength(3).maxLength(50);
const htmlAttrs = toJSONSchema(schema);
// { type: 'text', minLength: 3, maxLength: 50, required: true }
```

#### Union Schema Helper

```typescript
import { union, string, number } from 'validator';

// Create union schemas programmatically
const stringOrNumber = union([string(), number()]);

stringOrNumber.parse('hello'); // 'hello'
stringOrNumber.parse(42); // 42
stringOrNumber.parse(true); // Throws: invalid type
```

### Number-Specific Methods

- `min(n)` - Minimum value
- `max(n)` - Maximum value

### Array-Specific Methods

- `minLength(n)` - Minimum array length
- `maxLength(n)` - Maximum array length

## Error Handling

Validation errors provide detailed information:

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  result.errors.forEach(error => {
    console.log(`Field: ${error.path.join('.')}`);
    console.log(`Message: ${error.message}`);
    console.log(`Code: ${error.code}`);
  });
}
```

Error codes include:
- `invalid_type` - Type mismatch
- `pattern` - Pattern validation failed
- `min_length` - String/array too short
- `max_length` - String/array too long
- `min` - Number too small
- `max` - Number too large
- `invalid_email` - Invalid email format
- `invalid_url` - Invalid URL format
- `invalid_json` - Invalid JSON format

## Form Integration

Schemas can generate HTML attributes for form rendering:

```typescript
import { string } from 'validator';

const schema = string()
  .minLength(3)
  .maxLength(50)
  .placeholder('Enter your name')
  .default('John');

const htmlAttrs = schema.toJSON();
// { type: 'text', minLength: 3, maxLength: 50, placeholder: 'Enter your name', defaultValue: 'John' }
```

## Advanced Usage

### JSON Validation

Validate and parse JSON strings with full support for length constraints and pattern matching:

```typescript
import { json } from 'validator';

// Basic JSON validation
const configSchema = json();
configSchema.parse('{"theme":"dark","fontSize":14}'); // Valid
configSchema.parse('{invalid}'); // Throws: Invalid JSON format

// JSON with constraints
const apiResponseSchema = json()
  .minLength(10)
  .maxLength(100000)
  .required(true, 'API response is required');

// JSON structure validation using patterns
const objectOnlySchema = json()
  .pattern(/^\{.*\}$/, 'Must be a JSON object');

const arrayOnlySchema = json()
  .pattern(/^\[.*\]$/, 'Must be a JSON array');

// Use in complex forms
const formSchema = object({
  name: string().minLength(2),
  config: json()
    .minLength(5)
    .maxLength(5000)
    .placeholder('{"setting":"value"}'),
  data: json().optional().default('{}'),
});

// Type inference
type FormData = Infer<typeof formSchema>;
// FormData: { name: string; config: string; data: string }
```

### Conditional Validation

Define validation rules that depend on other fields:

```typescript
import { object, enum as enumSchema, string } from 'validator';

const schema = object({
  userType: enumSchema(['customer', 'business'] as const),
  taxId: string().dependsOn([
    { field: 'userType', condition: /^business$/ }
  ]),
});
```

### Custom Error Messages

```typescript
import { string } from 'validator';

const schema = string()
  .minLength(3)
  .required(true, 'Name must be at least 3 characters');
```

## TypeScript Support

Full type inference from schemas:

```typescript
import { v } from 'validator';

type UserData = v.infer<typeof userSchema>;

// UserData is inferred as:
// {
//   name: string;
//   email: string;
//   age: number;
//   subscribe: boolean;
// }

// Optional and nullable inference examples
const profileSchema = object({
  name: string(),
  nickname: string().optional(), // inferred as string | undefined
  middleName: string().nullable(), // inferred as string | null
});
type Profile = Infer<typeof profileSchema>;
// Profile: { name: string; nickname: string | undefined; middleName: string | null }
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

[GitHub Repository](https://github.com/Milimas/validator)

