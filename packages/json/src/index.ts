// @dastardly/json - JSON parser and serializer

import type { DocumentNode, DataNode } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import JSON_LANGUAGE from 'tree-sitter-json';

// Re-export main classes and types
export { JSONParser } from './parser.js';
export { serialize, type SerializeOptions } from './serializer.js';

// Re-export utilities
export { escapeString, unescapeString, normalizeIndent } from './utils.js';

import { JSONParser } from './parser.js';
import { serialize as serializeNode } from './serializer.js';

/**
 * Parse JSON string into a dASTardly DocumentNode.
 * Convenience function that creates a parser and parses the source.
 *
 * @param source - JSON string to parse
 * @returns DocumentNode AST
 * @throws ParseError if source is invalid JSON
 */
export function parse(source: string): DocumentNode {
  const runtime = new NodeTreeSitterRuntime();
  const parser = new JSONParser(runtime, JSON_LANGUAGE);
  return parser.parse(source);
}

/**
 * Parse JSON string and return just the body (DataNode).
 * Convenience function equivalent to parse(source).body
 *
 * @param source - JSON string to parse
 * @returns DataNode AST
 * @throws ParseError if source is invalid JSON
 */
export function parseValue(source: string): DataNode {
  return parse(source).body;
}

/**
 * Serialize a dASTardly AST node to JSON string.
 * Convenience function with indent parameter.
 *
 * @param node - DocumentNode or DataNode to serialize
 * @param indent - Indentation (number of spaces, string, or undefined for compact)
 * @returns JSON string
 */
export function stringify(
  node: DocumentNode | DataNode,
  indent?: number | string
): string {
  if (indent === undefined) {
    return serializeNode(node, {});
  }
  return serializeNode(node, { indent });
}
