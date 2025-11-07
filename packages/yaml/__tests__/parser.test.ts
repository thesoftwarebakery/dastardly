import { describe, it, expect } from 'vitest';
import { parse, parseValue } from '../src/index.js';
import type { DocumentNode, DataNode, ObjectNode, ArrayNode } from '@dastardly/core';

describe('YAML Parser', () => {
  describe('plain scalars', () => {
    describe('strings', () => {
      it('should parse simple string', () => {
        const node = parseValue('hello');
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello',
          loc: expect.objectContaining({
            start: expect.objectContaining({
              line: expect.any(Number),
              column: expect.any(Number),
              offset: expect.any(Number),
            }),
          }),
        });
      });

      it('should parse string with spaces', () => {
        const node = parseValue('hello world');
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello world',
        });
      });

      it('should parse string with hyphens', () => {
        const node = parseValue('hello-world');
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello-world',
        });
      });
    });

    describe('numbers', () => {
      it('should parse positive integer', () => {
        const node = parseValue('123');
        expect(node).toMatchObject({
          type: 'Number',
          value: 123,
        });
      });

      it('should parse negative integer', () => {
        const node = parseValue('-456');
        expect(node).toMatchObject({
          type: 'Number',
          value: -456,
        });
      });

      it('should parse float', () => {
        const node = parseValue('3.14');
        expect(node).toMatchObject({
          type: 'Number',
          value: 3.14,
        });
      });

      it('should parse exponential', () => {
        const node = parseValue('1.23e+2');
        expect(node).toMatchObject({
          type: 'Number',
          value: 123,
        });
      });

      it('should parse hexadecimal', () => {
        const node = parseValue('0xFF');
        expect(node).toMatchObject({
          type: 'Number',
          value: 255,
        });
      });

      it('should parse octal', () => {
        const node = parseValue('0o77');
        expect(node).toMatchObject({
          type: 'Number',
          value: 63,
        });
      });

      it('should parse binary', () => {
        const node = parseValue('0b1010');
        expect(node).toMatchObject({
          type: 'Number',
          value: 10,
        });
      });

      it('should parse positive infinity', () => {
        const node = parseValue('.inf');
        expect(node).toMatchObject({
          type: 'Number',
          value: Infinity,
        });
      });

      it('should parse negative infinity', () => {
        const node = parseValue('-.inf');
        expect(node).toMatchObject({
          type: 'Number',
          value: -Infinity,
        });
      });

      it('should parse NaN', () => {
        const node = parseValue('.nan');
        expect(node.type).toBe('Number');
        expect((node as any).value).toBeNaN();
      });
    });

    describe('booleans', () => {
      it('should parse true', () => {
        const node = parseValue('true');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: true,
        });
      });

      it('should parse false', () => {
        const node = parseValue('false');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: false,
        });
      });

      it('should parse yes as true', () => {
        const node = parseValue('yes');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: true,
        });
      });

      it('should parse no as false', () => {
        const node = parseValue('no');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: false,
        });
      });

      it('should parse on as true', () => {
        const node = parseValue('on');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: true,
        });
      });

      it('should parse off as false', () => {
        const node = parseValue('off');
        expect(node).toMatchObject({
          type: 'Boolean',
          value: false,
        });
      });
    });

    describe('null', () => {
      it('should parse null', () => {
        const node = parseValue('null');
        expect(node).toMatchObject({
          type: 'Null',
          value: null,
        });
      });

      it('should parse tilde as null', () => {
        const node = parseValue('~');
        expect(node).toMatchObject({
          type: 'Null',
          value: null,
        });
      });

      it('should parse empty value as null', () => {
        const doc = parse('key:');
        expect(doc.body).toMatchObject({
          type: 'Object',
          properties: [
            expect.objectContaining({
              key: expect.objectContaining({ value: 'key' }),
              value: expect.objectContaining({ type: 'Null', value: null }),
            }),
          ],
        });
      });
    });
  });

  describe('quoted scalars', () => {
    describe('double-quoted', () => {
      it('should parse double-quoted string', () => {
        const node = parseValue('"hello"');
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello',
        });
      });

      it('should unescape newline', () => {
        const node = parseValue('"line1\\nline2"');
        expect(node).toMatchObject({
          type: 'String',
          value: 'line1\nline2',
        });
      });

      it('should unescape tab', () => {
        const node = parseValue('"hello\\tworld"');
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello\tworld',
        });
      });

      it('should unescape unicode', () => {
        const node = parseValue('"\\u0048\\u0065\\u006c\\u006c\\u006f"');
        expect(node).toMatchObject({
          type: 'String',
          value: 'Hello',
        });
      });
    });

    describe('single-quoted', () => {
      it('should parse single-quoted string', () => {
        const node = parseValue("'hello'");
        expect(node).toMatchObject({
          type: 'String',
          value: 'hello',
        });
      });

      it('should handle escaped single quote', () => {
        const node = parseValue("'can''t'");
        expect(node).toMatchObject({
          type: 'String',
          value: "can't",
        });
      });

      it('should preserve double quotes', () => {
        const node = parseValue("'say \"hello\"'");
        expect(node).toMatchObject({
          type: 'String',
          value: 'say "hello"',
        });
      });
    });
  });

  describe('block mapping (objects)', () => {
    it('should parse simple object', () => {
      const node = parseValue('name: Alice\nage: 30');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ type: 'String', value: 'name' }),
            value: expect.objectContaining({ type: 'String', value: 'Alice' }),
          }),
          expect.objectContaining({
            key: expect.objectContaining({ type: 'String', value: 'age' }),
            value: expect.objectContaining({ type: 'Number', value: 30 }),
          }),
        ],
      });
      expect((node as ObjectNode).properties).toHaveLength(2);
    });

    it('should parse nested object', () => {
      const node = parseValue('person:\n  name: Alice\n  age: 30');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ type: 'String', value: 'person' }),
            value: expect.objectContaining({
              type: 'Object',
              properties: expect.arrayContaining([
                expect.objectContaining({
                  key: expect.objectContaining({ value: 'name' }),
                  value: expect.objectContaining({ value: 'Alice' }),
                }),
                expect.objectContaining({
                  key: expect.objectContaining({ value: 'age' }),
                  value: expect.objectContaining({ value: 30 }),
                }),
              ]),
            }),
          }),
        ],
      });
      expect((node as ObjectNode).properties).toHaveLength(1);
      expect(((node as ObjectNode).properties[0]?.value as ObjectNode).properties).toHaveLength(2);
    });

    it('should parse empty object', () => {
      const node = parseValue('{}');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [],
      });
    });
  });

  describe('block sequence (arrays)', () => {
    it('should parse simple array', () => {
      const node = parseValue('- one\n- two\n- three');
      expect(node).toMatchObject({
        type: 'Array',
        elements: [
          expect.objectContaining({ type: 'String', value: 'one' }),
          expect.objectContaining({ type: 'String', value: 'two' }),
          expect.objectContaining({ type: 'String', value: 'three' }),
        ],
      });
      expect((node as ArrayNode).elements).toHaveLength(3);
    });

    it('should parse nested array', () => {
      const node = parseValue('- - one\n  - two\n- - three\n  - four');
      expect(node).toMatchObject({
        type: 'Array',
        elements: [
          expect.objectContaining({
            type: 'Array',
            elements: expect.any(Array),
          }),
          expect.objectContaining({
            type: 'Array',
            elements: expect.any(Array),
          }),
        ],
      });
      expect((node as ArrayNode).elements).toHaveLength(2);
      expect(((node as ArrayNode).elements[0] as ArrayNode).type).toBe('Array');
      expect(((node as ArrayNode).elements[1] as ArrayNode).type).toBe('Array');
    });

    it('should parse empty array', () => {
      const node = parseValue('[]');
      expect(node).toMatchObject({
        type: 'Array',
        elements: [],
      });
    });
  });

  describe('flow style (inline)', () => {
    it('should parse flow mapping', () => {
      const node = parseValue('{name: Alice, age: 30}');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ value: 'name' }),
            value: expect.objectContaining({ value: 'Alice' }),
          }),
          expect.objectContaining({
            key: expect.objectContaining({ value: 'age' }),
            value: expect.objectContaining({ value: 30 }),
          }),
        ],
      });
      expect((node as ObjectNode).properties).toHaveLength(2);
    });

    it('should parse flow sequence', () => {
      const node = parseValue('[1, 2, 3]');
      expect(node).toMatchObject({
        type: 'Array',
        elements: [
          expect.objectContaining({ type: 'Number', value: 1 }),
          expect.objectContaining({ type: 'Number', value: 2 }),
          expect.objectContaining({ type: 'Number', value: 3 }),
        ],
      });
      expect((node as ArrayNode).elements).toHaveLength(3);
    });

    it('should parse nested flow structures', () => {
      const node = parseValue('{items: [1, 2, 3], count: 3}');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ value: 'items' }),
            value: expect.objectContaining({
              type: 'Array',
              elements: expect.any(Array),
            }),
          }),
          expect.objectContaining({
            key: expect.objectContaining({ value: 'count' }),
            value: expect.objectContaining({ value: 3 }),
          }),
        ],
      });
      expect((node as ObjectNode).properties).toHaveLength(2);
    });
  });

  describe('mixed structures', () => {
    it('should parse array of objects', () => {
      const node = parseValue('- name: Alice\n  age: 30\n- name: Bob\n  age: 25');
      expect(node).toMatchObject({
        type: 'Array',
        elements: [
          expect.objectContaining({
            type: 'Object',
            properties: expect.any(Array),
          }),
          expect.objectContaining({
            type: 'Object',
            properties: expect.any(Array),
          }),
        ],
      });
      expect((node as ArrayNode).elements).toHaveLength(2);
      expect(((node as ArrayNode).elements[0] as ObjectNode).type).toBe('Object');
      expect(((node as ArrayNode).elements[1] as ObjectNode).type).toBe('Object');
    });

    it('should parse object with arrays', () => {
      const node = parseValue('users:\n  - Alice\n  - Bob\ncount: 2');
      expect(node).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ value: 'users' }),
            value: expect.objectContaining({
              type: 'Array',
              elements: expect.any(Array),
            }),
          }),
          expect.objectContaining({
            key: expect.objectContaining({ value: 'count' }),
            value: expect.objectContaining({ value: 2 }),
          }),
        ],
      });
      expect((node as ObjectNode).properties).toHaveLength(2);
    });
  });

  describe('document node', () => {
    it('should return DocumentNode from parse()', () => {
      const doc = parse('hello: world');
      expect(doc).toMatchObject({
        type: 'Document',
        body: expect.objectContaining({
          type: 'Object',
        }),
      });
    });

    it('should return DataNode from parseValue()', () => {
      const node = parseValue('hello: world');
      expect(node).toMatchObject({
        type: 'Object',
      });
    });
  });

  describe('position tracking', () => {
    it('should track position for scalars', () => {
      const node = parseValue('hello');
      expect(node.loc).toBeDefined();
      expect(node.loc.start.line).toBeGreaterThan(0);
      expect(node.loc.start.column).toBeGreaterThanOrEqual(0);
      expect(node.loc.start.offset).toBeGreaterThanOrEqual(0);
      expect(node.loc.end.line).toBeGreaterThan(0);
      expect(node.loc.end.column).toBeGreaterThanOrEqual(0);
      expect(node.loc.end.offset).toBeGreaterThanOrEqual(0);
    });

    it('should track position for objects', () => {
      const node = parseValue('name: Alice') as ObjectNode;
      expect(node.loc).toBeDefined();
      expect(node.properties[0]?.loc).toBeDefined();
      expect(node.properties[0]?.key.loc).toBeDefined();
      expect(node.properties[0]?.value.loc).toBeDefined();
    });

    it('should track position for arrays', () => {
      const node = parseValue('- one\n- two') as ArrayNode;
      expect(node.loc).toBeDefined();
      expect(node.elements[0]?.loc).toBeDefined();
      expect(node.elements[1]?.loc).toBeDefined();
    });
  });

  describe('block scalars', () => {
    describe('literal (|)', () => {
      it('should parse literal block scalar', () => {
        const yaml = 'text: |\n  Line 1\n  Line 2\n';
        const node = parseValue(yaml) as ObjectNode;
        expect(node.properties[0]?.value).toMatchObject({
          type: 'String',
          value: 'Line 1\nLine 2\n',
        });
      });

      it('should parse literal with strip indicator (|-)', () => {
        const yaml = 'text: |-\n  Line 1\n  Line 2\n';
        const node = parseValue(yaml) as ObjectNode;
        expect(node.properties[0]?.value).toMatchObject({
          type: 'String',
          value: 'Line 1\nLine 2',
        });
      });

      it('should parse literal with keep indicator (|+)', () => {
        const yaml = 'text: |+\n  Line 1\n  Line 2\n\n\n';
        const node = parseValue(yaml) as ObjectNode;
        expect(node.properties[0]?.value).toMatchObject({
          type: 'String',
          value: 'Line 1\nLine 2\n\n\n',
        });
      });
    });

    describe('folded (>)', () => {
      it('should parse folded block scalar', () => {
        const yaml = 'text: >\n  Long line\n  continues here\n';
        const node = parseValue(yaml) as ObjectNode;
        expect(node.properties[0]?.value).toMatchObject({
          type: 'String',
          value: 'Long line continues here\n',
        });
      });

      it('should parse folded with strip indicator (>-)', () => {
        const yaml = 'text: >-\n  Long line\n  continues here\n';
        const node = parseValue(yaml) as ObjectNode;
        expect(node.properties[0]?.value).toMatchObject({
          type: 'String',
          value: 'Long line continues here',
        });
      });
    });
  });

  describe('anchors and aliases', () => {
    it('should resolve simple anchor reference', () => {
      const yaml = 'defaults: &defaults\n  key: value\nprod: *defaults';
      const node = parseValue(yaml) as ObjectNode;
      expect(node.properties).toHaveLength(2);

      const defaults = node.properties[0]?.value as ObjectNode;
      const prod = node.properties[1]?.value as ObjectNode;

      expect(defaults).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ value: 'key' }),
            value: expect.objectContaining({ value: 'value' }),
          }),
        ],
      });

      expect(prod).toMatchObject({
        type: 'Object',
        properties: [
          expect.objectContaining({
            key: expect.objectContaining({ value: 'key' }),
            value: expect.objectContaining({ value: 'value' }),
          }),
        ],
      });
    });

    it('should resolve scalar anchor reference', () => {
      const yaml = 'name: &name Alice\nuser: *name';
      const node = parseValue(yaml) as ObjectNode;
      expect(node.properties[0]?.value).toMatchObject({
        type: 'String',
        value: 'Alice',
      });
      expect(node.properties[1]?.value).toMatchObject({
        type: 'String',
        value: 'Alice',
      });
    });

    it('should resolve nested anchor reference', () => {
      const yaml = 'root: &root\n  child:\n    value: 42\nref: *root';
      const node = parseValue(yaml) as ObjectNode;

      const root = node.properties[0]?.value;
      const ref = node.properties[1]?.value;

      expect(root).toMatchObject({
        type: 'Object',
      });
      expect(ref).toMatchObject({
        type: 'Object',
      });
    });

    it('should handle multiple aliases to same anchor', () => {
      const yaml = 'template: &t\n  x: 1\na: *t\nb: *t\nc: *t';
      const node = parseValue(yaml) as ObjectNode;
      expect(node.properties).toHaveLength(4);

      // All references should be objects with the same structure
      expect(node.properties[0]?.value.type).toBe('Object');
      expect(node.properties[1]?.value.type).toBe('Object');
      expect(node.properties[2]?.value.type).toBe('Object');
      expect(node.properties[3]?.value.type).toBe('Object');
    });

    it('should throw on circular reference', () => {
      const yaml = 'a: &a\n  b: *a';
      expect(() => parseValue(yaml)).toThrow(/circular/i);
    });

    it('should throw on forward reference (alias before anchor)', () => {
      const yaml = 'prod: *defaults\ndefaults: &defaults\n  key: value';
      expect(() => parseValue(yaml)).toThrow(/undefined.*anchor/i);
    });

    it('should throw on undefined anchor reference', () => {
      const yaml = 'prod: *nonexistent';
      expect(() => parseValue(yaml)).toThrow(/undefined.*anchor/i);
    });
  });

  describe('merge keys', () => {
    it('should merge simple anchor', () => {
      const yaml = 'defaults: &defaults\n  a: 1\n  b: 2\nconfig:\n  <<: *defaults\n  c: 3';
      const node = parseValue(yaml) as ObjectNode;

      const config = node.properties[1]?.value as ObjectNode;
      expect(config).toMatchObject({
        type: 'Object',
      });
      expect(config.properties).toHaveLength(3);
      expect(config.properties.find(p => p.key.value === 'a')?.value).toMatchObject({ value: 1 });
      expect(config.properties.find(p => p.key.value === 'b')?.value).toMatchObject({ value: 2 });
      expect(config.properties.find(p => p.key.value === 'c')?.value).toMatchObject({ value: 3 });
    });

    it('should allow explicit keys to override merged keys', () => {
      const yaml = 'defaults: &defaults\n  a: 1\n  b: 2\nconfig:\n  a: 99\n  <<: *defaults';
      const node = parseValue(yaml) as ObjectNode;

      const config = node.properties[1]?.value as ObjectNode;
      // Explicit key 'a: 99' should override merged 'a: 1'
      expect(config.properties.find(p => p.key.value === 'a')?.value).toMatchObject({ value: 99 });
      expect(config.properties.find(p => p.key.value === 'b')?.value).toMatchObject({ value: 2 });
    });

    it('should merge multiple anchors', () => {
      const yaml = 'd1: &d1\n  a: 1\nd2: &d2\n  b: 2\nconfig:\n  <<: [*d1, *d2]\n  c: 3';
      const node = parseValue(yaml) as ObjectNode;

      const config = node.properties[2]?.value as ObjectNode;
      expect(config.properties.find(p => p.key.value === 'a')?.value).toMatchObject({ value: 1 });
      expect(config.properties.find(p => p.key.value === 'b')?.value).toMatchObject({ value: 2 });
      expect(config.properties.find(p => p.key.value === 'c')?.value).toMatchObject({ value: 3 });
    });
  });

  describe('tags', () => {
    it('should handle !!str tag to force string', () => {
      const yaml = 'age: !!str 25';
      const node = parseValue(yaml) as ObjectNode;

      const ageProp = node.properties[0]?.value;
      expect(ageProp).toMatchObject({
        type: 'String',
        value: '25',
      });
    });

    it('should handle !!int tag to force integer', () => {
      const yaml = 'count: !!int "123"';
      const node = parseValue(yaml) as ObjectNode;

      const countProp = node.properties[0]?.value;
      expect(countProp).toMatchObject({
        type: 'Number',
        value: 123,
      });
    });

    it('should ignore custom tags and parse underlying structure', () => {
      const yaml = 'custom: !MyType\n  data: value';
      const node = parseValue(yaml) as ObjectNode;

      const customProp = node.properties[0]?.value;
      expect(customProp).toMatchObject({
        type: 'Object',
      });
    });
  });

  describe('multi-document', () => {
    it('should parse first document by default', () => {
      const yaml = '---\nfirst: 1\n---\nsecond: 2';
      const node = parseValue(yaml) as ObjectNode;

      expect(node).toMatchObject({
        type: 'Object',
      });
      expect(node.properties).toHaveLength(1);
      expect(node.properties[0]?.key).toMatchObject({ value: 'first' });
    });

    it('should parse document without leading ---', () => {
      const yaml = 'simple: value';
      const node = parseValue(yaml);
      expect(node).toMatchObject({
        type: 'Object',
      });
    });

    it('should handle document end marker ...', () => {
      const yaml = 'first: 1\n...';
      const node = parseValue(yaml) as ObjectNode;

      expect(node).toMatchObject({
        type: 'Object',
      });
      expect(node.properties[0]?.key).toMatchObject({ value: 'first' });
    });
  });

  describe('real-world examples', () => {
    it('should parse Docker Compose with anchors', () => {
      const yaml = `version: '3'
x-common: &common
  restart: always
services:
  web:
    <<: *common
    image: nginx
  api:
    <<: *common
    image: node`;

      const node = parseValue(yaml) as ObjectNode;
      expect(node).toMatchObject({
        type: 'Object',
      });

      const services = node.properties.find(p => p.key.value === 'services')?.value as ObjectNode;
      expect(services).toMatchObject({
        type: 'Object',
      });

      const web = services.properties.find(p => p.key.value === 'web')?.value as ObjectNode;
      expect(web).toMatchObject({
        type: 'Object',
      });
      expect(web.properties.find(p => p.key.value === 'restart')?.value).toMatchObject({ value: 'always' });
    });

    it('should parse GitHub Actions workflow', () => {
      const yaml = `name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test`;

      const node = parseValue(yaml) as ObjectNode;
      expect(node).toMatchObject({
        type: 'Object',
      });
      expect(node.properties.find(p => p.key.value === 'name')?.value).toMatchObject({ value: 'CI' });

      const jobs = node.properties.find(p => p.key.value === 'jobs')?.value;
      expect(jobs).toMatchObject({
        type: 'Object',
      });
    });

    it('should parse Kubernetes-style manifest', () => {
      const yaml = `apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  labels:
    app: test
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80`;

      const node = parseValue(yaml) as ObjectNode;
      expect(node).toMatchObject({
        type: 'Object',
      });
      expect(node.properties.find(p => p.key.value === 'kind')?.value).toMatchObject({ value: 'Pod' });

      const metadata = node.properties.find(p => p.key.value === 'metadata')?.value;
      expect(metadata).toMatchObject({
        type: 'Object',
      });
    });
  });

  describe('error handling', () => {
    it('should throw on invalid YAML', () => {
      expect(() => parse('{')).toThrow();
    });

    it('should throw on unterminated string', () => {
      expect(() => parse('"unterminated')).toThrow();
    });

    it('should provide error location', () => {
      try {
        parse('{');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('loc');
      }
    });

    it('should throw on complex keys (objects as keys)', () => {
      const yaml = '? {key1: value1}\n: mapped_value';
      expect(() => parseValue(yaml)).toThrow(/complex.*key/i);
    });

    it('should throw on complex keys (arrays as keys)', () => {
      const yaml = '? [item1, item2]\n: mapped_value';
      expect(() => parseValue(yaml)).toThrow(/complex.*key/i);
    });
  });
});
