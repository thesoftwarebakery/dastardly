// @dastardly/yaml - YAML parser and serializer

import type { DocumentNode, DataNode } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import YAML_LANGUAGE from '@tree-sitter-grammars/tree-sitter-yaml';

// Re-export main classes and types
export { YAMLParser } from './parser.js';
export { serialize, type SerializeOptions } from './serializer.js';

// Re-export utilities
export {
  escapeDoubleQuoteString,
  unescapeDoubleQuoteString,
  escapeSingleQuoteString,
  unescapeSingleQuoteString,
  parseYAMLNumber,
  normalizeBoolean,
  normalizeNull,
  isPlainSafe,
  normalizeIndent,
} from './utils.js';

import { YAMLParser } from './parser.js';

/**
 * Parse YAML string into a dASTardly DocumentNode.
 * Convenience function that creates a parser and parses the source.
 *
 * Note: Only the first document is parsed in multi-document YAML files.
 *
 * @param source - YAML string to parse
 * @returns DocumentNode AST
 * @throws ParseError if source is invalid YAML
 */
export function parse(source: string): DocumentNode {
  const runtime = new NodeTreeSitterRuntime();
  const parser = new YAMLParser(runtime, YAML_LANGUAGE);
  return parser.parse(source);
}

/**
 * Parse YAML string and return just the body (DataNode).
 * Convenience function equivalent to parse(source).body
 *
 * Note: Only the first document is parsed in multi-document YAML files.
 *
 * @param source - YAML string to parse
 * @returns DataNode AST
 * @throws ParseError if source is invalid YAML
 */
export function parseValue(source: string): DataNode {
  return parse(source).body;
}
