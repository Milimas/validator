# Schema Base Classes

This document covers the foundational schema classes and wrappers that power the validator library. These are the building blocks that all specific schema types (String, Number, Object, etc.) extend from.

## Table of Contents

- [SchemaType Base Class](#schematype-base-class)
- [Schema Wrappers](#schema-wrappers)
  - [OptionalSchema](#optionalschema)
  - [NullableSchema](#nullableschema)
  - [DefaultSchema](#defaultschema)
  - [DependsOnSchema](#dependsonschema)
- [Special Schemas](#special-schemas)
  - [AnySchema](#anyschema)
  - [NeverSchema](#neverschema)
  - [UnknownSchema](#unknownschema)

---

## SchemaType Base Class

`SchemaType<Output, Input>` is the abstract base class that all validation schemas inherit from. It provides core validation functionality, HTML attribute generation, and type inference.

### Type Parameters

- **Output** - The TypeScript type produced after successful validation
- **Input** - The TypeScript type accepted as input (defaults to Output)

### Core Properties

#### `htmlAttributes`

```typescript
public abstract htmlAttributes: HTMLAttributes;
```

HTML attributes for rendering the schema as a form input element. Must be implemented by all concrete schema classes.

#### `_output` and `_input`

```typescript
readonly _output!: Output;
readonly _input!: Input;
```

Phantom type properties for TypeScript type inference. Not available at runtime - used only for compile-time type checking.

### Core Methods

#### `validate(data: unknown)`

Validates the provided data against this schema's rules. This abstract method must be implemented by all concrete schema classes.

```typescript
abstract validate(data: unknown): ValidationResult<Output>;
```

**Returns:** A ValidationResult containing either the validated data or validation errors.

#### `parse(data: unknown)`

Parses and validates data, throwing an error if validation fails.

```typescript
parse(data: unknown): Output
```

**Throws:** `ValidationAggregateError` if validation fails.

**Example:**

```typescript
import { email } from 'validator';

const emailSchema = email();
const validEmail = emailSchema.parse('user@example.com'); // Returns 'user@example.com'
emailSchema.parse('invalid'); // Throws ValidationAggregateError
```

#### `safeParse(data: unknown)`

Safely parses and validates data, returning a result object instead of throwing.

```typescript
safeParse(data: unknown): ValidationResult<Output>
```

**Returns:** A ValidationResult with success status and either validated data or errors.

**Example:**

```typescript
import { email } from 'validator';

const emailSchema = email();
const result = emailSchema.safeParse('user@example.com');

if (result.success) {
  console.log(result.data); // 'user@example.com'
} else {
  console.log(result.errors); // Array of validation errors
}
```

#### `toJSON()`

Serializes the schema to a JSON-compatible object of HTML attributes.

```typescript
toJSON(): HTMLAttributes
```

Handles special cases like RegExp patterns (converts to string source) and conditional dependencies (serializes functions to strings).

**Example:**

```typescript
import { string } from 'validator';

const schema = string().minLength(3).maxLength(10);
const attrs = schema.toJSON();
// { type: 'text', required: true, minLength: 3, maxLength: 10 }
```

### Modifier Methods

#### `optional()`

Marks this schema as optional, allowing undefined values.

```typescript
optional(): OptionalSchema<this>
```

Creates a new OptionalSchema wrapper that permits undefined, null, or empty string values to pass validation. Sets the required HTML attribute to false.

**Example:**

```typescript
import { email } from 'validator';

const optionalEmail = email().optional();
optionalEmail.parse(undefined); // Returns undefined (valid)
optionalEmail.parse('user@example.com'); // Returns 'user@example.com'
optionalEmail.parse('invalid'); // Throws error (invalid email)
```

#### `nullable()`

Marks this schema as nullable, allowing null values.

```typescript
nullable(): NullableSchema<this>
```

Creates a new NullableSchema wrapper that permits null values to pass validation while still validating non-null values against the original schema.

**Example:**

```typescript
import { number } from 'validator';

const nullableNumber = number().nullable();
nullableNumber.parse(null); // Returns null (valid)
nullableNumber.parse(42); // Returns 42 (valid)
nullableNumber.parse('text'); // Throws error (not a number)
```

#### `default(value: Output)`

Provides a default value for this schema when input is undefined or null.

```typescript
default(value: Output): DefaultSchema<this>
```

Creates a new DefaultSchema wrapper that automatically substitutes the provided default value when the input is undefined or null.

**Example:**

```typescript
import { string } from 'validator';

const nameSchema = string().default('Anonymous');
nameSchema.parse(undefined); // Returns 'Anonymous'
nameSchema.parse('John'); // Returns 'John'
```

#### `dependsOn(conditions)`

Makes this schema conditionally required based on other field values.

```typescript
dependsOn(conditions: [Condition, ...Condition[]]): DependsOnSchema<this>
```

Creates a new DependsOnSchema wrapper that adds conditional validation logic. The field becomes required only when the specified conditions are met.

**Example:**

```typescript
import { object, string, enum as enumSchema } from 'validator';

const schema = object({
  accountType: enumSchema(['personal', 'business'] as const),
  taxId: string().dependsOn([
    { field: 'accountType', condition: /^business$/ }
  ]),
});

// Tax ID is only required when accountType is 'business'
```

#### `required(required?, message?)`

Sets whether this field is required and customizes the required error message.

```typescript
required(required: boolean = true, message: string = "This field is required"): this
```

**Parameters:**
- `required` - Whether the field should be required (defaults to true)
- `message` - Custom error message for required validation failures

**Example:**

```typescript
import { string } from 'validator';

const nameSchema = string().required(true, 'Name is mandatory');
const optionalField = string().required(false);
```

#### `metadata(metadata)`

Adds custom attributes to the schema's HTML attributes.

```typescript
metadata(metadata: Record<string, unknown>): this
```

Useful for attaching additional information for form rendering or processing.

**Example:**

```typescript
import { string } from 'validator';

const schema = string().metadata({ 'info': 'extra', 'category': 'personal' });
// console.log(schema.toJSON().metadata); // { info: 'extra', category: 'personal' }
```

---

## Schema Wrappers

Schema wrappers are special classes that wrap existing schemas to modify their behavior without changing the underlying validation logic.

### OptionalSchema

`OptionalSchema<T>` makes any schema optional by permitting undefined, null, or empty string values while still validating non-empty values against the wrapped schema.

**Type Parameters:**
- `T` - The wrapped schema type

**Output Type:** `T["_output"] | undefined`

**Example:**

```typescript
import { OptionalSchema, email } from 'validator';

const optionalEmail = new OptionalSchema(email());
optionalEmail.parse(undefined); // Returns undefined
optionalEmail.parse('user@example.com'); // Returns 'user@example.com'
optionalEmail.parse('invalid'); // Throws error
```

**HTML Attributes:**

```typescript
const schema = string().optional();
schema.toJSON(); // { type: 'text', required: false, ... }
```

**Key Methods:**

- `validate(data)` - Returns success with undefined for empty values; otherwise delegates to inner schema
- `parse(data)` - Returns undefined for empty values or the validated data
- `safeParse(data)` - Returns ValidationResult with undefined or inner schema result
- `toJSON()` - Returns HTML attributes with `required: false`

---

### NullableSchema

`NullableSchema<T>` makes any schema nullable by permitting null values while still validating non-null values against the wrapped schema.

**Type Parameters:**
- `T` - The wrapped schema type

**Output Type:** `T["_output"] | null`

**Example:**

```typescript
import { NullableSchema, number } from 'validator';

const nullableNumber = new NullableSchema(number());
nullableNumber.parse(null); // Returns null
nullableNumber.parse(42); // Returns 42
nullableNumber.parse('text'); // Throws error
```

**Difference from Optional:**

```typescript
import { number } from 'validator';

// Optional allows undefined
const optional = number().optional();
optional.parse(undefined); // ✓ Returns undefined
optional.parse(null); // ✓ Returns null

// Nullable allows null
const nullable = number().nullable();
nullable.parse(null); // ✓ Returns null
nullable.parse(undefined); // ✗ Throws error (unless also made optional)

// Both together
const both = number().nullable().optional();
both.parse(null); // ✓ Returns null
both.parse(undefined); // ✓ Returns undefined
```

**Key Methods:**

- `validate(data)` - Returns success with null for null values; otherwise delegates to inner schema
- `parse(data)` - Returns null for null input or the validated data
- `safeParse(data)` - Returns ValidationResult with null or inner schema result

---

### DefaultSchema

`DefaultSchema<T>` provides a default value for undefined or null inputs. Automatically substitutes a specified default value when the input is undefined or null.

**Type Parameters:**
- `T` - The wrapped schema type

**Output Type:** `T["_output"]`
**Input Type:** `T["_input"] | undefined`

**Example:**

```typescript
import { DefaultSchema, string } from 'validator';

const nameSchema = new DefaultSchema(string(), 'Anonymous');
nameSchema.parse(undefined); // Returns 'Anonymous'
nameSchema.parse('John'); // Returns 'John'
```

**Common Patterns:**

```typescript
import { string, number, boolean, object } from 'validator';

// String with default
const username = string().default('guest');

// Number with default
const count = number().default(0);

// Boolean with default (checkboxes)
const subscribe = boolean().default(false);

// Object with defaults
const settings = object({
  theme: string().default('light'),
  fontSize: number().default(14),
  notifications: boolean().default(true),
});

settings.parse({}); 
// Returns: { theme: 'light', fontSize: 14, notifications: true }
```

**HTML Attributes:**

```typescript
const schema = string().default('Hello');
schema.toJSON(); 
// { type: 'text', required: true, defaultValue: 'Hello' }

// For checkboxes
const checked = boolean().default(true);
checked.toJSON();
// { type: 'checkbox', required: true, checked: true, defaultValue: true }
```

**Additional Methods:**

#### `readOnly(message?)`

Marks the schema as read-only with a custom error message.

```typescript
readOnly(message: string = "String is read-only"): this
```

Sets the readOnly HTML attribute to true. Useful for displaying pre-filled values that users should not modify.

**Example:**

```typescript
import { string } from 'validator';

const idField = string().default('AUTO-123').readOnly('ID cannot be changed');
idField.toJSON();
// { type: 'text', required: true, defaultValue: 'AUTO-123', readOnly: true }
```

---

### DependsOnSchema

`DependsOnSchema<T>` makes a field conditionally required based on other field values. Adds conditional validation logic where the field is only required when specified conditions are met.

**Type Parameters:**
- `T` - The wrapped schema type

**Output Type:** `T["_output"] | undefined`
**Input Type:** `T["_input"] | undefined`

**Condition Interface:**

```typescript
interface Condition {
  field: string;      // The field name to check
  condition: RegExp;  // Pattern that must match for requirement
}
```

**Example:**

```typescript
import { DependsOnSchema, string, object, enum as enumSchema } from 'validator';

const schema = object({
  accountType: enumSchema(['personal', 'business'] as const),
  taxId: string().dependsOn([
    { field: 'accountType', condition: /^business$/ }
  ]),
});

// Tax ID is only required when accountType is 'business'
schema.parse({ accountType: 'personal' }); // ✓ Valid (taxId not required)
schema.parse({ accountType: 'business' }); // ✗ Error (taxId required but missing)
schema.parse({ accountType: 'business', taxId: '12-3456789' }); // ✓ Valid
```

**Multiple Conditions:**

```typescript
import { object, string, boolean } from 'validator';

const contactSchema = object({
  hasPhone: boolean(),
  hasEmail: boolean(),
  contactInfo: string().dependsOn([
    { field: 'hasPhone', condition: /true/ },
    { field: 'hasEmail', condition: /true/ }
  ]),
});

// contactInfo is required when either hasPhone OR hasEmail is true
```

**HTML Attributes:**

```typescript
const schema = string().dependsOn([
  { field: 'userType', condition: /^premium$/ }
]);

schema.toJSON();
// {
//   type: 'text',
//   required: false,
//   'data-depends-on': [
//     { field: 'userType', condition: '^premium$' }
//   ]
// }
```

**Use Cases:**

1. **Business vs Personal Accounts**
```typescript
const businessInfo = string().dependsOn([
  { field: 'accountType', condition: /^business$/ }
]);
```

2. **Shipping Address (different from billing)**
```typescript
const shippingAddress = object({
  street: string(),
  city: string(),
  zip: string(),
}).dependsOn([
  { field: 'differentShipping', condition: /true/ }
]);
```

3. **Optional Details Based on Selection**
```typescript
const otherDetails = string().dependsOn([
  { field: 'category', condition: /^other$/ }
]);
```

---

## Special Schemas

These are utility schemas with specific validation behaviors.

### AnySchema

`AnySchema` accepts any input value without restrictions. Always returns a successful validation result.

**Type:** `any`

**Example:**

```typescript
import { any } from 'validator';

const anySchema = any();

anySchema.parse(42);              // ✓ Returns 42
anySchema.parse('Hello');         // ✓ Returns 'Hello'
anySchema.parse({ key: 'value' }); // ✓ Returns { key: 'value' }
anySchema.parse(null);            // ✓ Returns null
anySchema.parse(undefined);       // ✓ Returns undefined
```

**HTML Attributes:**

```typescript
anySchema.toJSON();
// { type: 'any', required: true, defaultValue: undefined }
```

**Use Cases:**

- Dynamic form fields with unknown types
- Passing through data without validation
- Placeholder schemas during development

---

### NeverSchema

`NeverSchema` rejects all input values without exception. Always returns a failed validation result.

**Type:** `never`

**Example:**

```typescript
import { never } from 'validator';

const neverSchema = never();

neverSchema.parse(42);              // ✗ Error: value is not allowed
neverSchema.parse('Hello');         // ✗ Error: value is not allowed
neverSchema.parse({ key: 'value' }); // ✗ Error: value is not allowed
neverSchema.parse(null);            // ✗ Error: value is not allowed
```

**Error Details:**

```typescript
const result = neverSchema.safeParse('anything');
// result.success === false
// result.errors[0].code === 'never_valid'
// result.errors[0].message === 'Value is not allowed'
```

**HTML Attributes:**

```typescript
neverSchema.toJSON();
// { type: 'never', required: true }
```

**Use Cases:**

- Representing impossible states
- Type-level constraints
- Exhaustiveness checking in TypeScript
- Disabled form fields that should never be submitted

---

### UnknownSchema

`UnknownSchema` accepts any input value without restrictions, similar to `AnySchema` but typed as `unknown` instead of `any`.

**Type:** `unknown`

**Example:**

```typescript
import { unknown } from 'validator';

const unknownSchema = unknown();

const value = unknownSchema.parse({ a: 1 }); 
// value is typed as unknown (safer than any)

// TypeScript requires type checking before use
if (typeof value === 'object' && value !== null) {
  // Now TypeScript knows value is an object
}
```

**Difference from Any:**

```typescript
import { any, unknown } from 'validator';

const anyValue = any().parse(42);
anyValue.toFixed(2); // ✓ TypeScript allows (unsafe)

const unknownValue = unknown().parse(42);
unknownValue.toFixed(2); // ✗ TypeScript error: unknownValue is unknown
if (typeof unknownValue === 'number') {
  unknownValue.toFixed(2); // ✓ Now TypeScript allows (safe)
}
```

**HTML Attributes:**

```typescript
unknownSchema.toJSON();
// { type: 'unknown', required: true, defaultValue: undefined }
```

**Use Cases:**

- Type-safe handling of unknown data
- API responses that need inspection
- User input that requires type checking
- Better than `any` for type safety

---

## Advanced Usage

### Chaining Modifiers

All modifier methods can be chained together:

```typescript
import { string, number, object } from 'validator';

const schema = object({
  // Optional with default
  username: string()
    .minLength(3)
    .optional()
    .default('guest'),
  
  // Nullable with default
  age: number()
    .min(0)
    .nullable()
    .default(null),
  
  // Conditional with metadata
  taxId: string()
    .pattern(/^\d{2}-\d{7}$/)
    .dependsOn([{ field: 'type', condition: /^business$/ }])
    .metadata({ 'data-sensitive': 'true' }),
  
  // Read-only default
  id: string()
    .default('AUTO')
    .readOnly('ID is auto-generated'),
});
```

### Type Inference with Wrappers

TypeScript correctly infers types through all wrapper layers:

```typescript
import { string, Infer } from 'validator';

const schema1 = string();
type T1 = Infer<typeof schema1>; // string

const schema2 = string().optional();
type T2 = Infer<typeof schema2>; // string | undefined

const schema3 = string().nullable();
type T3 = Infer<typeof schema3>; // string | null

const schema4 = string().default('hello');
type T4 = Infer<typeof schema4>; // string (default doesn't change output type)

const schema5 = string().nullable().optional();
type T5 = Infer<typeof schema5>; // string | null | undefined

const schema6 = string().dependsOn([{ field: 'x', condition: /y/ }]);
type T6 = Infer<typeof schema6>; // string | undefined
```

### Custom Schema Classes

You can extend `SchemaType` to create custom schemas:

```typescript
import { SchemaType, ValidationResult, ValidationError } from 'validator';

class ColorSchema extends SchemaType<string> {
  public htmlAttributes = {
    type: 'color' as const,
    required: true,
  };

  validate(data: unknown): ValidationResult<string> {
    if (typeof data !== 'string') {
      return ValidationResult.fail([
        new ValidationError([], 'Expected a string', 'invalid_type', 'string', typeof data, data)
      ]);
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(data)) {
      return ValidationResult.fail([
        new ValidationError([], 'Invalid hex color', 'pattern', '#RRGGBB', data, data)
      ]);
    }

    return ValidationResult.ok(data);
  }
}

// Use it
const colorSchema = new ColorSchema();
colorSchema.parse('#FF5733'); // ✓ '#FF5733'
colorSchema.parse('red'); // ✗ Error: Invalid hex color

// All modifiers work
const optionalColor = colorSchema.optional();
const defaultColor = colorSchema.default('#000000');
```

### Accessing Inner Schema

For wrapper schemas, you can access the wrapped schema if needed:

```typescript
import { string } from 'validator';

const base = string().minLength(5);
const optional = base.optional();

// The inner schema is available (though private in TypeScript)
// You can use methods that delegate to it
optional.toJSON(); // Returns combined attributes
```

---

## Related Documentation

- **[String Schema](./STRING.md)** - String validation with specialized types
- **[Number Schema](./NUMBER.md)** - Numeric validation
- **[Object Schema](./OBJECT.md)** - Object validation and composition
- **[Array Schema](./ARRAY.md)** - Array validation
- **[Boolean Schema](./BOOLEAN.md)** - Boolean validation
- **[Enum Schema](./ENUM.md)** - Enumeration validation
- **[Union Schema](./UNION.md)** - Union type validation
- **[Record Schema](./RECORD.md)** - Dynamic key-value validation

---

## Summary

The schema base classes provide:

- **SchemaType** - Abstract base class with `parse`, `safeParse`, `validate`, `toJSON`, and modifier methods
- **OptionalSchema** - Allows `undefined` values
- **NullableSchema** - Allows `null` values
- **DefaultSchema** - Provides default values for `undefined`/`null` inputs
- **DependsOnSchema** - Conditional requirements based on other fields
- **AnySchema** - Accepts all values (typed as `any`)
- **NeverSchema** - Rejects all values (typed as `never`)
- **UnknownSchema** - Accepts all values (typed as `unknown` for type safety)

All schemas support method chaining, type inference, and HTML attribute generation for seamless form integration.
