// JSON Schema validator for dASTardly ASTs

import type { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import type { DocumentNode, DataNode, NodeIdentity } from '@bakes/dastardly-core';
import { computeIdentities } from '@bakes/dastardly-core';
import { ValidationCache } from './cache.js';
import type { ValidationResult, ValidationError } from './types.js';
import { SchemaCompiler } from './compiler.js';
import type { CompiledSchema, ValidationContext } from './compiler-types.js';
import type { Draft, AnyJSONSchema, JSONSchema202012 } from './draft.js';
import { DEFAULT_DRAFT } from './draft.js';

/**
 * Validator options
 */
export interface ValidatorOptions<D extends Draft = Draft> {
  /** JSON Schema draft version (default: 'draft-07') */
  draft?: D;

  /** Enable validation caching (default: true) */
  cache?: boolean;

  /** Maximum cache size (default: 1000) */
  cacheSize?: number;

  /** Fail fast - stop on first error (default: false) */
  failFast?: boolean;
}

/**
 * JSON Schema validator for dASTardly ASTs
 * Supports JSON Schema Drafts 4, 6, 7, and 2020-12 with content-addressable caching
 *
 * @example
 * ```typescript
 * // Draft 7 (default)
 * const validator = new Validator(schema);
 *
 * // Explicit draft specification with type-safe schema
 * const validator = new Validator(schema, { draft: 'draft-06' });
 *
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
  private readonly draft: Draft;

  /**
   * Create a validator for JSON Schema Draft 4
   */
  constructor(schema: JSONSchema4, options: ValidatorOptions<'draft-04'>);

  /**
   * Create a validator for JSON Schema Draft 6
   */
  constructor(schema: JSONSchema6, options: ValidatorOptions<'draft-06'>);

  /**
   * Create a validator for JSON Schema Draft 7 (default)
   */
  constructor(schema: JSONSchema7, options?: ValidatorOptions<'draft-07'>);

  /**
   * Create a validator for JSON Schema Draft 2020-12
   */
  constructor(schema: JSONSchema202012, options: ValidatorOptions<'draft-2020-12'>);

  /**
   * Create a new validator (implementation)
   *
   * @param schema - JSON Schema (must be fully resolved, no remote $refs)
   * @param options - Validator options
   */
  constructor(schema: AnyJSONSchema, options: ValidatorOptions = {}) {
    this.draft = options.draft ?? DEFAULT_DRAFT;
    this.compiler = new SchemaCompiler(this.draft);
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
