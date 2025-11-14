// Basic validation keywords

import type { KeywordValidator } from '../compiler-types.js';
import { deepEqual } from '../utils/deep-equal.js';

/**
 * Create an enum validator
 *
 * Validates that a value matches one of the allowed enum values
 *
 * @param enumValues - Array of allowed values
 * @returns Keyword validator for enum
 */
export function createEnumValidator(enumValues: readonly unknown[]): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      // Extract the plain value from the node for comparison
      const value = extractValue(node);

      // Check if value matches any enum value using deep equality
      const matches = enumValues.some((enumValue) => deepEqual(value, enumValue));

      if (!matches) {
        return [
          {
            path: pointer,
            message: `Value must be one of: ${JSON.stringify(enumValues)}`,
            keyword: 'enum',
            schemaPath: `${schemaPath}/enum`,
            location: node.loc,
            params: { allowedValues: enumValues },
          },
        ];
      }

      return [];
    },

    appliesTo: () => true,
  };
}

/**
 * Create a const validator
 *
 * Validates that a value exactly matches the const value
 *
 * @param constValue - The constant value to match
 * @returns Keyword validator for const
 */
export function createConstValidator(constValue: unknown): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      // Extract the plain value from the node for comparison
      const value = extractValue(node);

      // Check if value matches const value using deep equality
      if (!deepEqual(value, constValue)) {
        return [
          {
            path: pointer,
            message: `Value must equal: ${JSON.stringify(constValue)}`,
            keyword: 'const',
            schemaPath: `${schemaPath}/const`,
            location: node.loc,
            params: { allowedValue: constValue },
          },
        ];
      }

      return [];
    },

    appliesTo: () => true,
  };
}

/**
 * Extract plain JavaScript value from AST node for comparison
 */
function extractValue(node: import('@bakes/dastardly-core').DataNode): unknown {
  switch (node.type) {
    case 'String':
      return node.value;
    case 'Number':
      return node.value;
    case 'Boolean':
      return node.value;
    case 'Null':
      return null;
    case 'Array':
      return node.elements.map(extractValue);
    case 'Object': {
      const obj: Record<string, unknown> = {};
      for (const prop of node.properties) {
        obj[prop.key.value] = extractValue(prop.value);
      }
      return obj;
    }
  }
}
