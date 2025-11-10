// $ref validation keyword

import type { JSONSchema7 } from 'json-schema';
import type { KeywordValidator } from '../compiler-types.js';
import { SchemaCompiler } from '../compiler.js';
import { resolveJsonPointer } from '../utils/json-pointer.js';

/**
 * Create a $ref validator
 *
 * Resolves JSON Pointer references within the schema and validates
 * against the referenced schema.
 *
 * Per JSON Schema spec:
 * - $ref overrides all sibling keywords (they are ignored)
 * - References are resolved using JSON Pointer (RFC 6901)
 * - Supports recursive references (e.g., "#" for self-reference)
 *
 * @param ref - JSON Pointer reference string (e.g., "#/properties/foo")
 * @param rootSchema - Root schema for resolving references
 * @param compiler - Schema compiler for caching subschemas
 * @returns Keyword validator for $ref
 */
export function createRefValidator(
  ref: string,
  rootSchema: JSONSchema7,
  compiler: SchemaCompiler
): KeywordValidator {
  return {
    validate(node, pointer, schemaPath, context) {
      // Resolve the reference
      const resolvedSchema = resolveJsonPointer(rootSchema, ref);

      if (resolvedSchema === undefined) {
        // Reference not found - this is a schema error, not a validation error
        // We'll report it as a validation error for now
        return [
          {
            path: pointer,
            message: `Cannot resolve $ref: ${ref}`,
            keyword: '$ref',
            schemaPath: `${schemaPath}/$ref`,
            location: node.loc,
            params: { ref },
          },
        ];
      }

      // Compile and validate against the resolved schema
      const compiled = compiler.compile(resolvedSchema);
      const errors = [];

      for (const validator of compiled.validators) {
        if (validator.appliesTo && !validator.appliesTo(node)) {
          continue;
        }

        const errs = validator.validate(node, pointer, `${schemaPath}/$ref`, context);
        errors.push(...errs);

        if (context.failFast && errs.length > 0) {
          break;
        }
      }

      return errors;
    },

    appliesTo: () => true,
  };
}
