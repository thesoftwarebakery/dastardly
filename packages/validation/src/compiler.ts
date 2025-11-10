// Schema compiler - compiles JSON schemas to optimized validators

import type { JSONSchema7 } from 'json-schema';
import type { CompiledSchema, KeywordValidator } from './compiler-types.js';
import { createTypeValidator } from './validators/type.js';
import {
  createMinLengthValidator,
  createMaxLengthValidator,
  createPatternValidator,
} from './validators/string.js';
import {
  createMinimumValidator,
  createMaximumValidator,
  createMultipleOfValidator,
} from './validators/number.js';
import {
  createMinItemsValidator,
  createMaxItemsValidator,
} from './validators/array.js';

/**
 * Schema compiler
 * Compiles JSON schemas into optimized validator functions
 *
 * Maintains a cache of compiled schemas by reference for performance
 */
export class SchemaCompiler {
  private readonly cache = new Map<JSONSchema7, CompiledSchema>();

  /**
   * Compile a JSON schema to optimized validators
   *
   * @param schema - JSON Schema to compile
   * @returns Compiled schema with validators
   */
  compile(schema: JSONSchema7): CompiledSchema {
    // Check cache first (by schema reference)
    const cached = this.cache.get(schema);
    if (cached) {
      return cached;
    }

    // Compile schema
    const compiled = this.compileSchema(schema);

    // Cache result
    this.cache.set(schema, compiled);

    return compiled;
  }

  /**
   * Compile schema to validators
   */
  private compileSchema(schema: JSONSchema7): CompiledSchema {
    const validators: KeywordValidator[] = [];

    // Type validation
    if (schema.type !== undefined) {
      validators.push(createTypeValidator(schema.type));
    }

    // String validators
    if (schema.minLength !== undefined) {
      validators.push(createMinLengthValidator(schema.minLength));
    }
    if (schema.maxLength !== undefined) {
      validators.push(createMaxLengthValidator(schema.maxLength));
    }
    if (schema.pattern !== undefined) {
      validators.push(createPatternValidator(schema.pattern));
    }

    // Number validators
    if (schema.minimum !== undefined) {
      validators.push(createMinimumValidator(schema.minimum));
    }
    if (schema.maximum !== undefined) {
      validators.push(createMaximumValidator(schema.maximum));
    }
    if (schema.multipleOf !== undefined) {
      validators.push(createMultipleOfValidator(schema.multipleOf));
    }

    // Array validators
    if (schema.minItems !== undefined) {
      validators.push(createMinItemsValidator(schema.minItems));
    }
    if (schema.maxItems !== undefined) {
      validators.push(createMaxItemsValidator(schema.maxItems));
    }

    // TODO: Add more keyword validators
    // - Object validators (properties, required, additionalProperties)
    // - items (array item schema)
    // - Combinators (allOf, anyOf, oneOf, not)
    // - Conditional (if/then/else)
    // - Enum/const
    // - $ref

    return {
      validators,
      schema,
    };
  }

  /**
   * Clear compilation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for debugging/testing)
   */
  get cacheSize(): number {
    return this.cache.size;
  }
}
