import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer.js';
import { parseCSV } from '../src/parser.js';
import { arrayNode, objectNode, propertyNode, stringNode, numberNode, booleanNode } from '@dastardly/core';

describe('CSV Serializer Edge Cases (from integration tests)', () => {
  describe('Field quoting', () => {
    it('should quote fields containing spaces', () => {
      // Creating AST for: name,age\nAlice Smith,30
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice Smith')),
          propertyNode(stringNode('age'), numberNode(30)),
        ]),
      ]);

      const csv = serialize(ast, {});

      // Should quote "Alice Smith" because it contains a space
      expect(csv).toContain('"Alice Smith"');

      // Verify it roundtrips correctly
      const reparsed = parseCSV(csv);
      expect(reparsed.root.type).toBe('Array');
    });

    it('should quote fields containing commas', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('description'), stringNode('Field with, comma')),
        ]),
      ]);

      const csv = serialize(ast, {});

      expect(csv).toContain('"Field with, comma"');

      const reparsed = parseCSV(csv);
      expect(reparsed.root.type).toBe('Array');
    });

    it('should quote fields containing quotes (with proper escaping)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('Field with "quotes"')),
        ]),
      ]);

      const csv = serialize(ast, {});

      // Should use "" to escape quotes
      expect(csv).toContain('""quotes""');

      const reparsed = parseCSV(csv);
      expect(reparsed.root.type).toBe('Array');
    });

    it('should quote fields containing newlines', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('Line 1\nLine 2')),
        ]),
      ]);

      const csv = serialize(ast, {});

      expect(csv).toContain('"Line 1\nLine 2"');

      const reparsed = parseCSV(csv);
      expect(reparsed.root.type).toBe('Array');
    });

    it('should not quote simple fields unnecessarily', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(stringNode('age'), numberNode(30)),
        ]),
      ]);

      const csv = serialize(ast, {});

      // Simple strings and numbers shouldn't be quoted by default
      expect(csv).not.toContain('"Alice"');
      expect(csv).not.toContain('"30"');
    });
  });

  describe('Quote strategy options', () => {
    it('should support quoteStrategy: "all"', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(stringNode('age'), numberNode(30)),
        ]),
      ]);

      const csv = serialize(ast, { quoteStrategy: 'all' });

      // All fields should be quoted
      expect(csv).toContain('"name"');
      expect(csv).toContain('"age"');
      expect(csv).toContain('"Alice"');
      expect(csv).toContain('"30"');
    });

    it('should support quoteStrategy: "needed"', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('simple'), stringNode('Alice')),
          propertyNode(stringNode('spaced'), stringNode('Bob Smith')),
        ]),
      ]);

      const csv = serialize(ast, { quoteStrategy: 'needed' });

      // Only quote when needed
      expect(csv).not.toContain('"Alice"');
      expect(csv).toContain('"Bob Smith"');
    });

    it('should support quoteStrategy: "nonnumeric"', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('Alice')),
          propertyNode(stringNode('number'), numberNode(30)),
        ]),
      ]);

      const csv = serialize(ast, { quoteStrategy: 'nonnumeric' });

      // Quote non-numeric fields
      expect(csv).toContain('"Alice"');
      expect(csv).not.toContain('"30"');
    });

    it('should support quoteStrategy: "none" (for simple data)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(stringNode('age'), numberNode(30)),
        ]),
      ]);

      const csv = serialize(ast, { quoteStrategy: 'none' });

      // No quotes
      expect(csv).not.toContain('"');
    });
  });

  describe('Line ending options', () => {
    it('should support lineEnding: "LF" (default)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('1')),
        ]),
        objectNode([
          propertyNode(stringNode('a'), stringNode('2')),
        ]),
      ]);

      const csv = serialize(ast, { lineEnding: 'LF' });

      expect(csv).toContain('\n');
      expect(csv).not.toContain('\r\n');
    });

    it('should support lineEnding: "CRLF"', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('1')),
        ]),
        objectNode([
          propertyNode(stringNode('a'), stringNode('2')),
        ]),
      ]);

      const csv = serialize(ast, { lineEnding: 'CRLF' });

      expect(csv).toContain('\r\n');
    });
  });

  describe('Header options', () => {
    it('should include headers by default', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
        ]),
      ]);

      const csv = serialize(ast, {});

      expect(csv).toContain('name\n');
    });

    it('should support includeHeaders: false', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
        ]),
      ]);

      const csv = serialize(ast, { includeHeaders: false });

      expect(csv).not.toContain('name');
      expect(csv).toContain('Alice');
    });

    it('should support includeHeaders: true (explicit)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
        ]),
      ]);

      const csv = serialize(ast, { includeHeaders: true });

      expect(csv).toContain('name\n');
      expect(csv).toContain('Alice');
    });
  });

  describe('Delimiter options', () => {
    it('should support TSV delimiter (tab)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('1')),
          propertyNode(stringNode('b'), stringNode('2')),
        ]),
      ]);

      const csv = serialize(ast, { delimiter: '\t' });

      expect(csv).toContain('\t');
      expect(csv).not.toContain(',');
    });

    it('should support PSV delimiter (pipe)', () => {
      const ast = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('1')),
          propertyNode(stringNode('b'), stringNode('2')),
        ]),
      ]);

      const csv = serialize(ast, { delimiter: '|' });

      expect(csv).toContain('|');
      expect(csv).not.toContain(',');
    });
  });

  describe('Type inference on parse (for roundtrip testing)', () => {
    it('should infer number types when inferTypes is true', () => {
      const csvSource = 'integer,float,negative,zero\n42,3.14,-10,0';
      const result = parseCSV(csvSource, { inferTypes: true });

      expect(result.root.type).toBe('Array');
      if (result.root.type !== 'Array') return;

      const row = result.root.elements[0];
      expect(row?.type).toBe('Object');
      if (row?.type !== 'Object') return;

      const integerProp = row.properties.find(p => p.key.type === 'String' && p.key.value === 'integer');
      expect(integerProp?.value.type).toBe('Number');
      if (integerProp?.value.type === 'Number') {
        expect(integerProp.value.value).toBe(42);
      }

      const floatProp = row.properties.find(p => p.key.type === 'String' && p.key.value === 'float');
      expect(floatProp?.value.type).toBe('Number');
      if (floatProp?.value.type === 'Number') {
        expect(floatProp.value.value).toBe(3.14);
      }
    });

    it('should infer boolean types when inferTypes is true', () => {
      const csvSource = 'flag1,flag2\ntrue,false';
      const result = parseCSV(csvSource, { inferTypes: true });

      expect(result.root.type).toBe('Array');
      if (result.root.type !== 'Array') return;

      const row = result.root.elements[0];
      expect(row?.type).toBe('Object');
      if (row?.type !== 'Object') return;

      const flag1Prop = row.properties.find(p => p.key.type === 'String' && p.key.value === 'flag1');
      expect(flag1Prop?.value.type).toBe('Boolean');
      if (flag1Prop?.value.type === 'Boolean') {
        expect(flag1Prop.value.value).toBe(true);
      }
    });

    it('should keep strings as strings when inferTypes is true', () => {
      const csvSource = 'text\nhello';
      const result = parseCSV(csvSource, { inferTypes: true });

      expect(result.root.type).toBe('Array');
      if (result.root.type !== 'Array') return;

      const row = result.root.elements[0];
      expect(row?.type).toBe('Object');
      if (row?.type !== 'Object') return;

      const textProp = row.properties.find(p => p.key.type === 'String' && p.key.value === 'text');
      expect(textProp?.value.type).toBe('String');
      if (textProp?.value.type === 'String') {
        expect(textProp.value.value).toBe('hello');
      }
    });

    it('should not infer types when inferTypes is false (default)', () => {
      const csvSource = 'number,bool\n42,true';
      const result = parseCSV(csvSource, { inferTypes: false });

      expect(result.root.type).toBe('Array');
      if (result.root.type !== 'Array') return;

      const row = result.root.elements[0];
      expect(row?.type).toBe('Object');
      if (row?.type !== 'Object') return;

      // All should be strings
      for (const prop of row.properties) {
        expect(prop.value.type).toBe('String');
      }
    });
  });
});
