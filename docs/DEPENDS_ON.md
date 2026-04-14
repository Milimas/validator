# dependsOn

Conditional field requirement driven by a typed, composable rule tree.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [The Rule System](#the-rule-system)
  - [FieldCondition](#fieldcondition)
  - [AndGroup](#andgroup)
  - [OrGroup](#orgroup)
  - [Nesting Rules](#nesting-rules)
- [Path Syntax](#path-syntax)
  - [Root Path](#root-path)
  - [Sibling Path (`^.`)](#sibling-path-)
  - [Multi-level (`^.^.`, `^.^.^.`, …)](#multi-level-)
- [Condition Matching](#condition-matching)
- [Nested Structures](#nested-structures)
  - [Arrays](#arrays)
  - [Records](#records)
- [Error Behaviour](#error-behaviour)
- [Type Reference](#type-reference)

---

## Overview

`dependsOn` makes a field conditionally required: the field is only validated (and required) when its rule evaluates to `true`. When the rule is not satisfied the field is skipped entirely — its value is omitted from the parsed result.

```ts
field.dependsOn(rule: DependencyRule)
```

A `DependencyRule` is one of three shapes:

| Shape | When it passes |
|---|---|
| `FieldCondition` | The referenced field's value matches the pattern |
| `AndGroup` | **Every** sub-rule passes |
| `OrGroup` | **At least one** sub-rule passes |

Groups nest freely, so any boolean combination is expressible.

---

## Quick Start

```ts
import { object, string, boolean } from 'validator';

const schema = object({
  isEmployee: boolean(),
  employeeId: string().dependsOn(
    { field: '^.isEmployee', condition: /true/ }
  ),
});

// isEmployee is false → employeeId is not required, omitted from result
schema.parse({ isEmployee: false });
// → { isEmployee: false }

// isEmployee is true → employeeId becomes required
schema.parse({ isEmployee: true });
// → throws: employeeId is required

schema.parse({ isEmployee: true, employeeId: 'E-123' });
// → { isEmployee: true, employeeId: 'E-123' }
```

---

## The Rule System

### FieldCondition

The simplest rule. Checks that the value of a single field matches a pattern.

```ts
interface FieldCondition {
  field: string;        // path to the dependency field
  condition: RegExp | string;  // pattern to test against
}
```

```ts
// Required when the sibling field `role` equals "admin"
string().dependsOn({ field: '^.role', condition: /^admin$/ })

// Required when the root-level `plan` contains "business"
string().dependsOn({ field: 'plan', condition: /business/ })
```

---

### AndGroup

All conditions must be satisfied. Use this when a field is only relevant at the intersection of multiple states.

```ts
interface AndGroup {
  operator: 'and';
  conditions: [DependencyRule, ...DependencyRule[]];
}
```

```ts
// vatNumber is required only when plan=business AND region=EU
string().dependsOn({
  operator: 'and',
  conditions: [
    { field: '^.plan',   condition: /business/ },
    { field: '^.region', condition: /EU/ },
  ],
})
```

---

### OrGroup

At least one condition must be satisfied. Use this when several independent states all make a field relevant.

```ts
interface OrGroup {
  operator: 'or';
  conditions: [DependencyRule, ...DependencyRule[]];
}
```

```ts
// contactEmail is required when the user is an admin OR has notifications enabled
string().dependsOn({
  operator: 'or',
  conditions: [
    { field: '^.role',          condition: /admin/ },
    { field: '^.notifications', condition: /true/ },
  ],
})
```

---

### Nesting Rules

`AndGroup` and `OrGroup` accept any `DependencyRule` as sub-rules — including other groups. This lets you build arbitrarily complex conditions.

```ts
// (plan=business AND region=EU) OR role=admin
string().dependsOn({
  operator: 'or',
  conditions: [
    {
      operator: 'and',
      conditions: [
        { field: '^.plan',   condition: /business/ },
        { field: '^.region', condition: /EU/ },
      ],
    },
    { field: '^.role', condition: /admin/ },
  ],
})
```

```ts
// (tier=premium OR role=admin) AND notifications=true
string().dependsOn({
  operator: 'and',
  conditions: [
    {
      operator: 'or',
      conditions: [
        { field: '^.tier', condition: /premium/ },
        { field: '^.role', condition: /admin/ },
      ],
    },
    { field: '^.notifications', condition: /true/ },
  ],
})
```

---

## Path Syntax

The `field` property in a `FieldCondition` accepts two path styles.

### Root Path

Absolute from the root of the validated data. Segments are separated by `.`; array indices are written as numbers.

```
'user.role'
'settings.flags.0'
'address.zip'
```

```ts
const schema = object({
  user: object({ role: string() }),
  billing: object({
    taxId: string().dependsOn({
      field: 'user.role',
      condition: /business/,
    }),
  }),
});
```

---

### Sibling Path (`^.`)

A single `^.` prefix resolves relative to the same containing object as the current field — a sibling lookup.

```
'^.flag'       →  field "flag" in the same object
'^.meta.type'  →  nested "meta.type" in the same object
```

```ts
const schema = object({
  notify: boolean(),
  email: string().dependsOn({ field: '^.notify', condition: /true/ }),
});
```

---

### Multi-level (`^.^.`, `^.^.^.`, …)

Each additional `^` segment moves one more level up from the sibling scope.

```
'^.^.role'       →  field "role" in the parent object
'^.^.^.plan'     →  field "plan" two levels up
```

```ts
const schema = object({
  role: string(),
  settings: object({
    // `name` is inside `settings`; ^.^.role goes up to the root object
    name: string().dependsOn({ field: '^.^.role', condition: /admin/ }),
  }),
});
```

```ts
const schema = object({
  plan: string(),
  billing: object({
    address: object({
      // two levels below `plan`: inside billing → address
      taxId: string().dependsOn({ field: '^.^.^.plan', condition: /business/ }),
    }),
  }),
});
```

> **Note:** Invalid path syntax (e.g. control characters appearing after non-control
> segments, like `^.a.^.b`) throws at parse time with a descriptive error message.

---

## Condition Matching

The `condition` field in a `FieldCondition` accepts a `RegExp` or a `string`.
The dependency field's value is converted to a string via `String(value)` before
testing.

```ts
// RegExp literal
{ field: '^.role', condition: /^admin$/ }

// String compiled to RegExp — equivalent to the above
{ field: '^.role', condition: '^admin$' }

// Partial match
{ field: '^.plan', condition: /business/ }  // matches "business-monthly", etc.
```

If the dependency field is `null` or `undefined`, the condition is treated as **not satisfied** and the dependent field is skipped.

---

## Nested Structures

### Arrays

`^.` matches siblings within the same array item; `^.^.` reaches the parent object.

```ts
// Sibling within each array item
const schema = object({
  items: array(
    object({
      type: string(),
      value: string().dependsOn({ field: '^.type', condition: /special/ }),
    }),
  ),
});

schema.parse({
  items: [
    { type: 'normal' },              // value not required
    { type: 'special', value: 'x' }, // value required
  ],
});
```

```ts
// Field in the object that contains the array — requires an extra ^.
const schema = object({
  sections: array(
    object({
      enabled: boolean(),
      details: object({
        note: string().dependsOn({ field: '^.^.enabled', condition: /true/ }),
      }),
    }),
  ),
});
```

> **Array level — easy to forget**
>
> An array is itself a level in the path hierarchy. When a field sits directly
> inside an array item, `^.` resolves siblings within the same item object.
> You need one extra `^.` to reach the array itself, and another to reach the
> object that holds the array.
>
> ```
> root object
>   └── items  ← the array          (level 1)
>         └── item[i]               (level 2 — "containing object" for item fields)
>               └── myField         (your field)
> ```
>
> | From `myField` | Lands on | Accessed by |
> |---|---|---|
> | `^.sibling` | `item[i]` — same item object | named key |
> | `^.^.0`, `^.^.1` | `items` — the array | numeric index |
> | `^.^.^.field` | root object | named key ✓ |
>
> ```ts
> // ^.^. lands on the array — navigate with a numeric index
> value.dependsOn({ field: '^.^.0.type', condition: /special/ })
> // reads items[0].type
>
> // ^.^.^. clears the array and the item object, reaching the parent object
> value.dependsOn({ field: '^.^.^.mode', condition: /special/ })
> // reads root.mode ✓
> ```
>
> ```ts
> // WRONG — ^.^. stops at the array; there is no named field "mode" there
> const schema = object({
>   mode: string(),
>   items: array(
>     object({
>       value: string().dependsOn({ field: '^.^.mode', condition: /special/ }),
>     }),
>   ),
> });
>
> // CORRECT — ^.^.^. exits both the item object and the array
> const schema = object({
>   mode: string(),
>   items: array(
>     object({
>       value: string().dependsOn({ field: '^.^.^.mode', condition: /special/ }),
>     }),
>   ),
> });
> ```
>
> The same applies to any nested object inside an array item: count every level
> — including the array — when deciding how many `^.` segments you need.

### Records

The same path syntax works inside `record` values.

```ts
const schema = object({
  rows: record(
    object({
      active: boolean(),
      label: string().dependsOn({ field: '^.active', condition: /true/ }),
    }),
  ),
});

schema.parse({
  rows: {
    a: { active: false },            // label not required
    b: { active: true, label: 'x' }, // label required
  },
});
```

---

## Error Behaviour

When the rule is satisfied but the field is absent, a `required` validation error is emitted with the field's full path:

```ts
const result = schema.safeParse({ isEmployee: true });
// result.success === false
// result.errors[0].code  === 'required'
// result.errors[0].path  === ['employeeId']
```

When the rule is **not** satisfied, the field is omitted from the parsed output entirely — it does not appear as `undefined` in the result object.

---

## Type Reference

```ts
/** Checks a single field's value against a pattern. */
interface FieldCondition {
  field: string;
  condition: RegExp | string;
}

/** Passes when every sub-rule passes (AND). */
interface AndGroup {
  operator: 'and';
  conditions: [DependencyRule, ...DependencyRule[]];
}

/** Passes when at least one sub-rule passes (OR). */
interface OrGroup {
  operator: 'or';
  conditions: [DependencyRule, ...DependencyRule[]];
}

/** Union of all rule shapes. */
type DependencyRule = FieldCondition | AndGroup | OrGroup;
```

All four types are exported from the package and fully typed, so VSCode will offer autocomplete and flag structural mistakes at edit time:

```ts
import type { DependencyRule, FieldCondition, AndGroup, OrGroup } from 'validator';
```
