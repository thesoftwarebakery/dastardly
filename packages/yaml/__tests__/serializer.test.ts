import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer.js';
import { parse } from '../src/index.js';
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
  toNative,
} from '@bakes/dastardly-core';

// Helper to create dummy location
const loc = sourceLocation(position(1, 0, 0), position(1, 1, 1), 'yaml');

describe('YAML serialize', () => {
  describe('scalars - compact mode', () => {
    it('serializes null', () => {
      const node = nullNode(loc);
      expect(serialize(node)).toBe('null');
    });

    it('serializes boolean true', () => {
      expect(serialize(booleanNode(true, loc))).toBe('true');
    });

    it('serializes boolean false', () => {
      expect(serialize(booleanNode(false, loc))).toBe('false');
    });

    it('serializes integer', () => {
      expect(serialize(numberNode(42, loc))).toBe('42');
    });

    it('serializes float', () => {
      expect(serialize(numberNode(3.14, loc))).toBe('3.14');
    });

    it('serializes negative number', () => {
      expect(serialize(numberNode(-456, loc))).toBe('-456');
    });

    it('serializes zero', () => {
      expect(serialize(numberNode(0, loc))).toBe('0');
    });

    it('serializes negative zero', () => {
      expect(serialize(numberNode(-0, loc))).toBe('-0');
    });

    it('serializes positive infinity', () => {
      expect(serialize(numberNode(Infinity, loc))).toBe('.inf');
    });

    it('serializes negative infinity', () => {
      expect(serialize(numberNode(-Infinity, loc))).toBe('-.inf');
    });

    it('serializes NaN', () => {
      expect(serialize(numberNode(NaN, loc))).toBe('.nan');
    });

    it('serializes exponential notation', () => {
      expect(serialize(numberNode(1.23e10, loc))).toBe('12300000000');
    });

    it('serializes plain string', () => {
      expect(serialize(stringNode('hello', loc))).toBe('hello');
    });

    it('serializes string with spaces', () => {
      expect(serialize(stringNode('hello world', loc))).toBe('hello world');
    });

    it('serializes empty string with quotes', () => {
      expect(serialize(stringNode('', loc))).toBe('""');
    });

    it('serializes string that looks like boolean with quotes', () => {
      expect(serialize(stringNode('true', loc))).toBe('"true"');
      expect(serialize(stringNode('false', loc))).toBe('"false"');
      expect(serialize(stringNode('yes', loc))).toBe('"yes"');
      expect(serialize(stringNode('no', loc))).toBe('"no"');
    });

    it('serializes string that looks like null with quotes', () => {
      expect(serialize(stringNode('null', loc))).toBe('"null"');
      expect(serialize(stringNode('~', loc))).toBe('"~"');
    });

    it('serializes string that looks like number with quotes', () => {
      expect(serialize(stringNode('123', loc))).toBe('"123"');
      expect(serialize(stringNode('3.14', loc))).toBe('"3.14"');
      expect(serialize(stringNode('0xFF', loc))).toBe('"0xFF"');
    });

    it('serializes string with special chars using double quotes', () => {
      expect(serialize(stringNode('hello: world', loc))).toBe('"hello: world"');
      expect(serialize(stringNode('hello#comment', loc))).toBe('"hello#comment"');
      expect(serialize(stringNode('[array]', loc))).toBe('"[array]"');
      expect(serialize(stringNode('{object}', loc))).toBe('"{object}"');
    });

    it('serializes string with newline using double quotes', () => {
      expect(serialize(stringNode('hello\nworld', loc))).toBe('"hello\\nworld"');
    });

    it('serializes string with tab using double quotes', () => {
      expect(serialize(stringNode('hello\tworld', loc))).toBe('"hello\\tworld"');
    });

    it('serializes string with double quote using escaped quotes', () => {
      expect(serialize(stringNode('say "hello"', loc))).toBe('"say \\"hello\\""');
    });

    it('serializes string with backslash using escaped backslash', () => {
      expect(serialize(stringNode('path\\to\\file', loc))).toBe('"path\\\\to\\\\file"');
    });
  });

  describe('collections - compact mode', () => {
    it('serializes empty object', () => {
      expect(serialize(objectNode([], loc))).toBe('{}');
    });

    it('serializes simple object inline', () => {
      const obj = objectNode([
        propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
      ], loc);
      expect(serialize(obj)).toBe('{name: Alice}');
    });

    it('serializes object with multiple properties inline', () => {
      const obj = objectNode([
        propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
        propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
      ], loc);
      expect(serialize(obj)).toBe('{name: Alice, age: 30}');
    });

    it('serializes empty array', () => {
      expect(serialize(arrayNode([], loc))).toBe('[]');
    });

    it('serializes simple array inline', () => {
      const arr = arrayNode([
        numberNode(1, loc),
        numberNode(2, loc),
        numberNode(3, loc),
      ], loc);
      expect(serialize(arr)).toBe('[1, 2, 3]');
    });

    it('serializes array with strings inline', () => {
      const arr = arrayNode([
        stringNode('one', loc),
        stringNode('two', loc),
        stringNode('three', loc),
      ], loc);
      expect(serialize(arr)).toBe('[one, two, three]');
    });

    it('serializes nested structures inline', () => {
      const nested = objectNode([
        propertyNode(
          stringNode('items', loc),
          arrayNode([numberNode(1, loc), numberNode(2, loc)], loc),
          loc
        ),
      ], loc);
      expect(serialize(nested)).toBe('{items: [1, 2]}');
    });
  });

  describe('collections - block mode (indented)', () => {
    it('serializes object in block style with 2 spaces', () => {
      const obj = objectNode([
        propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
        propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('name: Alice\nage: 30');
    });

    it('serializes nested object in block style', () => {
      const obj = objectNode([
        propertyNode(
          stringNode('person', loc),
          objectNode([
            propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
            propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
          ], loc),
          loc
        ),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('person:\n  name: Alice\n  age: 30');
    });

    it('serializes array in block style with 2 spaces', () => {
      const arr = arrayNode([
        stringNode('one', loc),
        stringNode('two', loc),
        stringNode('three', loc),
      ], loc);
      const result = serialize(arr, { indent: 2 });
      expect(result).toBe('- one\n- two\n- three');
    });

    it('serializes nested array in block style', () => {
      const arr = arrayNode([
        arrayNode([stringNode('a', loc), stringNode('b', loc)], loc),
        arrayNode([stringNode('c', loc), stringNode('d', loc)], loc),
      ], loc);
      const result = serialize(arr, { indent: 2 });
      expect(result).toBe('- - a\n  - b\n- - c\n  - d');
    });

    it('serializes object with array values in block style', () => {
      const obj = objectNode([
        propertyNode(
          stringNode('users', loc),
          arrayNode([
            stringNode('Alice', loc),
            stringNode('Bob', loc),
          ], loc),
          loc
        ),
        propertyNode(stringNode('count', loc), numberNode(2, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('users:\n  - Alice\n  - Bob\ncount: 2');
    });

    it('serializes array of objects in block style', () => {
      const arr = arrayNode([
        objectNode([
          propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
          propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
        ], loc),
        objectNode([
          propertyNode(stringNode('name', loc), stringNode('Bob', loc), loc),
          propertyNode(stringNode('age', loc), numberNode(25, loc), loc),
        ], loc),
      ], loc);
      const result = serialize(arr, { indent: 2 });
      expect(result).toBe('- name: Alice\n  age: 30\n- name: Bob\n  age: 25');
    });

    it('serializes deeply nested structures', () => {
      const obj = objectNode([
        propertyNode(
          stringNode('level1', loc),
          objectNode([
            propertyNode(
              stringNode('level2', loc),
              objectNode([
                propertyNode(stringNode('value', loc), numberNode(42, loc), loc),
              ], loc),
              loc
            ),
          ], loc),
          loc
        ),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('level1:\n  level2:\n    value: 42');
    });

    it('supports custom string indentation', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: '    ' });
      expect(result).toBe('a: 1');
    });

    it('supports tab indentation', () => {
      const obj = objectNode([
        propertyNode(
          stringNode('a', loc),
          objectNode([
            propertyNode(stringNode('b', loc), numberNode(1, loc), loc),
          ], loc),
          loc
        ),
      ], loc);
      const result = serialize(obj, { indent: '\t' });
      expect(result).toBe('a:\n\tb: 1');
    });
  });

  describe('multi-line strings', () => {
    it('uses literal block scalar for multi-line strings', () => {
      const str = stringNode('line 1\nline 2\nline 3', loc);
      const result = serialize(str, { indent: 2 });
      expect(result).toBe('|-\n  line 1\n  line 2\n  line 3');
    });

    it('uses literal block scalar in object context', () => {
      const obj = objectNode([
        propertyNode(
          stringNode('description', loc),
          stringNode('This is a long\nmulti-line\ndescription', loc),
          loc
        ),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('description: |-\n  This is a long\n  multi-line\n  description');
    });

    it('preserves trailing newlines in block scalars', () => {
      const str = stringNode('line 1\nline 2\n', loc);
      const result = serialize(str, { indent: 2 });
      expect(result).toBe('|\n  line 1\n  line 2\n');
    });

    it('uses strip indicator for strings without trailing newline', () => {
      const str = stringNode('line 1\nline 2', loc);
      const result = serialize(str, { indent: 2 });
      expect(result).toBe('|-\n  line 1\n  line 2');
    });
  });

  describe('special keys', () => {
    it('quotes keys that need quoting', () => {
      const obj = objectNode([
        propertyNode(stringNode('hello:world', loc), numberNode(1, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('"hello:world": 1');
    });

    it('quotes numeric keys', () => {
      const obj = objectNode([
        propertyNode(stringNode('123', loc), stringNode('value', loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('"123": value');
    });

    it('quotes keys with special characters', () => {
      const obj = objectNode([
        propertyNode(stringNode('key with spaces', loc), numberNode(1, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('"key with spaces": 1');
    });

    it('does not quote simple keys', () => {
      const obj = objectNode([
        propertyNode(stringNode('simpleKey', loc), numberNode(1, loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('simpleKey: 1');
    });
  });

  describe('document node', () => {
    it('serializes DocumentNode', () => {
      const doc = documentNode(numberNode(42, loc), loc);
      expect(serialize(doc)).toBe('42');
    });

    it('serializes DocumentNode with object in block style', () => {
      const doc = documentNode(
        objectNode([
          propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
          propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
        ], loc),
        loc
      );
      const result = serialize(doc, { indent: 2 });
      expect(result).toBe('name: Alice\nage: 30');
    });
  });

  describe('null handling', () => {
    it('serializes null property value', () => {
      const obj = objectNode([
        propertyNode(stringNode('value', loc), nullNode(loc), loc),
      ], loc);
      expect(serialize(obj, { indent: 2 })).toBe('value: null');
    });

    it('serializes null in array', () => {
      const arr = arrayNode([
        stringNode('a', loc),
        nullNode(loc),
        stringNode('b', loc),
      ], loc);
      expect(serialize(arr, { indent: 2 })).toBe('- a\n- null\n- b');
    });
  });

  describe('mixed values', () => {
    it('serializes object with different value types', () => {
      const obj = objectNode([
        propertyNode(stringNode('string', loc), stringNode('hello', loc), loc),
        propertyNode(stringNode('number', loc), numberNode(42, loc), loc),
        propertyNode(stringNode('boolean', loc), booleanNode(true, loc), loc),
        propertyNode(stringNode('null', loc), nullNode(loc), loc),
      ], loc);
      const result = serialize(obj, { indent: 2 });
      expect(result).toBe('string: hello\nnumber: 42\nboolean: true\n"null": null');
    });

    it('serializes array with different value types', () => {
      const arr = arrayNode([
        stringNode('hello', loc),
        numberNode(42, loc),
        booleanNode(true, loc),
        nullNode(loc),
      ], loc);
      const result = serialize(arr, { indent: 2 });
      expect(result).toBe('- hello\n- 42\n- true\n- null');
    });
  });

  describe('edge cases', () => {
    it('serializes empty object in block mode', () => {
      expect(serialize(objectNode([], loc), { indent: 2 })).toBe('{}');
    });

    it('serializes empty array in block mode', () => {
      expect(serialize(arrayNode([], loc), { indent: 2 })).toBe('[]');
    });

    it('handles single-element array', () => {
      const arr = arrayNode([numberNode(1, loc)], loc);
      expect(serialize(arr, { indent: 2 })).toBe('- 1');
    });

    it('handles single-property object', () => {
      const obj = objectNode([
        propertyNode(stringNode('a', loc), numberNode(1, loc), loc),
      ], loc);
      expect(serialize(obj, { indent: 2 })).toBe('a: 1');
    });
  });

  describe('real-world examples', () => {
    it('serializes Docker Compose-like structure', () => {
      const config = objectNode([
        propertyNode(stringNode('version', loc), stringNode('3', loc), loc),
        propertyNode(
          stringNode('services', loc),
          objectNode([
            propertyNode(
              stringNode('web', loc),
              objectNode([
                propertyNode(stringNode('image', loc), stringNode('nginx', loc), loc),
                propertyNode(
                  stringNode('ports', loc),
                  arrayNode([stringNode('80:80', loc)], loc),
                  loc
                ),
              ], loc),
              loc
            ),
          ], loc),
          loc
        ),
      ], loc);
      const result = serialize(config, { indent: 2 });
      expect(result).toBe(
        'version: "3"\nservices:\n  web:\n    image: nginx\n    ports:\n      - "80:80"'
      );
    });

    it('serializes GitHub Actions-like structure', () => {
      const workflow = objectNode([
        propertyNode(stringNode('name', loc), stringNode('CI', loc), loc),
        propertyNode(
          stringNode('on', loc),
          arrayNode([stringNode('push', loc), stringNode('pull_request', loc)], loc),
          loc
        ),
      ], loc);
      const result = serialize(workflow, { indent: 2 });
      expect(result).toBe('name: CI\n"on":\n  - push\n  - pull_request');
    });
  });

  describe('DocumentNode serialization', () => {
    it('serializes DocumentNode with number body', () => {
      const body = numberNode(42, loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('42');
    });

    it('serializes DocumentNode with string body', () => {
      const body = stringNode('hello', loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('hello');
    });

    it('serializes DocumentNode with boolean true body', () => {
      const body = booleanNode(true, loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('true');
    });

    it('serializes DocumentNode with boolean false body', () => {
      const body = booleanNode(false, loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('false');
    });

    it('serializes DocumentNode with null body', () => {
      const body = nullNode(loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('null');
    });

    it('serializes DocumentNode with object body', () => {
      const body = objectNode([
        propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
        propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
      ], loc);
      const doc = documentNode(body, loc);
      const result = serialize(doc);
      expect(result).toContain('name:');
      expect(result).toContain('Alice');
      expect(result).toContain('age:');
      expect(result).toContain('30');
    });

    it('serializes DocumentNode with array body', () => {
      const body = arrayNode([
        numberNode(1, loc),
        numberNode(2, loc),
        numberNode(3, loc),
      ], loc);
      const doc = documentNode(body, loc);
      const result = serialize(doc);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('serializes DocumentNode with empty string body', () => {
      const body = stringNode('', loc);
      const doc = documentNode(body, loc);
      expect(serialize(doc)).toBe('""');
    });
  });

  describe('Roundtrip: serialize → parse → toNative', () => {
    it('roundtrips number through DocumentNode', () => {
      const body = numberNode(42, loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toBe(42);
    });

    it('roundtrips string through DocumentNode', () => {
      const body = stringNode('hello', loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toBe('hello');
    });

    it('roundtrips boolean true through DocumentNode', () => {
      const body = booleanNode(true, loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toBe(true);
    });

    it('roundtrips boolean false through DocumentNode', () => {
      const body = booleanNode(false, loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toBe(false);
    });

    it('roundtrips null through DocumentNode', () => {
      const body = nullNode(loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toBe(null);
    });

    it('roundtrips object through DocumentNode', () => {
      const body = objectNode([
        propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
        propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
      ], loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toEqual({ name: 'Alice', age: 30 });
    });

    it('roundtrips array through DocumentNode', () => {
      const body = arrayNode([
        numberNode(1, loc),
        numberNode(2, loc),
        numberNode(3, loc),
      ], loc);
      const doc = documentNode(body, loc);
      const yaml = serialize(doc);
      const parsed = parse(yaml);
      expect(toNative(parsed)).toEqual([1, 2, 3]);
    });
  });
});
