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
yarn add validator
```

## Import Styles

Validator supports multiple import patterns:

```typescript
// Named imports (recommended for tree-shaking)
import { string, email, number, object, array } from 'validator';

// Default import (namespace)
import validator from 'validator';
const schema = validator.string();

// Namespace import
import { s } from 'validator';
const schema = s.string();
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
const user = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  subscribe: true,
});

// Or safely parse without throwing
const result = userSchema.safeParse(data);
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
  .minLength(3)
  .maxLength(50)
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

### Enum Validation

```typescript
import { enumSchema } from 'validator';

const schema = enumSchema(['active', 'inactive', 'pending'] as const);
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

### String-Specific Methods

- `minLength(n)` - Minimum string length
- `maxLength(n)` - Maximum string length
- `pattern(regex)` - Match against regex pattern
- `placeholder(text)` - Set placeholder text for HTML input
- `datalist(options)` - Set autocomplete options

### Specialized String Schemas

- `email()` - Email validation with RFC 5322 compliance
- `url()` - URL validation
- `password()` - Password field schema
- `date()` - Date input schema
- `datetimeLocal()` - Datetime-local input schema
- `uuid()` - UUID validation
- `guid()` - GUID validation
- `phoneNumber()` - Phone number validation
- `zipCode()` - ZIP code validation
- `hexColor()` - Hex color code validation
- `ipAddress()` - IP address validation
- `macAddress()` - MAC address validation
- `isoDate()` - ISO 8601 date validation

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

### Conditional Validation

Define validation rules that depend on other fields:

```typescript
import { object, enumSchema, string } from 'validator';

const schema = object({
  userType: enumSchema(['customer', 'business'] as const),
  taxId: string().dependsOn([
    { field: 'userType', condition: (type) => type === 'business' }
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
import { Infer } from 'validator';

type User = typeof userSchema;
type UserData = Infer<typeof userSchema>;

// UserData is inferred as:
// {
//   name: string;
//   email: string;
//   age: number;
//   subscribe: boolean;
// }
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

[GitHub Repository](https://github.com/Milimas/validator)

