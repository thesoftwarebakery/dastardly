import { describe, it, expect } from 'vitest';
import {
  TreeSitterParser,
  NodeTreeSitterRuntime,
  ParseError,
  nodeToLocation,
} from '../src/index.js';
import type { SyntaxNode } from '../src/index.js';
import { documentNode, stringNode, numberNode, objectNode, propertyNode } from '@dastardly/core';
import type { DocumentNode } from '@dastardly/core';
import JSON from 'tree-sitter-json';

// Mock JSON parser for testing
class TestJSONParser extends TreeSitterParser {
  constructor() {
    const runtime = new NodeTreeSitterRuntime();
    super(runtime, JSON, 'json');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    // Very simple conversion for testing - just handle string values
    const loc = nodeToLocation(node, this.sourceFormat);

    // Find the first named child (the actual value)
    const valueNode = node.firstNamedChild;
    if (!valueNode) {
      return documentNode(stringNode('', loc), loc);
    }

    // Handle simple string values for testing
    if (valueNode.type === 'string') {
      const text = valueNode.text.slice(1, -1); // Remove quotes
      return documentNode(stringNode(text, loc), loc);
    }

    // Handle numbers
    if (valueNode.type === 'number') {
      const value = parseFloat(valueNode.text);
      return documentNode(numberNode(value, loc), loc);
    }

    // Fallback
    return documentNode(stringNode(valueNode.text, loc), loc);
  }
}

describe('TreeSitterParser', () => {
  let parser: TestJSONParser;

  beforeEach(() => {
    parser = new TestJSONParser();
  });

  it('can be instantiated', () => {
    expect(parser).toBeInstanceOf(TreeSitterParser);
  });

  it('parses valid input successfully', () => {
    const doc = parser.parse('"hello"');

    expect(doc.type).toBe('Document');
    expect(doc.body.type).toBe('String');
    if (doc.body.type === 'String') {
      expect(doc.body.value).toBe('hello');
    }
  });

  it('preserves source location', () => {
    const doc = parser.parse('"test"');

    expect(doc.loc.source).toBe('json');
    expect(doc.loc.start.line).toBeGreaterThanOrEqual(1);
    expect(doc.loc.start.column).toBeGreaterThanOrEqual(0);
  });

  it('throws ParseError for invalid syntax', () => {
    expect(() => parser.parse('{invalid}')).toThrow(ParseError);
  });

  it('ParseError includes location information', () => {
    try {
      parser.parse('{invalid}');
      expect.fail('Should have thrown ParseError');
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      if (error instanceof ParseError) {
        expect(error.loc).toBeDefined();
        expect(error.loc.start.line).toBeGreaterThanOrEqual(1);
        expect(error.source).toBe('{invalid}');
      }
    }
  });

  it('ParseError message includes position', () => {
    try {
      parser.parse('[1,2,}');
      expect.fail('Should have thrown ParseError');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('at');
        expect(error.message).toMatch(/\d+:\d+/); // line:column
      }
    }
  });

  it('handles empty input gracefully', () => {
    // tree-sitter-json actually accepts empty input without error
    // This test just verifies it doesn't crash
    const doc = parser.parse('');
    expect(doc).toBeDefined();
    expect(doc.type).toBe('Document');
  });

  it('parses numbers correctly', () => {
    const doc = parser.parse('42');

    expect(doc.body.type).toBe('Number');
    if (doc.body.type === 'Number') {
      expect(doc.body.value).toBe(42);
    }
  });

  it('can parse multiple times', () => {
    const doc1 = parser.parse('"first"');
    const doc2 = parser.parse('"second"');

    expect(doc1.body.type).toBe('String');
    expect(doc2.body.type).toBe('String');
    if (doc1.body.type === 'String' && doc2.body.type === 'String') {
      expect(doc1.body.value).toBe('first');
      expect(doc2.body.value).toBe('second');
    }
  });
});
