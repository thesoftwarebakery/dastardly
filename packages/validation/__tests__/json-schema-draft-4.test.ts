/**
 * Official JSON Schema Test Suite - Draft 4
 * https://github.com/json-schema-org/JSON-Schema-Test-Suite
 *
 * This runs the official Draft 4 test suite to ensure JSON Schema Draft 4 compliance.
 * Draft 4 has some incompatible changes from Draft 6/7 (boolean exclusiveMinimum/Maximum, id vs $id).
 */

import { describe, it, expect } from 'vitest';
import * as testSuite from '@json-schema-org/tests';
import { json } from '@bakes/dastardly-json';
import { Validator } from '../src/validator.js';

// Load Draft 4 tests
const draft4Tests = testSuite.loadSync({ draft: 'draft4' });

// Enable Draft 4 tests to identify what needs implementation
const ENABLE_DRAFT_4_TESTS = true;

// Test files with known failures - ONLY mark if also failing in Draft 6/7 or if optional/unfixable
const knownFailingFiles = new Set([
  'refRemote.json',          // Remote $ref resolution not implemented
  'bignum.json',             // Large number parsing issues
  'ecmascript-regex.json',   // Advanced regex validation (also fails in Draft 6/7)
  'zeroTerminatedFloats.json', // Optional test - JavaScript cannot distinguish 1.0 vs 1
]);

// Specific test descriptions with known failures - match Draft 6/7
const knownFailingTests = new Set([
  // Remote refs and $id-based resolution (not supported - also fails in Draft 6/7)
  'remote ref, containing refs itself',
  'Recursive references between schemas',
  'remote ref',
  'fragment within remote ref',
  'ref within remote ref',
  'base URI change',
  'base URI change - change folder',
  'base URI change - change folder in subschema',
  'root ref in remote ref',
  'valid definition',  // definitions.json - $ref resolution
  // Location-independent identifier tests use $id resolution (also fails in Draft 6/7)
  'Location-independent identifier',
  'Location-independent identifier with absolute URI',
  'Location-independent identifier with base URI change in subschema',
  // Regex edge cases (also fail in Draft 6/7)
  'non-BMP, checks for proper surrogate pair handling for UTF-16',
  // Format validation edge cases
  'validation of date-time strings',
]);

describe('JSON Schema Test Suite (Draft 4)', () => {
  // Run tests grouped by file
  for (const testFile of draft4Tests) {
    describe(testFile.file, () => {
      // Each test file has multiple schemas
      for (const schemaTest of testFile.schemas) {
        describe(schemaTest.description, () => {
          // Create validator for this schema with Draft 4
          const validator = new Validator(schemaTest.schema, { draft: 'draft-04' });

          // Run all validation tests for this schema
          for (const test of schemaTest.tests) {
            // Mark all tests as .todo() until Draft 4 support is enabled
            const shouldMarkTodo =
              !ENABLE_DRAFT_4_TESTS ||
              knownFailingFiles.has(testFile.file) ||
              knownFailingTests.has(schemaTest.description);

            const testFn = shouldMarkTodo ? it.todo : it;

            testFn(test.description, () => {
              // Convert plain JSON to AST
              const jsonString = JSON.stringify(test.data);
              const document = json.parse(jsonString);

              // Validate
              const result = validator.validate(document);

              // Check result
              if (test.valid) {
                expect(result.valid).toBe(true);
              } else {
                expect(result.valid).toBe(false);
              }
            });
          }
        });
      }
    });
  }
});
