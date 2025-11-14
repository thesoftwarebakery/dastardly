# @bakes/dastardly-validation

JSON Schema validator for dASTardly ASTs with comprehensive Draft 7 support.

## Features

- ✅ **86.1% JSON Schema Draft 7 compliance** (488/567 official test suite tests passing)
- ✅ **High-performance schema compilation** - AJV-inspired architecture with validator caching
- ✅ **Precise error reporting** - Source location tracking with line/column/offset information
- ✅ **Content-addressable caching** - Automatic validation result caching for identical nodes
- ✅ **Modular validators** - Clean separation of concerns, testable in isolation
- ✅ **Full recursive validation** - Nested objects, arrays, and complex schemas
- ✅ **$ref support** - Local JSON Pointer references with automatic resolution
- ✅ **Conditional validation** - if/then/else schema logic

## Installation

```bash
pnpm add @bakes/dastardly-validation
```

## Quick Start

```typescript
import { json } from '@bakes/dastardly-json';
import { Validator } from '@bakes/dastardly-validation';

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'number', minimum: 0 },
    email: { type: 'string', pattern: '^[^@]+@[^@]+$' }
  },
  required: ['name', 'email']
};

// Parse your data to AST
const document = json.parse(`{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com"
}`);

// Create validator and validate
const validator = new Validator(schema);
const result = validator.validate(document);

if (result.valid) {
  console.log('Valid!');
} else {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
    console.error(`  at line ${error.location.start.line}, column ${error.location.start.column}`);
  }
}
```

## Supported Keywords

### Type Validation
- `type` - Type checking (string, number, integer, boolean, object, array, null)
- `enum` - Enumeration validation
- `const` - Constant value validation

### String Validation
- `minLength`, `maxLength` - Length constraints
- `pattern` - Regular expression validation

### Number Validation
- `minimum`, `maximum` - Inclusive bounds
- `exclusiveMinimum`, `exclusiveMaximum` - Exclusive bounds
- `multipleOf` - Divisibility validation

### Array Validation
- `minItems`, `maxItems` - Length constraints
- `uniqueItems` - Uniqueness validation
- `items` - Element schema validation (single schema or tuple)
- `additionalItems` - Extra elements beyond tuple schema
- `contains` - At least one matching element

### Object Validation
- `properties` - Property schema validation
- `patternProperties` - Regex-based property validation
- `additionalProperties` - Extra properties validation
- `required` - Required properties
- `minProperties`, `maxProperties` - Property count constraints
- `dependencies` - Property and schema dependencies

### Combinators
- `allOf` - Must match all schemas
- `anyOf` - Must match at least one schema
- `oneOf` - Must match exactly one schema
- `not` - Must not match schema

### Conditional
- `if`/`then`/`else` - Conditional schema application

### References
- `$ref` - Local JSON Pointer references (e.g., `#/definitions/address`)

### Boolean Schemas
- `true` - Always valid
- `false` - Always invalid

## Validator Options

```typescript
const validator = new Validator(schema, {
  // Enable/disable validation result caching (default: true)
  cache: true,

  // Maximum cache size (default: 1000)
  cacheSize: 1000,

  // Stop on first error (default: false)
  failFast: false
});
```

## Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string;              // JSON Pointer to error location
  message: string;           // Human-readable error message
  keyword: string;           // Schema keyword that failed
  schemaPath: string;        // Path in schema
  location: SourceLocation;  // Source code location
  params: Record<string, unknown>; // Additional context
}
```

## Architecture

### Schema Compilation

Schemas are compiled once into optimized validator functions:

```typescript
// Schema is compiled on validator creation
const validator = new Validator(schema);

// Compiled validators are cached by reference
// Multiple validations reuse the same compiled validators
validator.validate(doc1);
validator.validate(doc2);
```

### Validation Caching

Validation results are automatically cached using content-based hashing:

```typescript
const validator = new Validator(schema);

// First validation computes and caches result
const result1 = validator.validate(document);

// Second validation with identical AST node reuses cached result
const result2 = validator.validate(document);
```

### Modular Validators

Each JSON Schema keyword is implemented as an independent validator:

```typescript
// Type validator
createTypeValidator('string')

// Number range validator
createMinimumValidator(10)

// Nested validation
createPropertiesValidator(propertiesSchema, compiler)
```

Validators are composable and testable in isolation.

## Testing

The validator is tested against the [official JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite):

```bash
pnpm test json-schema-test-suite.test.ts
```

**Current Status:** 536/567 tests passing (94.5%)

### Test Failure Breakdown

The 31 remaining test failures fall into the following categories:

| Category | Tests | Status | Notes |
|----------|-------|--------|-------|
| Remote `$ref` / `$id` | 11 | ❌ Not supported by design | External schema references (http://), named schema resolution via `$id`, and meta-schema validation are intentionally not implemented |
| BigNum precision | 7 | ⚠️ JSON parser limitation | Numbers with very large exponents (>10^52) exceed JavaScript `Number` precision - would require BigInt support in parser |
| Content validation | 4 | ⚠️ Optional feature | `contentMediaType`/`contentEncoding` keywords are optional per spec - low priority |
| Format edge cases | 6 | ⚠️ Strict compliance | Internationalized formats (IRI, IDN hostname) and very strict RFC compliance edge cases |
| Regex compatibility | 1 | ❌ JavaScript limitation | .NET-specific regex features (`\Z` anchor) not supported by JavaScript |
| Date-time strict | 1 | ⚠️ Strict RFC compliance | Very specific timezone offset format validation |
| IDN hostname strict | 1 | ⚠️ Strict compliance | Unicode normalization and illegal character detection |

**Legend:**
- ❌ = Not supported by design or language limitation (11 tests)
- ⚠️ = Optional feature, strict compliance, or external limitation (19 tests)
- ✅ = All realistically fixable issues have been addressed (1 test remaining is a format edge case)

### What's Implemented

✅ **Core Validation (32 keywords):**
- Type checking: `type`, `enum`, `const`
- Strings: `minLength`, `maxLength`, `pattern`, `format` (17 formats)
- Numbers: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- Arrays: `minItems`, `maxItems`, `uniqueItems`, `items`, `additionalItems`, `contains`
- Objects: `required`, `minProperties`, `maxProperties`, `properties`, `patternProperties`, `additionalProperties`, `dependencies`, `propertyNames`
- Combinators: `allOf`, `anyOf`, `oneOf`, `not`
- Conditional: `if`/`then`/`else`
- References: `$ref` (local JSON Pointers)
- Boolean schemas: `true`/`false`

### What's Not Implemented

❌ **Intentional Limitations:**
- Remote `$ref` - External schema references (security/simplicity)
- Very strict format validation edge cases (low real-world impact)

⚠️ **Optional Features (JSON Schema spec):**
- `contentMediaType`, `contentEncoding` - Content validation
- Strict internationalized format validation (IRI, IDN edge cases)

⚠️ **External Limitations:**
- BigNum precision - JavaScript `Number` limitation
- Unicode code point counting - Currently counts UTF-16 code units
- .NET regex features - JavaScript regex engine differences

## Limitations

### Known Issues
- **BigNum:** Very large exponent numbers (>10^52) may fail to parse (JSON parser limitation)
- **Remote refs:** External schema references via http:// are not supported by design
- **Named schemas:** Schema resolution via `$id` is not supported (requires schema registry)

## Performance

### Schema Compilation
- Schemas are compiled once and cached by reference
- Compilation creates optimized validator functions
- Validators apply only to applicable node types

### Validation Caching
- Content-addressable caching using node identity hashes
- Identical subtrees skip re-validation
- Cache is LRU-based with configurable size

### Optimization Tips
1. Reuse validator instances across multiple validations
2. Enable caching for repeated validations (default: enabled)
3. Use `failFast: true` if you only need to know if validation fails

## Examples

### Nested Objects

```typescript
const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' }
          },
          required: ['city']
        }
      }
    }
  }
};
```

### Arrays with Tuples

```typescript
const schema = {
  type: 'array',
  items: [
    { type: 'string' },   // First element must be string
    { type: 'number' }    // Second element must be number
  ],
  additionalItems: false  // No additional elements allowed
};
```

### References

```typescript
const schema = {
  definitions: {
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' }
      }
    }
  },
  type: 'object',
  properties: {
    home: { $ref: '#/definitions/address' },
    work: { $ref: '#/definitions/address' }
  }
};
```

### Conditional Validation

```typescript
const schema = {
  type: 'object',
  properties: {
    country: { type: 'string' }
  },
  if: {
    properties: { country: { const: 'US' } }
  },
  then: {
    properties: {
      postalCode: { pattern: '^[0-9]{5}$' }
    }
  },
  else: {
    properties: {
      postalCode: { type: 'string' }
    }
  }
};
```

## License

MIT
