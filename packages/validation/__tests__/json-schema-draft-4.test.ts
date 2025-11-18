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

// Mark all tests as todo initially - will enable once Draft 4 support is implemented
const ENABLE_DRAFT_4_TESTS = false;

// Test files with known failures
const knownFailingFiles = new Set([
  'refRemote.json',     // Remote $ref resolution not implemented
  'bignum.json',        // Large number parsing issues
]);

// Specific test descriptions with known failures
const knownFailingTests = new Set([
  'remote ref, containing refs itself',
  'Recursive references between schemas',
  'remote ref',
  'fragment within remote ref',
  'ref within remote ref',
  'base URI change',
  'base URI change - change folder',
  'base URI change - change folder in subschema',
  'root ref in remote ref',
]);

describe('JSON Schema Test Suite (Draft 4)', () => {
  // Run tests grouped by file
  for (const testFile of draft4Tests) {
    describe(testFile.file, () => {
      // Each test file has multiple schemas
      for (const schemaTest of testFile.schemas) {
        describe(schemaTest.description, () => {
          // Create validator for this schema
          // Note: Will need to pass draft option once implemented
          const validator = new Validator(schemaTest.schema);

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
