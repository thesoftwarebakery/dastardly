// Combinator validation keywords (allOf, anyOf, oneOf, not)

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { DataNode } from '@dastardly/core';
import type { KeywordValidator, ValidationContext } from '../compiler-types.js';
import type { ValidationError } from '../types.js';
import { SchemaCompiler } from '../compiler.js';

/**
 * Validate a node against a schema definition (can be boolean or object schema)
 *
 * @param node - Node to validate
 * @param schemaDef - Schema definition (boolean or object)
 * @param pointer - JSON pointer to node
 * @param schemaPath - Path in schema for error reporting
 * @param context - Validation context
 * @param compiler - Schema compiler for caching
 * @returns Validation errors
 */
function validateAgainstSchema(
  node: DataNode,
  schemaDef: JSONSchema7Definition,
  pointer: string,
  schemaPath: string,
  context: ValidationContext,
  compiler: SchemaCompiler
): ValidationError[] {
  // Handle boolean schemas
  if (typeof schemaDef === 'boolean') {
    if (schemaDef === false) {
      // false schema - everything is invalid
      return [
        {
          path: pointer,
          message: 'Schema is false, no value is valid',
          keyword: 'false',
          schemaPath,
          location: node.loc,
          params: {},
        },
      ];
    }
    // true schema - everything is valid
    return [];
  }

  // Handle object schema - compile and validate
  const compiled = compiler.compile(schemaDef);
  const errors: ValidationError[] = [];

  for (const validator of compiled.validators) {
    if (validator.appliesTo && !validator.appliesTo(node)) {
      continue;
    }

    const errs = validator.validate(node, pointer, schemaPath, context);
    errors.push(...errs);

    if (context.failFast && errs.length > 0) {
      break;
    }
  }

  return errors;
}

/**
 * Create an allOf validator
 *
 * Validates that a value matches ALL of the given schemas
 *
 * @param schemas - Array of schemas that must all match
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for allOf
 */
export function createAllOfValidator(
  schemas: readonly JSONSchema7Definition[],
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      const errors: ValidationError[] = [];

      for (let i = 0; i < schemas.length; i++) {
        const schema = schemas[i]!;
        const subSchemaPath = `${schemaPath}/allOf/${i}`;
        const subErrors = validateAgainstSchema(node, schema, pointer, subSchemaPath, context, compiler);

        if (subErrors.length > 0) {
          errors.push(...subErrors);
          if (context.failFast) {
            break;
          }
        }
      }

      return errors;
    },

    appliesTo: () => true,
  };
}

/**
 * Create an anyOf validator
 *
 * Validates that a value matches AT LEAST ONE of the given schemas
 *
 * @param schemas - Array of schemas, at least one must match
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for anyOf
 */
export function createAnyOfValidator(
  schemas: readonly JSONSchema7Definition[],
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      // Try each schema - if any passes, we're valid
      let hasMatch = false;
      const allErrors: ValidationError[][] = [];

      for (let i = 0; i < schemas.length; i++) {
        const schema = schemas[i]!;
        const subSchemaPath = `${schemaPath}/anyOf/${i}`;
        const subErrors = validateAgainstSchema(node, schema, pointer, subSchemaPath, context, compiler);

        if (subErrors.length === 0) {
          hasMatch = true;
          break;
        }

        allErrors.push(subErrors);
      }

      // If no schema matched, return an error
      if (!hasMatch) {
        return [
          {
            path: pointer,
            message: `Value does not match any of the ${schemas.length} schemas`,
            keyword: 'anyOf',
            schemaPath: `${schemaPath}/anyOf`,
            location: node.loc,
            params: { failures: allErrors },
          },
        ];
      }

      return [];
    },

    appliesTo: () => true,
  };
}

/**
 * Create a oneOf validator
 *
 * Validates that a value matches EXACTLY ONE of the given schemas
 *
 * @param schemas - Array of schemas, exactly one must match
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for oneOf
 */
export function createOneOfValidator(
  schemas: readonly JSONSchema7Definition[],
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      let matchCount = 0;
      const allErrors: ValidationError[][] = [];

      for (let i = 0; i < schemas.length; i++) {
        const schema = schemas[i]!;
        const subSchemaPath = `${schemaPath}/oneOf/${i}`;
        const subErrors = validateAgainstSchema(node, schema, pointer, subSchemaPath, context, compiler);

        if (subErrors.length === 0) {
          matchCount++;
        } else {
          allErrors.push(subErrors);
        }
      }

      // Must match exactly one schema
      if (matchCount === 0) {
        return [
          {
            path: pointer,
            message: `Value does not match any of the ${schemas.length} schemas`,
            keyword: 'oneOf',
            schemaPath: `${schemaPath}/oneOf`,
            location: node.loc,
            params: { matches: matchCount, failures: allErrors },
          },
        ];
      } else if (matchCount > 1) {
        return [
          {
            path: pointer,
            message: `Value matches ${matchCount} schemas, expected exactly 1`,
            keyword: 'oneOf',
            schemaPath: `${schemaPath}/oneOf`,
            location: node.loc,
            params: { matches: matchCount },
          },
        ];
      }

      return [];
    },

    appliesTo: () => true,
  };
}

/**
 * Create a not validator
 *
 * Validates that a value does NOT match the given schema
 *
 * @param schema - Schema that must not match
 * @param compiler - Schema compiler for caching subschema
 * @returns Keyword validator for not
 */
export function createNotValidator(
  schema: JSONSchema7Definition,
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      const subSchemaPath = `${schemaPath}/not`;
      const subErrors = validateAgainstSchema(node, schema, pointer, subSchemaPath, context, compiler);

      // If schema matched (no errors), that's invalid for 'not'
      if (subErrors.length === 0) {
        return [
          {
            path: pointer,
            message: 'Value must not match the schema',
            keyword: 'not',
            schemaPath: `${schemaPath}/not`,
            location: node.loc,
            params: {},
          },
        ];
      }

      // If schema didn't match (has errors), that's valid for 'not'
      return [];
    },

    appliesTo: () => true,
  };
}
