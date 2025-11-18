// Number validation keywords

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a minimum validator
 *
 * @param minimum - Minimum numeric value
 * @param exclusive - Whether the minimum is exclusive (Draft 4 only)
 * @returns Keyword validator for minimum
 */
export function createMinimumValidator(minimum: number, exclusive = false): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      const invalid = exclusive ? node.value <= minimum : node.value < minimum;

      if (invalid) {
        const comparison = exclusive ? 'less than or equal to' : 'less than';
        const qualifier = exclusive ? 'exclusive ' : '';
        return [
          {
            path: pointer,
            message: `Value ${node.value} is ${comparison} ${qualifier}minimum ${minimum}`,
            keyword: 'minimum',
            schemaPath: `${schemaPath}/minimum`,
            location: node.loc,
            params: { minimum, exclusiveMinimum: exclusive },
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
 * @param exclusive - Whether the maximum is exclusive (Draft 4 only)
 * @returns Keyword validator for maximum
 */
export function createMaximumValidator(maximum: number, exclusive = false): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      const invalid = exclusive ? node.value >= maximum : node.value > maximum;

      if (invalid) {
        const comparison = exclusive ? 'greater than or equal to' : 'greater than';
        const qualifier = exclusive ? 'exclusive ' : '';
        return [
          {
            path: pointer,
            message: `Value ${node.value} is ${comparison} ${qualifier}maximum ${maximum}`,
            keyword: 'maximum',
            schemaPath: `${schemaPath}/maximum`,
            location: node.loc,
            params: { maximum, exclusiveMaximum: exclusive },
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

/**
 * Create an exclusiveMinimum validator
 *
 * @param exclusiveMinimum - Exclusive minimum numeric value
 * @returns Keyword validator for exclusiveMinimum
 */
export function createExclusiveMinimumValidator(exclusiveMinimum: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      if (node.value <= exclusiveMinimum) {
        return [
          {
            path: pointer,
            message: `Value ${node.value} is less than or equal to exclusive minimum ${exclusiveMinimum}`,
            keyword: 'exclusiveMinimum',
            schemaPath: `${schemaPath}/exclusiveMinimum`,
            location: node.loc,
            params: { exclusiveMinimum },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Number',
  };
}

/**
 * Create an exclusiveMaximum validator
 *
 * @param exclusiveMaximum - Exclusive maximum numeric value
 * @returns Keyword validator for exclusiveMaximum
 */
export function createExclusiveMaximumValidator(exclusiveMaximum: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Number') return [];

      if (node.value >= exclusiveMaximum) {
        return [
          {
            path: pointer,
            message: `Value ${node.value} is greater than or equal to exclusive maximum ${exclusiveMaximum}`,
            keyword: 'exclusiveMaximum',
            schemaPath: `${schemaPath}/exclusiveMaximum`,
            location: node.loc,
            params: { exclusiveMaximum },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Number',
  };
}
