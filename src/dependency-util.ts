import { DependencyRule } from "./types.js";

export const LEAF_OPERATORS = [
  "eq",
  "ne",
  "lt",
  "gt",
  "lte",
  "gte",
  "in",
  "notIn",
  "contains",
  "startsWith",
  "endsWith",
  "exists",
  "notEmpty",
  "truthy",
  "falsy",
  "pattern",
] as const;

export const GROUP_OPERATORS = ["and", "or", "not"] as const;

export type LeafKey = (typeof LEAF_OPERATORS)[number];
export type GroupKey = (typeof GROUP_OPERATORS)[number];
export type RuleKey = LeafKey | GroupKey;

const ALL_OPERATORS: readonly RuleKey[] = [
  ...LEAF_OPERATORS,
  ...GROUP_OPERATORS,
];

/**
 * Returns the single top-level operator key of a {@link DependencyRule}.
 * Throws if the rule does not carry a recognized key.
 */
export function getRuleKey(rule: DependencyRule): RuleKey {
  for (const k of ALL_OPERATORS) {
    if (k in (rule as object)) return k;
  }
  throw new Error(
    "Invalid dependency rule: no recognized operator key",
  );
}

export function isLeafKey(key: RuleKey): key is LeafKey {
  return (LEAF_OPERATORS as readonly string[]).includes(key);
}
