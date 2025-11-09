// @dastardly/json - JSON parser and serializer

import type { DocumentNode, DataNode, FormatPackage } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import JSON_LANGUAGE from 'tree-sitter-json';

// Export public types
export type { JSONSerializeOptions } from './serializer.js';

// Import internal classes
import { JSONParser } from './parser.js';
import { serialize as serializeNode, type JSONSerializeOptions } from './serializer.js';

/**
 * JSON format package implementing the FormatPackage interface.
 * Provides parsing and serialization for JSON documents.
 *
 * @example
 * ```typescript
 * import { json } from '@dastardly/json';
 *
 * // Parse JSON
 * const ast = json.parse('{"name": "Alice", "age": 30}');
 *
 * // Serialize with options
 * const output = json.serialize(ast, { indent: 2 });
 * console.log(output);
 * // {
 * //   "name": "Alice",
 * //   "age": 30
 * // }
 * ```
 */
export const json: FormatPackage<JSONSerializeOptions> = {
  /**
   * Parse JSON string into a dASTardly DocumentNode.
   *
   * @param source - JSON string to parse
   * @param options - Parse options (not used for JSON)
   * @returns DocumentNode AST
   * @throws ParseError if source is invalid JSON
   */
  parse(source, options): DocumentNode {
    const runtime = new NodeTreeSitterRuntime();
    const parser = new JSONParser(runtime, JSON_LANGUAGE);
    return parser.parse(source);
  },

  /**
   * Serialize a dASTardly AST node to JSON string.
   *
   * @param node - DocumentNode or DataNode to serialize
   * @param options - JSON serialization options
   * @returns JSON string
   */
  serialize(node: DocumentNode | DataNode, options?: JSONSerializeOptions): string {
    return serializeNode(node, options ?? {});
  },
};

// Convenience exports for destructuring
export const { parse, serialize } = json;
