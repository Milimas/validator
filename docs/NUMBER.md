# NumberSchema

Numeric validation schema for integer and floating-point number validation.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Basic Usage](#basic-usage)
- [API Methods](#api-methods)
  - [Value Constraints](#value-constraints)
    - [`min(value: number, message?: string)`](#minvalue-number-message-string)
    - [`max(value: number, message?: string)`](#maxvalue-number-message-string)
  - [Type Constraints](#type-constraints)
    - [`int()`](#int)
- [Common Patterns](#common-patterns)
  - [Age Validation](#age-validation)
  - [Price Validation](#price-validation)
  - [Rating Validation](#rating-validation)
  - [Quantity Validation](#quantity-validation)
  - [Percentage Validation](#percentage-validation)
- [Type Safety](#type-safety)
  - [Strict Type Checking](#strict-type-checking)
- [HTML Attributes](#html-attributes)
- [Validation Error Codes](#validation-error-codes)
- [Advanced Usage](#advanced-usage)
  - [Form Validation](#form-validation)
  - [Safe Parsing](#safe-parsing)
- [Related](#related)

## Overview

`NumberSchema` provides comprehensive validation for numeric values with support for min/max constraints. Essential for form fields involving quantities, prices, ratings, ages, and any numeric input. Automatically rejects NaN and enforces strict numeric type checking.

## Features

- Strict type validation (rejects strings, booleans, NaN)
- Min/max value constraints
- Support for both integers and decimals
- HTML5 number input compatibility
- Custom error messages
- Integer-only validation option
- Method chaining for fluent API usage

## Basic Usage

```typescript
import { number } from 'validator';

const schema = number()
  .min(0)
  .max(100)
  .default(0);

const result = schema.parse(50);
```

## API Methods

### Value Constraints

#### `min(value: number, message?: string)`
Sets the minimum allowed value (inclusive).

```typescript
const schema = number().min(18, 'Must be 18 or older');

schema.parse(17);   // Throws: Must be 18 or older
schema.parse(18);   // ✓ Valid
schema.parse(25);   // ✓ Valid
```

#### `max(value: number, message?: string)`
Sets the maximum allowed value (inclusive).

```typescript
const schema = number().max(120, 'Invalid age');

schema.parse(121);  // Throws: Invalid age
schema.parse(120);  // ✓ Valid
schema.parse(50);   // ✓ Valid
```

### Type Constraints

#### `int()`
Restricts the value to integers only (no decimals).

```typescript
const schema = number().int().min(0).max(100);

schema.parse(42);    // ✓ Valid
schema.parse(42.5);  // Throws: Number must be an integer
```

## Common Patterns

### Age Validation
```typescript
import { number } from 'validator';

const ageSchema = number()
  .min(0, 'Age cannot be negative')
  .max(150, 'Age seems unrealistic')
  .int('Age must be a whole number');

ageSchema.parse(25);   // ✓ Valid
ageSchema.parse(-5);   // Throws: Age cannot be negative
ageSchema.parse(25.5); // Throws: Age must be a whole number
```

### Price Validation
```typescript
import { number } from 'validator';

const priceSchema = number()
  .min(0.01, 'Price must be greater than 0')
  .max(999999.99, 'Price is too high');

priceSchema.parse(19.99);  // ✓ Valid
priceSchema.parse(0);      // Throws: Price must be greater than 0
priceSchema.parse(1000000); // Throws: Price is too high
```

### Rating Validation
```typescript
import { number } from 'validator';

const ratingSchema = number()
  .min(1, 'Rating must be at least 1 star')
  .max(5, 'Rating cannot exceed 5 stars')
  .int('Rating must be a whole number');

ratingSchema.parse(4);   // ✓ Valid
ratingSchema.parse(4.5); // Throws: Rating must be a whole number
ratingSchema.parse(0);   // Throws: Rating must be at least 1 star
```

### Quantity Validation
```typescript
import { number } from 'validator';

const quantitySchema = number()
  .min(1, 'Quantity must be at least 1')
  .max(1000, 'Quantity cannot exceed 1000')
  .int();

quantitySchema.parse(50);   // ✓ Valid
quantitySchema.parse(0);    // Throws
quantitySchema.parse(1001); // Throws
```

### Percentage Validation
```typescript
import { number } from 'validator';

const percentSchema = number()
  .min(0, 'Percentage must be between 0 and 100')
  .max(100, 'Percentage must be between 0 and 100');

percentSchema.parse(50);    // ✓ Valid
percentSchema.parse(50.5);  // ✓ Valid
percentSchema.parse(101);   // Throws
```

## Type Safety

### Strict Type Checking
`NumberSchema` strictly validates that the input is a number type:

```typescript
const schema = number().min(0);

schema.parse(42);      // ✓ Valid
schema.parse(42.5);    // ✓ Valid
schema.parse('42');    // Throws: Invalid number
schema.parse(true);    // Throws: Invalid number
schema.parse(NaN);     // Throws: Invalid number
schema.parse(null);    // Throws: Invalid number
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { number } from 'validator';

const schema = number()
  .min(18)
  .max(100)
  .default(25);

const attrs = schema.toJSON();
// {
//   type: 'number',
//   min: 18,
//   max: 100,
//   defaultValue: 25,
//   required: true
// }
```

## Validation Error Codes

- `invalid_type` - Input is not a number
- `too_small` - Number is less than minimum
- `too_big` - Number is greater than maximum
- `not_integer` - Number is not an integer (when using `.int()`)

## Advanced Usage

### Form Validation
```typescript
import { object, string, number } from 'validator';

const productSchema = object({
  name: string().minLength(3),
  price: number().min(0.01),
  quantity: number().int().min(0),
  discount: number().min(0).max(100),
});

const product = productSchema.parse({
  name: 'Widget',
  price: 29.99,
  quantity: 10,
  discount: 15,
});
```

### Safe Parsing
```typescript
import { number } from 'validator';

const schema = number().min(0).max(100);

const result = schema.safeParse(userInput);

if (result.success) {
  console.log('Valid number:', result.data);
} else {
  result.errors.forEach(error => {
    console.log(`${error.path.join('.')}: ${error.message}`);
  });
}
```

## Related

- [String Documentation](./STRING.md) - For string-based validation
- [Boolean Documentation](./BOOLEAN.md) - For boolean validation
- [Array Documentation](./ARRAY.md) - For arrays of numbers
- [Object Documentation](./OBJECT.md) - For objects containing numbers
