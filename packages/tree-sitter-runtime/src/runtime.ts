// Native tree-sitter runtime implementation for Node.js

import Parser from 'tree-sitter';
import type { ParserRuntime, Language, SyntaxTree } from './types.js';

/**
 * Node.js tree-sitter runtime adapter.
 * Wraps the native tree-sitter parser for use with our abstraction.
 */
export class NodeTreeSitterRuntime implements ParserRuntime {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  setLanguage(language: Language): void {
    // tree-sitter Language type is compatible with our Language interface
    this.parser.setLanguage(language as any);
  }

  parse(source: string): SyntaxTree {
    const tree = this.parser.parse(source);
    // tree-sitter Tree type is compatible with our SyntaxTree interface
    return tree as unknown as SyntaxTree;
  }
}
