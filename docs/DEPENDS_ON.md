# dependsOn

Conditional field requirement driven by a typed, composable rule tree.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Rule Shape](#rule-shape)
- [Leaf Operators](#leaf-operators)
  - [Equality — `eq`, `ne`](#equality--eq-ne)
  - [Numeric comparison — `lt`, `gt`, `lte`, `gte`](#numeric-comparison--lt-gt-lte-gte)
  - [Membership — `in`, `notIn`](#membership--in-notin)
  - [String predicates — `contains`, `startsWith`, `endsWith`](#string-predicates--contains-startswith-endswith)
  - [Existence / truthiness — `exists`, `notEmpty`, `truthy`, `falsy`](#existence--truthiness--exists-notempty-truthy-falsy)
  - [Regex — `pattern`](#regex--pattern)
- [Group Operators](#group-operators)
  - [`and`](#and)
  - [`or`](#or)
  - [`not`](#not)
  - [Nesting](#nesting)
- [Path Syntax](#path-syntax)
  - [Root Path](#root-path)
  - [Sibling Path (`^.`)](#sibling-path-)
  - [Multi-level (`^.^.`, `^.^.^.`, …)](#multi-level-)
- [Nested Structures](#nested-structures)
  - [Arrays](#arrays)
  - [Records](#records)
- [Error Behaviour](#error-behaviour)
- [Serialization](#serialization)
- [Type Reference](#type-reference)
- [Migrating from the Previous API](#migrating-from-the-previous-api)

---

## Overview

`dependsOn` makes a field conditionally required: the field is only validated (and required) when its rule evaluates to `true`. When the rule is not satisfied the field is skipped entirely — its value is omitted from the parsed result.

```ts
field.dependsOn(rule: DependencyRule)
```

Every rule is a plain object with **exactly one** top-level operator key. Leaf operators test a single field value; group operators (`and`, `or`, `not`) combine sub-rules. Rules nest freely, so any boolean combination is expressible.

> **Exactly one key per rule.** A rule object like `{ eq: {...}, gte: {...} }` does **not** compile. Use an explicit `and` group if you need both.

---

## Quick Start

```ts
import { object, string, boolean } from 'validator';

const schema = object({
  isEmployee: boolean(),
  employeeId: string().dependsOn({
    eq: { field: '^.isEmployee', value: true },
  }),
});

// isEmployee === false → employeeId is not required, omitted from result
schema.parse({ isEmployee: false });
// → { isEmployee: false }

// isEmployee === true → employeeId is required
schema.parse({ isEmployee: true });
// → throws: employeeId is required

schema.parse({ isEmployee: true, employeeId: 'E-123' });
// → { isEmployee: true, employeeId: 'E-123' }
```

---

## Rule Shape

```ts
type DependencyRule =
  | { eq:         { field: string; value: unknown } }
  | { ne:         { field: string; value: unknown } }
  | { lt:         { field: string; value: number } }
  | { gt:         { field: string; value: number } }
  | { lte:        { field: string; value: number } }
  | { gte:        { field: string; value: number } }
  | { in:         { field: string; value: readonly unknown[] } }
  | { notIn:      { field: string; value: readonly unknown[] } }
  | { contains:   { field: string; value: string } }
  | { startsWith: { field: string; value: string } }
  | { endsWith:   { field: string; value: string } }
  | { exists:     { field: string } }
  | { notEmpty:   { field: string } }
  | { truthy:     { field: string } }
  | { falsy:      { field: string } }
  | { pattern:    { field: string; value: RegExp | string } }
  | { and:        [DependencyRule, ...DependencyRule[]] }
  | { or:         [DependencyRule, ...DependencyRule[]] }
  | { not:        DependencyRule };
```

The `value` field is discriminated by the operator — e.g. `lt.value` must be a `number`, `startsWith.value` must be a `string`, `in.value` must be an array. The compiler flags mismatches at edit time.

---

## Leaf Operators

Every leaf payload carries a `field` (path to the dependency field). Most operators also carry a `value`. The operator below describes how the resolved dependency value `v` is tested against `value`.

### Equality — `eq`, `ne`

| Operator | Passes when |
|---|---|
| `eq` | `v === value` |
| `ne` | `v !== value` |

Reference equality is used for objects — two distinct object literals with the same keys are **not** equal.

```ts
// Required when role is exactly "admin"
string().dependsOn({ eq: { field: '^.role', value: 'admin' } })

// Required when status is not "archived"
string().dependsOn({ ne: { field: '^.status', value: 'archived' } })
```

---

### Numeric comparison — `lt`, `gt`, `lte`, `gte`

All four operators require both sides to be numbers. If the dependency field is not a number, the rule returns `false`.

| Operator | Passes when |
|---|---|
| `lt`  | `typeof v === 'number' && v <  value` |
| `gt`  | `typeof v === 'number' && v >  value` |
| `lte` | `typeof v === 'number' && v <= value` |
| `gte` | `typeof v === 'number' && v >= value` |

```ts
// Required when age >= 18
string().dependsOn({ gte: { field: '^.age', value: 18 } })

// Required when score is strictly below 50
string().dependsOn({ lt: { field: '^.score', value: 50 } })
```

---

### Membership — `in`, `notIn`

| Operator | Passes when |
|---|---|
| `in`    | `v` is present in `value[]` (via `Array.prototype.includes`) |
| `notIn` | `v` is **not** in `value[]` |

If the dependency field is `null` or `undefined`, both operators return `false`.

```ts
// Required when role is admin OR moderator
string().dependsOn({
  in: { field: '^.role', value: ['admin', 'moderator'] },
})

// Required when status is anything except archived / deleted
string().dependsOn({
  notIn: { field: '^.status', value: ['archived', 'deleted'] },
})
```

---

### String predicates — `contains`, `startsWith`, `endsWith`

All three require the dependency field to be a string. Non-string values return `false`.

| Operator | Passes when |
|---|---|
| `contains`   | `v.includes(value)` |
| `startsWith` | `v.startsWith(value)` |
| `endsWith`   | `v.endsWith(value)` |

```ts
string().dependsOn({ contains:   { field: '^.email', value: '@company.com' } })
string().dependsOn({ startsWith: { field: '^.code',  value: 'PREMIUM-' } })
string().dependsOn({ endsWith:   { field: '^.file',  value: '.pdf' } })
```

---

### Existence / truthiness — `exists`, `notEmpty`, `truthy`, `falsy`

These operators test only the **presence / shape** of the value. They take a `field` but no `value`.

| Operator   | Passes when |
|---|---|
| `exists`   | `v` is neither `null` nor `undefined` (empty strings, `0`, and `false` count as existing) |
| `notEmpty` | `v` is present and not an empty string, array, or object |
| `truthy`   | `Boolean(v) === true` |
| `falsy`    | `!v === true` — covers `null`, `undefined`, `0`, `''`, `false`, `NaN` |

```ts
// Required when the user has filled in a referral source (non-empty)
string().dependsOn({ notEmpty: { field: '^.referral' } })

// Required when the feature flag is explicitly on
string().dependsOn({ truthy:   { field: '^.betaEnabled' } })

// Required when the user opted out (flag missing or explicitly false)
string().dependsOn({ falsy:    { field: '^.marketingOptIn' } })
```

---

### Regex — `pattern`

Regex match on `String(v)`. Accepts a `RegExp` or a `string` (which is compiled with `new RegExp(value)`). Returns `false` if the dependency field is `null`/`undefined`.

```ts
// RegExp literal
string().dependsOn({ pattern: { field: '^.email', value: /@co\.com$/ } })

// String pattern — equivalent
string().dependsOn({ pattern: { field: '^.email', value: '@co\\.com$' } })
```

When serialized via `toJSON()`, `RegExp` values are lowered to their `.source` string so the rule is JSON-safe — see [Serialization](#serialization).

---

## Group Operators

### `and`

Every sub-rule must pass.

```ts
// Required when plan=business AND region=EU
string().dependsOn({
  and: [
    { eq: { field: '^.plan',   value: 'business' } },
    { eq: { field: '^.region', value: 'EU' } },
  ],
})
```

### `or`

At least one sub-rule must pass.

```ts
// Required when the user is admin OR has notifications enabled
string().dependsOn({
  or: [
    { eq:     { field: '^.role',          value: 'admin' } },
    { truthy: { field: '^.notifications' } },
  ],
})
```

### `not`

The sub-rule must **not** pass. `not` takes a single rule (leaf or group), not an array.

```ts
// Required when the user is NOT archived
string().dependsOn({
  not: { eq: { field: '^.status', value: 'archived' } },
})
```

Failed-dependency bookkeeping is snapshotted around `not` so inner failures inside a negation do not leak into error reporting.

### Nesting

Groups accept any other rule — leaf or group — as children. Common combinations:

```ts
// (plan=business AND region=EU) OR role=admin
{
  or: [
    {
      and: [
        { eq: { field: '^.plan',   value: 'business' } },
        { eq: { field: '^.region', value: 'EU' } },
      ],
    },
    { eq: { field: '^.role', value: 'admin' } },
  ],
}
```

```ts
// (tier=premium OR role=admin) AND notifications enabled
{
  and: [
    {
      or: [
        { eq: { field: '^.tier', value: 'premium' } },
        { eq: { field: '^.role', value: 'admin' } },
      ],
    },
    { truthy: { field: '^.notifications' } },
  ],
}
```

```ts
// NOT (status is archived or deleted)
{
  not: {
    in: { field: '^.status', value: ['archived', 'deleted'] },
  },
}
```

---

## Path Syntax

The `field` property in a leaf accepts two path styles. All relative-path behaviour is identical to the previous API.

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
      eq: { field: 'user.role', value: 'business' },
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
  email: string().dependsOn({
    eq: { field: '^.notify', value: true },
  }),
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
    name: string().dependsOn({
      eq: { field: '^.^.role', value: 'admin' },
    }),
  }),
});
```

> **Note:** Invalid path syntax (e.g. control characters after non-control segments, like `^.a.^.b`) throws at parse time with a descriptive error message.

---

## Nested Structures

### Arrays

`^.` matches siblings within the same array item; `^.^.` reaches the array itself, and `^.^.^.` exits the array and lands on its parent object.

```ts
// Sibling within each array item
const schema = object({
  items: array(
    object({
      type: string(),
      value: string().dependsOn({
        eq: { field: '^.type', value: 'special' },
      }),
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
        note: string().dependsOn({
          eq: { field: '^.^.enabled', value: true },
        }),
      }),
    }),
  ),
});
```

> **Array level — easy to forget**
>
> An array is itself a level in the path hierarchy. When a field sits directly inside an array item, `^.` resolves siblings within the same item object. You need one extra `^.` to reach the array itself, and another to reach the object that holds the array.
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

### Records

The same path syntax works inside `record` values.

```ts
const schema = object({
  rows: record(
    object({
      active: boolean(),
      label: string().dependsOn({
        eq: { field: '^.active', value: true },
      }),
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

## Serialization

`toJSON()` emits a JSON-safe form of the rule under the `data-depends-on` key. All operator payloads pass through unchanged except `pattern.value`, which is lowered from a `RegExp` to its `.source` string so the output is pure JSON.

```ts
const schema = string().dependsOn({
  and: [
    { eq:      { field: 'role',  value: 'admin' } },
    { pattern: { field: 'email', value: /@co\.com$/ } },
  ],
});

schema.toJSON()['data-depends-on'];
// {
//   and: [
//     { eq:      { field: 'role',  value: 'admin' } },
//     { pattern: { field: 'email', value: '@co\\.com$' } },
//   ],
// }
```

The emitted shape mirrors the source structure, so the JSON can be round-tripped by any consumer that understands the operator keys.

---

## Type Reference

```ts
// Leaf payloads — each value narrows by operator key.
interface EqPayload        { field: string; value: unknown }
interface NumericPayload   { field: string; value: number }
interface InPayload        { field: string; value: readonly unknown[] }
interface StringPayload    { field: string; value: string }
interface PatternPayload   { field: string; value: RegExp | string }
interface FieldOnlyPayload { field: string }

type ComparisonOperator =
  | 'eq' | 'ne'
  | 'lt' | 'gt' | 'lte' | 'gte'
  | 'in' | 'notIn'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'exists' | 'notEmpty' | 'truthy' | 'falsy'
  | 'pattern';

type GroupOperator = 'and' | 'or' | 'not';

// `Root` is reserved for future root-based type inference and currently
// defaults to `unknown` — it does not influence narrowing today.
type DependencyRule<Root = unknown> = /* exactly-one-of-the-above */;

// Union of all leaf variants (no group keys).
type FieldCondition<Root = unknown>;

// Exported for consumers who want to reference individual payload shapes.
type LeafPayload =
  | EqPayload
  | NumericPayload
  | InPayload
  | StringPayload
  | PatternPayload
  | FieldOnlyPayload;
```

All six types are exported from the package:

```ts
import type {
  DependencyRule,
  FieldCondition,
  ComparisonOperator,
  GroupOperator,
  LeafPayload,
} from 'validator';
```

VSCode will flag mismatched payloads at edit time:

```ts
// Error: Type 'string' is not assignable to type 'number'
string().dependsOn({ lt: { field: 'x', value: 'nope' } });

// Error: object literal may only specify known properties
string().dependsOn({ eq: { field: 'x', value: 1 }, gte: { field: 'x', value: 1 } });

// Error: 'value' does not exist on type 'FieldOnlyPayload'
string().dependsOn({ exists: { field: 'x', value: true } });
```

---

## Migrating from the Previous API

The previous API used a `{ field, condition: RegExp | string }` shape (plus `AndGroup` / `OrGroup` wrappers). It has been replaced by the operator-key shape above. **The old syntax no longer compiles.**

### Leaf rules

```ts
// Before
string().dependsOn({ field: '^.role', condition: /^admin$/ })

// After — prefer `eq` when you want exact equality (cheaper, clearer)
string().dependsOn({ eq: { field: '^.role', value: 'admin' } })

// After — use `pattern` when you truly need a regex
string().dependsOn({ pattern: { field: '^.role', value: /^admin$/ } })
```

**When to pick `eq` vs `pattern`:** if your old condition was a full-anchor regex (`/^…$/`) matching a literal, prefer `eq`. If it was a real regex (character classes, alternation, `.*`), keep `pattern`. Partial-match regex like `/business/` (no anchors) should become `pattern` unless you can rewrite it as `contains`, `startsWith`, or `endsWith`.

### AND groups

```ts
// Before
string().dependsOn({
  operator: 'and',
  conditions: [
    { field: '^.plan',   condition: /business/ },
    { field: '^.region', condition: /EU/ },
  ],
})

// After
string().dependsOn({
  and: [
    { eq: { field: '^.plan',   value: 'business' } },
    { eq: { field: '^.region', value: 'EU' } },
  ],
})
```

### OR groups

```ts
// Before
string().dependsOn({
  operator: 'or',
  conditions: [
    { field: '^.role',          condition: /admin/ },
    { field: '^.notifications', condition: /true/ },
  ],
})

// After
string().dependsOn({
  or: [
    { eq:     { field: '^.role',          value: 'admin' } },
    { truthy: { field: '^.notifications' } },
  ],
})
```

### Summary of breaking changes

| Old | New |
|---|---|
| `{ field, condition: /x/ }` | `{ pattern: { field, value: /x/ } }` or a more specific operator |
| `{ operator: 'and', conditions: [...] }` | `{ and: [...] }` |
| `{ operator: 'or', conditions: [...] }` | `{ or: [...] }` |
| — | `{ not: rule }` (new: negation) |
| — | `eq`, `ne`, `lt`, `gt`, `lte`, `gte`, `in`, `notIn`, `contains`, `startsWith`, `endsWith`, `exists`, `notEmpty`, `truthy`, `falsy` (new: richer leaf operators) |
| Exported: `AndGroup`, `OrGroup` | Exported: `ComparisonOperator`, `GroupOperator`, `LeafPayload` |

Because the old shape no longer compiles, `tsc --noEmit` will surface every call site that needs updating.
