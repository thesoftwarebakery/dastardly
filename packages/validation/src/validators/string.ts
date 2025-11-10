// String validation keywords

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a minLength validator
 *
 * @param minLength - Minimum string length
 * @returns Keyword validator for minLength
 */
export function createMinLengthValidator(minLength: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'String') return [];

      if (node.value.length < minLength) {
        return [
          {
            path: pointer,
            message: `String length ${node.value.length} is less than minimum ${minLength}`,
            keyword: 'minLength',
            schemaPath: `${schemaPath}/minLength`,
            location: node.loc,
            params: { minLength },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'String',
  };
}

/**
 * Create a maxLength validator
 *
 * @param maxLength - Maximum string length
 * @returns Keyword validator for maxLength
 */
export function createMaxLengthValidator(maxLength: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'String') return [];

      if (node.value.length > maxLength) {
        return [
          {
            path: pointer,
            message: `String length ${node.value.length} is greater than maximum ${maxLength}`,
            keyword: 'maxLength',
            schemaPath: `${schemaPath}/maxLength`,
            location: node.loc,
            params: { maxLength },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'String',
  };
}

/**
 * Create a pattern validator
 *
 * @param pattern - Regular expression pattern
 * @returns Keyword validator for pattern
 */
export function createPatternValidator(pattern: string): KeywordValidator {
  const regex = new RegExp(pattern);

  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'String') return [];

      if (!regex.test(node.value)) {
        return [
          {
            path: pointer,
            message: `String does not match pattern ${pattern}`,
            keyword: 'pattern',
            schemaPath: `${schemaPath}/pattern`,
            location: node.loc,
            params: { pattern },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'String',
  };
}
