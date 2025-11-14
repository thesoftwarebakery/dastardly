/**
 * Shared utility for validating nodes against schema definitions
 */

import type { JSONSchema7Definition } from 'json-schema';
import type { DataNode } from '@bakes/dastardly-core';
import type { ValidationContext } from '../compiler-types.js';
import type { ValidationError } from '../types.js';
import { SchemaCompiler } from '../compiler.js';

/**
 * Validate a node against a schema definition (can be boolean or object schema)
 *
 * This is the core recursive validation function used by all validators that
 * need to validate against nested schemas (properties, items, combinators, etc.)
 *
 * @param node - Node to validate
 * @param schemaDef - Schema definition (boolean or object)
 * @param pointer - JSON pointer to node
 * @param schemaPath - Path in schema for error reporting
 * @param context - Validation context
 * @param compiler - Schema compiler for caching
 * @returns Validation errors
 */
export function validateAgainstSchema(
  node: DataNode,
  schemaDef: JSONSchema7Definition,
  pointer: string,
  schemaPath: string,
  context: ValidationContext,
  compiler: SchemaCompiler
): ValidationError[] {
  // Handle boolean schemas
  if (typeof schemaDef === 'boolean') {
    if (schemaDef === false) {
      // false schema - everything is invalid
      return [
        {
          path: pointer,
          message: 'Schema is false, no value is valid',
          keyword: 'false',
          schemaPath,
          location: node.loc,
          params: {},
        },
      ];
    }
    // true schema - everything is valid
    return [];
  }

  // Handle object schema - compile and validate
  const compiled = compiler.compile(schemaDef);
  const errors: ValidationError[] = [];

  for (const validator of compiled.validators) {
    if (validator.appliesTo && !validator.appliesTo(node)) {
      continue;
    }

    const errs = validator.validate(node, pointer, schemaPath, context);
    errors.push(...errs);

    if (context.failFast && errs.length > 0) {
      break;
    }
  }

  return errors;
}
