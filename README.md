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

## Quick Start

```typescript
import { s } from 'validator';

// Define a schema
const userSchema = s.object({
  name: s.string().minLength(2),
  email: s.string().email(),
  age: s.number().min(18).max(120),
  subscribe: s.boolean().default(false),
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
const schema = s.string()
  .minLength(3)
  .maxLength(50)
  .email()
  .pattern(/^[A-Z]/)
  .default('default value')
  .placeholder('Enter text');
```

### Number Validation

```typescript
const schema = s.number()
  .min(0)
  .max(100)
  .default(0);
```

### Boolean Validation

```typescript
const schema = s.boolean()
  .default(false);
```

### Array Validation

```typescript
const schema = s.array(s.string())
  .minLength(1)
  .maxLength(10);
```

### Object Validation

```typescript
const schema = s.object({
  name: s.string(),
  age: s.number(),
  email: s.string().email(),
});
```

### Enum Validation

```typescript
const schema = s.enum(['active', 'inactive', 'pending']);
```

## Schema Methods

### Common Methods

- `parse(data)` - Parse data and throw on validation error
- `safeParse(data)` - Parse data and return validation result
- `default(value)` - Set a default value
- `description(text)` - Add schema description
- `optional()` - Make field optional

### String-Specific Methods

- `minLength(n)` - Minimum string length
- `maxLength(n)` - Maximum string length
- `email()` - Validate email format
- `url()` - Validate URL format
- `pattern(regex)` - Match against regex pattern

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
const schema = s.string()
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
const schema = s.object({
  userType: s.enum(['customer', 'business']),
  taxId: s.string().when('userType', 'business'),
});
```

### Custom Error Messages

```typescript
const schema = s.string()
  .minLength(3)
  .errorMessage('minLength', 'Name must be at least 3 characters');
```

## TypeScript Support

Full type inference from schemas:

```typescript
type User = typeof userSchema;
type UserData = typeof userSchema._output;

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

