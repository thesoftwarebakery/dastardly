// Utility functions for tree-sitter integration

import type { Position, SourceLocation } from '@dastardly/core';
import type { TreeSitterPoint, SyntaxNode } from './types.js';

/**
 * Convert tree-sitter Point to dastardly Position.
 * Tree-sitter uses 0-indexed rows, dastardly uses 1-indexed lines.
 */
export function pointToPosition(point: TreeSitterPoint, offset: number): Position {
  return {
    line: point.row + 1,  // Convert 0-indexed to 1-indexed
    column: point.column,
    offset,
  };
}

/**
 * Extract source location from a tree-sitter syntax node.
 */
export function nodeToLocation(
  node: SyntaxNode,
  sourceFormat?: string
): SourceLocation {
  const start = pointToPosition(node.startPosition, node.startIndex);
  const end = pointToPosition(node.endPosition, node.endIndex);

  if (sourceFormat) {
    return { start, end, source: sourceFormat };
  }
  return { start, end };
}

/**
 * Check if a node or any of its descendants has an error.
 */
export function hasError(node: SyntaxNode): boolean {
  if (node.hasError) return true;

  for (const child of node.children) {
    if (hasError(child)) return true;
  }

  return false;
}

/**
 * Find the first error node in the tree.
 */
export function findErrorNode(node: SyntaxNode): SyntaxNode | null {
  if (node.type === 'ERROR') return node;

  for (const child of node.children) {
    const errorNode = findErrorNode(child);
    if (errorNode) return errorNode;
  }

  return null;
}
