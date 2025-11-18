/**
 * JSON Schema draft version support
 *
 * This module defines types and utilities for working with multiple JSON Schema draft versions.
 */

import type { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import type { JSONSchema } from 'json-schema-typed';

/**
 * Type alias for JSON Schema Draft 2020-12
 */
export type JSONSchema202012 = JSONSchema;

/**
 * Supported JSON Schema draft versions
 */
export type Draft = 'draft-04' | 'draft-06' | 'draft-07' | 'draft-2020-12';

/**
 * Default draft version (for backward compatibility)
 */
export const DEFAULT_DRAFT: Draft = 'draft-07';

/**
 * Schema type for each draft version
 */
export type SchemaForDraft<D extends Draft> = D extends 'draft-04'
  ? JSONSchema4
  : D extends 'draft-06'
    ? JSONSchema6
    : D extends 'draft-07'
      ? JSONSchema7
      : D extends 'draft-2020-12'
        ? JSONSchema202012
        : never;

/**
 * Union type of all supported schema versions
 */
export type AnyJSONSchema = JSONSchema4 | JSONSchema6 | JSONSchema7 | JSONSchema202012;

/**
 * Type guard to check if a value is a valid draft identifier
 */
export function isDraft(value: unknown): value is Draft {
  return (
    value === 'draft-04' ||
    value === 'draft-06' ||
    value === 'draft-07' ||
    value === 'draft-2020-12'
  );
}

/**
 * Detect draft version from $schema URI
 *
 * Note: This is provided for future use, but the current implementation
 * requires explicit draft specification via ValidatorOptions.
 *
 * @param schemaUri - The $schema URI to parse
 * @returns The detected draft version, or undefined if not recognized
 */
export function detectDraftFromSchemaUri(schemaUri?: string): Draft | undefined {
  if (!schemaUri) {
    return undefined;
  }

  const uriMap: Record<string, Draft> = {
    'http://json-schema.org/draft-04/schema#': 'draft-04',
    'http://json-schema.org/draft-06/schema#': 'draft-06',
    'http://json-schema.org/draft-07/schema#': 'draft-07',
    'https://json-schema.org/draft/2020-12/schema': 'draft-2020-12',
  };

  return uriMap[schemaUri];
}
