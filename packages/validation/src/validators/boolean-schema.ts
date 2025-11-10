// Boolean schema validation

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a boolean schema validator
 *
 * In JSON Schema, schemas can be boolean values:
 * - true: always valid (allows any value)
 * - false: always invalid (rejects any value)
 *
 * @param allowed - Whether to allow (true) or reject (false) all values
 * @returns Keyword validator for boolean schema
 */
export function createBooleanSchemaValidator(allowed: boolean): KeywordValidator {
  if (allowed) {
    // true schema - everything is valid
    return {
      validate() {
        return [];
      },
      appliesTo: () => true,
    };
  }

  // false schema - everything is invalid
  return {
    validate(node, pointer, schemaPath) {
      return [
        {
          path: pointer,
          message: 'Boolean schema is false - no value is valid',
          keyword: 'false',
          schemaPath,
          location: node.loc,
          params: {},
        },
      ];
    },
    appliesTo: () => true,
  };
}
