// Object validation keywords

import type { JSONSchema7Definition } from 'json-schema';
import type { KeywordValidator } from '../compiler-types.js';
import { SchemaCompiler } from '../compiler.js';
import { validateAgainstSchema } from '../utils/validate-schema.js';

/**
 * Create a required validator
 *
 * Validates that all required properties are present in an object
 *
 * @param required - Array of required property names
 * @returns Keyword validator for required
 */
export function createRequiredValidator(required: readonly string[]): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Object') return [];

      const errors = [];
      const propertyKeys = new Set(node.properties.map((p) => p.key.value));

      for (const requiredKey of required) {
        if (!propertyKeys.has(requiredKey)) {
          errors.push({
            path: pointer,
            message: `Missing required property: ${requiredKey}`,
            keyword: 'required',
            schemaPath: `${schemaPath}/required`,
            location: node.loc,
            params: { missingProperty: requiredKey },
          });
        }
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Object',
  };
}

/**
 * Create a minProperties validator
 *
 * Validates that an object has at least the minimum number of properties
 *
 * @param minProperties - Minimum number of properties
 * @returns Keyword validator for minProperties
 */
export function createMinPropertiesValidator(minProperties: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Object') return [];

      const propertyCount = node.properties.length;

      if (propertyCount < minProperties) {
        return [
          {
            path: pointer,
            message: `Object has ${propertyCount} properties, minimum is ${minProperties}`,
            keyword: 'minProperties',
            schemaPath: `${schemaPath}/minProperties`,
            location: node.loc,
            params: { minProperties },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Object',
  };
}

/**
 * Create a maxProperties validator
 *
 * Validates that an object has at most the maximum number of properties
 *
 * @param maxProperties - Maximum number of properties
 * @returns Keyword validator for maxProperties
 */
export function createMaxPropertiesValidator(maxProperties: number): KeywordValidator {
  return {
    validate(node, pointer, schemaPath) {
      if (node.type !== 'Object') return [];

      const propertyCount = node.properties.length;

      if (propertyCount > maxProperties) {
        return [
          {
            path: pointer,
            message: `Object has ${propertyCount} properties, maximum is ${maxProperties}`,
            keyword: 'maxProperties',
            schemaPath: `${schemaPath}/maxProperties`,
            location: node.loc,
            params: { maxProperties },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'Object',
  };
}

/**
 * Create a properties validator
 *
 * Validates object properties against their schemas
 *
 * @param properties - Map of property names to their schemas
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for properties
 */
export function createPropertiesValidator(
  properties: Record<string, JSONSchema7Definition>,
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Object') return [];

      const errors = [];

      // Validate each property that has a schema defined
      for (const prop of node.properties) {
        const propertyName = prop.key.value;
        const propertySchema = properties[propertyName];

        if (propertySchema !== undefined) {
          const propPointer = `${pointer}/${propertyName}`;
          const propSchemaPath = `${schemaPath}/properties/${propertyName}`;

          const propErrors = validateAgainstSchema(
            prop.value,
            propertySchema,
            propPointer,
            propSchemaPath,
            context,
            compiler
          );

          errors.push(...propErrors);
        }
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Object',
  };
}

/**
 * Create a patternProperties validator
 *
 * Validates object properties against regex pattern-based schemas
 *
 * @param patternProperties - Map of regex patterns to their schemas
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for patternProperties
 */
export function createPatternPropertiesValidator(
  patternProperties: Record<string, JSONSchema7Definition>,
  compiler: SchemaCompiler
): KeywordValidator {
  // Compile regex patterns
  const patterns = Object.entries(patternProperties).map(([pattern, schema]) => ({
    regex: new RegExp(pattern),
    schema,
    pattern,
  }));

  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Object') return [];

      const errors = [];

      // Check each property against all patterns
      for (const prop of node.properties) {
        const propertyName = prop.key.value;

        for (const { regex, schema, pattern } of patterns) {
          if (regex.test(propertyName)) {
            const propPointer = `${pointer}/${propertyName}`;
            const propSchemaPath = `${schemaPath}/patternProperties/${pattern}`;

            const propErrors = validateAgainstSchema(
              prop.value,
              schema,
              propPointer,
              propSchemaPath,
              context,
              compiler
            );

            errors.push(...propErrors);
          }
        }
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Object',
  };
}

/**
 * Create an additionalProperties validator
 *
 * Validates properties not defined in properties or patternProperties
 *
 * @param additionalProperties - Schema for additional properties, or boolean
 * @param properties - Defined properties (to know what's additional)
 * @param patternProperties - Pattern properties (to know what's additional)
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for additionalProperties
 */
export function createAdditionalPropertiesValidator(
  additionalProperties: boolean | JSONSchema7Definition,
  properties: Record<string, JSONSchema7Definition> | undefined,
  patternProperties: Record<string, JSONSchema7Definition> | undefined,
  compiler: SchemaCompiler
): KeywordValidator {
  // Compile pattern regexes if patternProperties exist
  const patterns =
    patternProperties
      ? Object.keys(patternProperties).map((pattern) => new RegExp(pattern))
      : [];

  return {
    validate(node, pointer, schemaPath, context) {
      if (node.type !== 'Object') return [];

      const errors = [];

      for (const prop of node.properties) {
        const propertyName = prop.key.value;

        // Check if property is defined in properties
        const isDefined = properties && Object.prototype.hasOwnProperty.call(properties, propertyName);

        // Check if property matches any pattern
        const matchesPattern = patterns.some((regex) => regex.test(propertyName));

        // If not defined and doesn't match pattern, it's additional
        if (!isDefined && !matchesPattern) {
          if (additionalProperties === false) {
            // Additional properties not allowed
            errors.push({
              path: pointer,
              message: `Additional property '${propertyName}' is not allowed`,
              keyword: 'additionalProperties',
              schemaPath: `${schemaPath}/additionalProperties`,
              location: node.loc,
              params: { additionalProperty: propertyName },
            });
          } else if (additionalProperties !== true && typeof additionalProperties === 'object') {
            // Additional properties must match schema
            const propPointer = `${pointer}/${propertyName}`;
            const propSchemaPath = `${schemaPath}/additionalProperties`;

            const propErrors = validateAgainstSchema(
              prop.value,
              additionalProperties,
              propPointer,
              propSchemaPath,
              context,
              compiler
            );

            errors.push(...propErrors);
          }
          // If additionalProperties === true, allow anything (no errors)
        }
      }

      return errors;
    },

    appliesTo: (node) => node.type === 'Object',
  };
}
