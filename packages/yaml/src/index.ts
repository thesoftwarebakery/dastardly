// @dastardly/yaml - YAML parser and serializer

import type { DocumentNode, DataNode, FormatPackage } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import YAML_LANGUAGE from '@tree-sitter-grammars/tree-sitter-yaml';

// Export public types
export type { YAMLSerializeOptions } from './serializer.js';

// Import internal classes
import { YAMLParser } from './parser.js';
import { serialize as serializeNode, type YAMLSerializeOptions } from './serializer.js';

/**
 * YAML format package implementing the FormatPackage interface.
 * Provides parsing and serialization for YAML documents.
 *
 * Note: Only the first document is parsed in multi-document YAML files.
 *
 * @example
 * ```typescript
 * import { yaml } from '@dastardly/yaml';
 *
 * // Parse YAML
 * const ast = yaml.parse('name: Alice\nage: 30');
 *
 * // Serialize with options
 * const output = yaml.serialize(ast, { indent: 2 });
 * console.log(output);
 * // name: Alice
 * // age: 30
 * ```
 */
export const yaml: FormatPackage<YAMLSerializeOptions> = {
  /**
   * Parse YAML string into a dASTardly DocumentNode.
   *
   * Note: Only the first document is parsed in multi-document YAML files.
   *
   * @param source - YAML string to parse
   * @param options - Parse options (not used for YAML)
   * @returns DocumentNode AST
   * @throws ParseError if source is invalid YAML
   */
  parse(source, options): DocumentNode {
    const runtime = new NodeTreeSitterRuntime();
    const parser = new YAMLParser(runtime, YAML_LANGUAGE);
    return parser.parse(source);
  },

  /**
   * Serialize a dASTardly AST node to YAML string.
   *
   * @param node - DocumentNode or DataNode to serialize
   * @param options - YAML serialization options
   * @returns YAML string
   */
  serialize(node: DocumentNode | DataNode, options?: YAMLSerializeOptions): string {
    return serializeNode(node, options ?? {});
  },
};

// Convenience exports for destructuring
export const { parse, serialize } = yaml;
