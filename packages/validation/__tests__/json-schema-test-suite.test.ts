/**
 * Official JSON Schema Test Suite
 * https://github.com/json-schema-org/JSON-Schema-Test-Suite
 *
 * This runs the official test suite to ensure full JSON Schema Draft 7 compliance
 */

import { describe, it, expect } from 'vitest';
import * as testSuite from '@json-schema-org/tests';
import { json } from '@bakes/dastardly-json';
import { Validator } from '../src/validator.js';

// Load Draft 7 tests using the correct API
// Each test file contains an array of schemas, and each schema has tests
const draft7Tests = testSuite.loadSync({ draft: 'draft7' });

describe('JSON Schema Test Suite (Draft 7)', () => {
  // Run tests grouped by file
  for (const testFile of draft7Tests) {
    describe(testFile.file, () => {
      // Each test file has multiple schemas
      for (const schemaTest of testFile.schemas) {
        describe(schemaTest.description, () => {
          // Create validator for this schema
          const validator = new Validator(schemaTest.schema);

          // Run all validation tests for this schema
          for (const test of schemaTest.tests) {
            it(test.description, () => {
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
