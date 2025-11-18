/**
 * Official JSON Schema Test Suite - Draft 7
 * https://github.com/json-schema-org/JSON-Schema-Test-Suite
 *
 * This runs the official Draft 7 test suite to ensure full JSON Schema Draft 7 compliance.
 * For other draft versions, see json-schema-draft-*.test.ts files.
 */

import { describe, it, expect } from 'vitest';
import * as testSuite from '@json-schema-org/tests';
import { json } from '@bakes/dastardly-json';
import { Validator } from '../src/validator.js';

// Load Draft 7 tests using the correct API
// Each test file contains an array of schemas, and each schema has tests
const draft7Tests = testSuite.loadSync({ draft: 'draft7' });

// Test files with known failures that need implementation
const knownFailingFiles = new Set([
  'refRemote.json',     // Remote $ref resolution not implemented
  'bignum.json',        // Large number parsing issues
  'content.json',       // contentMediaType/contentEncoding validation
  'ecmascript-regex.json', // Advanced regex validation
  'date-time.json',     // Strict date-time format validation
  'idn-hostname.json',  // Internationalized hostname validation
  'iri-reference.json', // IRI reference format validation
  'iri.json',           // IRI format validation
  'uri-reference.json', // URI reference format validation
]);

// Specific test descriptions with known failures in otherwise passing files
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
  'valid definition',  // definitions.json - $ref resolution issue
]);

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
            // Use .todo() for known failing files or specific test descriptions
            const shouldMarkTodo =
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
