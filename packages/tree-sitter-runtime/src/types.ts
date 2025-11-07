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
 * Alias for TreeSitterPoint - used in Edit interface.
 * @deprecated Use TreeSitterPoint instead
 */
export type Point = TreeSitterPoint;

/**
 * Describes a source code edit for incremental parsing.
 * Used to update a parse tree before re-parsing.
 *
 * @internal - Not part of stable API in v1
 */
export interface Edit {
  readonly startIndex: number;      // Byte offset where edit starts
  readonly oldEndIndex: number;     // Byte offset where edit ended (before change)
  readonly newEndIndex: number;     // Byte offset where edit ends (after change)
  readonly startPosition: TreeSitterPoint;
  readonly oldEndPosition: TreeSitterPoint;
  readonly newEndPosition: TreeSitterPoint;
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

  /**
   * Update the parse tree to reflect a source code edit.
   * Must be called before re-parsing with this tree as oldTree.
   *
   * @internal - Not part of stable API in v1
   */
  edit?(edit: Edit): void;
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
   *
   * @param source - Source code to parse
   * @param oldTree - Optional previous parse tree for incremental parsing
   *                  Tree-sitter will reuse unchanged portions for better performance
   *
   * @internal - oldTree parameter is not part of stable API in v1
   */
  parse(source: string, oldTree?: SyntaxTree): SyntaxTree;
}
