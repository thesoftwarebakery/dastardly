import { expect } from 'vitest';
import type { ASTNode, Position, SourceLocation } from '@bakes/dastardly-core';
import { toNative } from '@bakes/dastardly-core';

/**
 * Assert that two AST nodes are structurally equal (ignoring position information)
 */
export function assertASTEqual(
  actual: ASTNode,
  expected: ASTNode,
  options?: { ignorePositions?: boolean }
): void {
  const ignorePos = options?.ignorePositions ?? true;

  if (ignorePos) {
    // Convert to native JS objects for comparison (strips positions)
    expect(toNative(actual)).toEqual(toNative(expected));
  } else {
    // Deep equality including positions
    expect(actual).toEqual(expected);
  }
}

/**
 * Assert that a position is valid
 */
export function assertPositionValid(pos: Position): void {
  expect(pos.line).toBeGreaterThanOrEqual(1);
  expect(pos.column).toBeGreaterThanOrEqual(0);
  expect(pos.offset).toBeGreaterThanOrEqual(0);
}

/**
 * Assert that a source location is valid
 */
export function assertSourceLocationValid(loc: SourceLocation): void {
  assertPositionValid(loc.start);
  assertPositionValid(loc.end);

  // End should come after start
  if (loc.start.line === loc.end.line) {
    expect(loc.end.column).toBeGreaterThanOrEqual(loc.start.column);
  } else {
    expect(loc.end.line).toBeGreaterThan(loc.start.line);
  }

  expect(loc.end.offset).toBeGreaterThanOrEqual(loc.start.offset);
  expect(loc.source).toBeTruthy();
}

/**
 * Assert that all nodes in the AST have valid positions
 */
export function assertAllPositionsValid(node: ASTNode): void {
  assertSourceLocationValid(node.loc);

  // Recursively check children
  switch (node.type) {
    case 'Document':
      assertAllPositionsValid(node.body);
      break;

    case 'Object':
      for (const prop of node.properties) {
        assertAllPositionsValid(prop);
      }
      break;

    case 'Property':
      assertAllPositionsValid(node.key);
      assertAllPositionsValid(node.value);
      break;

    case 'Array':
      for (const element of node.elements) {
        assertAllPositionsValid(element);
      }
      break;

    // Leaf nodes (String, Number, Boolean, Null) have no children
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Null':
      break;

    default:
      // Exhaustiveness check
      const _exhaustive: never = node;
      throw new Error(`Unknown node type: ${(_exhaustive as ASTNode).type}`);
  }
}

/**
 * Assert that a roundtrip (parse → serialize → parse) preserves data
 */
export function assertRoundtripEqual(
  original: ASTNode,
  roundtripped: ASTNode
): void {
  assertASTEqual(original, roundtripped, { ignorePositions: true });
}

/**
 * Assert that position ranges don't overlap incorrectly
 * (This is a basic sanity check - more sophisticated checks could be added)
 */
export function assertPositionRangesValid(nodes: ASTNode[]): void {
  for (const node of nodes) {
    assertSourceLocationValid(node.loc);
  }

  // Check that sibling nodes don't overlap
  for (let i = 0; i < nodes.length - 1; i++) {
    const current = nodes[i]!;
    const next = nodes[i + 1]!;

    // Next node should start at or after current node ends
    if (current.loc.end.line === next.loc.start.line) {
      expect(next.loc.start.column).toBeGreaterThanOrEqual(
        current.loc.end.column
      );
    }
  }
}
