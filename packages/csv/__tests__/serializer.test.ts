import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer.js';
import { arrayNode, objectNode, stringNode, numberNode, booleanNode, nullNode, propertyNode } from '@bakes/dastardly-core';

describe('CSV Serializer', () => {
  describe('Basic serialization', () => {
    it('should serialize array of objects to CSV with headers', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(stringNode('age'), numberNode(30)),
        ]),
        objectNode([
          propertyNode(stringNode('name'), stringNode('Bob')),
          propertyNode(stringNode('age'), numberNode(25)),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('name,age\nAlice,30\nBob,25');
    });

    it('should serialize array of arrays to CSV without headers', () => {
      const data = arrayNode([
        arrayNode([stringNode('Alice'), numberNode(30)]),
        arrayNode([stringNode('Bob'), numberNode(25)]),
      ]);

      const result = serialize(data, { includeHeaders: false });
      expect(result).toBe('Alice,30\nBob,25');
    });

    it('should handle empty array', () => {
      const data = arrayNode([]);
      const result = serialize(data);
      expect(result).toBe('');
    });

    it('should serialize different value types', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('str'), stringNode('text')),
          propertyNode(stringNode('num'), numberNode(42)),
          propertyNode(stringNode('bool'), booleanNode(true)),
          propertyNode(stringNode('null'), nullNode()),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('str,num,bool,null\ntext,42,true,');
    });
  });

  describe('Quote handling', () => {
    it('should quote fields containing delimiter', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('Hello, world')),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('text\n"Hello, world"');
    });

    it('should quote fields containing newlines', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('Line 1\nLine 2')),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('text\n"Line 1\nLine 2"');
    });

    it('should escape quotes in quoted fields', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('She said "hello"')),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('text\n"She said ""hello"""');
    });

    it('should support quoting=all strategy', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('simple')),
          propertyNode(stringNode('b'), numberNode(123)),
        ]),
      ]);

      const result = serialize(data, { quoteStrategy: 'all' });
      expect(result).toBe('"a","b"\n"simple","123"');
    });

    it('should support quoting=nonnumeric strategy', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('text')),
          propertyNode(stringNode('b'), numberNode(123)),
        ]),
      ]);

      const result = serialize(data, { quoteStrategy: 'nonnumeric' });
      expect(result).toBe('"a","b"\n"text",123');
    });

    it('should support quoting=none strategy', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('simple')),
        ]),
      ]);

      const result = serialize(data, { quoteStrategy: 'none' });
      expect(result).toBe('a\nsimple');
    });
  });

  describe('Delimiter options', () => {
    it('should use tab delimiter for TSV', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('one')),
          propertyNode(stringNode('b'), stringNode('two')),
        ]),
      ]);

      const result = serialize(data, { delimiter: '\t' });
      expect(result).toBe('a\tb\none\ttwo');
    });

    it('should use pipe delimiter for PSV', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('one')),
          propertyNode(stringNode('b'), stringNode('two')),
        ]),
      ]);

      const result = serialize(data, { delimiter: '|' });
      expect(result).toBe('a|b\none|two');
    });

    it('should quote fields containing custom delimiter', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('a|b')),
        ]),
      ]);

      const result = serialize(data, { delimiter: '|' });
      expect(result).toBe('text\n"a|b"');
    });
  });

  describe('Line ending options', () => {
    it('should use CRLF line endings when specified', () => {
      const data = arrayNode([
        objectNode([propertyNode(stringNode('a'), stringNode('1'))]),
        objectNode([propertyNode(stringNode('a'), stringNode('2'))]),
      ]);

      const result = serialize(data, { lineEnding: 'crlf' });
      expect(result).toBe('a\r\n1\r\n2');
    });

    it('should use LF line endings by default', () => {
      const data = arrayNode([
        objectNode([propertyNode(stringNode('a'), stringNode('1'))]),
        objectNode([propertyNode(stringNode('a'), stringNode('2'))]),
      ]);

      const result = serialize(data, { lineEnding: 'lf' });
      expect(result).toBe('a\n1\n2');
    });
  });

  describe('Header options', () => {
    it('should use custom headers when provided', () => {
      const data = arrayNode([
        arrayNode([stringNode('Alice'), numberNode(30)]),
        arrayNode([stringNode('Bob'), numberNode(25)]),
      ]);

      const result = serialize(data, { includeHeaders: ['Name', 'Age'] });
      expect(result).toBe('Name,Age\nAlice,30\nBob,25');
    });

    it('should extract headers from object keys', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('firstName'), stringNode('Alice')),
          propertyNode(stringNode('lastName'), stringNode('Smith')),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('firstName,lastName\nAlice,Smith');
    });

    it('should handle inconsistent keys across objects', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('1')),
          propertyNode(stringNode('b'), stringNode('2')),
        ]),
        objectNode([
          propertyNode(stringNode('a'), stringNode('3')),
          propertyNode(stringNode('c'), stringNode('4')),
        ]),
      ]);

      // Should use union of all keys, missing values become empty
      const result = serialize(data);
      expect(result).toBe('a,b,c\n1,2,\n3,,4');
    });
  });

  describe('Nested structure handling', () => {
    it('should error on nested objects by default', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(
            stringNode('address'),
            objectNode([propertyNode(stringNode('city'), stringNode('NYC'))]),
          ),
        ]),
      ]);

      expect(() => serialize(data)).toThrow('Cannot serialize nested object');
    });

    it('should error on nested arrays by default', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(stringNode('tags'), arrayNode([stringNode('a'), stringNode('b')])),
        ]),
      ]);

      expect(() => serialize(data)).toThrow('Cannot serialize nested array');
    });

    it('should JSON stringify nested structures when nestHandling=json', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(
            stringNode('address'),
            objectNode([propertyNode(stringNode('city'), stringNode('NYC'))]),
          ),
        ]),
      ]);

      const result = serialize(data, { nestHandling: 'json' });
      expect(result).toBe('name,address\nAlice,"{""city"":""NYC""}"');
    });

    it('should flatten nested objects when nestHandling=flatten', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('name'), stringNode('Alice')),
          propertyNode(
            stringNode('address'),
            objectNode([
              propertyNode(stringNode('city'), stringNode('NYC')),
              propertyNode(stringNode('zip'), stringNode('10001')),
            ]),
          ),
        ]),
      ]);

      const result = serialize(data, { nestHandling: 'flatten' });
      expect(result).toBe('name,address.city,address.zip\nAlice,NYC,10001');
    });
  });

  describe('Edge cases', () => {
    it('should handle single object wrapped in array', () => {
      const data = arrayNode([
        objectNode([propertyNode(stringNode('a'), stringNode('1'))]),
      ]);

      const result = serialize(data);
      expect(result).toBe('a\n1');
    });

    it('should handle objects with no properties', () => {
      const data = arrayNode([objectNode([]), objectNode([])]);

      const result = serialize(data);
      expect(result).toBe('');
    });

    it('should handle trailing/leading whitespace', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('text'), stringNode('  spaces  ')),
        ]),
      ]);

      const result = serialize(data);
      // Fields with spaces must be quoted for RFC 4180 compliance
      expect(result).toBe('text\n"  spaces  "');
    });

    it('should convert numbers to strings', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('int'), numberNode(42)),
          propertyNode(stringNode('float'), numberNode(3.14)),
          propertyNode(stringNode('negative'), numberNode(-10)),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('int,float,negative\n42,3.14,-10');
    });

    it('should handle null values', () => {
      const data = arrayNode([
        objectNode([
          propertyNode(stringNode('a'), stringNode('text')),
          propertyNode(stringNode('b'), nullNode()),
        ]),
      ]);

      const result = serialize(data);
      expect(result).toBe('a,b\ntext,');
    });
  });
});
