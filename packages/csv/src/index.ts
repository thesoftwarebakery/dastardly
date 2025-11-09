// @dastardly/csv - CSV parser and serializer

import type { DocumentNode, DataNode, FormatPackage } from '@dastardly/core';
import { isDocumentNode } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import CSV_LANGUAGE from '@dastardly/tree-sitter-csv';

// Export public types
export type { CSVParseOptions } from './parser.js';
export type { CSVSerializeOptions } from './serializer.js';

// Import internal classes
import { CSVParser, type CSVParseOptions } from './parser.js';
import { serialize as serializeNode, type CSVSerializeOptions } from './serializer.js';

/**
 * CSV format package implementing the FormatPackage interface.
 * Provides parsing and serialization for CSV (Comma-Separated Values) documents.
 *
 * Supports multiple delimiters (CSV, TSV, PSV) and various formatting options.
 *
 * @example
 * ```typescript
 * import { csv } from '@dastardly/csv';
 *
 * // Parse CSV with headers
 * const ast = csv.parse('name,age\nAlice,30\nBob,25');
 *
 * // Serialize with custom delimiter
 * const output = csv.serialize(ast, { delimiter: '\t' });
 * console.log(output);
 * // name	age
 * // Alice	30
 * // Bob	25
 * ```
 */
export const csv: FormatPackage<CSVSerializeOptions, CSVParseOptions> = {
  /**
   * Parse CSV string into a dASTardly DocumentNode.
   *
   * @param source - CSV string to parse
   * @param options - CSV parse options (delimiter, headers, inferTypes)
   * @returns DocumentNode AST
   * @throws ParseError if source is invalid CSV
   */
  parse(source, options): DocumentNode {
    const runtime = new NodeTreeSitterRuntime();
    const delimiter = options?.delimiter ?? ',';
    // Select grammar based on delimiter
    const grammar = delimiter === '\t' ? CSV_LANGUAGE.tsv : delimiter === '|' ? CSV_LANGUAGE.psv : CSV_LANGUAGE.csv;
    const parser = new CSVParser(runtime, grammar, options);
    return parser.parse(source);
  },

  /**
   * Serialize a dASTardly AST node to CSV string.
   *
   * Accepts either DocumentNode or DataNode. If a DataNode is provided,
   * it will be serialized directly. The root must be an ArrayNode containing
   * either Objects (for row-based CSV with headers) or Arrays (for raw tabular data).
   *
   * @param node - DocumentNode or DataNode to serialize
   * @param options - CSV serialization options
   * @returns CSV string
   * @throws Error if node structure is incompatible with CSV format
   */
  serialize(node: DocumentNode | DataNode, options?: CSVSerializeOptions): string {
    const dataNode = isDocumentNode(node) ? node.body : node;
    return serializeNode(dataNode, options ?? {});
  },
};

// Convenience exports for destructuring
export const { parse, serialize } = csv;
