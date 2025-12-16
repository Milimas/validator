# UnionSchema

Union schema for validating data against multiple possible schemas.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [Common Patterns](#common-patterns)
  - [String or Number ID](#string-or-number-id)
  - [Email or Phone Number](#email-or-phone-number)
  - [Response Data (Success or Error)](#response-data-success-or-error)
- [Type Inference](#type-inference)
  - [Union of Specific Types](#union-of-specific-types)
  - [Complex Union Types](#complex-union-types)
- [Nested Unions](#nested-unions)
  - [Union of Objects](#union-of-objects)
  - [Union of Arrays](#union-of-arrays)
- [Nested in Objects](#nested-in-objects)
  - [API Response Handler](#api-response-handler)
  - [Flexible Configuration](#flexible-configuration)
- [Error Handling](#error-handling)
  - [Error Collection](#error-collection)
  - [Detailed Error Context](#detailed-error-context)
- [HTML Attributes](#html-attributes)
- [Validation Error Codes](#validation-error-codes)
- [Advanced Examples](#advanced-examples)
  - [Polymorphic Data Handler](#polymorphic-data-handler)
  - [GraphQL-like Query Responses](#graphql-like-query-responses)
- [Performance Considerations](#performance-considerations)
- [Related](#related)

## Overview

`UnionSchema` allows data to be validated against a set of different schemas, passing validation if it conforms to at least one of them. This is useful for scenarios where input data can take multiple valid forms or types.

## Features

- Flexible validation against multiple schema types
- Comprehensive error reporting from all attempted schemas
- TypeScript type inference for union types
- Automatic HTML form attribute generation from constituent schemas
- Support for any schema type in the union

## Basic Usage

```typescript
import { union, string, number, boolean } from 'validator';

const schema = union([
  string().minLength(3),
  number().min(0),
  boolean(),
]);

schema.parse('hello');   // ✓ Valid: matches string schema
schema.parse(42);        // ✓ Valid: matches number schema
schema.parse(true);      // ✓ Valid: matches boolean schema
schema.parse({});        // ✗ Throws: matches no schema
```

## Common Patterns

### String or Number ID
```typescript
import { union, string, number } from 'validator';

const idSchema = union([
  string().uuid(),
  number().int().min(1),
]);

idSchema.parse('550e8400-e29b-41d4-a716-446655440000'); // ✓ Valid UUID
idSchema.parse(12345);                                  // ✓ Valid number
idSchema.parse('invalid');                              // ✗ Throws
```

### Email or Phone Number
```typescript
import { union, email, string } from 'validator';

const contactSchema = union([
  email(),
  string().pattern(/^\+?[0-9]{10,}$/), // Phone number
]);

contactSchema.parse('user@example.com');  // ✓ Valid email
contactSchema.parse('+1234567890');       // ✓ Valid phone
contactSchema.parse('invalid');           // ✗ Throws
```

### Response Data (Success or Error)
```typescript
import { union, object, string, number } from 'validator';

const responseSchema = union([
  // Success response
  object({
    success: true,
    data: object({
      id: number().int(),
      message: string(),
    }),
  }),
  // Error response
  object({
    success: false,
    error: string(),
    code: number().int(),
  }),
]);

responseSchema.parse({
  success: true,
  data: { id: 1, message: 'Done' },
}); // ✓ Valid

responseSchema.parse({
  success: false,
  error: 'Not found',
  code: 404,
}); // ✓ Valid
```

## Type Inference

### Union of Specific Types

```typescript
import { union, string, number, boolean, Infer } from 'validator';

const schema = union([
  string().minLength(3),
  number().min(0),
  boolean(),
]);

type Value = Infer<typeof schema>;
// Value = string | number | boolean
```

### Complex Union Types

```typescript
import { union, object, string, number, array, Infer } from 'validator';

const dataSchema = union([
  object({ type: 'user', name: string(), age: number() }),
  object({ type: 'product', title: string(), price: number() }),
  object({ type: 'post', content: string(), likes: number() }),
  array(string()),
]);

type Data = Infer<typeof dataSchema>;
// Data = 
// | { type: 'user'; name: string; age: number }
// | { type: 'product'; title: string; price: number }
// | { type: 'post'; content: string; likes: number }
// | string[]
```

## Nested Unions

### Union of Objects
```typescript
import { union, object, string, number, enum as enumSchema } from 'validator';

const paymentSchema = union([
  object({
    method: 'credit_card',
    cardNumber: string().pattern(/^\d{16}$/),
    cvv: string().pattern(/^\d{3,4}$/),
  }),
  object({
    method: 'paypal',
    email: string(),
  }),
  object({
    method: 'bank_transfer',
    accountNumber: string(),
    routingNumber: string(),
  }),
]);

paymentSchema.parse({
  method: 'credit_card',
  cardNumber: '1234567890123456',
  cvv: '123',
}); // ✓ Valid
```

### Union of Arrays
```typescript
import { union, array, string, number, object } from 'validator';

const dataSchema = union([
  array(string()),
  array(number()),
  array(object({ id: number(), name: string() })),
]);

dataSchema.parse(['hello', 'world']);           // ✓ Valid
dataSchema.parse([1, 2, 3]);                    // ✓ Valid
dataSchema.parse([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
]); // ✓ Valid
```

## Nested in Objects

### API Response Handler
```typescript
import { object, union, string, number, array } from 'validator';

const apiResponseSchema = object({
  status: number().int(),
  data: union([
    object({ users: array(object({ id: number(), name: string() })) }),
    object({ posts: array(object({ id: number(), title: string() })) }),
    string(),
  ]),
});

apiResponseSchema.parse({
  status: 200,
  data: {
    users: [{ id: 1, name: 'John' }],
  },
}); // ✓ Valid
```

### Flexible Configuration
```typescript
import { object, union, string, number, boolean } from 'validator';

const configSchema = object({
  timeout: union([
    number().min(0),
    string().enum(['default', 'short', 'long'] as const),
  ]),
  retries: union([
    number().int().min(0).max(10),
    boolean(),
  ]),
  debug: boolean().default(false),
});

configSchema.parse({
  timeout: 5000,
  retries: 3,
  debug: true,
}); // ✓ Valid

configSchema.parse({
  timeout: 'short',
  retries: true,
  debug: false,
}); // ✓ Valid
```

## Error Handling

### Error Collection
```typescript
import { union, string, number } from 'validator';

const schema = union([
  string().minLength(5),
  number().min(100),
]);

const result = schema.safeParse('ab');

if (!result.success) {
  console.log('Validation failed:');
  result.errors.forEach(error => {
    console.log(`- ${error.message}`);
  });
  // Output:
  // - String is too short
  // - Invalid number
}
```

### Detailed Error Context
```typescript
import { union, object, string, number, email } from 'validator';

const contactSchema = union([
  object({
    type: 'email',
    email: email(),
  }),
  object({
    type: 'phone',
    phone: string().pattern(/^\+?[0-9]{10,}$/),
  }),
]);

const result = contactSchema.safeParse({
  type: 'email',
  email: 'invalid-email',
});

if (!result.success) {
  // Collect all errors from both schemas
  result.errors.forEach(error => {
    console.log(`Path: ${error.path.join('.')}, Message: ${error.message}`);
  });
}
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { union, string, number, boolean } from 'validator';

const schema = union([
  string().minLength(3),
  number().min(0),
  boolean(),
]);

const attrs = schema.toJSON();
// {
//   type: 'union',
//   required: true,
//   anyOf: [
//     { type: 'text', minLength: 3, required: true },
//     { type: 'number', min: 0, required: true },
//     { type: 'checkbox', checked: false, required: true }
//   ]
// }
```

## Validation Error Codes

- `invalid_union` - Input doesn't match any schema in the union
- (Plus errors from individual schema attempts)

## Advanced Examples

### Polymorphic Data Handler
```typescript
import { union, object, string, number, enum as enumSchema, array } from 'validator';

const eventSchema = union([
  object({
    type: 'user_signup',
    userId: number().int(),
    email: string(),
    timestamp: string(),
  }),
  object({
    type: 'user_login',
    userId: number().int(),
    ipAddress: string(),
    timestamp: string(),
  }),
  object({
    type: 'purchase',
    userId: number().int(),
    orderId: string(),
    amount: number().min(0),
    timestamp: string(),
  }),
  object({
    type: 'comment',
    userId: number().int(),
    postId: number().int(),
    content: string().minLength(1).maxLength(500),
    timestamp: string(),
  }),
]);

// Each event type is handled correctly
eventSchema.parse({
  type: 'user_signup',
  userId: 123,
  email: 'user@example.com',
  timestamp: '2024-01-01T10:00:00Z',
}); // ✓ Valid

eventSchema.parse({
  type: 'purchase',
  userId: 123,
  orderId: 'ORDER-456',
  amount: 99.99,
  timestamp: '2024-01-01T10:00:00Z',
}); // ✓ Valid
```

### GraphQL-like Query Responses
```typescript
import { union, object, array, string, number, boolean } from 'validator';

const userQuerySchema = union([
  // Single user
  object({
    data: object({
      id: number().int(),
      name: string(),
      email: string(),
    }),
  }),
  // Multiple users
  object({
    data: array(object({
      id: number().int(),
      name: string(),
      email: string(),
    })),
  }),
  // Error response
  object({
    error: string(),
    code: number().int(),
  }),
]);

// All valid responses are accepted
userQuerySchema.parse({
  data: { id: 1, name: 'John', email: 'john@example.com' },
}); // ✓ Valid

userQuerySchema.parse({
  data: [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ],
}); // ✓ Valid

userQuerySchema.parse({
  error: 'Unauthorized',
  code: 401,
}); // ✓ Valid
```

## Performance Considerations

- Union schemas attempt to validate against each schema sequentially
- The first matching schema is used (try order matters)
- For performance, order schemas from most specific to least specific
- All error information is collected for debugging

## Related

- [String Documentation](./STRING.md) - For string schemas in unions
- [Number Documentation](./NUMBER.md) - For numeric schemas in unions
- [Object Documentation](./OBJECT.md) - For object schemas in unions
- [Array Documentation](./ARRAY.md) - For array schemas in unions
