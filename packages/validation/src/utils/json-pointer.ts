/**
 * JSON Pointer utilities (RFC 6901)
 * https://tools.ietf.org/html/rfc6901
 */

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

/**
 * Parse a JSON Pointer reference string into path segments
 *
 * Handles:
 * - Root reference: "#" → []
 * - Pointer paths: "#/properties/foo" → ["properties", "foo"]
 * - Escaping: ~0 → ~, ~1 → /
 * - URL encoding: %XX → decoded character
 *
 * @param ref - Reference string (e.g., "#/properties/foo")
 * @returns Array of path segments
 */
export function parseJsonPointer(ref: string): string[] {
  // Remove leading '#' if present
  const pointer = ref.startsWith('#') ? ref.slice(1) : ref;

  // Empty string or just "/" means root
  if (pointer === '' || pointer === '/') {
    return [];
  }

  // Split by '/', skip first empty element (from leading /)
  const segments = pointer.split('/').slice(1);

  // Decode each segment
  return segments.map(decodePointerSegment);
}

/**
 * Decode a JSON Pointer segment
 *
 * Per RFC 6901:
 * - ~0 is replaced with ~
 * - ~1 is replaced with /
 * - URL percent encoding is decoded
 *
 * @param segment - Encoded segment
 * @returns Decoded segment
 */
function decodePointerSegment(segment: string): string {
  // First decode URL encoding (e.g., %25 → %)
  let decoded = decodeURIComponent(segment);

  // Then handle JSON Pointer escaping
  // ~1 must be decoded before ~0 (order matters!)
  decoded = decoded.replace(/~1/g, '/');
  decoded = decoded.replace(/~0/g, '~');

  return decoded;
}

/**
 * Resolve a JSON Pointer within a schema
 *
 * @param rootSchema - Root schema to resolve from
 * @param pointer - JSON Pointer string (e.g., "#/properties/foo")
 * @returns Resolved schema definition, or undefined if not found
 */
export function resolveJsonPointer(
  rootSchema: JSONSchema7,
  pointer: string
): JSONSchema7Definition | undefined {
  const segments = parseJsonPointer(pointer);

  // Root reference
  if (segments.length === 0) {
    return rootSchema;
  }

  // Navigate through schema
  let current: any = rootSchema;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle boolean schemas (can't navigate into them)
    if (typeof current === 'boolean') {
      return undefined;
    }

    // Navigate into object/array
    if (typeof current === 'object') {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return current as JSONSchema7Definition;
}
