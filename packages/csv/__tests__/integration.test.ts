import { describe, it, expect } from 'vitest';
import { parse, parseValue, CSVParser, serialize } from '../src/index.js';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import CSV_LANGUAGE from '@dastardly/tree-sitter-csv';

describe('Public API', () => {
  describe('parse()', () => {
    it('parses CSV and returns DocumentNode', () => {
      const doc = parse('name,age\nAlice,30');
      expect(doc.type).toBe('Document');
      expect(doc.body.type).toBe('Array');
    });

    it('throws on invalid CSV', () => {
      // Invalid CSV with syntax error
      expect(() => parse('name,age\n"unclosed quote')).toThrow();
    });
  });

  describe('parseValue()', () => {
    it('parses CSV and returns DataNode', () => {
      const value = parseValue('name,age\nAlice,30');
      expect(value.type).toBe('Array');
    });
  });

  describe('serialize()', () => {
    it('serializes with options', () => {
      const doc = parse('name,age\nAlice,30');
      const csv = serialize(doc, { delimiter: '\t' });
      expect(csv).toBe('name\tage\nAlice\t30');
    });

    it('supports different quoting strategies', () => {
      const doc = parse('text\nhello');
      const csv = serialize(doc, { quoteStrategy: 'all' });
      expect(csv).toBe('"text"\n"hello"');
    });

    it('supports CRLF line endings', () => {
      const doc = parse('a\n1\n2');
      const csv = serialize(doc, { lineEnding: 'crlf' });
      expect(csv).toBe('a\r\n1\r\n2');
    });
  });

  describe('CSVParser', () => {
    it('can be instantiated and reused', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.csv);

      const doc1 = parser.parse('a\n1');
      const doc2 = parser.parse('b\n2');

      expect(doc1.body.type).toBe('Array');
      expect(doc2.body.type).toBe('Array');
    });

    it('supports custom parse options', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.csv, {
        headers: false,
        inferTypes: true,
      });

      const doc = parser.parse('1,2,3');
      expect(doc.body.type).toBe('Array');
    });
  });

  describe('Roundtrip', () => {
    it('parse → serialize → parse produces equivalent AST', () => {
      const original = 'name,age\nAlice,30\nBob,25';
      const doc1 = parse(original);
      const csv = serialize(doc1);
      const doc2 = parse(csv);

      // Should have same structure
      expect(doc1.type).toBe(doc2.type);
      expect(doc1.body.type).toBe(doc2.body.type);
    });

    it('handles quoted fields', () => {
      const original = 'text\n"Hello, world"';
      const doc1 = parse(original);
      const csv = serialize(doc1);
      const doc2 = parse(csv);

      expect(doc2.body.type).toBe('Array');
    });

    it('handles multiline fields', () => {
      const original = 'text\n"Line 1\nLine 2"';
      const doc1 = parse(original);
      const csv = serialize(doc1);
      const doc2 = parse(csv);

      expect(doc2.body.type).toBe('Array');
    });
  });

  describe('Real-world CSV', () => {
    it('parses employee data', () => {
      const csv = `name,department,salary
"Alice Smith",Engineering,100000
"Bob Jones",Marketing,85000
"Carol White",Sales,90000`;

      const doc = parse(csv);
      expect(doc.body).toMatchObject({
        type: 'Array',
      });
      expect(doc.body.elements.length).toBe(3);
    });

    it('parses product catalog', () => {
      const csv = `id,name,price,in_stock
1,Widget,19.99,true
2,Gadget,29.99,false
3,Doohickey,39.99,true`;

      const doc = parse(csv);
      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements.length).toBe(3);
    });

    it('parses TSV (tab-separated)', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.tsv, {
        delimiter: '\t',
      });

      const tsv = 'name\tage\nAlice\t30\nBob\t25';
      const doc = parser.parse(tsv);

      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements.length).toBe(2);
    });

    it('parses PSV (pipe-separated)', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.psv, {
        delimiter: '|',
      });

      const psv = 'name|age\nAlice|30\nBob|25';
      const doc = parser.parse(psv);

      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements.length).toBe(2);
    });

    it('parses data with complex quoted fields', () => {
      const csv = `description,status
"Project ""Alpha"" - Q1 2024",active
"Meeting notes:
- Item 1
- Item 2",complete`;

      const doc = parse(csv);
      expect(doc.body.type).toBe('Array');
      expect(doc.body.elements.length).toBe(2);
    });
  });

  describe('Cross-format scenarios', () => {
    it('serializes nested JSON-like data with json handling', () => {
      const doc = parse('name\nAlice');
      // Normally CSV can't handle nesting, but with json handling it should work
      const csv = serialize(doc, { nestHandling: 'json' });
      expect(csv).toBe('name\nAlice');
    });

    it('serializes with custom headers', () => {
      // Parse without headers to get array-of-arrays structure
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.csv, { headers: false });
      const doc = parser.parse('Alice,30\nBob,25');

      const csv = serialize(doc.body, {
        includeHeaders: ['Name', 'Age'],
      });
      expect(csv).toBe('Name,Age\nAlice,30\nBob,25');
    });

    it('handles data without headers', () => {
      const runtime = new NodeTreeSitterRuntime();
      const parser = new CSVParser(runtime, CSV_LANGUAGE.csv, {
        headers: false,
      });

      const csv = 'Alice,30\nBob,25';
      const doc = parser.parse(csv);

      expect(doc.body.type).toBe('Array');
      // Should be array of arrays without headers
      const firstElement = doc.body.elements[0];
      expect(firstElement?.type).toBe('Array');
    });
  });
});
