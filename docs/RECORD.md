# RecordSchema

Record schema for validating objects with dynamic string keys and uniform value types.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
  - [Simple Record (Default String Keys)](#simple-record-default-string-keys)
    - [Single parameter - valueSchema](#single-parameter---valueschema)
  - [Record with Key Constraints](#record-with-key-constraints)
    - [Two parameters - keySchema and valueSchema](#two-parameters---keyschema-and-valueschema)
- [Common Patterns](#common-patterns)
  - [User Scores](#user-scores)
  - [Configuration Object](#configuration-object)
  - [Feature Flags](#feature-flags)
  - [Translations/i18n](#translationsi18n)
  - [User Permissions](#user-permissions)
- [Nested Records](#nested-records)
  - [Record of Objects](#record-of-objects)
  - [Record of Records](#record-of-records)
  - [Record of Arrays](#record-of-arrays)
- [Error Handling](#error-handling)
  - [Key Validation Errors](#key-validation-errors)
  - [Value Validation Errors](#value-validation-errors)
- [HTML Attributes](#html-attributes)
- [Type Inference](#type-inference)
  - [TypeScript Support](#typescript-support)
- [Advanced Examples](#advanced-examples)
  - [Database Configuration](#database-configuration)
  - [API Endpoints](#api-endpoints)
  - [Theme Configuration](#theme-configuration)
- [Validation Error Codes](#validation-error-codes)
- [Related](#related)

## Overview

Similar to TypeScript's `Record<string, T>`, `RecordSchema` validates objects where:
- Keys are strings (can be constrained with keySchema)
- All values conform to the same valueSchema
- Useful for dictionaries, maps, and dynamic key-value structures

## Features

- Dynamic key-value validation
- Uniform value type enforcement
- Optional key schema for key constraints
- String key validation by default
- HTML form attribute generation
- Type-safe key-value mapping

## Basic Usage

```typescript
import { record, string, number } from 'validator';

// Simple record: string keys, numeric values
const scoresSchema = record(number().min(0).max(100));

const result = scoresSchema.parse({
  alice: 95,
  bob: 87,
  charlie: 92,
});
```

## API Methods

### Simple Record (Default String Keys)

#### Single parameter - valueSchema
When only one schema is provided, it's treated as the valueSchema and keys default to strings.

```typescript
import { record, number, string, object, boolean } from 'validator';

// Numeric values with default string keys
const scoresSchema = record(number().min(0).max(100));
scoresSchema.parse({ alice: 95, bob: 87 }); // ✓ Valid

// String values
const configSchema = record(string());
configSchema.parse({ theme: 'dark', lang: 'en' }); // ✓ Valid

// Object values
const settingsSchema = record(
  object({
    enabled: boolean(),
    value: string(),
  })
);
settingsSchema.parse({
  notifications: { enabled: true, value: 'all' },
  darkMode: { enabled: false, value: 'auto' },
}); // ✓ Valid
```

### Record with Key Constraints

#### Two parameters - keySchema and valueSchema
You can constrain keys with their own validation schema.

```typescript
import { record, string, number } from 'validator';

// Keys must match pattern, values are numbers
const configSchema = record(
  string().pattern(/^[a-z_]+$/),
  number()
);

configSchema.parse({
  max_retries: 3,
  timeout_ms: 5000,
  port_number: 8080,
}); // ✓ Valid

configSchema.parse({
  'MaxRetries': 3, // Invalid key format
  timeout_ms: 5000,
}); // ✗ Throws
```

## Common Patterns

### User Scores
```typescript
import { record, number } from 'validator';

const leaderboardSchema = record(number().min(0).max(1000));

leaderboardSchema.parse({
  player1: 1000,
  player2: 950,
  player3: 890,
}); // ✓ Valid
```

### Configuration Object
```typescript
import { record, string } from 'validator';

const configSchema = record(
  string().pattern(/^[a-z_]+$/), // Keys: lowercase with underscores
  string().minLength(1)           // Values: non-empty strings
);

configSchema.parse({
  database_url: 'postgresql://localhost/mydb',
  api_key: 'secret_key_123',
  jwt_secret: 'my_jwt_secret',
}); // ✓ Valid

configSchema.parse({
  'DatabaseURL': 'postgresql://localhost/mydb', // Invalid key
}); // ✗ Throws
```

### Feature Flags
```typescript
import { record, boolean } from 'validator';

const featureFlagsSchema = record(
  string().pattern(/^[a-z_]+$/),
  boolean()
);

featureFlagsSchema.parse({
  dark_mode: true,
  beta_features: false,
  analytics_enabled: true,
  new_ui: false,
}); // ✓ Valid
```

### Translations/i18n
```typescript
import { record, string } from 'validator';

const translationsSchema = record(
  string().pattern(/^[a-z]{2}(-[A-Z]{2})?$/), // e.g., en, en-US, fr, fr-CA
  string().minLength(1)
);

translationsSchema.parse({
  en: 'Hello',
  es: 'Hola',
  fr: 'Bonjour',
  de: 'Hallo',
  'zh-CN': '你好',
}); // ✓ Valid
```

### User Permissions
```typescript
import { record, boolean } from 'validator';

const permissionsSchema = record(
  string().pattern(/^[a-z_:]+$/), // Resource:action format
  boolean()
);

permissionsSchema.parse({
  'users:read': true,
  'users:write': false,
  'admin:read': true,
  'admin:write': false,
  'posts:delete': false,
}); // ✓ Valid
```

## Nested Records

### Record of Objects
```typescript
import { record, object, string, number } from 'validator';

const usersSchema = record(
  object({
    id: number().int(),
    name: string(),
    email: string(),
    age: number().min(0),
  })
);

usersSchema.parse({
  user_1: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
  user_2: { id: 2, name: 'Jane', email: 'jane@example.com', age: 28 },
}); // ✓ Valid
```

### Record of Records
```typescript
import { record, number } from 'validator';

// Matrix-like structure
const matrixSchema = record(record(number()));

matrixSchema.parse({
  row1: { col1: 1, col2: 2, col3: 3 },
  row2: { col1: 4, col2: 5, col3: 6 },
  row3: { col1: 7, col2: 8, col3: 9 },
}); // ✓ Valid
```

### Record of Arrays
```typescript
import { record, array, string } from 'validator';

const groupsSchema = record(array(string().minLength(1)));

groupsSchema.parse({
  admins: ['alice', 'bob'],
  moderators: ['charlie', 'diana'],
  users: ['eve', 'frank', 'grace'],
}); // ✓ Valid
```

## Error Handling

### Key Validation Errors
```typescript
import { record, string, number } from 'validator';

const schema = record(
  string().pattern(/^[a-z_]+$/),
  number()
);

const result = schema.safeParse({
  valid_key: 100,
  'InvalidKey': 200,
});

if (!result.success) {
  result.errors.forEach(error => {
    console.log(`${error.path.join('.')}: ${error.message}`);
  });
  // Output: InvalidKey: Key doesn't match pattern
}
```

### Value Validation Errors
```typescript
import { record, number } from 'validator';

const schema = record(number().min(0).max(100));

const result = schema.safeParse({
  alice: 95,
  bob: 150,  // Exceeds max
  charlie: -10, // Below min
});

if (!result.success) {
  result.errors.forEach(error => {
    console.log(`${error.path.join('.')}: ${error.message}`);
  });
}
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { record, string, number } from 'validator';

const schema = record(
  string().pattern(/^[a-z_]+$/),
  number().min(0).max(100)
);

const attrs = schema.toJSON();
// {
//   type: 'record',
//   keySchema: { type: 'text', pattern: '[a-z_]+', required: true },
//   valueSchema: { type: 'number', min: 0, max: 100, required: true },
//   required: true
// }
```

## Type Inference

### TypeScript Support

```typescript
import { record, number, string, Infer } from 'validator';

const scoreSchema = record(number().min(0).max(100));
type Scores = Infer<typeof scoreSchema>;
// Scores = Record<string, number>

const configSchema = record(
  string().pattern(/^[a-z_]+$/),
  string()
);
type Config = Infer<typeof configSchema>;
// Config = Record<string, string>
```

## Advanced Examples

### Database Configuration
```typescript
import { record, object, string, number } from 'validator';

const databasesSchema = record(
  object({
    host: string(),
    port: number().int().min(1).max(65535),
    database: string(),
    user: string(),
    password: string(),
  })
);

databasesSchema.parse({
  production: {
    host: 'prod-db.example.com',
    port: 5432,
    database: 'myapp_prod',
    user: 'prod_user',
    password: 'prod_pass',
  },
  staging: {
    host: 'staging-db.example.com',
    port: 5432,
    database: 'myapp_staging',
    user: 'staging_user',
    password: 'staging_pass',
  },
  development: {
    host: 'localhost',
    port: 5432,
    database: 'myapp_dev',
    user: 'dev_user',
    password: 'dev_pass',
  },
}); // ✓ Valid
```

### API Endpoints
```typescript
import { record, object, string, array, enum as enumSchema } from 'validator';

const endpointsSchema = record(
  string().pattern(/^\/[a-z/]*$/), // REST path pattern
  object({
    method: enumSchema(['GET', 'POST', 'PUT', 'DELETE'] as const),
    description: string(),
    requiresAuth: boolean().default(false),
  })
);

endpointsSchema.parse({
  '/users': {
    method: 'GET',
    description: 'List all users',
    requiresAuth: true,
  },
  '/users/:id': {
    method: 'GET',
    description: 'Get user by ID',
    requiresAuth: true,
  },
  '/auth/login': {
    method: 'POST',
    description: 'Login user',
    requiresAuth: false,
  },
}); // ✓ Valid
```

### Theme Configuration
```typescript
import { record, object, string } from 'validator';

const themeSchema = record(
  object({
    primary: string().pattern(/^#[0-9A-F]{6}$/i),
    secondary: string().pattern(/^#[0-9A-F]{6}$/i),
    background: string().pattern(/^#[0-9A-F]{6}$/i),
    text: string().pattern(/^#[0-9A-F]{6}$/i),
  })
);

themeSchema.parse({
  light: {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    background: '#FFFFFF',
    text: '#000000',
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#30B0C0',
    background: '#000000',
    text: '#FFFFFF',
  },
}); // ✓ Valid
```

## Validation Error Codes

- `invalid_type` - Input is not an object
- `invalid_record_key` - Key doesn't match keySchema
- `invalid_record_value` - Value doesn't match valueSchema
- (Plus errors from key and value schema validation)

## Related

- [Object Documentation](./OBJECT.md) - For fixed-property objects
- [String Documentation](./STRING.md) - For key/value validation
- [Number Documentation](./NUMBER.md) - For numeric values
- [Array Documentation](./ARRAY.md) - For arrays as values
