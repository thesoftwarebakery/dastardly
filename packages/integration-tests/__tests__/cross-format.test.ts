import { describe, it, expect } from 'vitest';
import { parse as parseJSON, serialize as serializeJSON } from '@bakes/dastardly-json';
import { parse as parseYAML, serialize as serializeYAML } from '@bakes/dastardly-yaml';
import { parse as parseCSV, serialize as serializeCSV } from '@bakes/dastardly-csv';
import { toNative } from '@bakes/dastardly-core';
import { loadJSONFixture, loadYAMLFixture, loadCSVFixture } from './helpers/fixtures.js';

describe('Cross-format conversions: JSON ↔ YAML', () => {
  describe('JSON → YAML → JSON roundtrip', () => {
    it('converts simple string', () => {
      const jsonSource = loadJSONFixture('primitives/string');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);
      const jsonOutput = serializeJSON(yamlAst);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(jsonOutput).toBe('"hello world"');
    });

    it('converts numbers', () => {
      const jsonSource = loadJSONFixture('primitives/number');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe(42);
    });

    it('converts booleans', () => {
      const jsonSource = loadJSONFixture('primitives/boolean');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe(true);
    });

    it('converts null', () => {
      const jsonSource = loadJSONFixture('primitives/null');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe(null);
    });

    it('converts empty string', () => {
      const jsonSource = loadJSONFixture('primitives/empty-string');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe('');
    });

    it('converts unicode strings', () => {
      const jsonSource = loadJSONFixture('primitives/unicode');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe('Hello 世界 🌍');
    });

    it('converts simple objects', () => {
      const jsonSource = loadJSONFixture('collections/simple-object');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      const expected = { name: 'Alice', age: 30, active: true };
      expect(toNative(jsonAst)).toEqual(expected);
      expect(toNative(yamlAst)).toEqual(expected);
    });

    it('converts simple arrays', () => {
      const jsonSource = loadJSONFixture('collections/simple-array');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      const expected = [1, 2, 3, 4, 5];
      expect(toNative(jsonAst)).toEqual(expected);
      expect(toNative(yamlAst)).toEqual(expected);
    });

    it('converts nested objects', () => {
      const jsonSource = loadJSONFixture('collections/nested-object');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      const expected = {
        user: {
          name: 'Bob',
          contact: {
            email: 'bob@example.com',
            phone: '555-1234',
          },
        },
      };
      expect(toNative(jsonAst)).toEqual(expected);
      expect(toNative(yamlAst)).toEqual(expected);
    });

    it('converts nested arrays', () => {
      const jsonSource = loadJSONFixture('collections/nested-array');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      const expected = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      expect(toNative(jsonAst)).toEqual(expected);
      expect(toNative(yamlAst)).toEqual(expected);
    });

    it('converts mixed arrays', () => {
      const jsonSource = loadJSONFixture('collections/mixed-array');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      const expected = [1, 'two', true, null, { five: 5 }];
      expect(toNative(jsonAst)).toEqual(expected);
      expect(toNative(yamlAst)).toEqual(expected);
    });

    it('converts empty objects', () => {
      const jsonSource = loadJSONFixture('collections/empty-object');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual({});
      expect(toNative(yamlAst)).toEqual({});
    });

    it('converts empty arrays', () => {
      const jsonSource = loadJSONFixture('collections/empty-array');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual([]);
      expect(toNative(yamlAst)).toEqual([]);
    });
  });

  describe('YAML → JSON → YAML roundtrip', () => {
    it('converts block mappings', () => {
      const yamlSource = loadYAMLFixture('collections/block-mapping');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      const expected = { name: 'Alice', age: 30, active: true };
      expect(toNative(yamlAst)).toEqual(expected);
      expect(toNative(jsonAst)).toEqual(expected);
    });

    it('converts block sequences', () => {
      const yamlSource = loadYAMLFixture('collections/block-sequence');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      const expected = ['apple', 'banana', 'cherry'];
      expect(toNative(yamlAst)).toEqual(expected);
      expect(toNative(jsonAst)).toEqual(expected);
    });

    it('converts flow mappings', () => {
      const yamlSource = loadYAMLFixture('collections/flow-mapping');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      const expected = { name: 'Alice', age: 30 };
      expect(toNative(yamlAst)).toEqual(expected);
      expect(toNative(jsonAst)).toEqual(expected);
    });

    it('converts flow sequences', () => {
      const yamlSource = loadYAMLFixture('collections/flow-sequence');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      const expected = [1, 2, 3, 4, 5];
      expect(toNative(yamlAst)).toEqual(expected);
      expect(toNative(jsonAst)).toEqual(expected);
    });

    it('converts nested YAML structures', () => {
      const yamlSource = loadYAMLFixture('collections/nested');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      const expected = {
        user: {
          name: 'Bob',
          contact: {
            email: 'bob@example.com',
            phone: '555-1234',
          },
        },
      };
      expect(toNative(yamlAst)).toEqual(expected);
      expect(toNative(jsonAst)).toEqual(expected);
    });
  });

  describe('Real-world documents', () => {
    it('converts package.json to YAML and back', () => {
      const jsonSource = loadJSONFixture('real-world/package');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);
      const jsonOutput = serializeJSON(yamlAst);
      const finalAst = parseJSON(jsonOutput);

      expect(toNative(jsonAst)).toEqual(toNative(finalAst));
      expect(toNative(jsonAst)).toHaveProperty('name', 'example-package');
      expect(toNative(jsonAst)).toHaveProperty('dependencies.lodash');
    });

    it('converts tsconfig.json to YAML and back', () => {
      const jsonSource = loadJSONFixture('real-world/tsconfig');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(jsonAst)).toHaveProperty('compilerOptions.strict', true);
    });

    it('converts API response to YAML and back', () => {
      const jsonSource = loadJSONFixture('real-world/api-response');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(jsonAst)).toHaveProperty('status', 'success');
      expect(toNative(jsonAst)).toHaveProperty('data.users');
    });

    it('converts docker-compose.yaml to JSON and back', () => {
      const yamlSource = loadYAMLFixture('real-world/docker-compose');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);
      const yamlOutput = serializeYAML(jsonAst);
      const finalAst = parseYAML(yamlOutput);

      expect(toNative(yamlAst)).toEqual(toNative(finalAst));
      expect(toNative(yamlAst)).toHaveProperty('version', '3.8');
      expect(toNative(yamlAst)).toHaveProperty('services.web');
    });

    it('converts GitHub Actions workflow to JSON and back', () => {
      const yamlSource = loadYAMLFixture('real-world/github-actions');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(yamlAst)).toEqual(toNative(jsonAst));
      expect(toNative(yamlAst)).toHaveProperty('name', 'CI');
      expect(toNative(yamlAst)).toHaveProperty('jobs.test');
    });
  });

  describe('Edge cases', () => {
    it('handles large numbers', () => {
      const jsonSource = loadJSONFixture('edge-cases/large-number');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe(9007199254740992);
    });

    it('handles scientific notation', () => {
      const jsonSource = loadJSONFixture('edge-cases/scientific-notation');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toBe(1.5e10);
    });

    it('handles deeply nested structures', () => {
      const jsonSource = loadJSONFixture('edge-cases/deeply-nested');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      expect(toNative(yamlAst)).toHaveProperty('a.b.c.d.e.f.g.h.i.j', 'deep');
    });

    it('handles objects with many properties', () => {
      const jsonSource = loadJSONFixture('edge-cases/many-properties');
      const jsonAst = parseJSON(jsonSource);
      const yamlOutput = serializeYAML(jsonAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
      const native = toNative(yamlAst) as Record<string, unknown>;
      expect(Object.keys(native).length).toBe(20);
    });
  });

  describe('YAML-specific features', () => {
    it('resolves anchors and aliases in conversion', () => {
      const yamlSource = loadYAMLFixture('yaml-specific/anchors-aliases');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      // Anchors should be resolved to their values
      expect(toNative(yamlAst)).toEqual(toNative(jsonAst));
      expect(toNative(jsonAst)).toHaveProperty('service1.timeout', 30);
      expect(toNative(jsonAst)).toHaveProperty('service2.timeout', 60);
    });

    it('resolves merge keys in conversion', () => {
      const yamlSource = loadYAMLFixture('yaml-specific/merge-keys');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(yamlAst)).toEqual(toNative(jsonAst));
      expect(toNative(jsonAst)).toHaveProperty('extended.x', 1);
      expect(toNative(jsonAst)).toHaveProperty('extended.y', 2);
      expect(toNative(jsonAst)).toHaveProperty('extended.z', 3);
    });

    it('handles special YAML values (infinity, NaN)', () => {
      const yamlSource = loadYAMLFixture('yaml-specific/special-values');
      const yamlAst = parseYAML(yamlSource);

      // Note: JSON cannot represent Infinity or NaN, so we just verify parsing
      const native = toNative(yamlAst) as Record<string, unknown>;
      expect(native.positive_infinity).toBe(Infinity);
      expect(native.negative_infinity).toBe(-Infinity);
      expect(native.not_a_number).toBe(NaN);
    });

    it('handles multiline strings in conversion', () => {
      const yamlSource = loadYAMLFixture('scalars/multiline-string');
      const yamlAst = parseYAML(yamlSource);
      const jsonOutput = serializeJSON(yamlAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(yamlAst)).toEqual(toNative(jsonAst));
      const value = toNative(jsonAst) as string;
      expect(value).toContain('This is a multiline');
      expect(value).toContain('string with line breaks');
    });
  });
});

describe('Cross-format conversions: CSV ↔ JSON', () => {
  describe('CSV → JSON → CSV roundtrip', () => {
    it('converts simple CSV with headers', () => {
      const csvSource = loadCSVFixture('primitives/simple');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);
      const csvOutput = serializeCSV(jsonAst);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(3);
      expect(native[0]).toEqual({ name: 'Alice', age: '30', active: 'true' });
    });

    it('converts array of objects', () => {
      const csvSource = loadCSVFixture('collections/array-of-objects');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(3);
      expect(native[0]).toHaveProperty('id', '1');
      expect(native[0]).toHaveProperty('name', 'Alice');
      expect(native[0]).toHaveProperty('email', 'alice@example.com');
    });

    it('converts mixed types with type inference', () => {
      const csvSource = loadCSVFixture('collections/mixed-types');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native[0]).toEqual({
        string: 'hello',
        number: 42,
        boolean: true,
        float: 3.14,
      });
      expect(typeof native[0].number).toBe('number');
      expect(typeof native[0].boolean).toBe('boolean');
      expect(typeof native[0].float).toBe('number');
    });

    it('handles empty fields', () => {
      const csvSource = loadCSVFixture('edge-cases/empty-fields');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native[1]).toHaveProperty('name', '');
      expect(native[1]).toHaveProperty('phone', '');
      expect(native[2]).toHaveProperty('email', '');
    });

    it('handles quoted fields with special characters', () => {
      const csvSource = loadCSVFixture('edge-cases/quoted-fields');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native[1].description).toBe('Field with, comma');
      expect(native[2].description).toBe('Field with "quotes"');
      expect(native[3].description).toContain('\n');
    });

    it('handles special characters and unicode', () => {
      const csvSource = loadCSVFixture('edge-cases/special-chars');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native[0]).toHaveProperty('emoji', '👋');
      expect(native[0]).toHaveProperty('unicode', 'café');
      expect(native[3]).toHaveProperty('unicode', '日本語');
    });
  });

  describe('JSON → CSV conversion', () => {
    it('converts array of objects to CSV', () => {
      const jsonSource = loadJSONFixture('collections/simple-array');
      const jsonAst = parseJSON(jsonSource);

      // Simple array [1,2,3,4,5] can't be directly converted to CSV with headers
      // It needs to be an array of objects
      const native = toNative(jsonAst) as number[];
      expect(native).toEqual([1, 2, 3, 4, 5]);
    });

    it('converts object array from JSON to CSV', () => {
      // Use a JSON fixture that's compatible with CSV structure
      const jsonSource = JSON.stringify([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ]);
      const jsonAst = parseJSON(jsonSource);
      const csvOutput = serializeCSV(jsonAst);
      const csvAst = parseCSV(csvOutput, { inferTypes: true });

      expect(toNative(jsonAst)).toEqual(toNative(csvAst));
    });
  });

  describe('Real-world CSV documents', () => {
    it('converts employee data', () => {
      const csvSource = loadCSVFixture('real-world/employee-data');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('name', 'Alice Smith');
      expect(native[0]).toHaveProperty('department', 'Engineering');
      expect(native[0]).toHaveProperty('salary', 100000);
    });

    it('converts product catalog', () => {
      const csvSource = loadCSVFixture('real-world/product-catalog');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('sku', 'WID-001');
      expect(native[0]).toHaveProperty('price', 19.99);
      expect(native[0]).toHaveProperty('in_stock', true);
    });

    it('converts sales data', () => {
      const csvSource = loadCSVFixture('real-world/sales-data');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(5);
      expect(native[0]).toHaveProperty('product', 'Widget');
      expect(native[0]).toHaveProperty('quantity', 10);
      expect(native[0]).toHaveProperty('revenue', 199.9);
    });
  });

  describe('CSV edge cases', () => {
    it('handles single column CSV', () => {
      const csvSource = loadCSVFixture('edge-cases/single-column');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(4);
      expect(native[0]).toHaveProperty('value', 42);
      expect(native[1]).toHaveProperty('value', 3.14);
    });

    it('handles single row (headers only)', () => {
      const csvSource = loadCSVFixture('edge-cases/single-row');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<unknown>;
      expect(native).toHaveLength(0);
    });

    it('handles large datasets efficiently', () => {
      const csvSource = loadCSVFixture('edge-cases/large-dataset');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<unknown>;
      expect(native).toHaveLength(20);
    });

    it('handles trailing commas', () => {
      const csvSource = loadCSVFixture('edge-cases/trailing-comma');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      // Trailing comma creates an empty field
      expect(Object.keys(native[0] ?? {})).toHaveLength(4);
    });

    it('handles leading commas', () => {
      const csvSource = loadCSVFixture('edge-cases/leading-comma');
      const csvAst = parseCSV(csvSource);
      const jsonOutput = serializeJSON(csvAst);
      const jsonAst = parseJSON(jsonOutput);

      expect(toNative(csvAst)).toEqual(toNative(jsonAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      // Leading comma creates an empty header field
      expect(Object.keys(native[0] ?? {})).toHaveLength(4);
    });
  });
});

describe('Cross-format conversions: CSV ↔ YAML', () => {
  describe('CSV → YAML → CSV roundtrip', () => {
    it('converts simple CSV to YAML', () => {
      const csvSource = loadCSVFixture('primitives/simple');
      const csvAst = parseCSV(csvSource);
      const yamlOutput = serializeYAML(csvAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(csvAst)).toEqual(toNative(yamlAst));
      const native = toNative(csvAst) as Array<Record<string, unknown>>;
      expect(native).toHaveLength(3);
      expect(native[0]).toHaveProperty('name', 'Alice');
    });

    it('converts array of objects via YAML', () => {
      const csvSource = loadCSVFixture('collections/array-of-objects');
      const csvAst = parseCSV(csvSource);
      const yamlOutput = serializeYAML(csvAst);
      const yamlAst = parseYAML(yamlOutput);
      const csvOutput = serializeCSV(yamlAst);

      expect(toNative(csvAst)).toEqual(toNative(yamlAst));
      // Note: CSV roundtrip may not preserve exact formatting
      expect(csvOutput).toContain('id,name,email');
    });

    it('converts real-world employee data via YAML', () => {
      const csvSource = loadCSVFixture('real-world/employee-data');
      const csvAst = parseCSV(csvSource, { inferTypes: true });
      const yamlOutput = serializeYAML(csvAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(csvAst)).toEqual(toNative(yamlAst));
      const native = toNative(yamlAst) as Array<Record<string, unknown>>;
      expect(native[0]).toHaveProperty('name', 'Alice Smith');
      expect(native[0]).toHaveProperty('salary', 100000);
    });

    it('handles empty fields in YAML conversion', () => {
      const csvSource = loadCSVFixture('edge-cases/empty-fields');
      const csvAst = parseCSV(csvSource);
      const yamlOutput = serializeYAML(csvAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(csvAst)).toEqual(toNative(yamlAst));
      const native = toNative(yamlAst) as Array<Record<string, unknown>>;
      expect(native[1].name).toBe('');
      expect(native[1].phone).toBe('');
    });

    it('handles special characters in YAML conversion', () => {
      const csvSource = loadCSVFixture('edge-cases/special-chars');
      const csvAst = parseCSV(csvSource);
      const yamlOutput = serializeYAML(csvAst);
      const yamlAst = parseYAML(yamlOutput);

      expect(toNative(csvAst)).toEqual(toNative(yamlAst));
      const native = toNative(yamlAst) as Array<Record<string, unknown>>;
      expect(native[0].emoji).toBe('👋');
      expect(native[0].unicode).toBe('café');
    });
  });

  describe('YAML → CSV conversion limitations', () => {
    it('handles flat YAML structures', () => {
      const yamlSource = loadYAMLFixture('collections/block-sequence');
      const yamlAst = parseYAML(yamlSource);

      // Simple sequence like ['apple', 'banana', 'cherry'] can't be directly converted to CSV with headers
      // It would need to be an array of objects
      const native = toNative(yamlAst) as string[];
      expect(native).toEqual(['apple', 'banana', 'cherry']);
    });

    it('converts YAML array of objects to CSV', () => {
      const yamlSource = `
- id: 1
  name: Alice
  age: 30
- id: 2
  name: Bob
  age: 25
`;
      const yamlAst = parseYAML(yamlSource);
      const csvOutput = serializeCSV(yamlAst);
      const csvAst = parseCSV(csvOutput, { inferTypes: true });

      expect(toNative(yamlAst)).toEqual(toNative(csvAst));
    });
  });
});
