/**
 * Entry point for the validator package, re-exporting all public factory helpers.
 *
 * Consumers can import the namespace (`import validator from 'validator'`) for a
 * convenient bundled API, or use named exports to tree-shake specific helpers.
 */
import * as s from "./external.js";

// Namespace export for the full API surface (default export mirrors this).
export { s };

// Named exports for tree-shaking and direct access to individual schema factories.
export * from "./external.js";
export type { ValidationAggregateError, ValidationError } from "./error.js";

// Default export exposes the namespace for ergonomic usage.
export default s;
