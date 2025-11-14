// Format package interface for dASTardly

import type { DocumentNode, DataNode } from './types.js';

/**
 * Base parse options shared by all formats.
 *
 * Currently minimal - only truly universal options belong here
 * (e.g., future: encoding detection, unicode normalization, error recovery modes).
 *
 * Format-specific options (type inference, delimiters, header handling, etc.) belong in
 * format-specific extensions like CSVParseOptions.
 */
export interface BaseParseOptions {
  // Intentionally minimal - most options are format-specific
}

/**
 * Base serialization options shared by all formats.
 *
 * Currently minimal - only truly universal options belong here
 * (e.g., future: encoding, unicode normalization, BOM handling).
 *
 * Format-specific options (indent, delimiters, quoting, etc.) belong in
 * format-specific extensions like JSONSerializeOptions or CSVSerializeOptions.
 */
export interface BaseSerializeOptions {
  // Intentionally minimal - most options are format-specific
}

/**
 * Common interface all format packages must implement.
 * Provides consistent API across JSON, YAML, XML, CSV, TOML, etc.
 *
 * Format packages export an object implementing this interface, ensuring
 * type safety and API consistency across all formats.
 *
 * @template TSerializeOptions - Format-specific serialization options extending BaseSerializeOptions
 * @template TParseOptions - Format-specific parse options extending BaseParseOptions
 *
 * @example
 * ```typescript
 * // Implementing a format package with parse options
 * import type { FormatPackage } from '@bakes/dastardly-core';
 *
 * export interface CSVSerializeOptions extends BaseSerializeOptions {
 *   delimiter?: string;
 *   quoteStrategy?: 'needed' | 'all' | 'nonnumeric' | 'none';
 * }
 *
 * export interface CSVParseOptions extends BaseParseOptions {
 *   inferTypes?: boolean;
 *   headers?: boolean | string[];
 *   delimiter?: string;
 * }
 *
 * export const csv: FormatPackage<CSVSerializeOptions, CSVParseOptions> = {
 *   parse(source, options) {
 *     // Parse CSV to AST using options
 *   },
 *
 *   serialize(node, options) {
 *     // Serialize AST to CSV
 *   }
 * };
 * ```
 */
export interface FormatPackage<
  TSerializeOptions extends BaseSerializeOptions = BaseSerializeOptions,
  TParseOptions extends BaseParseOptions = BaseParseOptions
> {
  /**
   * Parse source text into a dASTardly DocumentNode.
   *
   * @param source - Source text in the format (JSON, YAML, XML, etc.)
   * @param options - Format-specific parse options (optional)
   * @returns Parsed DocumentNode AST with full position information
   * @throws ParseError if source is invalid or malformed
   *
   * @example
   * ```typescript
   * import { csv } from '@bakes/dastardly-csv';
   *
   * // Parse with default options
   * const ast1 = csv.parse('name,age\nAlice,30');
   *
   * // Parse with type inference
   * const ast2 = csv.parse('name,age\nAlice,30', { inferTypes: true });
   * console.log(ast2.type); // 'Document'
   * console.log(ast2.body.type); // 'Array'
   * ```
   */
  parse(source: string, options?: TParseOptions): DocumentNode;

  /**
   * Serialize a dASTardly AST node to format-specific text.
   *
   * Accepts either a DocumentNode or DataNode and converts it to the
   * target format (JSON, YAML, XML, etc.) using format-specific options.
   *
   * @param node - DocumentNode or DataNode to serialize
   * @param options - Format-specific serialization options (optional)
   * @returns Serialized text in the target format
   *
   * @example
   * ```typescript
   * import { json } from '@bakes/dastardly-json';
   * import { objectNode, propertyNode, stringNode, numberNode } from '@bakes/dastardly-core';
   *
   * const ast = objectNode([
   *   propertyNode(stringNode('name'), stringNode('Alice')),
   *   propertyNode(stringNode('age'), numberNode(30))
   * ]);
   *
   * // Compact output
   * json.serialize(ast); // '{"name":"Alice","age":30}'
   *
   * // Pretty-printed
   * json.serialize(ast, { indent: 2 });
   * // {
   * //   "name": "Alice",
   * //   "age": 30
   * // }
   * ```
   */
  serialize(node: DocumentNode | DataNode, options?: TSerializeOptions): string;
}
