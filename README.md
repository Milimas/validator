# Validator

A type-safe TypeScript validation library built for modern form builders. Define schemas once, infer precise types, and validate confidently across client and server.

## Features

- 🎯 **Type-Safe by Default**: End-to-end TypeScript inference from schemas to runtime parsing
- 📋 **Schema-First**: Reusable, composable schemas for forms and data pipelines
- 🏗️ **Rich Primitives**: Strings, numbers, booleans, arrays, objects, enums, unions, records, and helpers
- 🎨 **Form-Ready**: Generate HTML attributes directly from schemas for immediate UI rendering
- ✅ **Actionable Errors**: Structured error codes and messages for precise feedback
- 🔄 **Safe Parsing**: Throwing (`parse`) and non-throwing (`safeParse`) flows
- 🛡️ **Conditional Logic**: Field dependencies and required-state control
- 📝 **Chainable API**: Fluent, ergonomic method chaining

## Installation (GitHub)

The package is not yet published to npm. Install directly from GitHub:

```bash
pnpm add github:Milimas/validator
# or
npm install github:Milimas/validator
# or
yarn add github:Milimas/validator
```

## Development

```bash
pnpm install
pnpm build   # type-check and emit
pnpm test    # run unit tests
```

During development you can run `pnpm dev` to start the local playground if configured.

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

Validator includes comprehensive documentation for each schema type. See the detailed guides:

- **[Schema Base Classes](./docs/SCHEMA.md)** — Core schema classes, wrappers (optional/nullable/default), and special schemas (any/never/unknown)
- **[StringSchema Documentation](./docs/STRING.md)** — String validation with length, pattern, and format constraints
- **[NumberSchema Documentation](./docs/NUMBER.md)** — Numeric validation with min/max constraints
- **[BooleanSchema Documentation](./docs/BOOLEAN.md)** — Boolean validation for checkboxes and toggles
- **[ArraySchema Documentation](./docs/ARRAY.md)** — Array validation with item and length constraints
- **[ObjectSchema Documentation](./docs/OBJECT.md)** — Object validation with composition (extend/omit/pick)
- **[EnumSchema Documentation](./docs/ENUM.md)** — Enumeration validation for fixed value sets
- **[UnionSchema Documentation](./docs/UNION.md)** — Union validation for multiple possible types
- **[RecordSchema Documentation](./docs/RECORD.md)** — Record validation for dynamic key-value objects

### Quick Reference

#### String Validation

```typescript
import { string, email, url } from 'validator';

const schema = string()
  .minLength(3)
  .maxLength(50)
  .pattern(/^[A-Z]/)
  .placeholder('Enter text')
  .required();

// Specialized strings
const emailSchema = email();
const urlSchema = url();
const phoneSchema = phoneNumber();
```

See [String Documentation](./docs/STRING.md) for all string schemas and methods.

#### Number Validation

```typescript
import { number } from 'validator';

const schema = number()
  .min(0)
  .max(100)
  .int()
  .default(0);
```

See [Number Documentation](./docs/NUMBER.md) for all numeric schemas and constraints.

#### Boolean Validation

```typescript
import { boolean } from 'validator';

const schema = boolean().default(false);
```

See [Boolean Documentation](./docs/BOOLEAN.md) for boolean schemas.

#### Array Validation

```typescript
import { array, string } from 'validator';

const schema = array(string())
  .minLength(1)
  .maxLength(10);
```

See [Array Documentation](./docs/ARRAY.md) for array schemas and nested structures.

#### Object Validation

```typescript
import { object, string, number, email } from 'validator';

const schema = object({
  name: string(),
  age: number(),
  email: email(),
});
```

See [Object Documentation](./docs/OBJECT.md) for composition methods (`extend`, `omit`, `pick`).

#### Enum Validation

```typescript
import { enum as enumSchema } from 'validator';

const status = enumSchema(['active', 'inactive', 'pending'] as const);
```

See [Enum Documentation](./docs/ENUM.md) for enumeration schemas.

#### Union Validation

```typescript
import { union, string, number } from 'validator';

const schema = union([string(), number()] as const);
```

See [Union Documentation](./docs/UNION.md) for union schemas and type handling.

#### Record Validation

```typescript
import { record, string, number } from 'validator';

const schema = record(string(), number().min(0).max(100));
```

See [Record Documentation](./docs/RECORD.md) for dynamic key-value validation.

## Schema Methods

All schemas support common methods:

- `parse(data)` - Parse data and throw on validation error
- `safeParse(data)` - Parse data and return `{ success, data/errors }`
- `validate(data)` - Validate and return detailed errors
- `toJSON()` - Convert to HTML attributes
- `default(value)` - Set default value
- `optional()` - Allow undefined
- `nullable()` - Allow null
- `required(flag, message?)` - Set required state

See individual documentation files for schema-specific methods.

## Error Handling

Validation errors are returned in `safeParse()` results:

```typescript
const result = schema.safeParse(data);
if (!result.success) {
  result.errors.forEach(error => {
    console.log(error.path, error.message, error.code);
  });
}
```

Error codes: `invalid_type`, `pattern`, `min_length`, `max_length`, `min`, `max`, `invalid_email`, `invalid_url`, etc.

See individual documentation files for schema-specific error codes.

## Form Integration

Schemas generate HTML attributes automatically:

```typescript
const schema = string().minLength(3).maxLength(50);
const htmlAttrs = schema.toJSON();
// { type: 'text', minLength: 3, maxLength: 50, required: true }
```

See individual documentation files for form integration examples.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

[GitHub Repository](https://github.com/Milimas/validator)

