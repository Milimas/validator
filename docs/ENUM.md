# EnumSchema

Enumeration schema for validating against a fixed set of allowed values.

## Overview

`EnumSchema` provides type-safe validation that restricts input to one of a predefined set of string values. Ideal for dropdowns, radio buttons, status fields, and any categorical data with a finite set of valid options. Generates HTML select element attributes for form rendering.

## Features

- Type-safe enumeration with full TypeScript literal type inference
- Efficient lookup using Set-based validation (O(1))
- HTML5 select element compatibility
- Automatic options generation for form builders
- Clear error messages showing expected values
- Const generics for strict type checking

## Basic Usage

```typescript
import { enum as enumSchema } from 'validator';

const statusSchema = enumSchema(['active', 'inactive', 'pending'] as const);

const result = statusSchema.parse('active');
```

## API Methods

### Creating Enums

```typescript
import { enum as enumSchema } from 'validator';

// Basic enum
const roleSchema = enumSchema(['admin', 'user', 'guest'] as const);

// With explicit const assertion
const colors = ['red', 'green', 'blue'] as const;
const colorSchema = enumSchema(colors);

// Using as variable
const statuses = ['open', 'closed', 'pending'] as const;
const statusSchema = enumSchema(statuses);
```

## Common Patterns

### User Roles
```typescript
import { enum as enumSchema } from 'validator';

const roleSchema = enumSchema(['admin', 'moderator', 'user', 'guest'] as const);

roleSchema.parse('admin');   // ✓ Valid
roleSchema.parse('user');    // ✓ Valid
roleSchema.parse('owner');   // Throws: Must be one of: admin, moderator, user, guest
```

### Order Status
```typescript
import { enum as enumSchema } from 'validator';

const orderStatusSchema = enumSchema([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const);

orderStatusSchema.parse('processing'); // ✓ Valid
orderStatusSchema.parse('invalid');    // Throws
```

### Product Category
```typescript
import { enum as enumSchema } from 'validator';

const categorySchema = enumSchema([
  'electronics',
  'clothing',
  'food',
  'books',
  'home',
] as const);

categorySchema.parse('electronics'); // ✓ Valid
categorySchema.parse('furniture');   // Throws
```

### Priority Level
```typescript
import { enum as enumSchema } from 'validator';

const prioritySchema = enumSchema(['low', 'medium', 'high', 'urgent'] as const);

prioritySchema.parse('high');    // ✓ Valid
prioritySchema.parse('critical'); // Throws
```

### Payment Method
```typescript
import { enum as enumSchema } from 'validator';

const paymentMethodSchema = enumSchema([
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'cryptocurrency',
] as const);

paymentMethodSchema.parse('credit_card'); // ✓ Valid
paymentMethodSchema.parse('apple_pay');   // Throws
```

## Type Inference

### TypeScript Type Safety

```typescript
import { enum as enumSchema, Infer } from 'validator';

const statusSchema = enumSchema(['draft', 'published', 'archived'] as const);

type Status = Infer<typeof statusSchema>;
// Status = 'draft' | 'published' | 'archived'

// TypeScript will catch invalid values
const status: Status = 'draft';      // ✓ OK
const invalid: Status = 'invalid';   // ✗ Type error
```

## Nested in Objects

### User Model with Status
```typescript
import { object, string, number, email, enum as enumSchema } from 'validator';

const userSchema = object({
  id: number().int(),
  name: string(),
  email: email(),
  role: enumSchema(['admin', 'user', 'guest'] as const),
  status: enumSchema(['active', 'suspended', 'deleted'] as const),
});

userSchema.parse({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  status: 'active',
}); // ✓ Valid
```

### Product with Category and Status
```typescript
import { object, string, number, enum as enumSchema, array } from 'validator';

const productSchema = object({
  id: number().int(),
  name: string(),
  category: enumSchema([
    'electronics',
    'clothing',
    'home',
    'books',
  ] as const),
  status: enumSchema(['available', 'out_of_stock', 'discontinued'] as const),
  tags: array(string()),
});

productSchema.parse({
  id: 1,
  name: 'Laptop',
  category: 'electronics',
  status: 'available',
  tags: ['computer', 'tech'],
}); // ✓ Valid
```

## Arrays of Enums

### Multiple Selections
```typescript
import { array, enum as enumSchema } from 'validator';

const permissionsSchema = array(
  enumSchema(['read', 'write', 'delete', 'admin'] as const)
).minLength(1, 'Select at least one permission');

permissionsSchema.parse(['read', 'write']); // ✓ Valid
permissionsSchema.parse(['read']);          // ✓ Valid
permissionsSchema.parse([]);                // Throws
permissionsSchema.parse(['read', 'invalid']); // Throws
```

### Tags with Predefined Options
```typescript
import { array, enum as enumSchema } from 'validator';

const skillsSchema = array(
  enumSchema([
    'javascript',
    'typescript',
    'nodejs',
    'react',
    'python',
    'java',
  ] as const)
).minLength(1).maxLength(5);

skillsSchema.parse(['javascript', 'typescript', 'react']); // ✓ Valid
skillsSchema.parse(['javascript', 'rust']);               // Throws: rust not allowed
```

## Error Handling

### Safe Parsing with Error Details
```typescript
import { enum as enumSchema } from 'validator';

const roleSchema = enumSchema(['admin', 'user', 'guest'] as const);

const result = roleSchema.safeParse('moderator');

if (!result.success) {
  result.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);
    console.log(`Expected: ${error.expected}`);
    // Output:
    // Error: Invalid enum value
    // Code: invalid_enum
    // Expected: admin,user,guest
  });
}
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { enum as enumSchema } from 'validator';

const roleSchema = enumSchema(['admin', 'moderator', 'user', 'guest'] as const);

const attrs = roleSchema.toJSON();
// {
//   type: 'select',
//   options: ['admin', 'moderator', 'user', 'guest'],
//   required: true
// }
```

## Validation Error Codes

- `invalid_type` - Input is not a string
- `invalid_enum` - String is not one of the allowed values

## Advanced Examples

### Complex Form with Multiple Enums
```typescript
import { object, string, enum as enumSchema, number } from 'validator';

const jobApplicationSchema = object({
  fullName: string().minLength(2),
  
  position: enumSchema([
    'junior_developer',
    'senior_developer',
    'team_lead',
    'manager',
  ] as const),
  
  experience: enumSchema([
    'less_1_year',
    '1_3_years',
    '3_5_years',
    '5_10_years',
    'more_10_years',
  ] as const),
  
  yearsExperience: number().int().min(0),
  
  department: enumSchema([
    'engineering',
    'product',
    'design',
    'marketing',
  ] as const),
  
  salaryExpectation: enumSchema([
    'entry_level',
    'mid_level',
    'senior_level',
    'director_level',
  ] as const),
});

const application = jobApplicationSchema.parse({
  fullName: 'Jane Doe',
  position: 'senior_developer',
  experience: '5_10_years',
  yearsExperience: 7,
  department: 'engineering',
  salaryExpectation: 'senior_level',
}); // ✓ Valid
```

### Dynamic Configuration
```typescript
import { object, enum as enumSchema, boolean, string } from 'validator';

const configSchema = object({
  environment: enumSchema(['development', 'staging', 'production'] as const),
  logLevel: enumSchema(['debug', 'info', 'warn', 'error'] as const),
  database: enumSchema(['postgresql', 'mysql', 'mongodb'] as const),
  caching: enumSchema(['redis', 'memcached', 'none'] as const),
  debug: boolean().default(false),
  apiKey: string().optional(),
});

const config = configSchema.parse({
  environment: 'production',
  logLevel: 'warn',
  database: 'postgresql',
  caching: 'redis',
  debug: false,
}); // ✓ Valid
```

## Performance Notes

- EnumSchema uses Set-based lookup for O(1) validation performance
- Efficient for large enum values
- No performance degradation with schema complexity

## Related

- [String Documentation](./STRING.md) - For string validation
- [Array Documentation](./ARRAY.md) - For arrays of enum values
- [Object Documentation](./OBJECT.md) - For objects containing enums
- [Union Documentation](./UNION.md) - For multiple different types
