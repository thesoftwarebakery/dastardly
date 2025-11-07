import { describe, it, expect, beforeEach } from 'vitest';
import { NodeTreeSitterRuntime } from '../src/index.js';
import JSON from 'tree-sitter-json';

describe('NodeTreeSitterRuntime', () => {
  let runtime: NodeTreeSitterRuntime;

  beforeEach(() => {
    runtime = new NodeTreeSitterRuntime();
  });

  it('can be instantiated', () => {
    expect(runtime).toBeInstanceOf(NodeTreeSitterRuntime);
  });

  it('can set a language', () => {
    expect(() => runtime.setLanguage(JSON)).not.toThrow();
  });

  it('can parse source code', () => {
    runtime.setLanguage(JSON);
    const tree = runtime.parse('{"key": "value"}');

    expect(tree).toBeDefined();
    expect(tree.rootNode).toBeDefined();
  });

  it('parses valid JSON without errors', () => {
    runtime.setLanguage(JSON);
    const tree = runtime.parse('{"name": "Alice", "age": 30}');

    expect(tree.rootNode.hasError).toBe(false);
    expect(tree.rootNode.type).toBe('document');
  });

  it('indicates errors for invalid JSON', () => {
    runtime.setLanguage(JSON);
    const tree = runtime.parse('{invalid}');

    expect(tree.rootNode.hasError).toBe(true);
  });

  it('preserves position information', () => {
    runtime.setLanguage(JSON);
    const tree = runtime.parse('{"key": "value"}');

    expect(tree.rootNode.startPosition).toEqual({ row: 0, column: 0 });
    expect(tree.rootNode.startIndex).toBe(0);
  });

  it('handles empty input', () => {
    runtime.setLanguage(JSON);
    const tree = runtime.parse('');

    expect(tree).toBeDefined();
    expect(tree.rootNode).toBeDefined();
  });

  it('handles large input', () => {
    runtime.setLanguage(JSON);
    // Create a large JSON array
    const largeArray = '[' + Array(1000).fill('1').join(',') + ']';
    const tree = runtime.parse(largeArray);

    expect(tree.rootNode.hasError).toBe(false);
  });

  it('can parse multiple times', () => {
    runtime.setLanguage(JSON);

    const tree1 = runtime.parse('{"a": 1}');
    const tree2 = runtime.parse('{"b": 2}');

    expect(tree1.rootNode.hasError).toBe(false);
    expect(tree2.rootNode.hasError).toBe(false);
  });
});
