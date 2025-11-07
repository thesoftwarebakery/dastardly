import { describe, it, expect } from 'vitest';
import {
  pointToPosition,
  nodeToLocation,
  hasError,
  findErrorNode,
} from '../src/index.js';
import type { SyntaxNode, TreeSitterPoint } from '../src/index.js';

describe('pointToPosition', () => {
  it('converts tree-sitter point to dastardly position', () => {
    const point: TreeSitterPoint = { row: 0, column: 5 };
    const pos = pointToPosition(point, 10);

    expect(pos.line).toBe(1); // row 0 → line 1
    expect(pos.column).toBe(5);
    expect(pos.offset).toBe(10);
  });

  it('handles row 0 as line 1', () => {
    const point: TreeSitterPoint = { row: 0, column: 0 };
    const pos = pointToPosition(point, 0);

    expect(pos.line).toBe(1);
  });

  it('handles large row numbers', () => {
    const point: TreeSitterPoint = { row: 999, column: 0 };
    const pos = pointToPosition(point, 50000);

    expect(pos.line).toBe(1000); // row 999 → line 1000
    expect(pos.offset).toBe(50000);
  });
});

describe('nodeToLocation', () => {
  const createMockNode = (
    startRow: number,
    startCol: number,
    startIdx: number,
    endRow: number,
    endCol: number,
    endIdx: number
  ): SyntaxNode => {
    return {
      type: 'test',
      startPosition: { row: startRow, column: startCol },
      endPosition: { row: endRow, column: endCol },
      startIndex: startIdx,
      endIndex: endIdx,
      text: '',
      hasError: false,
      children: [],
      childCount: 0,
      childForFieldName: () => null,
      child: () => null,
      firstNamedChild: null,
      nextNamedSibling: null,
    };
  };

  it('extracts source location from node', () => {
    const node = createMockNode(0, 0, 0, 0, 5, 5);
    const loc = nodeToLocation(node);

    expect(loc.start.line).toBe(1);
    expect(loc.start.column).toBe(0);
    expect(loc.start.offset).toBe(0);
    expect(loc.end.line).toBe(1);
    expect(loc.end.column).toBe(5);
    expect(loc.end.offset).toBe(5);
    expect(loc.source).toBeUndefined();
  });

  it('includes source format when provided', () => {
    const node = createMockNode(0, 0, 0, 0, 5, 5);
    const loc = nodeToLocation(node, 'json');

    expect(loc.source).toBe('json');
  });

  it('handles multi-line nodes', () => {
    const node = createMockNode(0, 0, 0, 2, 10, 50);
    const loc = nodeToLocation(node);

    expect(loc.start.line).toBe(1);
    expect(loc.end.line).toBe(3); // row 2 → line 3
  });
});

describe('hasError', () => {
  const createNode = (hasErr: boolean, children: SyntaxNode[] = []): SyntaxNode => {
    return {
      type: hasErr ? 'ERROR' : 'test',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      startIndex: 0,
      endIndex: 0,
      text: '',
      hasError: hasErr,
      children,
      childCount: children.length,
      childForFieldName: () => null,
      child: (i) => children[i] || null,
      firstNamedChild: children[0] || null,
      nextNamedSibling: null,
    };
  };

  it('returns true for node with error', () => {
    const node = createNode(true);
    expect(hasError(node)).toBe(true);
  });

  it('returns false for node without error', () => {
    const node = createNode(false);
    expect(hasError(node)).toBe(false);
  });

  it('returns true if any descendant has error', () => {
    const errorChild = createNode(true);
    const parent = createNode(false, [errorChild]);

    expect(hasError(parent)).toBe(true);
  });

  it('returns false if no descendants have errors', () => {
    const child1 = createNode(false);
    const child2 = createNode(false);
    const parent = createNode(false, [child1, child2]);

    expect(hasError(parent)).toBe(false);
  });
});

describe('findErrorNode', () => {
  const createNode = (type: string, children: SyntaxNode[] = []): SyntaxNode => {
    return {
      type,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      startIndex: 0,
      endIndex: 0,
      text: '',
      hasError: type === 'ERROR',
      children,
      childCount: children.length,
      childForFieldName: () => null,
      child: (i) => children[i] || null,
      firstNamedChild: children[0] || null,
      nextNamedSibling: null,
    };
  };

  it('returns the node if it is an ERROR', () => {
    const node = createNode('ERROR');
    expect(findErrorNode(node)).toBe(node);
  });

  it('returns null if no error found', () => {
    const node = createNode('test');
    expect(findErrorNode(node)).toBeNull();
  });

  it('finds error in descendants', () => {
    const errorChild = createNode('ERROR');
    const parent = createNode('test', [createNode('test'), errorChild]);

    expect(findErrorNode(parent)).toBe(errorChild);
  });

  it('returns first error found (depth-first)', () => {
    const error1 = createNode('ERROR');
    const error2 = createNode('ERROR');
    const parent = createNode('test', [error1, error2]);

    expect(findErrorNode(parent)).toBe(error1);
  });
});
