# @bakes/dastardly-integration-tests

Integration tests for the dASTardly project, validating cross-format conversions, position tracking, and real-world usage scenarios.

## Overview

This package contains comprehensive integration tests that validate:

- **Cross-format conversions**: JSON ↔ YAML roundtrip accuracy
- **Position tracking**: Source location preservation through conversions
- **Roundtrip fidelity**: Parse → serialize → parse data integrity
- **Real-world scenarios**: Common configuration files and data formats
- **Edge cases**: Boundary conditions, special values, and format-specific features

## Running Tests

```bash
# Run integration tests
pnpm test

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui
```

## Test Organization

### Test Suites

- **`cross-format.test.ts`**: Cross-format conversion tests (JSON ↔ YAML)
- **`position-tracking.test.ts`**: Source location accuracy validation
- **`roundtrip.test.ts`**: Parse-serialize-parse fidelity tests
- **`real-world.test.ts`**: Real-world configuration file tests
- **`edge-cases.test.ts`**: Boundary conditions and special values

### Fixtures

Test fixtures are organized by format and category:

```
fixtures/
├── json/
│   ├── primitives/     - Basic JSON types
│   ├── collections/    - Objects and arrays
│   ├── real-world/     - Real configuration files
│   └── edge-cases/     - Boundary conditions
├── yaml/
│   ├── scalars/        - YAML scalar types
│   ├── collections/    - Mappings and sequences
│   ├── real-world/     - Real YAML documents
│   └── yaml-specific/  - YAML-specific features
└── expected/
    ├── json-to-yaml/   - Expected YAML outputs
    ├── yaml-to-json/   - Expected JSON outputs
    └── roundtrip/      - Expected roundtrip results
```

### Helpers

- **`helpers/fixtures.ts`**: Fixture loading utilities
- **`helpers/assertions.ts`**: Custom assertion helpers for AST comparisons

## Adding New Tests

### Adding a Test Fixture

1. Add the fixture file to the appropriate subdirectory in `fixtures/`
2. Create a corresponding test in the relevant test suite
3. Use fixture helpers from `helpers/fixtures.ts`

Example:

```typescript
import { loadJSONFixture } from './helpers/fixtures.js';

it('parses package.json correctly', () => {
  const source = loadJSONFixture('real-world/package.json');
  const ast = parseJSON(source);
  // assertions...
});
```

### Writing Integration Tests

Integration tests should:

1. Test cross-package interactions (not internal implementation details)
2. Validate end-to-end workflows (parse → convert → serialize)
3. Use real-world data when possible
4. Verify position tracking accuracy
5. Test error handling and edge cases

Example:

```typescript
import { parse as parseJSON, stringify as stringifyJSON } from '@bakes/dastardly-json';
import { parse as parseYAML, serialize as serializeYAML } from '@bakes/dastardly-yaml';
import { toNative } from '@bakes/dastardly-core';

it('converts JSON to YAML and back', () => {
  const jsonSource = '{"name": "Alice", "age": 30}';

  // JSON → AST
  const jsonAst = parseJSON(jsonSource);

  // AST → YAML
  const yamlOutput = serializeYAML(jsonAst);

  // YAML → AST
  const yamlAst = parseYAML(yamlOutput);

  // AST → JSON
  const jsonOutput = stringifyJSON(yamlAst);

  // Verify structural equivalence
  expect(toNative(jsonAst)).toEqual(toNative(yamlAst));
});
```

## Coverage Goals

- 100% coverage of cross-format conversion paths
- Position tracking validation for all node types
- Roundtrip testing for all supported formats
- Real-world examples from popular tools
- Edge case coverage for format-specific features

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines.

When adding integration tests:

1. Use descriptive test names that explain what is being validated
2. Add fixture files for complex test data rather than inline strings
3. Test both happy paths and error cases
4. Verify position tracking for all parsed nodes
5. Document any format-specific behavior being tested
