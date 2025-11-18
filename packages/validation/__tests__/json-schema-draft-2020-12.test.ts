/**
 * Official JSON Schema Test Suite - Draft 2020-12
 * https://github.com/json-schema-org/JSON-Schema-Test-Suite
 *
 * This will run the official Draft 2020-12 test suite once available.
 *
 * NOTE: The @json-schema-org/tests npm package (v2.0.0) doesn't expose Draft 2020-12 tests yet,
 * even though they exist in the GitHub repository. We'll need to either:
 * 1. Wait for a package update that includes them
 * 2. Load them directly from the raw GitHub repository
 * 3. Vendor them into our test suite
 *
 * For now, this file serves as a placeholder for Draft 2020-12 test integration.
 */

import { describe, it } from 'vitest';

describe('JSON Schema Test Suite (Draft 2020-12)', () => {
  it.todo('Load Draft 2020-12 tests from official test suite');
  it.todo('Implement prefixItems keyword support');
  it.todo('Implement items keyword (new semantics for 2020-12)');
  it.todo('Implement unevaluatedProperties keyword');
  it.todo('Implement unevaluatedItems keyword');
  it.todo('Implement $dynamicRef and $dynamicAnchor support');
  it.todo('Support $defs (prefer over definitions)');

  // TODO: Once @json-schema-org/tests includes draft2020-12, implement full test suite
  // similar to draft-4, draft-6, and draft-7 test files
});
