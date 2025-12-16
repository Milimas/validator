# ObjectSchema

Composite schema for validating object structures with typed properties.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
  - [Composition Methods](#composition-methods)
    - [`extend(...schemas: ObjectSchema[])`](#extendschemas-objectschema)
    - [`omit(...keys: (keyof Shape)[])`](#omitkeys-keyof-shape)
    - [`pick(...keys: (keyof Shape)[])`](#pickkeys-keyof-shape)
  - [Chaining Composition Methods](#chaining-composition-methods)
- [Nested Objects](#nested-objects)
  - [Basic Nesting](#basic-nesting)
  - [Deep Nesting](#deep-nesting)
- [Complex Examples](#complex-examples)
  - [User Registration Form](#user-registration-form)
  - [Product Catalog with Dynamic Fields](#product-catalog-with-dynamic-fields)
- [Error Handling](#error-handling)
- [Optional and Nullable Properties](#optional-and-nullable-properties)
  - [Optional Properties](#optional-properties)
  - [Nullable Properties](#nullable-properties)
- [Validation Error Codes](#validation-error-codes)
- [Type Inference](#type-inference)
- [Related](#related)

## Overview

`ObjectSchema` provides comprehensive validation for complex object types by composing multiple property schemas together. Each property in the object is validated according to its defined schema, enabling type-safe validation of nested and complex data structures.

## Features

- Type-safe property validation with full TypeScript inference
- Nested object support for multi-level data structures
- Individual error reporting per property with path information
- Automatic HTML form attribute generation
- Method chaining for fluent API usage
- Support for default values and optional properties
- Powerful schema composition methods (extend, omit, pick)

## Basic Usage

```typescript
import { object, string, number, email } from 'validator';

const userSchema = object({
  name: string().minLength(2),
  email: email(),
  age: number().min(18),
});

const result = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
});
```

## API Methods

### Composition Methods

#### `extend(...schemas: ObjectSchema[])`
Merges multiple object schemas into one, combining all properties. All validation rules are preserved.

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

// Single schema
const userSchema = userBase.extend(contactInfo);

// Multiple schemas at once
const preferences = object({ newsletter: boolean() });
const metadata = object({ createdAt: string() });

const fullSchema = userBase.extend(contactInfo, preferences, metadata);

const result = fullSchema.parse({
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  phone: '+1234567890',
  newsletter: true,
  createdAt: '2024-01-01',
}); // ✓ Valid
```

#### `omit(...keys: (keyof Shape)[])`
Removes specified keys from the object schema and forbids them in validation.

```typescript
import { object, string, number } from 'validator';

const baseSchema = object({
  id: number().int(),
  name: string(),
  password: string(),
  email: string(),
});

// Remove sensitive fields
const publicSchema = baseSchema.omit('password', 'email');

publicSchema.parse({ id: 1, name: 'John' }); // ✓ Valid

// Including omitted keys will fail
publicSchema.parse({
  id: 1,
  name: 'John',
  password: 'secret', // ✗ Unexpected property
}); // Throws
```

#### `pick(...keys: (keyof Shape)[])`
Keeps only specified keys and rejects all others.

```typescript
import { object, string, number, email } from 'validator';

const userSchema = object({
  id: number().int(),
  username: string(),
  email: email(),
  password: string(),
  createdAt: string(),
});

// Keep only specific fields
const loginSchema = userSchema.pick('username', 'email');

loginSchema.parse({
  username: 'john_doe',
  email: 'john@example.com',
}); // ✓ Valid

// Other keys are rejected
loginSchema.parse({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secret',
}); // ✗ Throws: Unexpected property
```

### Chaining Composition Methods

You can chain composition methods for complex schemas:

```typescript
import { object, string, number, boolean } from 'validator';

const baseSchema = object({
  id: number(),
  name: string(),
  email: string(),
  age: number(),
  newsletter: boolean(),
  phone: string(),
});

const customSchema = baseSchema
  .extend(object({ country: string() }))
  .omit('age', 'phone')
  .pick('id', 'name', 'email', 'newsletter', 'country');

// Result: { id, name, email, newsletter, country }
```

## Nested Objects

### Basic Nesting
```typescript
import { object, string, number, email } from 'validator';

const addressSchema = object({
  street: string().minLength(3),
  city: string().minLength(2),
  zipCode: string().pattern(/^\d{5}$/),
});

const userSchema = object({
  name: string(),
  email: email(),
  address: addressSchema,
});

userSchema.parse({
  name: 'John',
  email: 'john@example.com',
  address: {
    street: '123 Main Street',
    city: 'New York',
    zipCode: '10001',
  },
}); // ✓ Valid
```

### Deep Nesting
```typescript
import { object, string, number } from 'validator';

const companySchema = object({
  name: string(),
  address: object({
    street: string(),
    country: object({
      name: string(),
      code: string(),
    }),
  }),
});

companySchema.parse({
  name: 'Acme Corp',
  address: {
    street: '456 Oak Ave',
    country: {
      name: 'United States',
      code: 'US',
    },
  },
}); // ✓ Valid
```

## Complex Examples

### User Registration Form
```typescript
import { object, string, number, email, boolean, array } from 'validator';

const registrationSchema = object({
  personalInfo: object({
    firstName: string().minLength(2),
    lastName: string().minLength(2),
    dateOfBirth: string(),
  }),
  
  contactInfo: object({
    email: email(),
    phone: string().pattern(/^\+?[0-9]{10,}$/),
  }),
  
  accountInfo: object({
    username: string().minLength(3).maxLength(20),
    password: string().minLength(8),
  }),
  
  preferences: object({
    newsletter: boolean().default(false),
    notifications: boolean().default(true),
  }),
  
  tags: array(string().minLength(2)).maxLength(5),
});

const user = registrationSchema.parse({
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
  },
  contactInfo: {
    email: 'john@example.com',
    phone: '+1234567890',
  },
  accountInfo: {
    username: 'johndoe',
    password: 'SecurePass123',
  },
  preferences: {
    newsletter: true,
    notifications: false,
  },
  tags: ['developer', 'typescript'],
}); // ✓ Valid
```

### Product Catalog with Dynamic Fields
```typescript
import { object, string, number, array, enum as enumSchema } from 'validator';

const productSchema = object({
  id: number().int(),
  name: string().minLength(3),
  description: string().maxLength(1000),
  
  pricing: object({
    basePrice: number().min(0.01),
    currency: enumSchema(['USD', 'EUR', 'GBP'] as const),
    discount: number().min(0).max(100).optional(),
  }),
  
  inventory: object({
    quantity: number().int().min(0),
    sku: string().pattern(/^[A-Z0-9-]+$/),
    warehouse: string(),
  }),
  
  categories: array(string()).minLength(1).maxLength(5),
  
  specifications: array(
    object({
      name: string(),
      value: string(),
    })
  ),
});

const product = productSchema.parse({
  id: 1,
  name: 'Premium Widget',
  description: 'A high-quality widget for all your needs',
  pricing: {
    basePrice: 99.99,
    currency: 'USD',
    discount: 10,
  },
  inventory: {
    quantity: 500,
    sku: 'WIDGET-001',
    warehouse: 'NYC-01',
  },
  categories: ['Electronics', 'Premium'],
  specifications: [
    { name: 'Color', value: 'Black' },
    { name: 'Weight', value: '2.5kg' },
  ],
}); // ✓ Valid
```

## Error Handling

Object validation provides detailed error information with property paths:

```typescript
import { object, string, number } from 'validator';

const schema = object({
  user: object({
    name: string().minLength(3),
    age: number().min(18),
  }),
});

const result = schema.safeParse({
  user: {
    name: 'Jo',     // Too short
    age: 25,
  },
});

if (!result.success) {
  result.errors.forEach(error => {
    // Error path: ['user', 'name']
    console.log(`${error.path.join('.')}: ${error.message}`);
    // Output: user.name: String is too short
  });
}
```

## Optional and Nullable Properties

### Optional Properties
```typescript
import { object, string } from 'validator';

const profileSchema = object({
  name: string(),
  nickname: string().optional(), // Can be undefined
});

profileSchema.parse({ name: 'John' }); // ✓ Valid
profileSchema.parse({ name: 'John', nickname: 'Johnny' }); // ✓ Valid
profileSchema.parse({ name: 'John', nickname: undefined }); // ✓ Valid
```

### Nullable Properties
```typescript
import { object, string } from 'validator';

const profileSchema = object({
  name: string(),
  middleName: string().nullable(), // Can be null
});

profileSchema.parse({ name: 'John', middleName: null }); // ✓ Valid
profileSchema.parse({ name: 'John', middleName: 'Robert' }); // ✓ Valid
```

## Validation Error Codes

- `invalid_type` - Input is not an object
- `unexpected_property` - Object has unexpected property
- `invalid_object` - Object is null or array
- (Plus errors from property validation)

## Type Inference

```typescript
import { object, string, number, email, Infer } from 'validator';

const userSchema = object({
  name: string(),
  age: number(),
  email: email(),
});

type User = Infer<typeof userSchema>;
// User = {
//   name: string;
//   age: number;
//   email: string;
// }
```

## Related

- [Array Documentation](./ARRAY.md) - For arrays of objects
- [String Documentation](./STRING.md) - For string properties
- [Number Documentation](./NUMBER.md) - For numeric properties
- [Boolean Documentation](./BOOLEAN.md) - For boolean properties
- [Record Documentation](./RECORD.md) - For dynamic key-value objects
