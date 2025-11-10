// Array validation keywords

import type { JSONSchema7Definition } from 'json-schema';
import type { KeywordValidator } from '../compiler-types.js';
import { SchemaCompiler } from '../compiler.js';
import { validateAgainstSchema } from '../utils/validate-schema.js';

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

/**
 * Create an items validator
 *
 * Validates array elements against schemas. Supports two modes:
 * - Single schema: all elements must match the same schema
 * - Tuple schema: element[i] must match schema[i]
 *
 * @param items - Schema or array of schemas for items
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for items
 */
export function createItemsValidator(
  items: JSONSchema7Definition | JSONSchema7Definition[],
  compiler: SchemaCompiler
): KeywordValidator {
  const isTuple = Array.isArray(items);

  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Array') return [];

      const errors = [];

      if (isTuple) {
        // Tuple mode: validate element[i] against schema[i]
        const tupleSchemas = items as JSONSchema7Definition[];
        const validateCount = Math.min(node.elements.length, tupleSchemas.length);

        for (let i = 0; i < validateCount; i++) {
          const element = node.elements[i]!;
          const elementSchema = tupleSchemas[i]!;
          const elementPointer = `${pointer}/${i}`;
          const elementSchemaPath = `${schemaPath}/items/${i}`;

          const elementErrors = validateAgainstSchema(
            element,
            elementSchema,
            elementPointer,
            elementSchemaPath,
            context,
            compiler
          );

          errors.push(...elementErrors);
        }
      } else {
        // Single schema mode: validate all elements against same schema
        const itemSchema = items as JSONSchema7Definition;

        for (let i = 0; i < node.elements.length; i++) {
          const element = node.elements[i]!;
          const elementPointer = `${pointer}/${i}`;
          const elementSchemaPath = `${schemaPath}/items`;

          const elementErrors = validateAgainstSchema(
            element,
            itemSchema,
            elementPointer,
            elementSchemaPath,
            context,
            compiler
          );

          errors.push(...elementErrors);
        }
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Array',
  };
}

/**
 * Create an additionalItems validator
 *
 * Validates array elements beyond the tuple schema length.
 * Only applies when items is a tuple (array of schemas).
 *
 * @param additionalItems - Schema for additional items, or boolean
 * @param itemsSchema - The items schema (to check if tuple mode)
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for additionalItems
 */
export function createAdditionalItemsValidator(
  additionalItems: boolean | JSONSchema7Definition,
  itemsSchema: JSONSchema7Definition | JSONSchema7Definition[] | undefined,
  compiler: SchemaCompiler
): KeywordValidator {
  // Only applies if items is a tuple (array)
  const isTuple = Array.isArray(itemsSchema);
  const tupleLength = isTuple ? (itemsSchema as JSONSchema7Definition[]).length : 0;

  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Array') return [];

      // additionalItems only applies in tuple mode
      if (!isTuple) return [];

      const errors = [];

      // Validate elements beyond tuple length
      for (let i = tupleLength; i < node.elements.length; i++) {
        const element = node.elements[i]!;

        if (additionalItems === false) {
          // Additional items not allowed
          errors.push({
            path: `${pointer}/${i}`,
            message: `Additional items are not allowed (index ${i})`,
            keyword: 'additionalItems',
            schemaPath: `${schemaPath}/additionalItems`,
            location: element.loc,
            params: { index: i },
          });
        } else if (additionalItems !== true && typeof additionalItems === 'object') {
          // Additional items must match schema
          const elementPointer = `${pointer}/${i}`;
          const elementSchemaPath = `${schemaPath}/additionalItems`;

          const elementErrors = validateAgainstSchema(
            element,
            additionalItems,
            elementPointer,
            elementSchemaPath,
            context,
            compiler
          );

          errors.push(...elementErrors);
        }
        // If additionalItems === true, allow anything (no errors)
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Array',
  };
}
