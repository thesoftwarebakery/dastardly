// Validation result types

import type { SourceLocation } from '@bakes/dastardly-core';

/**
 * Validation error with source location
 */
export interface ValidationError {
  /** JSON Pointer path to the invalid node */
  readonly path: string;

  /** Error message */
  readonly message: string;

  /** JSON Schema keyword that failed */
  readonly keyword: string;

  /** Schema path (JSON Pointer in the schema) */
  readonly schemaPath: string;

  /** Source location in original document */
  readonly location: SourceLocation;

  /** Additional error parameters */
  readonly params?: Record<string, unknown>;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  readonly valid: boolean;

  /** Validation errors (empty if valid) */
  readonly errors: readonly ValidationError[];
}
