// Core AST type definitions for dASTardly
// Pure, immutable, format-agnostic data structures

// =============================================================================
// Position & Location Types
// =============================================================================

/**
 * A position in source text (line, column, and byte offset).
 * Lines are 1-indexed, columns and offsets are 0-indexed.
 */
export interface Position {
  readonly line: number;    // 1-indexed line number
  readonly column: number;  // 0-indexed column number
  readonly offset: number;  // 0-indexed byte offset from start of file
}

/**
 * A range in source text with start and end positions.
 */
export interface SourceRange {
  readonly start: Position;
  readonly end: Position;
}

/**
 * Source location with format metadata.
 */
export interface SourceLocation extends SourceRange {
  readonly source?: string;  // Source format: "json", "yaml", "xml", etc.
}

// =============================================================================
// AST Node Types (Discriminated Union Pattern)
// =============================================================================
// Note: We use type aliases instead of interface inheritance to enable proper
// discriminated union narrowing. See: https://github.com/microsoft/TypeScript/issues/56106

// =============================================================================
// Value Nodes (Leaf nodes with scalar values)
// =============================================================================

/**
 * String value node.
 */
export type StringNode = {
  readonly type: 'String';
  readonly value: string;
  readonly raw?: string;  // Original representation with quotes (e.g., '"hello"')
  readonly loc: SourceLocation;
};

/**
 * Number value node.
 */
export type NumberNode = {
  readonly type: 'Number';
  readonly value: number;
  readonly raw?: string;  // Original representation (e.g., "1.0", "1e5")
  readonly loc: SourceLocation;
};

/**
 * Boolean value node.
 */
export type BooleanNode = {
  readonly type: 'Boolean';
  readonly value: boolean;
  readonly loc: SourceLocation;
};

/**
 * Null value node.
 */
export type NullNode = {
  readonly type: 'Null';
  readonly value: null;
  readonly loc: SourceLocation;
};

/**
 * Union of all value node types.
 */
export type ValueNode = StringNode | NumberNode | BooleanNode | NullNode;

// =============================================================================
// Container Nodes (Nodes with children)
// =============================================================================

/**
 * Object property (key-value pair).
 */
export type PropertyNode = {
  readonly type: 'Property';
  readonly key: StringNode;
  readonly value: DataNode;
  readonly loc: SourceLocation;
};

/**
 * Object node (map/dictionary).
 * No format-specific metadata - keep core pure.
 */
export type ObjectNode = {
  readonly type: 'Object';
  readonly properties: readonly PropertyNode[];
  readonly loc: SourceLocation;
};

/**
 * Array node (ordered list).
 */
export type ArrayNode = {
  readonly type: 'Array';
  readonly elements: readonly DataNode[];
  readonly loc: SourceLocation;
};

/**
 * Union of all data node types (containers + values).
 */
export type DataNode = ObjectNode | ArrayNode | ValueNode;

// =============================================================================
// Document Node (Root)
// =============================================================================

/**
 * Document root node.
 */
export type DocumentNode = {
  readonly type: 'Document';
  readonly body: DataNode;
  readonly loc: SourceLocation;
};

// =============================================================================
// Base Union Type
// =============================================================================

/**
 * Union of all AST node types.
 * Uses discriminated union pattern for type-safe pattern matching.
 */
export type ASTNode = DocumentNode | ObjectNode | ArrayNode | PropertyNode | StringNode | NumberNode | BooleanNode | NullNode;
