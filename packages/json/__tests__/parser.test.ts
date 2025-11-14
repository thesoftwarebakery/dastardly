import { describe, it, expect, beforeEach } from 'vitest';
import { JSONParser } from '../src/parser.js';
import { NodeTreeSitterRuntime, ParseError } from '@bakes/dastardly-tree-sitter-runtime';
import JSON_LANGUAGE from 'tree-sitter-json';

describe('JSONParser', () => {
  let parser: JSONParser;

  beforeEach(() => {
    const runtime = new NodeTreeSitterRuntime();
    parser = new JSONParser(runtime, JSON_LANGUAGE);
  });

  describe('primitives', () => {
    it('parses null', () => {
      const doc = parser.parse('null');
      expect(doc.type).toBe('Document');
      expect(doc.body).toMatchObject({
        type: 'Null',
        value: null,
      });
    });

    it('parses boolean true', () => {
      const doc = parser.parse('true');
      expect(doc.body).toMatchObject({
        type: 'Boolean',
        value: true,
      });
    });

    it('parses boolean false', () => {
      const doc = parser.parse('false');
      expect(doc.body).toMatchObject({
        type: 'Boolean',
        value: false,
      });
    });

    it('parses positive integer', () => {
      const doc = parser.parse('42');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 42,
        raw: '42',
      });
    });

    it('parses negative integer', () => {
      const doc = parser.parse('-1');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: -1,
      });
    });

    it('parses zero', () => {
      const doc = parser.parse('0');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 0,
      });
    });

    it('parses negative zero', () => {
      const doc = parser.parse('-0');
      expect(doc.body.type).toBe('Number');
      expect(Object.is(doc.body.value, -0)).toBe(true);
    });

    it('parses float', () => {
      const doc = parser.parse('3.14');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 3.14,
      });
    });

    it('parses scientific notation', () => {
      const doc = parser.parse('1e10');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 1e10,
      });
    });

    it('parses scientific notation with uppercase E', () => {
      const doc = parser.parse('1.5E10');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 1.5e10,
      });
    });

    it('parses scientific notation with negative exponent', () => {
      const doc = parser.parse('1e-5');
      expect(doc.body).toMatchObject({
        type: 'Number',
        value: 1e-5,
      });
    });

    it('parses empty string', () => {
      const doc = parser.parse('""');
      expect(doc.body).toMatchObject({
        type: 'String',
        value: '',
        raw: '""',
      });
    });

    it('parses simple string', () => {
      const doc = parser.parse('"hello"');
      expect(doc.body).toMatchObject({
        type: 'String',
        value: 'hello',
        raw: '"hello"',
      });
    });

    it('parses string with escape sequences', () => {
      const doc = parser.parse('"hello\\nworld"');
      expect(doc.body).toMatchObject({
        type: 'String',
        value: 'hello\nworld',
      });
    });

    it('parses string with unicode escapes', () => {
      const doc = parser.parse('"\\u0041\\u0042\\u0043"');
      expect(doc.body).toMatchObject({
        type: 'String',
        value: 'ABC',
      });
    });
  });

  describe('arrays', () => {
    it('parses empty array', () => {
      const doc = parser.parse('[]');
      expect(doc.body).toMatchObject({
        type: 'Array',
        elements: [],
      });
    });

    it('parses single element array', () => {
      const doc = parser.parse('[1]');
      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements).toHaveLength(1);
      expect(doc.body.elements[0]).toMatchObject({
        type: 'Number',
      });
    });

    it('parses multiple element array', () => {
      const doc = parser.parse('[1, 2, 3]');
      expect(doc.body).toMatchObject({
        type: 'Array',
      });
      expect(doc.body.elements).toHaveLength(3);
    });

    it('parses mixed type array', () => {
      const doc = parser.parse('[1, "two", true, null]');
      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements).toHaveLength(4);
      expect(doc.body.elements[0]).toMatchObject({ type: 'Number' });
      expect(doc.body.elements[1]).toMatchObject({ type: 'String' });
      expect(doc.body.elements[2]).toMatchObject({ type: 'Boolean' });
      expect(doc.body.elements[3]).toMatchObject({ type: 'Null' });
    });

    it('parses nested arrays', () => {
      const doc = parser.parse('[[1, 2], [3, 4]]');
      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements).toHaveLength(2);
      expect(doc.body.elements[0]).toMatchObject({ type: 'Array' });
      expect(doc.body.elements[1]).toMatchObject({ type: 'Array' });
    });

    it('parses deeply nested arrays (5 levels)', () => {
      const doc = parser.parse('[[[[[1]]]]]');
      expect(doc.body.type).toBe('Array');
      // Verify we can access deeply nested structure
      let current: any = doc.body;
      for (let i = 0; i < 5; i++) {
        expect(current.type).toBe('Array');
        expect(current.elements).toHaveLength(1);
        current = current.elements[0];
      }
      expect(current).toMatchObject({ type: 'Number', value: 1 });
    });
  });

  describe('objects', () => {
    it('parses empty object', () => {
      const doc = parser.parse('{}');
      expect(doc.body).toMatchObject({
        type: 'Object',
        properties: [],
      });
    });

    it('parses single property object', () => {
      const doc = parser.parse('{"a": 1}');
      expect(doc.body.type).toBe('Object');
      expect(doc.body.properties).toHaveLength(1);
      const prop = doc.body.properties[0]!;
      expect(prop).toMatchObject({
        type: 'Property',
        key: { value: 'a' },
        value: { type: 'Number' },
      });
    });

    it('parses multiple property object', () => {
      const doc = parser.parse('{"a": 1, "b": 2}');
      expect(doc.body).toMatchObject({
        type: 'Object',
      });
      expect(doc.body.properties).toHaveLength(2);
    });

    it('parses nested objects', () => {
      const doc = parser.parse('{"a": {"b": {"c": 1}}}');
      expect(doc.body.type).toBe('Object');
      const prop = doc.body.properties[0]!;
      expect(prop.value).toMatchObject({
        type: 'Object',
      });
    });

    it('parses deeply nested objects (5 levels)', () => {
      const doc = parser.parse('{"a":{"a":{"a":{"a":{"a":1}}}}}');
      expect(doc.body.type).toBe('Object');
      // Verify we can access deeply nested structure
      let current: any = doc.body;
      for (let i = 0; i < 5; i++) {
        expect(current.type).toBe('Object');
        expect(current.properties).toHaveLength(1);
        const prop = current.properties[0];
        expect(prop.key.value).toBe('a');
        current = prop.value;
      }
      expect(current).toMatchObject({ type: 'Number', value: 1 });
    });

    it('parses object with all value types', () => {
      const doc = parser.parse('{"str": "hi", "num": 42, "bool": true, "nil": null, "arr": [], "obj": {}}');
      expect(doc.body).toMatchObject({
        type: 'Object',
      });
      expect(doc.body.properties).toHaveLength(6);
    });
  });

  describe('whitespace handling', () => {
    it('parses with leading whitespace', () => {
      const doc = parser.parse('  42');
      expect(doc.body.type).toBe('Number');
    });

    it('parses with trailing whitespace', () => {
      const doc = parser.parse('42  ');
      expect(doc.body.type).toBe('Number');
    });

    it('parses with newlines', () => {
      const doc = parser.parse('{\n  "a": 1\n}');
      expect(doc.body.type).toBe('Object');
    });

    it('parses with tabs', () => {
      const doc = parser.parse('{\t"a":\t1\t}');
      expect(doc.body.type).toBe('Object');
    });
  });

  describe('error handling', () => {
    it('throws on empty document', () => {
      expect(() => parser.parse('')).toThrow(ParseError);
      expect(() => parser.parse('')).toThrow('Empty document');
    });

    it('throws on whitespace-only document', () => {
      expect(() => parser.parse('   ')).toThrow(ParseError);
    });

    it('throws on multiple top-level values', () => {
      expect(() => parser.parse('1 2')).toThrow(ParseError);
      expect(() => parser.parse('1 2')).toThrow('Multiple top-level values');
    });

    it('throws on syntax errors', () => {
      expect(() => parser.parse('{invalid}')).toThrow(ParseError);
    });

    it('throws on unclosed strings', () => {
      expect(() => parser.parse('"unclosed')).toThrow(ParseError);
    });

    it('throws on unclosed arrays', () => {
      expect(() => parser.parse('[1, 2')).toThrow(ParseError);
    });

    it('throws on unclosed objects', () => {
      expect(() => parser.parse('{"a": 1')).toThrow(ParseError);
    });
  });

  describe('position tracking', () => {
    it('tracks position for primitives', () => {
      const doc = parser.parse('42');
      expect(doc.loc).toBeDefined();
      expect(doc.loc.source).toBe('json');
      expect(doc.loc.start.line).toBeGreaterThanOrEqual(1);
      expect(doc.loc.start.column).toBeGreaterThanOrEqual(0);
    });

    it('tracks position for nested structures', () => {
      const doc = parser.parse('{"a": [1, 2]}');
      expect(doc.body.loc).toBeDefined();
      expect(doc.body.type).toBe('Object');
      const prop = doc.body.properties[0]!;
      expect(prop.loc).toBeDefined();
      expect(prop.key.loc).toBeDefined();
      expect(prop.value.loc).toBeDefined();
    });
  });
});
