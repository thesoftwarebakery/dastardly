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
  createExclusiveMinimumValidator,
  createExclusiveMaximumValidator,
} from './validators/number.js';
import {
  createMinItemsValidator,
  createMaxItemsValidator,
  createItemsValidator,
  createAdditionalItemsValidator,
} from './validators/array.js';
import {
  createRequiredValidator,
  createMinPropertiesValidator,
  createMaxPropertiesValidator,
  createPropertiesValidator,
  createPatternPropertiesValidator,
  createAdditionalPropertiesValidator,
} from './validators/object.js';
import { createEnumValidator, createConstValidator } from './validators/basic.js';
import {
  createAllOfValidator,
  createAnyOfValidator,
  createOneOfValidator,
  createNotValidator,
} from './validators/combinators.js';
import { createBooleanSchemaValidator } from './validators/boolean-schema.js';

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
   * @param schema - JSON Schema to compile (can be boolean or object)
   * @returns Compiled schema with validators
   */
  compile(schema: JSONSchema7 | boolean): CompiledSchema {
    // Handle boolean schemas
    if (typeof schema === 'boolean') {
      return {
        validators: [createBooleanSchemaValidator(schema)],
        schema,
      };
    }

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

    // Enum/const validators (higher priority than type)
    if (schema.enum !== undefined) {
      validators.push(createEnumValidator(schema.enum));
    }
    if (schema.const !== undefined) {
      validators.push(createConstValidator(schema.const));
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
    if (schema.exclusiveMinimum !== undefined) {
      validators.push(createExclusiveMinimumValidator(schema.exclusiveMinimum));
    }
    if (schema.exclusiveMaximum !== undefined) {
      validators.push(createExclusiveMaximumValidator(schema.exclusiveMaximum));
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
    // items must come before additionalItems
    if (schema.items !== undefined) {
      validators.push(createItemsValidator(schema.items, this));
    }
    if (schema.additionalItems !== undefined) {
      validators.push(createAdditionalItemsValidator(schema.additionalItems, schema.items, this));
    }

    // Object validators
    if (schema.required !== undefined) {
      validators.push(createRequiredValidator(schema.required));
    }
    if (schema.minProperties !== undefined) {
      validators.push(createMinPropertiesValidator(schema.minProperties));
    }
    if (schema.maxProperties !== undefined) {
      validators.push(createMaxPropertiesValidator(schema.maxProperties));
    }
    // properties and patternProperties must come before additionalProperties
    if (schema.properties !== undefined) {
      validators.push(createPropertiesValidator(schema.properties, this));
    }
    if (schema.patternProperties !== undefined) {
      validators.push(createPatternPropertiesValidator(schema.patternProperties, this));
    }
    if (schema.additionalProperties !== undefined) {
      validators.push(
        createAdditionalPropertiesValidator(
          schema.additionalProperties,
          schema.properties,
          schema.patternProperties,
          this
        )
      );
    }

    // Combinator validators
    if (schema.allOf !== undefined) {
      validators.push(createAllOfValidator(schema.allOf, this));
    }
    if (schema.anyOf !== undefined) {
      validators.push(createAnyOfValidator(schema.anyOf, this));
    }
    if (schema.oneOf !== undefined) {
      validators.push(createOneOfValidator(schema.oneOf, this));
    }
    if (schema.not !== undefined) {
      validators.push(createNotValidator(schema.not, this));
    }

    // TODO: Add more keyword validators
    // - Conditional (if/then/else)
    // - contains, uniqueItems
    // - dependencies, propertyNames
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
