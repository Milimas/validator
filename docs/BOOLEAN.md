# BooleanSchema

Boolean schema for validating true/false values and checkbox inputs.

## Overview

`BooleanSchema` provides validation for boolean values with HTML5 checkbox input type attributes. Essential for feature toggles, agreement checkboxes, and any binary choice fields in forms. Supports default values and integrates seamlessly with form builders.

## Features

- Strict type validation (only true/false allowed)
- HTML5 checkbox input compatibility
- Support for checked/unchecked states
- Default value configuration
- Lightweight validation with minimal overhead
- Method chaining for fluent API usage

## Basic Usage

```typescript
import { boolean } from 'validator';

const schema = boolean().default(false);

const result = schema.parse(true);
```

## API Methods

### Default Values

#### `default(value: boolean)`
Sets a default value when the field is undefined.

```typescript
const schema = boolean().default(true);

schema.parse(undefined); // Returns: true
schema.parse(false);     // Returns: false
schema.parse(true);      // Returns: true
```

### Required/Optional

#### `required(isRequired?: boolean, message?: string)`
Sets whether the field is required.

```typescript
const schema = boolean()
  .required(true, 'You must agree to continue');

schema.parse(undefined); // Throws if undefined
schema.parse(false);     // Throws: You must agree to continue
schema.parse(true);      // ✓ Valid
```

## Common Patterns

### Terms and Conditions Checkbox
```typescript
import { boolean } from 'validator';

const termsSchema = boolean()
  .required(true, 'You must agree to the terms and conditions');

termsSchema.parse(true);  // ✓ Valid
termsSchema.parse(false); // Throws: User must agree
termsSchema.parse(undefined); // Throws: User must agree
```

### Feature Toggle
```typescript
import { boolean } from 'validator';

const featureSchema = boolean().default(false);

featureSchema.parse(true);      // ✓ Valid
featureSchema.parse(false);     // ✓ Valid
featureSchema.parse(undefined); // Returns: false (default)
```

### Newsletter Subscription (Optional)
```typescript
import { boolean } from 'validator';

const newsletterSchema = boolean()
  .default(false)
  .optional();

newsletterSchema.parse(true);      // ✓ Valid
newsletterSchema.parse(false);     // ✓ Valid
newsletterSchema.parse(undefined); // Returns: false (default)
```

## Type Safety

### Strict Type Checking
`BooleanSchema` strictly validates that the input is a boolean type. Truthy/falsy values are rejected:

```typescript
const schema = boolean();

schema.parse(true);      // ✓ Valid
schema.parse(false);     // ✓ Valid
schema.parse(1);         // Throws: Invalid boolean
schema.parse(0);         // Throws: Invalid boolean
schema.parse('true');    // Throws: Invalid boolean
schema.parse('false');   // Throws: Invalid boolean
schema.parse(null);      // Throws: Invalid boolean
schema.parse(undefined); // Throws: Invalid boolean (unless optional)
```

## HTML Attributes

When converting a schema to JSON for form rendering:

```typescript
import { boolean } from 'validator';

const schema = boolean()
  .default(false)
  .required(true);

const attrs = schema.toJSON();
// {
//   type: 'checkbox',
//   checked: false,
//   defaultValue: false,
//   required: true
// }
```

## Validation Error Codes

- `invalid_type` - Input is not a boolean (e.g., string 'true', number 1)
- `required` - Required field is missing or undefined

## Complex Examples

### User Registration Form
```typescript
import { object, string, email, boolean } from 'validator';

const registrationSchema = object({
  email: email().required(),
  password: string().minLength(8).required(),
  confirmPassword: string().minLength(8).required(),
  agreeToTerms: boolean()
    .required(true, 'You must agree to the terms'),
  subscribeToNewsletter: boolean()
    .default(false),
  receiveNotifications: boolean()
    .default(true),
});

const user = registrationSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  agreeToTerms: true,
  subscribeToNewsletter: false,
  receiveNotifications: true,
});
```

### Preference Settings
```typescript
import { object, boolean } from 'validator';

const preferencesSchema = object({
  darkMode: boolean().default(false),
  enableNotifications: boolean().default(true),
  enableAnalytics: boolean().default(true),
  enableCookies: boolean().required(true, 'Cookie consent is required'),
});

const prefs = preferencesSchema.parse({
  darkMode: true,
  enableNotifications: false,
  enableAnalytics: true,
  enableCookies: true,
});
```

### Safe Parsing
```typescript
import { boolean } from 'validator';

const schema = boolean().required(true, 'This field is required');

const result = schema.safeParse(userInput);

if (result.success) {
  console.log('Valid boolean:', result.data);
} else {
  result.errors.forEach(error => {
    console.log(`${error.path.join('.')}: ${error.message}`);
  });
}
```

## Related

- [String Documentation](./STRING.md) - For string validation
- [Number Documentation](./NUMBER.md) - For numeric validation
- [Object Documentation](./OBJECT.md) - For objects containing booleans
- [Array Documentation](./ARRAY.md) - For arrays of booleans
