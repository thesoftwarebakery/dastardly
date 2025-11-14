/**
 * RFC 4180 Compliance Tests: Spaces in Unquoted Fields
 *
 * RFC 4180 Section 2.4 states:
 * "Spaces are considered part of a field and should not be ignored."
 *
 * The ABNF grammar defines:
 * non-escaped = *TEXTDATA
 * TEXTDATA = %x20-21 / %x23-2B / %x2D-7E
 *
 * %x20 is the space character, so spaces ARE allowed in unquoted fields.
 *
 * These tests verify that the parser correctly handles spaces in unquoted
 * fields per RFC 4180 specification.
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src/index.js';
import { isArrayNode, isObjectNode, isStringNode } from '@bakes/dastardly-core';
import { fixtures } from '../benchmarks/fixtures.js';

describe('RFC 4180: Spaces in Unquoted Fields', () => {
  describe('Internal spaces', () => {
    it('should parse unquoted fields with internal spaces', () => {
      const csv = 'name,age\nAlice Smith,30';
      const doc = parse(csv);

      expect(doc.type).toBe('Document');
      expect(isArrayNode(doc.body)).toBe(true);

      if (isArrayNode(doc.body)) {
        expect(doc.body.elements).toHaveLength(1);
        const row = doc.body.elements[0];

        expect(isObjectNode(row)).toBe(true);
        if (isObjectNode(row)) {
          const nameValue = row.properties[0]?.value;
          expect(isStringNode(nameValue)).toBe(true);
          if (isStringNode(nameValue)) {
            expect(nameValue.value).toBe('Alice Smith'); // Space should be preserved
          }
        }
      }
    });

    it('should parse multiple unquoted fields with spaces', () => {
      const csv = 'first,last,title\nJohn Doe,Software Engineer,Senior Developer';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const row = doc.body.elements[0];
        if (isObjectNode(row)) {
          const props = row.properties;

          const lastName = props[1]?.value;
          expect(isStringNode(lastName)).toBe(true);
          if (isStringNode(lastName)) {
            expect(lastName.value).toBe('Software Engineer');
          }

          const title = props[2]?.value;
          expect(isStringNode(title)).toBe(true);
          if (isStringNode(title)) {
            expect(title.value).toBe('Senior Developer');
          }
        }
      }
    });

    it('should parse fields with multiple consecutive spaces', () => {
      const csv = 'text\nHello   World';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const row = doc.body.elements[0];
        if (isObjectNode(row)) {
          const textValue = row.properties[0]?.value;
          expect(isStringNode(textValue)).toBe(true);
          if (isStringNode(textValue)) {
            expect(textValue.value).toBe('Hello   World'); // All spaces preserved
          }
        }
      }
    });
  });

  describe('Leading and trailing spaces', () => {
    it('should preserve leading spaces in unquoted fields', () => {
      const csv = 'text\n  leading';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const row = doc.body.elements[0];
        if (isObjectNode(row)) {
          const textValue = row.properties[0]?.value;
          expect(isStringNode(textValue)).toBe(true);
          if (isStringNode(textValue)) {
            expect(textValue.value).toBe('  leading');
          }
        }
      }
    });

    it('should preserve trailing spaces in unquoted fields', () => {
      const csv = 'text\ntrailing  ';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const row = doc.body.elements[0];
        if (isObjectNode(row)) {
          const textValue = row.properties[0]?.value;
          expect(isStringNode(textValue)).toBe(true);
          if (isStringNode(textValue)) {
            expect(textValue.value).toBe('trailing  ');
          }
        }
      }
    });

    it('should preserve both leading and trailing spaces', () => {
      const csv = 'text\n  both  ';
      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const row = doc.body.elements[0];
        if (isObjectNode(row)) {
          const textValue = row.properties[0]?.value;
          expect(isStringNode(textValue)).toBe(true);
          if (isStringNode(textValue)) {
            expect(textValue.value).toBe('  both  ');
          }
        }
      }
    });
  });

  describe('Real-world examples', () => {
    it('should parse employee data with spaces in names', () => {
      const csv = `id,name,email,department,salary
1,Employee 1,emp1@example.com,Dept2,51000
2,Employee 2,emp2@example.com,Dept3,52000`;

      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        expect(doc.body.elements).toHaveLength(2);

        const firstRow = doc.body.elements[0];
        if (isObjectNode(firstRow)) {
          const nameValue = firstRow.properties[1]?.value;
          expect(isStringNode(nameValue)).toBe(true);
          if (isStringNode(nameValue)) {
            expect(nameValue.value).toBe('Employee 1');
          }
        }
      }
    });

    it('should parse product data with spaces in descriptions', () => {
      const csv = `sku,name,description
SKU001,Widget A,High quality widget
SKU002,Widget B,Premium widget model`;

      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        const firstRow = doc.body.elements[0];
        if (isObjectNode(firstRow)) {
          const descValue = firstRow.properties[2]?.value;
          expect(isStringNode(descValue)).toBe(true);
          if (isStringNode(descValue)) {
            expect(descValue.value).toBe('High quality widget');
          }
        }
      }
    });
  });

  describe('Benchmark fixture compatibility', () => {
    it('should parse all benchmark fixtures without errors', () => {
      // These currently fail because fixtures contain unquoted spaces
      // After grammar fix, all should parse successfully
      for (const fixture of fixtures) {
        expect(() => {
          parse(fixture.csv, { inferTypes: false });
        }, `Failed to parse fixture: ${fixture.name}`).not.toThrow();
      }
    });

    it('should correctly parse the small fixture with employee names', () => {
      const smallFixture = fixtures.find(f => f.name === 'small');
      expect(smallFixture).toBeDefined();

      if (smallFixture) {
        const doc = parse(smallFixture.csv, { inferTypes: false });

        expect(isArrayNode(doc.body)).toBe(true);
        if (isArrayNode(doc.body)) {
          // Should have 50 employee rows
          expect(doc.body.elements.length).toBeGreaterThan(0);

          const firstRow = doc.body.elements[0];
          if (isObjectNode(firstRow)) {
            const nameValue = firstRow.properties[1]?.value;
            expect(isStringNode(nameValue)).toBe(true);
            if (isStringNode(nameValue)) {
              expect(nameValue.value).toBe('Employee 1');
            }
          }
        }
      }
    });
  });

  describe('Mixed quoted and unquoted fields with spaces', () => {
    it('should handle mix of quoted and unquoted fields with spaces', () => {
      const csv = 'name,title,company\nAlice Smith,"Senior Engineer","Tech Corp"\nBob Jones,Software Developer,StartUp Inc';

      const doc = parse(csv);

      expect(isArrayNode(doc.body)).toBe(true);
      if (isArrayNode(doc.body)) {
        expect(doc.body.elements).toHaveLength(2);

        // First row: quoted fields
        const firstRow = doc.body.elements[0];
        if (isObjectNode(firstRow)) {
          const name1 = firstRow.properties[0]?.value;
          expect(isStringNode(name1)).toBe(true);
          if (isStringNode(name1)) {
            expect(name1.value).toBe('Alice Smith'); // Unquoted with space
          }
        }

        // Second row: unquoted fields with spaces
        const secondRow = doc.body.elements[1];
        if (isObjectNode(secondRow)) {
          const name2 = secondRow.properties[0]?.value;
          const title2 = secondRow.properties[1]?.value;
          const company2 = secondRow.properties[2]?.value;

          expect(isStringNode(name2)).toBe(true);
          expect(isStringNode(title2)).toBe(true);
          expect(isStringNode(company2)).toBe(true);

          if (isStringNode(name2) && isStringNode(title2) && isStringNode(company2)) {
            expect(name2.value).toBe('Bob Jones');
            expect(title2.value).toBe('Software Developer');
            expect(company2.value).toBe('StartUp Inc');
          }
        }
      }
    });
  });
});
