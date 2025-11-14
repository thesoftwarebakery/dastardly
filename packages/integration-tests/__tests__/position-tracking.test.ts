import { describe, it, expect } from 'vitest';
import { parse as parseJSON } from '@bakes/dastardly-json';
import { parse as parseYAML } from '@bakes/dastardly-yaml';
import { parse as parseCSV } from '@bakes/dastardly-csv';
import {
  assertAllPositionsValid,
  assertSourceLocationValid,
  assertPositionRangesValid,
} from './helpers/assertions.js';
import { loadJSONFixture, loadYAMLFixture, loadCSVFixture } from './helpers/fixtures.js';
import type { ArrayNode, ObjectNode } from '@bakes/dastardly-core';

describe('Position tracking', () => {
  describe('JSON position tracking', () => {
    it('tracks positions for primitives', () => {
      const source = loadJSONFixture('primitives/string');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);
      expect(ast.loc.source).toBe('json');
    });

    it('tracks positions for objects', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);

      // Verify document has valid location
      expect(ast.type).toBe('Document');
      assertSourceLocationValid(ast.loc);

      // Verify body object has valid location
      expect(ast.body).toBeTruthy();
      if (ast.body) {
        assertSourceLocationValid(ast.body.loc);
        expect(ast.body.type).toBe('Object');
      }
    });

    it('tracks positions for arrays', () => {
      const source = loadJSONFixture('collections/simple-array');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;
        // Each element should have valid positions
        for (const element of arrayNode.elements) {
          assertSourceLocationValid(element.loc);
        }

        // Elements should not overlap
        assertPositionRangesValid(arrayNode.elements);
      }
    });

    it('tracks positions for nested structures', () => {
      const source = loadJSONFixture('collections/nested-object');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);

      // Verify nested structure positions
      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;
        for (const prop of objectNode.properties) {
          assertSourceLocationValid(prop.loc);
          assertSourceLocationValid(prop.key.loc);
          assertSourceLocationValid(prop.value.loc);

          // Key should come before value
          expect(prop.key.loc.end.offset).toBeLessThanOrEqual(
            prop.value.loc.start.offset
          );
        }
      }
    });

    it('tracks positions for real-world JSON', () => {
      const source = loadJSONFixture('real-world/package');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);
    });

    it('tracks positions with unicode', () => {
      const source = loadJSONFixture('primitives/unicode');
      const ast = parseJSON(source);

      assertAllPositionsValid(ast);

      // Unicode characters should be handled correctly
      if (ast.body?.type === 'String') {
        const start = ast.body.loc.start.offset;
        const end = ast.body.loc.end.offset;
        const substring = source.substring(start, end);
        expect(substring).toContain('世界');
        expect(substring).toContain('🌍');
      }
    });
  });

  describe('YAML position tracking', () => {
    it('tracks positions for scalars', () => {
      const source = loadYAMLFixture('scalars/plain-string');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);
      expect(ast.loc.source).toBe('yaml');
    });

    it('tracks positions for block mappings', () => {
      const source = loadYAMLFixture('collections/block-mapping');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);

      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;
        for (const prop of objectNode.properties) {
          assertSourceLocationValid(prop.loc);
          assertSourceLocationValid(prop.key.loc);
          assertSourceLocationValid(prop.value.loc);
        }
      }
    });

    it('tracks positions for block sequences', () => {
      const source = loadYAMLFixture('collections/block-sequence');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;
        for (const element of arrayNode.elements) {
          assertSourceLocationValid(element.loc);
        }
      }
    });

    it('tracks positions for nested YAML', () => {
      const source = loadYAMLFixture('collections/nested');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);
    });

    it('tracks positions for real-world YAML', () => {
      const source = loadYAMLFixture('real-world/docker-compose');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);
    });

    it('tracks positions with multiline strings', () => {
      const source = loadYAMLFixture('scalars/multiline-string');
      const ast = parseYAML(source);

      assertAllPositionsValid(ast);

      // Multiline string should span multiple lines
      if (ast.body?.type === 'String') {
        const loc = ast.body.loc;
        expect(loc.end.line).toBeGreaterThan(loc.start.line);
      }
    });

    it('tracks positions with anchors and aliases', () => {
      const source = loadYAMLFixture('yaml-specific/anchors-aliases');
      const ast = parseYAML(source);

      // All resolved nodes should have valid positions
      assertAllPositionsValid(ast);
    });
  });

  describe('Position accuracy', () => {
    it('JSON: line numbers match source', () => {
      const source = loadJSONFixture('collections/simple-object');
      const ast = parseJSON(source);

      const lines = source.split('\n');

      // Verify that positions reference actual lines
      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;
        for (const prop of objectNode.properties) {
          const line = prop.loc.start.line;
          expect(line).toBeGreaterThan(0);
          expect(line).toBeLessThanOrEqual(lines.length);

          // Extract line content and verify key is present
          const lineContent = lines[line - 1]; // lines are 1-indexed
          if (prop.key.type === 'String') {
            expect(lineContent).toContain(prop.key.value);
          }
        }
      }
    });

    it('YAML: line numbers match source', () => {
      const source = loadYAMLFixture('collections/block-mapping');
      const ast = parseYAML(source);

      const lines = source.split('\n');

      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;
        for (const prop of objectNode.properties) {
          const line = prop.loc.start.line;
          expect(line).toBeGreaterThan(0);
          expect(line).toBeLessThanOrEqual(lines.length);

          // Extract line content and verify key is present
          const lineContent = lines[line - 1];
          if (prop.key.type === 'String') {
            expect(lineContent).toContain(prop.key.value);
          }
        }
      }
    });

    it('JSON: offsets match byte positions', () => {
      const source = loadJSONFixture('primitives/string');
      const ast = parseJSON(source);

      if (ast.body) {
        const start = ast.body.loc.start.offset;
        const end = ast.body.loc.end.offset;

        // Extract substring using offsets
        const extracted = source.substring(start, end);

        // For a string primitive, offsets should give us the quoted string
        expect(extracted).toBe('"hello world"');
      }
    });

    it('YAML: offsets match byte positions', () => {
      const source = loadYAMLFixture('scalars/plain-string');
      const ast = parseYAML(source);

      if (ast.body) {
        const start = ast.body.loc.start.offset;
        const end = ast.body.loc.end.offset;

        // Extract substring using offsets
        const extracted = source.substring(start, end);

        // Should match the scalar value
        expect(extracted).toBe('hello world');
      }
    });

    it('columns are 0-indexed', () => {
      const jsonSource = '{"key": "value"}';
      const ast = parseJSON(jsonSource);

      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;
        const firstProp = objectNode.properties[0];

        if (firstProp) {
          // Column indexing starts at 0
          expect(firstProp.key.loc.start.column).toBeGreaterThanOrEqual(0);

          // First character '{' is at column 0
          expect(ast.body.loc.start.column).toBe(0);
        }
      }
    });

    it('handles deeply nested position tracking', () => {
      const source = loadJSONFixture('edge-cases/deeply-nested');
      const ast = parseJSON(source);

      // All positions should be valid even at depth
      assertAllPositionsValid(ast);

      // Walk to deepest node and verify its position
      let current = ast.body;
      while (current?.type === 'Object') {
        assertSourceLocationValid(current.loc);
        const objectNode = current as ObjectNode;
        if (objectNode.properties.length > 0) {
          current = objectNode.properties[0]!.value;
        } else {
          break;
        }
      }

      // Deepest string node should have valid position
      if (current?.type === 'String') {
        assertSourceLocationValid(current.loc);
        expect(current.value).toBe('deep');
      }
    });
  });

  describe('Position consistency', () => {
    it('JSON: parent ranges contain child ranges', () => {
      const source = loadJSONFixture('collections/nested-object');
      const ast = parseJSON(source);

      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;

        for (const prop of objectNode.properties) {
          // Property range should contain key and value ranges
          expect(prop.loc.start.offset).toBeLessThanOrEqual(
            prop.key.loc.start.offset
          );
          expect(prop.loc.end.offset).toBeGreaterThanOrEqual(
            prop.value.loc.end.offset
          );

          // If value is an object, its range should be within property range
          if (prop.value.type === 'Object') {
            expect(prop.loc.start.offset).toBeLessThanOrEqual(
              prop.value.loc.start.offset
            );
            expect(prop.loc.end.offset).toBeGreaterThanOrEqual(
              prop.value.loc.end.offset
            );
          }
        }
      }
    });

    it('YAML: parent ranges contain child ranges', () => {
      const source = loadYAMLFixture('collections/nested');
      const ast = parseYAML(source);

      if (ast.body?.type === 'Object') {
        const objectNode = ast.body as ObjectNode;

        for (const prop of objectNode.properties) {
          // Property range should contain key and value ranges
          expect(prop.loc.start.offset).toBeLessThanOrEqual(
            prop.key.loc.start.offset
          );
          expect(prop.loc.end.offset).toBeGreaterThanOrEqual(
            prop.value.loc.end.offset
          );
        }
      }
    });
  });

  describe('CSV position tracking', () => {
    it('tracks positions for simple CSV', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      assertAllPositionsValid(ast);
      expect(ast.loc.source).toBe('csv');
    });

    it('tracks positions for array of objects', () => {
      const source = loadCSVFixture('collections/array-of-objects');
      const ast = parseCSV(source);

      assertAllPositionsValid(ast);

      // CSV body should be an array
      expect(ast.body?.type).toBe('Array');

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        // Each row should have valid positions
        for (const element of arrayNode.elements) {
          assertSourceLocationValid(element.loc);

          // Each row should be an object
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            // Each field should have valid positions
            for (const prop of objectNode.properties) {
              assertSourceLocationValid(prop.loc);
              assertSourceLocationValid(prop.key.loc);
              assertSourceLocationValid(prop.value.loc);
            }
          }
        }

        // Rows should not overlap
        assertPositionRangesValid(arrayNode.elements);
      }
    });

    it('tracks positions for empty fields', () => {
      const source = loadCSVFixture('edge-cases/empty-fields');
      const ast = parseCSV(source);

      assertAllPositionsValid(ast);

      // Empty fields should still have valid (zero-width) positions
      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            for (const prop of objectNode.properties) {
              // Empty string values should have valid positions
              if (prop.value.type === 'String' && prop.value.value === '') {
                assertSourceLocationValid(prop.value.loc);

                // Empty fields might have zero-width spans
                const start = prop.value.loc.start.offset;
                const end = prop.value.loc.end.offset;
                expect(end).toBeGreaterThanOrEqual(start);
              }
            }
          }
        }
      }
    });

    it('tracks positions for quoted fields', () => {
      const source = loadCSVFixture('edge-cases/quoted-fields');
      const ast = parseCSV(source);

      assertAllPositionsValid(ast);

      // Quoted fields should include the quotes in position tracking
      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            for (const prop of objectNode.properties) {
              assertSourceLocationValid(prop.value.loc);

              // Extract substring using offsets
              const start = prop.value.loc.start.offset;
              const end = prop.value.loc.end.offset;
              const substring = source.substring(start, end);

              // For quoted fields, substring might start with quote
              if (prop.value.type === 'String' && prop.value.value.includes(',')) {
                expect(substring).toBeTruthy();
              }
            }
          }
        }
      }
    });

    it('tracks positions for special characters', () => {
      const source = loadCSVFixture('edge-cases/special-chars');
      const ast = parseCSV(source);

      assertAllPositionsValid(ast);

      // Unicode characters should be handled correctly
      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          assertSourceLocationValid(element.loc);
        }
      }
    });

    it('tracks positions for real-world CSV', () => {
      const source = loadCSVFixture('real-world/employee-data');
      const ast = parseCSV(source, { inferTypes: true });

      assertAllPositionsValid(ast);

      // Verify some specific positions
      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;
        expect(arrayNode.elements.length).toBeGreaterThan(0);

        for (const element of arrayNode.elements) {
          assertSourceLocationValid(element.loc);
        }
      }
    });

    it('tracks positions for single column', () => {
      const source = loadCSVFixture('edge-cases/single-column');
      const ast = parseCSV(source, { inferTypes: true });

      assertAllPositionsValid(ast);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            // Single column should still have valid positions
            expect(objectNode.properties.length).toBe(1);
            assertSourceLocationValid(objectNode.properties[0]!.loc);
          }
        }
      }
    });
  });

  describe('CSV position accuracy', () => {
    it('CSV: line numbers match source rows', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      const lines = source.split('\n').filter(line => line.trim().length > 0);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const [index, element] of arrayNode.elements.entries()) {
          const line = element.loc.start.line;
          expect(line).toBeGreaterThan(0);

          // Data rows start at line 2 (after header)
          expect(line).toBe(index + 2);
        }
      }
    });

    it('CSV: offsets match byte positions', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          const start = element.loc.start.offset;
          const end = element.loc.end.offset;

          // Extract substring using offsets
          const extracted = source.substring(start, end);

          // Substring should contain row data
          expect(extracted).toBeTruthy();
          expect(extracted.length).toBeGreaterThan(0);
        }
      }
    });

    it('CSV: header positions are tracked', () => {
      const source = loadCSVFixture('primitives/simple');
      const ast = parseCSV(source);

      // The CSV parser infers headers from the first row
      // While headers aren't explicitly in the AST, we can verify
      // that the first data row starts after the header line
      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        if (arrayNode.elements.length > 0) {
          const firstElement = arrayNode.elements[0]!;

          // First data row should be on line 2 (after header)
          expect(firstElement.loc.start.line).toBe(2);
        }
      }
    });

    it('CSV: field positions within rows', () => {
      const source = loadCSVFixture('collections/array-of-objects');
      const ast = parseCSV(source);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            // Properties should be ordered left-to-right in the source
            for (let i = 0; i < objectNode.properties.length - 1; i++) {
              const current = objectNode.properties[i]!;
              const next = objectNode.properties[i + 1]!;

              // Current field should end before or at next field's start
              expect(current.loc.end.offset).toBeLessThanOrEqual(
                next.loc.start.offset
              );
            }
          }
        }
      }
    });

    it('CSV: empty field positions are zero-width or minimal', () => {
      const source = loadCSVFixture('edge-cases/empty-fields');
      const ast = parseCSV(source);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            for (const prop of objectNode.properties) {
              if (prop.value.type === 'String' && prop.value.value === '') {
                const start = prop.value.loc.start.offset;
                const end = prop.value.loc.end.offset;
                const span = end - start;

                // Empty fields should have minimal or zero span
                expect(span).toBeLessThanOrEqual(2); // Allow for empty_field token
              }
            }
          }
        }
      }
    });
  });

  describe('CSV position consistency', () => {
    it('CSV: row ranges contain field ranges', () => {
      const source = loadCSVFixture('collections/array-of-objects');
      const ast = parseCSV(source);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            for (const prop of objectNode.properties) {
              // Row range should contain property range
              expect(element.loc.start.offset).toBeLessThanOrEqual(
                prop.loc.start.offset
              );
              expect(element.loc.end.offset).toBeGreaterThanOrEqual(
                prop.loc.end.offset
              );

              // Property range should contain value range
              expect(prop.loc.start.offset).toBeLessThanOrEqual(
                prop.value.loc.start.offset
              );
              expect(prop.loc.end.offset).toBeGreaterThanOrEqual(
                prop.value.loc.end.offset
              );
            }
          }
        }
      }
    });

    it('CSV: rows do not overlap', () => {
      const source = loadCSVFixture('real-world/employee-data');
      const ast = parseCSV(source);

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        // Rows should be sequential and non-overlapping
        assertPositionRangesValid(arrayNode.elements);

        for (let i = 0; i < arrayNode.elements.length - 1; i++) {
          const current = arrayNode.elements[i]!;
          const next = arrayNode.elements[i + 1]!;

          // Current row should end before next row starts
          expect(current.loc.end.offset).toBeLessThanOrEqual(
            next.loc.start.offset
          );

          // Current row should be on earlier line than next row
          expect(current.loc.start.line).toBeLessThan(
            next.loc.start.line
          );
        }
      }
    });

    it('CSV: all positions reference valid source locations', () => {
      const source = loadCSVFixture('real-world/sales-data');
      const ast = parseCSV(source, { inferTypes: true });

      const sourceLength = source.length;

      if (ast.body?.type === 'Array') {
        const arrayNode = ast.body as ArrayNode;

        for (const element of arrayNode.elements) {
          // Element offsets should be within source bounds
          expect(element.loc.start.offset).toBeGreaterThanOrEqual(0);
          expect(element.loc.end.offset).toBeLessThanOrEqual(sourceLength);

          if (element.type === 'Object') {
            const objectNode = element as ObjectNode;

            for (const prop of objectNode.properties) {
              // Property offsets should be within source bounds
              expect(prop.loc.start.offset).toBeGreaterThanOrEqual(0);
              expect(prop.loc.end.offset).toBeLessThanOrEqual(sourceLength);

              // Value offsets should be within source bounds
              expect(prop.value.loc.start.offset).toBeGreaterThanOrEqual(0);
              expect(prop.value.loc.end.offset).toBeLessThanOrEqual(sourceLength);
            }
          }
        }
      }
    });
  });
});
