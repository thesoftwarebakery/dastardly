# @bakes/dastardly-validation

JSON Schema validator for dASTardly ASTs with multi-draft support.

## Features

- ✅ **Multi-draft support** - JSON Schema Draft 4, 6, 7, and architecture for 2020-12
- ✅ **High test coverage** - 1,964 tests passing across 3 draft versions (85.5% overall)
- ✅ **Type-safe API** - Constructor overloads enforce draft/schema correspondence
- ✅ **High-performance schema compilation** - AJV-inspired architecture with validator caching
- ✅ **Precise error reporting** - Source location tracking with line/column/offset information
- ✅ **Content-addressable caching** - Automatic validation result caching for identical nodes
- ✅ **Modular validators** - Clean separation of concerns, testable in isolation
- ✅ **Full recursive validation** - Nested objects, arrays, and complex schemas
- ✅ **$ref support** - Local JSON Pointer references with automatic resolution
- ✅ **Conditional validation** - if/then/else schema logic (Draft 7+)

## Installation

```bash
pnpm add @bakes/dastardly-validation
```

## Quick Start

```typescript
import { json } from '@bakes/dastardly-json';
import { Validator } from '@bakes/dastardly-validation';

// Define your JSON Schema (Draft 7 is default)
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

## JSON Schema Draft Support

This validator supports multiple JSON Schema draft versions:

### Draft 7 (default)
```typescript
import type { JSONSchema7 } from 'json-schema';

const schema: JSONSchema7 = {
  type: 'string',
  minLength: 1
};

// Draft 7 is the default - no options needed
const validator = new Validator(schema);
```

### Draft 6
```typescript
import type { JSONSchema6 } from 'json-schema';

const schema: JSONSchema6 = {
  type: 'number',
  minimum: 0
};

const validator = new Validator(schema, { draft: 'draft-06' });
```

### Draft 4
```typescript
import type { JSONSchema4 } from 'json-schema';

const schema: JSONSchema4 = {
  type: 'number',
  minimum: 10,
  exclusiveMinimum: true  // Draft 4 uses boolean
};

const validator = new Validator(schema, { draft: 'draft-04' });
```

**Key differences between drafts:**
- **Draft 4**: `exclusiveMinimum`/`exclusiveMaximum` are booleans that modify `minimum`/`maximum`
- **Draft 6/7**: `exclusiveMinimum`/`exclusiveMaximum` are standalone numeric values
- **Draft 7**: Added `if`/`then`/`else`, `readOnly`/`writeOnly`

**Type safety:** Constructor overloads ensure the schema type matches the draft option at compile-time.

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
  // JSON Schema draft version (default: 'draft-07')
  draft: 'draft-07',  // Options: 'draft-04' | 'draft-06' | 'draft-07' | 'draft-2020-12'

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
# Run all draft tests
pnpm test

# Run specific draft tests
pnpm test json-schema-draft-7.test.ts
pnpm test json-schema-draft-6.test.ts
pnpm test json-schema-draft-4.test.ts
```

**Test Coverage Across Drafts:**

| Draft | Passing | Skipped | Pass Rate |
|-------|---------|---------|-----------|
| Draft 4 | 511 | 88 | 85.3% |
| Draft 6 | 677 | 95 | 87.7% |
| Draft 7 | 776 | 98 | 88.8% |
| **Total** | **1,964** | **281** | **85.5%** |

### Skipped Tests Breakdown

The skipped tests fall into consistent categories across all drafts:

| Category | Status | Notes |
|----------|--------|-------|
| Remote `$ref` / `$id` | ❌ Not supported by design | External schema references (http://), named schema resolution via `$id` - intentionally not implemented for security/simplicity |
| BigNum precision | ⚠️ JSON parser limitation | Numbers with very large exponents exceed JavaScript `Number` precision |
| Regex edge cases | ⚠️ Spec compliance | Unicode surrogate pairs, .NET-specific regex features |
| Format validation | ⚠️ Strict RFC compliance | Internationalized formats (IRI, IDN), strict date-time validation |
| Optional features | ⚠️ Low priority | `contentMediaType`/`contentEncoding` (optional per JSON Schema spec) |
| Float vs integer | ⚠️ JavaScript limitation | Cannot distinguish 1.0 vs 1 (Draft 4 only) |

**Legend:**
- ❌ = Not supported by design (security/simplicity trade-off)
- ⚠️ = Optional feature, strict compliance, or language limitation

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
