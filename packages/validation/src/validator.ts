// JSON Schema validator for dASTardly ASTs

import type { JSONSchema7 } from 'json-schema';
import type { DocumentNode, DataNode, NodeIdentity } from '@dastardly/core';
import { computeIdentities } from '@dastardly/core';
import { ValidationCache } from './cache.js';
import type { ValidationResult, ValidationError } from './types.js';
import { SchemaCompiler } from './compiler.js';
import type { CompiledSchema, ValidationContext } from './compiler-types.js';

/**
 * Validator options
 */
export interface ValidatorOptions {
  /** Enable validation caching (default: true) */
  cache?: boolean;

  /** Maximum cache size (default: 1000) */
  cacheSize?: number;

  /** Fail fast - stop on first error (default: false) */
  failFast?: boolean;
}

/**
 * JSON Schema validator for dASTardly ASTs
 * Supports JSON Schema Draft 7 with content-addressable caching
 *
 * @example
 * ```typescript
 * const validator = new Validator(schema);
 * const result = validator.validate(document);
 * if (!result.valid) {
 *   for (const error of result.errors) {
 *     console.error(`${error.path}: ${error.message}`);
 *   }
 * }
 * ```
 */
export class Validator {
  private readonly compiled: CompiledSchema;
  private readonly cache: ValidationCache | null;
  private readonly failFast: boolean;
  private readonly compiler: SchemaCompiler;

  /**
   * Create a new validator
   *
   * @param schema - JSON Schema (must be fully resolved, no remote $refs)
   * @param options - Validator options
   */
  constructor(schema: JSONSchema7, options: ValidatorOptions = {}) {
    this.compiler = new SchemaCompiler();
    this.compiled = this.compiler.compile(schema, true); // true = isRoot for $ref resolution
    this.cache = options.cache !== false ? new ValidationCache(options.cacheSize) : null;
    this.failFast = options.failFast ?? false;
  }

  /**
   * Validate a document against the schema
   *
   * @param document - Document to validate
   * @returns Validation result
   */
  validate(document: DocumentNode): ValidationResult {
    // Compute identities for all nodes (for caching and error reporting)
    const identities = computeIdentities(document);

    // Validate root node
    const errors: ValidationError[] = [];
    this.validateNode(document.body, '', '#', identities, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.cache?.clear();
  }

  /**
   * Validate a single node
   *
   * @param node - AST node to validate
   * @param pointer - JSON Pointer path to node
   * @param schemaPath - Path in schema (for error reporting)
   * @param identities - Node identities map
   * @param errors - Accumulated errors
   * @returns True if validation should stop (fail-fast mode)
   */
  private validateNode(
    node: DataNode,
    pointer: string,
    schemaPath: string,
    identities: WeakMap<DataNode, NodeIdentity>,
    errors: ValidationError[]
  ): boolean {
    // Check cache
    if (this.cache) {
      const identity = identities.get(node);
      if (identity) {
        const cached = this.cache.get(pointer, identity.contentHash);
        if (cached) {
          errors.push(...cached.errors);
          return this.failFast && !cached.valid;
        }
      }
    }

    // Validate node using compiled validators
    const nodeErrors: ValidationError[] = [];
    const context: ValidationContext = {
      identities,
      failFast: this.failFast,
    };

    for (const validator of this.compiled.validators) {
      // Skip validators that don't apply to this node type
      if (validator.appliesTo && !validator.appliesTo(node)) {
        continue;
      }

      const errs = validator.validate(node, pointer, schemaPath, context);
      nodeErrors.push(...errs);

      if (this.failFast && errs.length > 0) {
        break;
      }
    }

    // Cache result
    if (this.cache) {
      const identity = identities.get(node);
      if (identity) {
        this.cache.set(pointer, identity.contentHash, {
          valid: nodeErrors.length === 0,
          errors: nodeErrors,
        });
      }
    }

    errors.push(...nodeErrors);
    return this.failFast && nodeErrors.length > 0;
  }

}
