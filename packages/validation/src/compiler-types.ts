// Compiler types and interfaces for schema compilation

import type { JSONSchema7 } from 'json-schema';
import type { DataNode, NodeIdentity } from '@bakes/dastardly-core';
import type { ValidationError } from './types.js';

/**
 * Context passed to keyword validators during validation
 */
export interface ValidationContext {
  /** Node identities for cache lookups */
  readonly identities: WeakMap<DataNode, NodeIdentity>;

  /** Whether to stop on first error */
  readonly failFast: boolean;
}

/**
 * A keyword validator validates a specific JSON Schema keyword
 * Each validator is pure and testable in isolation
 */
export interface KeywordValidator {
  /**
   * Validate a node against this keyword
   *
   * @param node - AST node to validate
   * @param pointer - JSON Pointer path to node
   * @param schemaPath - Path in schema (for error reporting)
   * @param context - Validation context
   * @returns Array of validation errors (empty if valid)
   */
  validate(
    node: DataNode,
    pointer: string,
    schemaPath: string,
    context: ValidationContext
  ): ValidationError[];

  /**
   * Optional: Check if this validator applies to a node
   * Used for performance optimization (skip validators that don't apply)
   *
   * @param node - AST node to check
   * @returns True if validator should run on this node
   */
  appliesTo?(node: DataNode): boolean;
}

/**
 * Result of schema compilation
 * Contains optimized validators for a schema
 */
export interface CompiledSchema {
  /** Validators for this schema (in order) */
  readonly validators: ReadonlyArray<KeywordValidator>;

  /** Original schema (for debugging) - can be boolean or object */
  readonly schema: JSONSchema7 | boolean;
}
