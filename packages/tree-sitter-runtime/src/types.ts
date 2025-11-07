// Tree-sitter runtime type definitions
// Abstracts over tree-sitter (Node.js) and web-tree-sitter (WASM)

/**
 * Represents a position in the source code (from tree-sitter).
 */
export interface TreeSitterPoint {
  readonly row: number;    // 0-indexed line
  readonly column: number; // 0-indexed column
}

/**
 * Represents a syntax node in the parse tree.
 * This interface abstracts over both tree-sitter and web-tree-sitter node types.
 */
export interface SyntaxNode {
  readonly type: string;
  readonly startPosition: TreeSitterPoint;
  readonly endPosition: TreeSitterPoint;
  readonly startIndex: number;  // Byte offset
  readonly endIndex: number;
  readonly text: string;
  readonly hasError: boolean;
  readonly children: readonly SyntaxNode[];
  readonly childCount: number;

  /**
   * Get a child node by field name (e.g., "key", "value").
   */
  childForFieldName(fieldName: string): SyntaxNode | null;

  /**
   * Get a child node by index.
   */
  child(index: number): SyntaxNode | null;

  /**
   * Get the first named child (non-anonymous).
   */
  firstNamedChild: SyntaxNode | null;

  /**
   * Get the next named sibling.
   */
  nextNamedSibling: SyntaxNode | null;
}

/**
 * Represents a parsed syntax tree.
 */
export interface SyntaxTree {
  readonly rootNode: SyntaxNode;
}

/**
 * Tree-sitter language grammar.
 */
export interface Language {
  // Opaque type - specific to tree-sitter implementation
}

/**
 * Parser runtime interface.
 * Abstracts over tree-sitter (native) and web-tree-sitter (WASM).
 */
export interface ParserRuntime {
  /**
   * Set the language grammar to use for parsing.
   */
  setLanguage(language: Language): void;

  /**
   * Parse source code into a syntax tree.
   */
  parse(source: string): SyntaxTree;
}
