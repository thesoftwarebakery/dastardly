// Base tree-sitter parser class

import type { DocumentNode } from '@bakes/dastardly-core';
import type { ParserRuntime, Language, SyntaxNode, ParseOptions } from './types.js';
import { ParseError } from './errors.js';
import { nodeToLocation, findErrorNode } from './utils.js';

/**
 * Abstract base class for tree-sitter parsers.
 * Format-specific parsers (JSON, YAML, etc.) should extend this class.
 */
export abstract class TreeSitterParser {
  protected runtime: ParserRuntime;
  protected sourceFormat: string;

  constructor(runtime: ParserRuntime, language: Language, sourceFormat: string) {
    this.runtime = runtime;
    this.sourceFormat = sourceFormat;
    this.runtime.setLanguage(language);
  }

  /**
   * Parse source code into a dastardly DocumentNode.
   * Throws ParseError if the source contains syntax errors.
   *
   * @param source - Source code to parse
   * @param options - Optional parse options (e.g., bufferSize for large files)
   */
  parse(source: string, options?: ParseOptions): DocumentNode {
    const tree = this.runtime.parse(source, undefined, options);

    // Check for parse errors (fail-fast strategy)
    if (tree.rootNode.hasError) {
      const errorNode = findErrorNode(tree.rootNode);
      const loc = errorNode
        ? nodeToLocation(errorNode, this.sourceFormat)
        : nodeToLocation(tree.rootNode, this.sourceFormat);

      throw new ParseError(
        'Failed to parse document: syntax error',
        loc,
        source
      );
    }

    // Convert tree-sitter CST to dastardly AST
    return this.convertDocument(tree.rootNode, source);
  }

  /**
   * Convert the root tree-sitter node to a DocumentNode.
   * Must be implemented by format-specific parsers.
   */
  protected abstract convertDocument(
    node: SyntaxNode,
    source: string
  ): DocumentNode;
}
