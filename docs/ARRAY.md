# ArraySchema

Array schema for validating collections of homogeneous typed items.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
  - [Length Constraints](#length-constraints)
    - [`minLength(min: number, message?: string)`](#minlengthmin-number-message-string)
    - [`maxLength(max: number, message?: string)`](#maxlengthmax-number-message-string)
- [Common Patterns](#common-patterns)
  - [Tag Validation](#tag-validation)
  - [Email List Validation](#email-list-validation)
  - [Checkbox Group Validation](#checkbox-group-validation)
  - [Product List Validation](#product-list-validation)
- [Nested Arrays](#nested-arrays)
  - [Array of Arrays](#array-of-arrays)
  - [Array of Objects](#array-of-objects)
- [Error Handling](#error-handling)
  - [Error Paths](#error-paths)
- [HTML Attributes](#html-attributes)
- [Validation Error Codes](#validation-error-codes)
- [Complex Examples](#complex-examples)
  - [Form Submission with Multiple Items](#form-submission-with-multiple-items)
  - [Safe Parsing with Detailed Error Reporting](#safe-parsing-with-detailed-error-reporting)
- [Performance Considerations](#performance-considerations)
- [Related](#related)

## Overview

`ArraySchema` provides comprehensive validation for arrays/lists by applying a single item schema to every element in the array. Ensures type consistency and enables validation of collections of objects, strings, numbers, or any other SchemaType.

## Features

- Type-safe array element validation
- Min/max length constraints on array size
- Individual error reporting per array element with index
- Support for nested arrays and complex item types
- Automatic HTML form attribute generation
- Method chaining for fluent API usage

## Basic Usage

```typescript
import { array, string } from 'validator';

const schema = array(string())
  .minLength(1)
  .maxLength(10);

const result = schema.parse(['hello', 'world']);
```

## API Methods

### Length Constraints

#### `minLength(min: number, message?: string)`
Sets the minimum number of items allowed in the array.

```typescript
const schema = array(string())
  .minLength(1, 'At least one item is required');

schema.parse([]);           // Throws: At least one item is required
schema.parse(['item']);     // ✓ Valid
schema.parse(['a', 'b']);   // ✓ Valid
```

#### `maxLength(max: number, message?: string)`
Sets the maximum number of items allowed in the array.

```typescript
const schema = array(string())
  .maxLength(10, 'Maximum 10 items allowed');

schema.parse(['a', 'b', 'c']);     // ✓ Valid
schema.parse(new Array(11).fill('x')); // Throws: Maximum 10 items allowed
```

## Common Patterns

### Tag Validation
```typescript
import { array, string } from 'validator';

const tagsSchema = array(string().minLength(2).maxLength(20))
  .minLength(1, 'At least one tag required')
  .maxLength(10, 'Maximum 10 tags allowed');

tagsSchema.parse(['javascript', 'typescript', 'nodejs']); // ✓ Valid
tagsSchema.parse([]);                                     // Throws: At least one tag required
tagsSchema.parse(['a']);                                  // Throws: Tag too short
```

### Email List Validation
```typescript
import { array, email } from 'validator';

const emailListSchema = array(email())
  .minLength(1)
  .maxLength(100);

emailListSchema.parse([
  'user1@example.com',
  'user2@example.com'
]); // ✓ Valid
```

### Checkbox Group Validation
```typescript
import { array, enum as enumSchema } from 'validator';

const permissionsSchema = array(
  enumSchema(['read', 'write', 'delete'] as const)
).minLength(1, 'Select at least one permission');

permissionsSchema.parse(['read', 'write']); // ✓ Valid
permissionsSchema.parse([]);                // Throws
```

### Product List Validation
```typescript
import { array, object, string, number } from 'validator';

const productListSchema = array(
  object({
    id: number().int().min(1),
    name: string().minLength(3),
    price: number().min(0),
  })
).minLength(1).maxLength(100);

productListSchema.parse([
  { id: 1, name: 'Product A', price: 19.99 },
  { id: 2, name: 'Product B', price: 29.99 },
]); // ✓ Valid
```

## Nested Arrays

### Array of Arrays
```typescript
import { array, string } from 'validator';

const matrix = array(
  array(string())
).maxLength(10);

matrix.parse([
  ['a', 'b', 'c'],
  ['d', 'e', 'f'],
]); // ✓ Valid
```

### Array of Objects
```typescript
import { array, object, string, number, email } from 'validator';

const usersSchema = array(
  object({
    id: number().int(),
    name: string().minLength(2),
    email: email(),
  })
).minLength(1).maxLength(1000);

usersSchema.parse([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
  },
]); // ✓ Valid
```

## Error Handling

Array validation provides detailed error information with array indices:

```typescript
import { array, string, number } from 'validator';

const schema = array(string().minLength(3));

const result = schema.safeParse(['hello', 'ab', 'world']);

if (!result.success) {
  result.errors.forEach(error => {
    // Error path includes array index: [1]
    console.log(`${error.path.join('.')}: ${error.message}`);
  });
}
```

### Error Paths
```typescript
import { array, object, string } from 'validator';

const schema = array(
  object({
    name: string().minLength(3),
  })
);

const result = schema.safeParse([
  { name: 'Valid' },
  { name: 'ab' }, // Error at index 1
  { name: 'Valid' },
]);

// Error path: [1].name - indicates item at index 1, property name
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { array, string } from 'validator';

const schema = array(string())
  .minLength(1)
  .maxLength(10);

const attrs = schema.toJSON();
// {
//   type: 'array',
//   items: [{ type: 'text', required: true }],
//   minLength: 1,
//   maxLength: 10
// }
```

## Validation Error Codes

- `invalid_type` - Input is not an array
- `too_small` - Array has fewer items than minLength
- `too_big` - Array has more items than maxLength
- (Plus errors from individual item validation)

## Complex Examples

### Form Submission with Multiple Items
```typescript
import { object, array, string, number, email, boolean } from 'validator';

const orderSchema = object({
  customerId: number().int(),
  customerEmail: email(),
  items: array(
    object({
      productId: number().int(),
      name: string().minLength(2),
      quantity: number().int().min(1).max(1000),
      price: number().min(0),
    })
  ).minLength(1, 'Order must contain at least one item')
   .maxLength(100, 'Order cannot contain more than 100 items'),
  
  notes: string().maxLength(500).optional(),
  
  shippingAddress: array(string()).minLength(1).maxLength(5),
});

const order = orderSchema.parse({
  customerId: 123,
  customerEmail: 'customer@example.com',
  items: [
    { productId: 1, name: 'Widget', quantity: 2, price: 19.99 },
    { productId: 2, name: 'Gadget', quantity: 1, price: 29.99 },
  ],
  notes: 'Rush delivery if possible',
  shippingAddress: [
    '123 Main St',
    'Apt 4B',
    'New York, NY 10001',
  ],
});
```

### Safe Parsing with Detailed Error Reporting
```typescript
import { array, object, string, number, email } from 'validator';

const schema = array(
  object({
    email: email(),
    age: number().int().min(18),
  })
);

const userInput = [
  { email: 'user1@example.com', age: 25 },
  { email: 'invalid-email', age: 30 },
  { email: 'user3@example.com', age: 17 },
];

const result = schema.safeParse(userInput);

if (!result.success) {
  result.errors.forEach(error => {
    const path = error.path.join('.');
    console.error(`${path}: ${error.message}`);
  });
  // Output:
  // [1].email: Invalid email format
  // [2].age: Number must be greater than or equal to 18
}
```

## Performance Considerations

- Arrays validate each item sequentially
- For large arrays, errors from all items are collected and reported
- Consider using `.maxLength()` to prevent validation of extremely large arrays

## Related

- [Object Documentation](./OBJECT.md) - For objects containing arrays
- [String Documentation](./STRING.md) - For string validation
- [Number Documentation](./NUMBER.md) - For numeric validation
- [Union Documentation](./UNION.md) - For union types in arrays
