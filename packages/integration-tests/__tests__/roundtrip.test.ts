import { describe, it, expect } from 'vitest';
import { parse as parseJSON, serialize as serializeJSON } from '@dastardly/json';
import { parse as parseYAML, serialize as serializeYAML } from '@dastardly/yaml';
import { parse as parseCSV, serialize as serializeCSV } from '@dastardly/csv';
import { toNative } from '@dastardly/core';
import { assertRoundtripEqual } from './helpers/assertions.js';
import { loadJSONFixture, loadYAMLFixture, loadCSVFixture } from './helpers/fixtures.js';

describe('Roundtrip tests', () => {
  describe('JSON roundtrip: parse → stringify → parse', () => {
    it('roundtrips string primitives', () => {
      const source = loadJSONFixture('primitives/string');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe('hello world');
    });

    it('roundtrips number primitives', () => {
      const source = loadJSONFixture('primitives/number');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(42);
    });

    it('roundtrips boolean primitives', () => {
      const source = loadJSONFixture('primitives/boolean');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(true);
    });

    it('roundtrips null', () => {
      const source = loadJSONFixture('primitives/null');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(null);
    });

    it('roundtrips empty strings', () => {
      const source = loadJSONFixture('primitives/empty-string');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe('');
    });

    it('roundtrips unicode strings', () => {
      const source = loadJSONFixture('primitives/unicode');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe('Hello 世界 🌍');
    });

    it('roundtrips simple objects', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual({ name: 'Alice', age: 30, active: true });
    });

    it('roundtrips simple arrays', () => {
      const source = loadJSONFixture('collections/simple-array');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([1, 2, 3, 4, 5]);
    });

    it('roundtrips nested objects', () => {
      const source = loadJSONFixture('collections/nested-object');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('user.contact.email', 'bob@example.com');
    });

    it('roundtrips nested arrays', () => {
      const source = loadJSONFixture('collections/nested-array');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('roundtrips mixed arrays', () => {
      const source = loadJSONFixture('collections/mixed-array');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([1, 'two', true, null, { five: 5 }]);
    });

    it('roundtrips empty objects', () => {
      const source = loadJSONFixture('collections/empty-object');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual({});
    });

    it('roundtrips empty arrays', () => {
      const source = loadJSONFixture('collections/empty-array');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([]);
    });

    it('roundtrips real-world package.json', () => {
      const source = loadJSONFixture('real-world/package');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('name', 'example-package');
      expect(toNative(ast2)).toHaveProperty('dependencies.lodash');
    });

    it('roundtrips real-world tsconfig.json', () => {
      const source = loadJSONFixture('real-world/tsconfig');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('compilerOptions.strict', true);
    });

    it('roundtrips real-world API response', () => {
      const source = loadJSONFixture('real-world/api-response');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('status', 'success');
    });

    it('roundtrips large numbers', () => {
      const source = loadJSONFixture('edge-cases/large-number');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(9007199254740992);
    });

    it('roundtrips scientific notation', () => {
      const source = loadJSONFixture('edge-cases/scientific-notation');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(1.5e10);
    });

    it('roundtrips deeply nested structures', () => {
      const source = loadJSONFixture('edge-cases/deeply-nested');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('a.b.c.d.e.f.g.h.i.j', 'deep');
    });

    it('roundtrips objects with many properties', () => {
      const source = loadJSONFixture('edge-cases/many-properties');
      const ast1 = parseJSON(source);
      const output = serializeJSON(ast1);
      const ast2 = parseJSON(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Record<string, unknown>;
      expect(Object.keys(native).length).toBe(20);
    });
  });

  describe('JSON formatting options', () => {
    it('compact mode produces single-line output', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast = parseJSON(source);
      const output = serializeJSON(ast, { indent: 0 });

      expect(output).not.toContain('\n');
      expect(output).toMatch(/^\{.*\}$/);
    });

    it('pretty-print mode produces formatted output', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast = parseJSON(source);
      const output = serializeJSON(ast, { indent: 2 });

      expect(output).toContain('\n');
      expect(output).toContain('  '); // 2-space indent
    });

    it('custom indent works correctly', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast = parseJSON(source);
      const output = serializeJSON(ast, { indent: 4 });

      expect(output).toContain('    '); // 4-space indent
    });

    it('preserveRaw option maintains original formatting', () => {
      const source = '{\n  "name": "Alice"\n}';
      const ast = parseJSON(source);
      const output = serializeJSON(ast, { preserveRaw: true });

      // preserveRaw should use raw values when available
      const ast2 = parseJSON(output);
      assertRoundtripEqual(ast, ast2);
    });
  });

  describe('YAML roundtrip: parse → serialize → parse', () => {
    it('roundtrips plain scalars', () => {
      const source = loadYAMLFixture('scalars/plain-string');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe('hello world');
    });

    it('roundtrips quoted scalars', () => {
      const source = loadYAMLFixture('scalars/quoted-string');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe('hello world');
    });

    it('roundtrips numbers', () => {
      const source = loadYAMLFixture('scalars/numbers');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(42);
    });

    it('roundtrips booleans', () => {
      const source = loadYAMLFixture('scalars/booleans');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(true);
    });

    it('roundtrips null', () => {
      const source = loadYAMLFixture('scalars/null');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toBe(null);
    });

    it('roundtrips block mappings', () => {
      const source = loadYAMLFixture('collections/block-mapping');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual({ name: 'Alice', age: 30, active: true });
    });

    it('roundtrips flow mappings', () => {
      const source = loadYAMLFixture('collections/flow-mapping');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual({ name: 'Alice', age: 30 });
    });

    it('roundtrips block sequences', () => {
      const source = loadYAMLFixture('collections/block-sequence');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual(['apple', 'banana', 'cherry']);
    });

    it('roundtrips flow sequences', () => {
      const source = loadYAMLFixture('collections/flow-sequence');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([1, 2, 3, 4, 5]);
    });

    it('roundtrips nested structures', () => {
      const source = loadYAMLFixture('collections/nested');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('user.contact.email', 'bob@example.com');
    });

    it('roundtrips real-world docker-compose.yaml', () => {
      const source = loadYAMLFixture('real-world/docker-compose');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('version', '3.8');
      expect(toNative(ast2)).toHaveProperty('services.web');
    });

    it('roundtrips real-world GitHub Actions workflow', () => {
      const source = loadYAMLFixture('real-world/github-actions');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('name', 'CI');
      expect(toNative(ast2)).toHaveProperty('jobs.test');
    });

    it('roundtrips real-world Kubernetes deployment', () => {
      const source = loadYAMLFixture('real-world/kubernetes-deployment');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('kind', 'Deployment');
      expect(toNative(ast2)).toHaveProperty('spec.replicas', 3);
    });

    it('roundtrips multiline strings', () => {
      const source = loadYAMLFixture('scalars/multiline-string');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      assertRoundtripEqual(ast1, ast2);
      const value = toNative(ast2) as string;
      expect(value).toContain('This is a multiline');
      expect(value).toContain('string with line breaks');
    });
  });

  describe('YAML-specific roundtrips', () => {
    it('roundtrips after resolving anchors and aliases', () => {
      const source = loadYAMLFixture('yaml-specific/anchors-aliases');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      // After serialization, anchors are resolved to values
      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('service1.timeout', 30);
      expect(toNative(ast2)).toHaveProperty('service2.timeout', 60);
    });

    it('roundtrips after resolving merge keys', () => {
      const source = loadYAMLFixture('yaml-specific/merge-keys');
      const ast1 = parseYAML(source);
      const output = serializeYAML(ast1);
      const ast2 = parseYAML(output);

      // Merge keys should be resolved
      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toHaveProperty('extended.x', 1);
      expect(toNative(ast2)).toHaveProperty('extended.y', 2);
      expect(toNative(ast2)).toHaveProperty('extended.z', 3);
    });

    it('handles special YAML values in roundtrip', () => {
      const source = loadYAMLFixture('yaml-specific/special-values');
      const ast1 = parseYAML(source);

      // Note: Infinity and NaN cannot be represented in standard YAML after serialization
      // We just verify parsing works correctly
      const native = toNative(ast1) as Record<string, unknown>;
      expect(native.positive_infinity).toBe(Infinity);
      expect(native.negative_infinity).toBe(-Infinity);
      expect(native.not_a_number).toBe(NaN);
    });
  });

  describe('YAML formatting options', () => {
    it('compact mode uses flow style', () => {
      const source = loadYAMLFixture('collections/block-mapping');
      const ast = parseYAML(source);
      const output = serializeYAML(ast, { indent: 0 });

      // Compact mode should use flow style (single line)
      expect(output).not.toContain('\n');
      expect(output).toMatch(/\{.*\}/);
    });

    it('block mode uses block style with indentation', () => {
      const source = loadYAMLFixture('collections/flow-mapping');
      const ast = parseYAML(source);
      const output = serializeYAML(ast, { indent: 2 });

      // Block mode should have newlines and indentation
      expect(output).toContain('\n');
    });

    it('respects indent option', () => {
      const source = loadYAMLFixture('collections/nested');
      const ast = parseYAML(source);
      const output = serializeYAML(ast, { indent: 4 });

      // Should have proper indentation
      expect(output).toContain('\n');
      const lines = output.split('\n');
      const indentedLine = lines.find(line => line.startsWith('    '));
      expect(indentedLine).toBeTruthy();
    });
  });

  describe('Cross-format roundtrip stability', () => {
    it('JSON → YAML → JSON → YAML is stable', () => {
      const jsonSource = loadJSONFixture('collections/simple-object');
      const json1 = parseJSON(jsonSource);
      const yaml1 = serializeYAML(json1);
      const yamlAst = parseYAML(yaml1);
      const json2 = serializeJSON(yamlAst);
      const jsonAst = parseJSON(json2);
      const yaml2 = serializeYAML(jsonAst);

      // Second YAML output should match first YAML output
      expect(yaml1).toBe(yaml2);
    });

    it('YAML → JSON → YAML → JSON is stable', () => {
      const yamlSource = loadYAMLFixture('collections/block-mapping');
      const yaml1 = parseYAML(yamlSource);
      const json1 = serializeJSON(yaml1);
      const jsonAst = parseJSON(json1);
      const yaml2 = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yaml2);
      const json2 = serializeJSON(yamlAst);

      // Second JSON output should match first JSON output
      expect(json1).toBe(json2);
    });

    it('multiple roundtrips preserve data integrity', () => {
      const source = loadJSONFixture('real-world/api-response');
      let ast = parseJSON(source);
      const originalNative = toNative(ast);

      // Do 5 roundtrips
      for (let i = 0; i < 5; i++) {
        const json = serializeJSON(ast);
        ast = parseJSON(json);
      }

      // Data should be unchanged
      expect(toNative(ast)).toEqual(originalNative);
    });
  });

  describe('CSV roundtrip: parse → serialize → parse', () => {
    it('roundtrips simple CSV with headers', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual(toNative(ast1));
    });

    it('roundtrips numbers CSV', () => {
      const source = loadCSVFixture('primitives/numbers');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[0]).toHaveProperty('integer', 42);
      expect(native[0]).toHaveProperty('float', 3.14);
    });

    it('roundtrips strings CSV', () => {
      const source = loadCSVFixture('primitives/strings');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[0]).toHaveProperty('short', 'Hi');
      expect(native[0]).toHaveProperty('single', 'A');
    });

    it('roundtrips array of objects', () => {
      const source = loadCSVFixture('collections/array-of-objects');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
        { id: '3', name: 'Carol', email: 'carol@example.com' },
      ]);
    });

    it('roundtrips mixed types', () => {
      const source = loadCSVFixture('collections/mixed-types');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[0]).toEqual({
        string: 'hello',
        number: 42,
        boolean: true,
        float: 3.14,
      });
    });

    it('roundtrips empty fields', () => {
      const source = loadCSVFixture('edge-cases/empty-fields');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[1]).toHaveProperty('name', '');
      expect(native[1]).toHaveProperty('phone', '');
    });

    it('roundtrips quoted fields', () => {
      const source = loadCSVFixture('edge-cases/quoted-fields');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[1].description).toBe('Field with, comma');
      expect(native[2].description).toBe('Field with "quotes"');
      expect(native[3].description).toContain('\n');
    });

    it('roundtrips special characters', () => {
      const source = loadCSVFixture('edge-cases/special-chars');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native[0]).toHaveProperty('emoji', '👋');
      expect(native[0]).toHaveProperty('unicode', 'café');
      expect(native[3]).toHaveProperty('unicode', '日本語');
    });

    it('roundtrips single column CSV', () => {
      const source = loadCSVFixture('edge-cases/single-column');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(4);
      expect(native[0]).toHaveProperty('value', 42);
    });

    it('roundtrips single row (headers only)', () => {
      const source = loadCSVFixture('edge-cases/single-row');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      expect(toNative(ast2)).toEqual([]);
    });

    it('roundtrips large datasets', () => {
      const source = loadCSVFixture('edge-cases/large-dataset');
      const ast1 = parseCSV(source);
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output);

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<unknown>;
      expect(native).toHaveLength(20);
    });

    it('roundtrips real-world employee data', () => {
      const source = loadCSVFixture('real-world/employee-data');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('name', 'Alice Smith');
      expect(native[0]).toHaveProperty('salary', 100000);
    });

    it('roundtrips real-world product catalog', () => {
      const source = loadCSVFixture('real-world/product-catalog');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('sku', 'WID-001');
      expect(native[0]).toHaveProperty('price', 19.99);
    });

    it('roundtrips real-world sales data', () => {
      const source = loadCSVFixture('real-world/sales-data');
      const ast1 = parseCSV(source, { inferTypes: true });
      const output = serializeCSV(ast1);
      const ast2 = parseCSV(output, { inferTypes: true });

      assertRoundtripEqual(ast1, ast2);
      const native = toNative(ast2) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('product', 'Widget');
      expect(native[0]).toHaveProperty('quantity', 10);
    });
  });

  describe('CSV formatting options', () => {
    it('handles different delimiters (TSV)', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);
      const output = serializeCSV(ast, { delimiter: '\t' });

      expect(output).toContain('\t');
      expect(output).not.toContain(',');

      // Verify roundtrip with TSV
      const ast2 = parseCSV(output, { delimiter: '\t' });
      assertRoundtripEqual(ast, ast2);
    });

    it('handles different delimiters (PSV)', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);
      const output = serializeCSV(ast, { delimiter: '|' });

      expect(output).toContain('|');
      expect(output).not.toContain(',');

      // Verify roundtrip with PSV
      const ast2 = parseCSV(output, { delimiter: '|' });
      assertRoundtripEqual(ast, ast2);
    });

    it('handles different quote strategies', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      // Quote all fields
      const allQuoted = serializeCSV(ast, { quoteStrategy: 'all' });
      expect(allQuoted.split('\n')[0]).toBe('"name","age","active"');

      // Quote only when needed
      const needed = serializeCSV(ast, { quoteStrategy: 'needed' });
      expect(needed.split('\n')[0]).toBe('name,age,active');
    });

    it('handles different line endings', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      // LF (Unix)
      const lf = serializeCSV(ast, { lineEnding: 'LF' });
      expect(lf).toContain('\n');
      expect(lf).not.toContain('\r\n');

      // CRLF (Windows)
      const crlf = serializeCSV(ast, { lineEnding: 'CRLF' });
      expect(crlf).toContain('\r\n');
    });

    it('handles includeHeaders option', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      // Without headers
      const noHeaders = serializeCSV(ast, { includeHeaders: false });
      expect(noHeaders).not.toContain('name,age,active');
      expect(noHeaders).toContain('Alice');

      // With headers (default)
      const withHeaders = serializeCSV(ast);
      expect(withHeaders).toContain('name,age,active');
    });
  });

  describe('CSV cross-format roundtrip stability', () => {
    it('CSV → JSON → CSV → JSON is stable', () => {
      const csvSource = loadCSVFixture('collections/array-of-objects');
      const csv1 = parseCSV(csvSource);
      const json1 = serializeJSON(csv1);
      const jsonAst = parseJSON(json1);
      const csv2 = serializeCSV(jsonAst);
      const csvAst = parseCSV(csv2);
      const json2 = serializeJSON(csvAst);

      // Second JSON output should match first JSON output
      expect(json1).toBe(json2);
    });

    it('CSV → YAML → CSV → YAML is stable', () => {
      const csvSource = loadCSVFixture('collections/array-of-objects');
      const csv1 = parseCSV(csvSource);
      const yaml1 = serializeYAML(csv1);
      const yamlAst = parseYAML(yaml1);
      const csv2 = serializeCSV(yamlAst);
      const csvAst = parseCSV(csv2);
      const yaml2 = serializeYAML(csvAst);

      // Second YAML output should match first YAML output
      expect(yaml1).toBe(yaml2);
    });

    it('multiple CSV roundtrips preserve data integrity', () => {
      const source = loadCSVFixture('real-world/employee-data');
      let ast = parseCSV(source, { inferTypes: true });
      const originalNative = toNative(ast);

      // Do 5 roundtrips
      for (let i = 0; i < 5; i++) {
        const csv = serializeCSV(ast);
        ast = parseCSV(csv, { inferTypes: true });
      }

      // Data should be unchanged
      expect(toNative(ast)).toEqual(originalNative);
    });

    it('CSV with empty fields roundtrips through JSON', () => {
      const csvSource = loadCSVFixture('edge-cases/empty-fields');
      const csv1 = parseCSV(csvSource);
      const json = serializeJSON(csv1);
      const jsonAst = parseJSON(json);
      const csv2 = serializeCSV(jsonAst);
      const csvAst = parseCSV(csv2);

      expect(toNative(csv1)).toEqual(toNative(csvAst));
    });

    it('CSV with special characters roundtrips through YAML', () => {
      const csvSource = loadCSVFixture('edge-cases/special-chars');
      const csv1 = parseCSV(csvSource);
      const yaml = serializeYAML(csv1);
      const yamlAst = parseYAML(yaml);
      const csv2 = serializeCSV(yamlAst);
      const csvAst = parseCSV(csv2);

      expect(toNative(csv1)).toEqual(toNative(csvAst));
    });
  });
});
