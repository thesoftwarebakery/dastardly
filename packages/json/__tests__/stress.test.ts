import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src/index.js';

/**
 * Stress tests for JSON parser to verify handling of:
 * - Deep nesting (>4 levels)
 * - Large files (>25KB)
 * - Wide structures (many properties/elements)
 *
 * These tests are designed to expose the stack overflow issues
 * in the recursive parser implementation.
 */

/**
 * Helper to create deeply nested object: {"a":{"a":{"a":...}}}
 */
function createDeepObject(depth: number): object {
  if (depth === 0) return { value: 42 };
  return { a: createDeepObject(depth - 1) };
}

/**
 * Helper to create deeply nested array: [[[[...]]]]
 */
function createDeepArray(depth: number): unknown[] {
  if (depth === 0) return [42];
  return [createDeepArray(depth - 1)];
}

/**
 * Helper to create wide object with many properties
 */
function createWideObject(width: number): object {
  const obj: Record<string, number> = {};
  for (let i = 0; i < width; i++) {
    obj[`prop${i}`] = i;
  }
  return obj;
}

/**
 * Helper to create large array
 */
function createLargeArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Helper to create branching tree: depth levels with breadth children each
 */
function createBranchingTree(depth: number, breadth: number): object {
  if (depth === 0) return { value: 42 };

  const obj: Record<string, unknown> = {};
  for (let i = 0; i < breadth; i++) {
    obj[`child${i}`] = createBranchingTree(depth - 1, breadth);
  }
  return obj;
}

describe('JSON Stress Tests', () => {
  describe('Deep Nesting - Objects', () => {
    it('handles 5 levels of nested objects', () => {
      const input = createDeepObject(5);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      // Verify roundtrip
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 10 levels of nested objects', () => {
      const input = createDeepObject(10);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 20 levels of nested objects', () => {
      const input = createDeepObject(20);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 50 levels of nested objects', () => {
      const input = createDeepObject(50);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 100 levels of nested objects', () => {
      const input = createDeepObject(100);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });

  describe('Deep Nesting - Arrays', () => {
    it('handles 5 levels of nested arrays', () => {
      const input = createDeepArray(5);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 10 levels of nested arrays', () => {
      const input = createDeepArray(10);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 20 levels of nested arrays', () => {
      const input = createDeepArray(20);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 50 levels of nested arrays', () => {
      const input = createDeepArray(50);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles 100 levels of nested arrays', () => {
      const input = createDeepArray(100);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });

  describe('Branching Factor', () => {
    it('handles depth 5 with breadth 3', () => {
      const input = createBranchingTree(5, 3);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles depth 6 with breadth 3', () => {
      const input = createBranchingTree(6, 3);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles depth 10 with breadth 2', () => {
      const input = createBranchingTree(10, 2);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });

  describe('Wide Structures', () => {
    it('handles object with 1000 properties', () => {
      const input = createWideObject(1000);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles object with 5000 properties', () => {
      const input = createWideObject(5000);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles array with 5000 elements', () => {
      const input = createLargeArray(5000);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });

  describe('Large Files', () => {
    it('handles ~30KB nested structure', () => {
      // Create moderately nested structure with many properties
      // Note: tree-sitter has buffer size limits around 40-50KB
      const input = {
        level1: createWideObject(100),
        level2: {
          nested: createWideObject(100),
          array: createLargeArray(500),
        },
        level3: createBranchingTree(5, 5),
      };
      const json = JSON.stringify(input);
      const sizeKB = Buffer.byteLength(json, 'utf8') / 1024;

      expect(sizeKB).toBeGreaterThan(10);

      const ast = parse(json);
      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });

  describe('Mixed Complexity', () => {
    it('handles deep nesting with wide structures at each level', () => {
      // 10 levels deep, each with 100 properties
      function createMixedStructure(depth: number, width: number): object {
        if (depth === 0) return createWideObject(width);
        return {
          data: createWideObject(width),
          nested: createMixedStructure(depth - 1, width),
        };
      }

      const input = createMixedStructure(10, 100);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });

    it('handles alternating object/array nesting', () => {
      // Create structure like: {a:[{b:[{c:[...]}]}]}
      function createAlternating(depth: number): unknown {
        if (depth === 0) return { value: 42 };
        if (depth % 2 === 0) {
          return { nested: createAlternating(depth - 1) };
        } else {
          return [createAlternating(depth - 1)];
        }
      }

      const input = createAlternating(20);
      const json = JSON.stringify(input);
      const ast = parse(json);

      expect(ast.type).toBe('Document');
      const output = serialize(ast);
      expect(JSON.parse(output)).toEqual(input);
    });
  });
});
