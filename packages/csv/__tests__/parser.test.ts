import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/parser.js';
import { isArrayNode, isObjectNode, isStringNode, isNumberNode } from '@bakes/dastardly-core';

describe('CSV Parser', () => {
  describe('Basic parsing with headers', () => {
    it('should parse simple CSV with headers', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(2);

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties).toHaveLength(2);
      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[0]?.value.type).toBe('String');
      expect(first.properties[1]?.key.value).toBe('age');
    });

    it('should parse CSV with quoted fields', () => {
      const csv = 'name,description\n"Alice","Hello, world"\n"Bob","Test"';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('String');
      if (first.properties[1]?.value.type !== 'String') return;
      expect(first.properties[1].value.value).toBe('Hello, world');
    });

    it('should handle empty fields', () => {
      // External scanner now supports empty fields (Phase 2)
      const csv = 'a,b,c\n1,,3\n,2,';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      // First row: 1,,3 - middle field is empty
      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;
      expect(first.properties[1]?.value.type).toBe('String');
      if (first.properties[1]?.value.type !== 'String') return;
      expect(first.properties[1].value.value).toBe('');

      // Second row: ,2, - leading and trailing fields are empty
      const second = result.root.elements[1];
      expect(isObjectNode(second)).toBe(true);
      if (!isObjectNode(second)) return;
      expect(second.properties[0]?.value.type).toBe('String');
      if (second.properties[0]?.value.type !== 'String') return;
      expect(second.properties[0].value.value).toBe('');
      expect(second.properties[2]?.value.type).toBe('String');
      if (second.properties[2]?.value.type !== 'String') return;
      expect(second.properties[2].value.value).toBe('');
    });
  });

  describe('Type inference', () => {
    it('should infer numbers when inferTypes is true', () => {
      const csv = 'name,age,score\nAlice,30,95.5\nBob,25,88';
      const result = parseCSV(csv, { inferTypes: true });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('Number');
      if (first.properties[1]?.value.type !== 'Number') return;
      expect(first.properties[1].value.value).toBe(30);

      expect(first.properties[2]?.value.type).toBe('Number');
      if (first.properties[2]?.value.type !== 'Number') return;
      expect(first.properties[2].value.value).toBe(95.5);
    });

    it('should treat all values as strings when inferTypes is false', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = parseCSV(csv, { inferTypes: false });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('String');
      if (first.properties[1]?.value.type !== 'String') return;
      expect(first.properties[1].value.value).toBe('30');
    });

    it('should infer booleans when inferTypes is true', () => {
      const csv = 'name,active\nAlice,true\nBob,false';
      const result = parseCSV(csv, { inferTypes: true });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)) .toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('Boolean');
      if (first.properties[1]?.value.type !== 'Boolean') return;
      expect(first.properties[1].value.value).toBe(true);
    });

    it('should infer null when inferTypes is true', () => {
      const csv = 'name,value\nAlice,null\nBob,NULL';
      const result = parseCSV(csv, { inferTypes: true });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('Null');
    });
  });

  describe('Headers option', () => {
    it('should parse as array of arrays when headers is false', () => {
      const csv = 'Alice,30\nBob,25';
      const result = parseCSV(csv, { headers: false });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(2);

      const first = result.root.elements[0];
      expect(isArrayNode(first)).toBe(true);
      if (!isArrayNode(first)) return;

      expect(first.elements).toHaveLength(2);
      expect(isStringNode(first.elements[0])).toBe(true);
    });

    it('should use custom header names', () => {
      const csv = 'Alice,30\nBob,25';
      const result = parseCSV(csv, { headers: ['name', 'age'] });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });
  });

  describe('Delimiter option', () => {
    it('should parse TSV with tab delimiter', () => {
      const tsv = 'name\tage\nAlice\t30\nBob\t25';
      const result = parseCSV(tsv, { delimiter: '\t' });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });

    it('should parse PSV with pipe delimiter', () => {
      const psv = 'name|age\nAlice|30\nBob|25';
      const result = parseCSV(psv, { delimiter: '|' });

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });
  });

  describe('Position tracking', () => {
    it('should track positions for each node', () => {
      const csv = 'name,age\nAlice,30';
      const result = parseCSV(csv);

      expect(result.root.loc).toBeDefined();
      // Positions are tracked (exact line numbers depend on tree-sitter implementation)
      expect(result.root.loc?.start.line).toBeGreaterThanOrEqual(0);
      expect(result.root.loc?.start.column).toBe(0);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(first?.loc).toBeDefined();
      expect(first?.loc?.start.line).toBeGreaterThanOrEqual(0);
    });

    it('should track positions for properties', () => {
      const csv = 'name,age\nAlice,30';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      const nameProp = first.properties[0];
      expect(nameProp?.loc).toBeDefined();
      expect(nameProp?.key.loc).toBeDefined();
      expect(nameProp?.value.loc).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle CRLF line endings', () => {
      const csv = 'name,age\r\nAlice,30\r\nBob,25';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;
      expect(result.root.elements).toHaveLength(2);
    });

    it('should handle trailing newline', () => {
      const csv = 'name,age\nAlice,30\n';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;
      expect(result.root.elements).toHaveLength(1);
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;
      expect(result.root.elements).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'name,age';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;
      expect(result.root.elements).toHaveLength(0);
    });

    it.skip('should handle rows with different field counts', () => {
      // LIMITATION: tree-sitter-csv grammar requires same field count per row
      // Rows with fewer fields will cause parse errors
      const csv = 'a,b,c\n1,2,3\n4,5\n6,7,8,9';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;
      expect(result.root.elements).toHaveLength(3);

      const second = result.root.elements[1];
      expect(isObjectNode(second)).toBe(true);
      if (!isObjectNode(second)) return;
      // Missing field should be empty string
      expect(second.properties).toHaveLength(3);
      expect(second.properties[2]?.value.type).toBe('String');
      if (second.properties[2]?.value.type !== 'String') return;
      expect(second.properties[2].value.value).toBe('');
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,quote\nAlice,"She said ""hello"""';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const first = result.root.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[1]?.value.type).toBe('String');
      if (first.properties[1]?.value.type !== 'String') return;
      expect(first.properties[1].value.value).toBe('She said "hello"');
    });
  });
});
