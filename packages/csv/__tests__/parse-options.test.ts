import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';
import { isArrayNode, isObjectNode, isNumberNode, isBooleanNode } from '@bakes/dastardly-core';

describe('CSV parse() with options', () => {
  describe('inferTypes option', () => {
    it('should infer number types when inferTypes is true', () => {
      const csv = 'name,age,score\nAlice,30,95.5';
      const doc = parse(csv, { inferTypes: true });

      expect(doc.type).toBe('Document');
      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      // Age should be number
      const ageProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'age');
      expect(ageProp?.value.type).toBe('Number');
      if (ageProp?.value.type === 'Number') {
        expect(ageProp.value.value).toBe(30);
      }

      // Score should be number
      const scoreProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'score');
      expect(scoreProp?.value.type).toBe('Number');
      if (scoreProp?.value.type === 'Number') {
        expect(scoreProp.value.value).toBe(95.5);
      }
    });

    it('should keep values as strings when inferTypes is false or undefined', () => {
      const csv = 'name,age\nAlice,30';

      // Default (inferTypes not specified)
      const doc1 = parse(csv);
      expect(isArrayNode(doc1.body)).toBe(true);
      if (!isArrayNode(doc1.body)) return;
      const first1 = doc1.body.elements[0];
      expect(isObjectNode(first1)).toBe(true);
      if (!isObjectNode(first1)) return;
      const ageProp1 = first1.properties.find(p => p.key.type === 'String' && p.key.value === 'age');
      expect(ageProp1?.value.type).toBe('String');

      // Explicit false
      const doc2 = parse(csv, { inferTypes: false });
      expect(isArrayNode(doc2.body)).toBe(true);
      if (!isArrayNode(doc2.body)) return;
      const first2 = doc2.body.elements[0];
      expect(isObjectNode(first2)).toBe(true);
      if (!isObjectNode(first2)) return;
      const ageProp2 = first2.properties.find(p => p.key.type === 'String' && p.key.value === 'age');
      expect(ageProp2?.value.type).toBe('String');
    });

    it('should infer boolean types when inferTypes is true', () => {
      const csv = 'name,active\nAlice,true\nBob,false';
      const doc = parse(csv, { inferTypes: true });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      const activeProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'active');
      expect(activeProp?.value.type).toBe('Boolean');
      if (activeProp?.value.type === 'Boolean') {
        expect(activeProp.value.value).toBe(true);
      }
    });

    it('should infer null when inferTypes is true', () => {
      const csv = 'name,value\nAlice,null';
      const doc = parse(csv, { inferTypes: true });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      const valueProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'value');
      expect(valueProp?.value.type).toBe('Null');
    });
  });

  describe('delimiter option', () => {
    it('should parse TSV with tab delimiter', () => {
      const tsv = 'name\tage\nAlice\t30';
      const doc = parse(tsv, { delimiter: '\t' });

      expect(doc.type).toBe('Document');
      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties).toHaveLength(2);
      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });

    it('should parse PSV with pipe delimiter', () => {
      const psv = 'name|age\nAlice|30';
      const doc = parse(psv, { delimiter: '|' });

      expect(doc.type).toBe('Document');
      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties).toHaveLength(2);
      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });
  });

  describe('headers option', () => {
    it('should parse with headers by default', () => {
      const csv = 'name,age\nAlice,30';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[0]?.key.value).toBe('name');
    });

    it('should parse as array of arrays when headers is false', () => {
      const csv = 'Alice,30\nBob,25';
      const doc = parse(csv, { headers: false });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isArrayNode(first)).toBe(true);
      if (!isArrayNode(first)) return;

      expect(first.elements).toHaveLength(2);
      expect(first.elements[0]?.type).toBe('String');
    });

    it('should use custom headers when provided as array', () => {
      const csv = 'Alice,30\nBob,25';
      const doc = parse(csv, { headers: ['name', 'age'] });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      expect(first.properties[0]?.key.value).toBe('name');
      expect(first.properties[1]?.key.value).toBe('age');
    });
  });

  describe('combined options', () => {
    it('should handle delimiter + inferTypes together', () => {
      const tsv = 'name\tage\nAlice\t30';
      const doc = parse(tsv, { delimiter: '\t', inferTypes: true });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      const ageProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'age');
      expect(ageProp?.value.type).toBe('Number');
    });

    it('should handle headers + inferTypes together', () => {
      const csv = 'Alice,30,true';
      const doc = parse(csv, { headers: ['name', 'age', 'active'], inferTypes: true });

      expect(isArrayNode(doc.body)).toBe(true);
      if (!isArrayNode(doc.body)) return;

      const first = doc.body.elements[0];
      expect(isObjectNode(first)).toBe(true);
      if (!isObjectNode(first)) return;

      const ageProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'age');
      expect(ageProp?.value.type).toBe('Number');

      const activeProp = first.properties.find(p => p.key.type === 'String' && p.key.value === 'active');
      expect(activeProp?.value.type).toBe('Boolean');
    });
  });
});
