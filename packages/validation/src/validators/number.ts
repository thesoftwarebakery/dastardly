// Number validation keywords

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a minimum validator
 *
 * @param minimum - Minimum numeric value
 * @returns Keyword validator for minimum
 */
export function createMinimumValidator(minimum: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      if (node.value < minimum) {
        return [
          {
            path: pointer,
            message: `Value ${node.value} is less than minimum ${minimum}`,
            keyword: 'minimum',
            schemaPath: `${schemaPath}/minimum`,
            location: node.loc,
            params: { minimum },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Number',
  };
}

/**
 * Create a maximum validator
 *
 * @param maximum - Maximum numeric value
 * @returns Keyword validator for maximum
 */
export function createMaximumValidator(maximum: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      if (node.value > maximum) {
        return [
          {
            path: pointer,
            message: `Value ${node.value} is greater than maximum ${maximum}`,
            keyword: 'maximum',
            schemaPath: `${schemaPath}/maximum`,
            location: node.loc,
            params: { maximum },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Number',
  };
}

/**
 * Create a multipleOf validator
 *
 * @param multipleOf - Number must be a multiple of this value
 * @returns Keyword validator for multipleOf
 */
export function createMultipleOfValidator(multipleOf: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      // Handle floating point precision
      const quotient = node.value / multipleOf;
      const isMultiple = Math.abs(quotient - Math.round(quotient)) < 1e-10;

      if (!isMultiple) {
        return [
          {
            path: pointer,
            message: `Value ${node.value} is not a multiple of ${multipleOf}`,
            keyword: 'multipleOf',
            schemaPath: `${schemaPath}/multipleOf`,
            location: node.loc,
            params: { multipleOf },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Number',
  };
}
