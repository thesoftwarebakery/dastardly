import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src/index.js';
import { JSONParser } from '../src/parser.js';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import JSON_LANGUAGE from 'tree-sitter-json';

describe('Public API', () => {
  describe('parse()', () => {
    it('parses JSON and returns DocumentNode', () => {
      const doc = parse('{"a": 1}');
      expect(doc.type).toBe('Document');
      expect(doc.body.type).toBe('Object');
    });

    it('throws on invalid JSON', () => {
      expect(() => parse('{invalid}')).toThrow();
    });
  });

  describe('parse().body', () => {
    it('returns DataNode from DocumentNode', () => {
      const value = parse('{"a": 1}').body;
      expect(value.type).toBe('Object');
    });
  });

  describe('serialize()', () => {
    it('serializes with options', () => {
      const doc = parse('{"a": 1}');
      const json = serialize(doc, { indent: 2 });
      expect(json).toBe('{\n  "a": 1\n}');
    });

    it('preserves raw values', () => {
      const doc = parse('1.0');
      const json = serialize(doc, { preserveRaw: true });
      expect(json).toBe('1.0');
    });
  });

  describe('JSONParser', () => {
    it('can be instantiated and reused', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new JSONParser(runtime, JSON_LANGUAGE);

      const doc1 = parser.parse('1');
      const doc2 = parser.parse('2');

      expect(doc1.body.type).toBe('Number');
      expect(doc2.body.type).toBe('Number');
    });
  });

  describe('Roundtrip', () => {
    it('parse → serialize → parse produces equivalent AST', () => {
      const original = '{"name":"Alice","age":30,"active":true}';
      const doc1 = parse(original);
      const json = serialize(doc1);
      const doc2 = parse(json);

      // Should have same structure (not testing deep equality, just types)
      expect(doc1.type).toBe(doc2.type);
      expect(doc1.body.type).toBe(doc2.body.type);
    });

    it('handles nested structures', () => {
      const original = '{"users":[{"name":"Alice"},{"name":"Bob"}]}';
      const doc1 = parse(original);
      const json = serialize(doc1);
      const doc2 = parse(json);

      expect(doc2.body.type).toBe('Object');
    });
  });

  describe('Real-world JSON', () => {
    it('parses package.json-like structure', () => {
      const json = `{
        "name": "@dastardly/json",
        "version": "0.1.0",
        "dependencies": {
          "@dastardly/core": "workspace:*"
        },
        "scripts": {
          "test": "vitest run"
        }
      }`;

      const doc = parse(json);
      expect(doc.body).toMatchObject({
        type: 'Object',
      });
      expect(doc.body.properties.length).toBeGreaterThan(0);
    });

    it('parses API response-like structure', () => {
      const json = `{
        "data": [
          {"id": 1, "name": "Item 1"},
          {"id": 2, "name": "Item 2"}
        ],
        "meta": {
          "total": 2,
          "page": 1
        }
      }`;

      const doc = parse(json);
      expect(doc.body.type).toBe('Object');
    });
  });
});
