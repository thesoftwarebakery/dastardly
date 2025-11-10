// Array validation keywords

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a minItems validator
 *
 * @param minItems - Minimum array length
 * @returns Keyword validator for minItems
 */
export function createMinItemsValidator(minItems: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Array') return [];

      if (node.elements.length < minItems) {
        return [
          {
            path: pointer,
            message: `Array length ${node.elements.length} is less than minimum ${minItems}`,
            keyword: 'minItems',
            schemaPath: `${schemaPath}/minItems`,
            location: node.loc,
            params: { minItems },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Array',
  };
}

/**
 * Create a maxItems validator
 *
 * @param maxItems - Maximum array length
 * @returns Keyword validator for maxItems
 */
export function createMaxItemsValidator(maxItems: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Array') return [];

      if (node.elements.length > maxItems) {
        return [
          {
            path: pointer,
            message: `Array length ${node.elements.length} is greater than maximum ${maxItems}`,
            keyword: 'maxItems',
            schemaPath: `${schemaPath}/maxItems`,
            location: node.loc,
            params: { maxItems },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Array',
  };
}
