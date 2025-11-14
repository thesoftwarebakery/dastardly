import { describe, it, expect } from 'vitest';
import { Validator } from '../src/validator.js';
import {
  position,
  sourceLocation,
  stringNode,
  numberNode,
  booleanNode,
  nullNode,
  propertyNode,
  objectNode,
  arrayNode,
  documentNode,
} from '@bakes/dastardly-core';

const loc = sourceLocation(position(1, 0, 0), position(1, 10, 10));

describe('Validator', () => {
  describe('basic type validation', () => {
    it('validates string type', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(stringNode('hello', loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects wrong type for string', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.keyword).toBe('type');
      expect(result.errors[0]?.path).toBe('');
    });

    it('validates number type', () => {
      const schema = { type: 'number' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42.5, loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });

    it('validates integer type', () => {
      const schema = { type: 'integer' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });

    it('rejects float for integer type', () => {
      const schema = { type: 'integer' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42.5, loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.keyword).toBe('type');
    });

    it('validates boolean type', () => {
      const schema = { type: 'boolean' as const };
      const validator = new Validator(schema);

      const doc = documentNode(booleanNode(true, loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });

    it('validates null type', () => {
      const schema = { type: 'null' as const };
      const validator = new Validator(schema);

      const doc = documentNode(nullNode(loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });

    it('validates array type', () => {
      const schema = { type: 'array' as const };
      const validator = new Validator(schema);

      const doc = documentNode(arrayNode([], loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });

    it('validates object type', () => {
      const schema = { type: 'object' as const };
      const validator = new Validator(schema);

      const doc = documentNode(objectNode([], loc), loc);
      const result = validator.validate(doc);

      expect(result.valid).toBe(true);
    });
  });

  describe('multiple types', () => {
    it('validates union types', () => {
      const schema = { type: ['string', 'number'] as const };
      const validator = new Validator(schema);

      const doc1 = documentNode(stringNode('hello', loc), loc);
      expect(validator.validate(doc1).valid).toBe(true);

      const doc2 = documentNode(numberNode(42, loc), loc);
      expect(validator.validate(doc2).valid).toBe(true);

      const doc3 = documentNode(booleanNode(true, loc), loc);
      expect(validator.validate(doc3).valid).toBe(false);
    });
  });

  describe('caching', () => {
    it('caches validation results', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(stringNode('test', loc), loc);

      // First validation
      const result1 = validator.validate(doc);
      expect(result1.valid).toBe(true);

      // Second validation should use cache (same content hash)
      const result2 = validator.validate(doc);
      expect(result2.valid).toBe(true);
      expect(result2).toEqual(result1);
    });

    it('can disable caching', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema, { cache: false });

      const doc = documentNode(stringNode('test', loc), loc);
      const result = validator.validate(doc);
      expect(result.valid).toBe(true);
    });

    it('can clear cache', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(stringNode('test', loc), loc);
      validator.validate(doc);

      validator.clearCache();
      // Validation still works after clearing cache
      const result = validator.validate(doc);
      expect(result.valid).toBe(true);
    });
  });

  describe('error reporting', () => {
    it('includes source location in errors', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.errors[0]?.location).toEqual(loc);
    });

    it('includes JSON pointer path in errors', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.errors[0]?.path).toBe('');
    });

    it('includes schema path in errors', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.errors[0]?.schemaPath).toBe('#/type');
    });

    it('includes error params', () => {
      const schema = { type: 'string' as const };
      const validator = new Validator(schema);

      const doc = documentNode(numberNode(42, loc), loc);
      const result = validator.validate(doc);

      expect(result.errors[0]?.params).toEqual({ type: 'string' });
    });
  });
});
