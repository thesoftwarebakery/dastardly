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

/**
 * Create a contains validator
 *
 * Validates that at least one array element matches the schema
 *
 * @param containsSchema - Schema that at least one element must match
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for contains
 */
export function createContainsValidator(
  containsSchema: JSONSchema7Definition,
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Array') return [];

      // Empty array fails contains validation
      if (node.elements.length === 0) {
        return [
          {
            path: pointer,
            message: 'Array must contain at least one matching element',
            keyword: 'contains',
            schemaPath: `${schemaPath}/contains`,
            location: node.loc,
            params: {},
          },
        ];
      }

      // Check if at least one element matches the schema
      let hasMatch = false;

      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i]!;
        const elementPointer = `${pointer}/${i}`;
        const elementSchemaPath = `${schemaPath}/contains`;

        const elementErrors = validateAgainstSchema(
          element,
          containsSchema,
          elementPointer,
          elementSchemaPath,
          context,
          compiler
        );

        if (elementErrors.length === 0) {
          hasMatch = true;
          break;
        }
      }

      if (!hasMatch) {
        return [
          {
            path: pointer,
            message: 'Array must contain at least one element matching the schema',
            keyword: 'contains',
            schemaPath: `${schemaPath}/contains`,
            location: node.loc,
            params: {},
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Array',
  };
}

/**
 * Create a uniqueItems validator
 *
 * Validates that all array elements are unique
 *
 * @param uniqueItems - Whether items must be unique
 * @returns Keyword validator for uniqueItems
 */
export function createUniqueItemsValidator(uniqueItems: boolean): KeywordValidator {
  if (!uniqueItems) {
    // If uniqueItems is false, no validation needed
    return {
      validate() {
        return [];
      },
      appliesTo: () => false,
    };
  }

  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Array') return [];

      // Use deep equality to check for duplicates
      const seen = new Map<string, number>();

      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i]!;

        // Serialize element for comparison (handles objects/arrays)
        const serialized = serializeNode(element);

        if (seen.has(serialized)) {
          const firstIndex = seen.get(serialized)!;
          return [
            {
              path: `${pointer}/${i}`,
              message: `Array items must be unique (duplicate of item at index ${firstIndex})`,
              keyword: 'uniqueItems',
              schemaPath: `${schemaPath}/uniqueItems`,
              location: element.loc,
              params: { duplicateIndex: firstIndex },
            },
          ];
        }

        seen.set(serialized, i);
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Array',
  };
}

/**
 * Serialize a node to a string for uniqueness comparison
 * Uses the same logic as extractValue but returns JSON string
 */
function serializeNode(node: import('@bakes/dastardly-core').DataNode): string {
  const value = extractValue(node);
  return JSON.stringify(value);
}

/**
 * Extract plain JavaScript value from AST node
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
