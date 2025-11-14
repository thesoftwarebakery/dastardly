// Type validation keyword

import type { JSONSchema7 } from 'json-schema';
import type { DataNode } from '@bakes/dastardly-core';
import type { KeywordValidator } from '../compiler-types.js';

/**
 * Create a type validator for a JSON Schema type keyword
 *
 * @param schemaType - Type(s) from schema
 * @returns Keyword validator for type checking
 */
export function createTypeValidator(schemaType: JSONSchema7['type']): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      const errors = [];

      if (typeof schemaType === 'string') {
        if (!nodeMatchesType(node, schemaType)) {
          const nodeType = getNodeTypeForError(node);
          errors.push({
            path: pointer,
            message: `Expected type ${schemaType}, got ${nodeType}`,
            keyword: 'type',
            schemaPath: `${schemaPath}/type`,
            location: node.loc,
            params: { type: schemaType },
          });
        }
      } else if (Array.isArray(schemaType)) {
        const matches = schemaType.some((t) => nodeMatchesType(node, t));
        if (!matches) {
          const nodeType = getNodeTypeForError(node);
          errors.push({
            path: pointer,
            message: `Expected one of ${schemaType.join(', ')}, got ${nodeType}`,
            keyword: 'type',
            schemaPath: `${schemaPath}/type`,
            location: node.loc,
            params: { type: schemaType },
          });
        }
      }

      return errors;
    },

    // All nodes have types
    appliesTo: () => true,
  };
}

/**
 * Check if node matches a JSON Schema type
 */
function nodeMatchesType(node: DataNode, schemaType: string): boolean {
  switch (node.type) {
    case 'String':
      return schemaType === 'string';
    case 'Number':
      // Numbers match both 'number' and 'integer' (if they're integers)
      if (schemaType === 'number') return true;
      if (schemaType === 'integer') return node.value % 1 === 0;
      return false;
    case 'Boolean':
      return schemaType === 'boolean';
    case 'Null':
      return schemaType === 'null';
    case 'Array':
      return schemaType === 'array';
    case 'Object':
      return schemaType === 'object';
  }
}

/**
 * Get JSON Schema type name for error messages
 */
function getNodeTypeForError(node: DataNode): string {
  switch (node.type) {
    case 'String':
      return 'string';
    case 'Number':
      return node.value % 1 === 0 ? 'integer' : 'number';
    case 'Boolean':
      return 'boolean';
    case 'Null':
      return 'null';
    case 'Array':
      return 'array';
    case 'Object':
      return 'object';
  }
}
