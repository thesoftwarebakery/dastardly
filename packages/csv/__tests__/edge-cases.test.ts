import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/parser.js';
import { isArrayNode, isObjectNode } from '@bakes/dastardly-core';

describe('CSV Edge Cases (from integration tests)', () => {
  describe('Trailing empty fields', () => {
    it('should handle trailing comma with empty field', () => {
      // Pattern: field,field,<empty>
      const csv = 'a,b,c\n1,2,';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      expect(row.properties).toHaveLength(3);
      expect(row.properties[2]?.value.type).toBe('String');
      if (row.properties[2]?.value.type !== 'String') return;
      expect(row.properties[2].value.value).toBe('');
    });

    it('should handle multiple trailing empty fields', () => {
      // Pattern: field,<empty>,<empty>
      const csv = 'a,b,c,d\n1,2,,';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      expect(row.properties).toHaveLength(4);
      expect(row.properties[2]?.value.type).toBe('String');
      expect(row.properties[3]?.value.type).toBe('String');
      if (row.properties[2]?.value.type !== 'String') return;
      if (row.properties[3]?.value.type !== 'String') return;
      expect(row.properties[2].value.value).toBe('');
      expect(row.properties[3].value.value).toBe('');
    });

    it('should handle all empty fields in a row', () => {
      // Pattern: <empty>,<empty>,<empty>
      const csv = 'a,b,c\n,,';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      expect(row.properties).toHaveLength(3);
      for (const prop of row.properties) {
        expect(prop.value.type).toBe('String');
        if (prop.value.type === 'String') {
          expect(prop.value.value).toBe('');
        }
      }
    });
  });

  describe('Leading empty fields', () => {
    it('should handle leading empty field', () => {
      // Pattern: <empty>,field,field
      const csv = 'a,b,c\n,2,3';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      expect(row.properties).toHaveLength(3);
      expect(row.properties[0]?.value.type).toBe('String');
      if (row.properties[0]?.value.type !== 'String') return;
      expect(row.properties[0].value.value).toBe('');
    });

    it('should handle leading empty fields in all rows', () => {
      const csv = 'a,b,c\n,2,3\n,5,6';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(2);
      for (const row of result.root.elements) {
        expect(isObjectNode(row)).toBe(true);
        if (!isObjectNode(row)) continue;
        expect(row.properties[0]?.value.type).toBe('String');
        if (row.properties[0]?.value.type === 'String') {
          expect(row.properties[0].value.value).toBe('');
        }
      }
    });
  });

  describe('Date-like values', () => {
    it('should parse ISO date strings as text', () => {
      const csv = 'date,value\n2024-01-01,100';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      // Date should be parsed as text, not as a number minus another number
      const dateField = row.properties.find(p => p.key.type === 'String' && p.key.value === 'date');
      expect(dateField?.value.type).toBe('String');
      if (dateField?.value.type === 'String') {
        expect(dateField.value.value).toBe('2024-01-01');
      }
    });

    it('should handle multiple date fields', () => {
      const csv = 'start,end,duration\n2024-01-01,2024-12-31,365';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      const startField = row.properties.find(p => p.key.type === 'String' && p.key.value === 'start');
      const endField = row.properties.find(p => p.key.type === 'String' && p.key.value === 'end');

      expect(startField?.value.type).toBe('String');
      expect(endField?.value.type).toBe('String');
    });
  });

  describe('Quoted fields with special characters', () => {
    it('should handle newlines within quoted fields', () => {
      const csv = 'id,text\n1,"line1\nline2"';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      const textField = row.properties.find(p => p.key.type === 'String' && p.key.value === 'text');
      expect(textField?.value.type).toBe('String');
      if (textField?.value.type === 'String') {
        expect(textField.value.value).toContain('\n');
        expect(textField.value.value).toBe('line1\nline2');
      }
    });

    it('should handle multiple newlines and quotes', () => {
      const csv = 'id,description\n1,"Mixed: comma, ""quotes"", and\nnewline"';
      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      const row = result.root.elements[0];
      expect(isObjectNode(row)).toBe(true);
      if (!isObjectNode(row)) return;

      const descField = row.properties.find(p => p.key.type === 'String' && p.key.value === 'description');
      expect(descField?.value.type).toBe('String');
      if (descField?.value.type === 'String') {
        expect(descField.value.value).toContain(',');
        expect(descField.value.value).toContain('"');
        expect(descField.value.value).toContain('\n');
      }
    });
  });

  describe('Complex real-world patterns', () => {
    it('should handle employee data with dates and quoted names', () => {
      const csv = `id,name,department,salary,start_date
1,"Alice Smith",Engineering,100000,2020-01-15
2,"Bob Jones",Marketing,85000,2019-06-01`;

      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(2);

      const row1 = result.root.elements[0];
      expect(isObjectNode(row1)).toBe(true);
      if (!isObjectNode(row1)) return;

      expect(row1.properties).toHaveLength(5);

      const nameField = row1.properties.find(p => p.key.type === 'String' && p.key.value === 'name');
      expect(nameField?.value.type).toBe('String');
      if (nameField?.value.type === 'String') {
        expect(nameField.value.value).toBe('Alice Smith');
      }

      const dateField = row1.properties.find(p => p.key.type === 'String' && p.key.value === 'start_date');
      expect(dateField?.value.type).toBe('String');
      if (dateField?.value.type === 'String') {
        expect(dateField.value.value).toBe('2020-01-15');
      }
    });

    it('should handle sales data with dates as first column', () => {
      const csv = `date,product,quantity,revenue,region
2024-01-01,Widget,10,199.90,North
2024-01-02,Gadget,5,149.95,South`;

      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(2);

      const row1 = result.root.elements[0];
      expect(isObjectNode(row1)).toBe(true);
      if (!isObjectNode(row1)) return;

      const dateField = row1.properties.find(p => p.key.type === 'String' && p.key.value === 'date');
      expect(dateField?.value.type).toBe('String');
      if (dateField?.value.type === 'String') {
        expect(dateField.value.value).toBe('2024-01-01');
      }
    });

    it('should handle mixed empty and trailing fields', () => {
      const csv = `id,name,email,phone
1,Alice,alice@example.com,555-0001
2,,bob@example.com,
3,Carol,,555-0003`;

      const result = parseCSV(csv);

      expect(isArrayNode(result.root)).toBe(true);
      if (!isArrayNode(result.root)) return;

      expect(result.root.elements).toHaveLength(3);

      // Row 2: empty name, trailing empty phone
      const row2 = result.root.elements[1];
      expect(isObjectNode(row2)).toBe(true);
      if (!isObjectNode(row2)) return;

      const nameField = row2.properties.find(p => p.key.type === 'String' && p.key.value === 'name');
      expect(nameField?.value.type).toBe('String');
      if (nameField?.value.type === 'String') {
        expect(nameField.value.value).toBe('');
      }

      const phoneField = row2.properties.find(p => p.key.type === 'String' && p.key.value === 'phone');
      expect(phoneField?.value.type).toBe('String');
      if (phoneField?.value.type === 'String') {
        expect(phoneField.value.value).toBe('');
      }
    });
  });
});
