// String validation keywords

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Get the Unicode code point length of a string
 * Counts actual Unicode code points, not UTF-16 code units
 * This correctly handles supplementary characters (emoji, etc.)
 */
function getCodePointLength(str: string): number {
  // Use Array.from or spread operator to split by code points
  return [...str].length;
}

/**
 * Create a minLength validator
 *
 * @param minLength - Minimum string length (in Unicode code points)
 * @returns Keyword validator for minLength
 */
export function createMinLengthValidator(minLength: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'String') return [];

      const length = getCodePointLength(node.value);
      if (length < minLength) {
        return [
          {
            path: pointer,
            message: `String length ${length} is less than minimum ${minLength}`,
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
 * @param maxLength - Maximum string length (in Unicode code points)
 * @returns Keyword validator for maxLength
 */
export function createMaxLengthValidator(maxLength: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'String') return [];

      const length = getCodePointLength(node.value);
      if (length > maxLength) {
        return [
          {
            path: pointer,
            message: `String length ${length} is greater than maximum ${maxLength}`,
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
