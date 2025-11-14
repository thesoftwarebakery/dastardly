import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer.js';
import {
  documentNode,
  objectNode,
  arrayNode,
  propertyNode,
  stringNode,
  numberNode,
  booleanNode,
  nullNode,
  sourceLocation,
  position,
} from '@bakes/dastardly-core';

// Helper to create dummy location
const loc = sourceLocation(position(1, 0, 0), position(1, 1, 1), 'json');

describe('serialize', () => {
  describe('compact mode', () => {
    it('serializes null', () => {
      const node = nullNode(loc);
      expect(serialize(node)).toBe('null');
    });

    it('serializes boolean', () => {
      expect(serialize(booleanNode(true, loc))).toBe('true');
      expect(serialize(booleanNode(false, loc))).toBe('false');
    });

    it('serializes number', () => {
      expect(serialize(numberNode(42, loc))).toBe('42');
      expect(serialize(numberNode(3.14, loc))).toBe('3.14');
      expect(serialize(numberNode(1e10, loc))).toBe('10000000000');
    });

    it('serializes negative zero', () => {
      expect(serialize(numberNode(-0, loc))).toBe('-0');
    });

    it('serializes string', () => {
      expect(serialize(stringNode('hello', loc))).toBe('"hello"');
    });

    it('serializes string with escapes', () => {
      expect(serialize(stringNode('hello\nworld', loc))).toBe('"hello\\nworld"');
    });

    it('serializes empty object', () => {
      expect(serialize(objectNode([], loc))).toBe('{}');
    });

    it('serializes simple object', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
      ], loc);
      expect(serialize(obj)).toBe('{"a":1}');
    });

    it('serializes object with multiple properties', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
        propertyNode(stringNode('b', loc), numberNode(2, loc), loc),
      ], loc);
      expect(serialize(obj)).toBe('{"a":1,"b":2}');
    });

    it('serializes empty array', () => {
      expect(serialize(arrayNode([], loc))).toBe('[]');
    });

    it('serializes simple array', () => {
      const arr = arrayNode([
        numberNode(1, loc),
        numberNode(2, loc),
        numberNode(3, loc),
      ], loc);
      expect(serialize(arr)).toBe('[1,2,3]');
    });

    it('serializes nested structures', () => {
      const nested = objectNode([
        propertyNode(
          stringNode('items', loc),
          arrayNode([numberNode(1, loc), numberNode(2, loc)], loc),
          loc
        ),
      ], loc);
      expect(serialize(nested)).toBe('{"items":[1,2]}');
    });
  });

  describe('pretty mode', () => {
    it('pretty prints object with 2 spaces', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
        propertyNode(stringNode('b', loc), numberNode(2, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it('pretty prints array with 2 spaces', () => {
      const arr = arrayNode([
        numberNode(1, loc),
        numberNode(2, loc),
      ], loc);
      const result = serialize(arr, { indent: 2 });
      expect(result).toBe('[\n  1,\n  2\n]');
    });

    it('pretty prints nested structures', () => {
      const nested = objectNode([
        propertyNode(
          stringNode('a', loc),
          objectNode([
            propertyNode(stringNode('b', loc), numberNode(1, loc), loc),
          ], loc),
          loc
        ),
      ], loc);
      const result = serialize(nested, { indent: 2 });
      expect(result).toBe('{\n  "a": {\n    "b": 1\n  }\n}');
    });

    it('supports tab indentation', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: '\t' });
      expect(result).toBe('{\n\t"a": 1\n}');
    });
  });

  describe('preserveRaw option', () => {
    it('uses raw value for strings when available', () => {
      const str = stringNode('hello', loc, '"hello"');
      expect(serialize(str, { preserveRaw: true })).toBe('"hello"');
    });

    it('uses raw value for numbers when available', () => {
      const num = numberNode(1, loc, '1.0');
      expect(serialize(num, { preserveRaw: true })).toBe('1.0');
    });

    it('falls back to computed value when raw not available', () => {
      const str = stringNode('hello', loc);
      expect(serialize(str, { preserveRaw: true })).toBe('"hello"');
    });
  });

  describe('document node', () => {
    it('serializes DocumentNode', () => {
      const doc = documentNode(numberNode(42, loc), loc);
      expect(serialize(doc)).toBe('42');
    });

    it('serializes DocumentNode with pretty print', () => {
      const doc = documentNode(
        objectNode([
          propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
        ], loc),
        loc
      );
      const result = serialize(doc, { indent: 2 });
      expect(result).toBe('{\n  "a": 1\n}');
    });
  });

  describe('error handling', () => {
    it('throws on Infinity', () => {
      const node = numberNode(Infinity, loc);
      expect(() => serialize(node)).toThrow('not a finite number');
    });

    it('throws on NaN', () => {
      const node = numberNode(NaN, loc);
      expect(() => serialize(node)).toThrow('not a finite number');
    });
  });
});
