# @bakes/dastardly-json

High-performance JSON parser and serializer for dASTardly, built with Tree-sitter.

## Installation

```bash
npm install @bakes/dastardly-json @bakes/dastardly-core
```

```bash
pnpm add @bakes/dastardly-json @bakes/dastardly-core
```

## Overview

`@bakes/dastardly-json` provides a blazing-fast JSON parser and serializer that converts JSON to dASTardly's format-agnostic AST. Built on tree-sitter for real-time editor performance with full position tracking for precise error reporting.

**Key Features:**
- **High performance** - Tree-sitter-based parsing (36-52x faster than traditional parsers)
- **Position tracking** - Every node tracks source location (line, column, offset)
- **Roundtrip support** - Parse and serialize while preserving formatting
- **Type-safe** - Full TypeScript support with strict mode
- **Comprehensive** - Handles all JSON types and edge cases
- **Format-agnostic AST** - Convert to/from other formats (YAML, CSV, etc.)

## Quick Start

### Parsing

```typescript
import { parse } from '@bakes/dastardly-json';

// Parse to DocumentNode (includes document wrapper)
const doc = parse('{"name": "Alice", "age": 30}');
console.log(doc.type); // 'Document'
console.log(doc.body.type); // 'Object'

// Access the data directly
const obj = doc.body;
console.log(obj.properties[0].key.value); // 'name'
```

### Serializing

```typescript
import { serialize } from '@bakes/dastardly-json';
import { parse } from '@bakes/dastardly-json';

const doc = parse('{"name": "Alice"}');

// Compact mode (no whitespace)
const compact = serialize(doc);
// {"name":"Alice"}

// Pretty-print with custom indentation
const pretty = serialize(doc, { indent: 2 });
// {
//   "name": "Alice"
// }
```

### Roundtrip

```typescript
import { parse, serialize } from '@bakes/dastardly-json';

const source = '{"name": "Alice", "age": 30}';
const doc = parse(source);
const output = serialize(doc, { indent: 2 });
// Preserves data structure, reformats with specified style
```

## API Reference

### Package Object

The package exports a `json` object implementing the `FormatPackage` interface:

```typescript
import { json } from '@bakes/dastardly-json';

const doc = json.parse('{"a": 1}');
const output = json.serialize(doc);
```

### Convenience Functions

For convenience, `parse` and `serialize` are also exported as standalone functions (destructured from the `json` object):

#### `parse(source)`

Parse JSON string into a DocumentNode:

```typescript
function parse(source: string): DocumentNode;
```

**Example:**

```typescript
import { parse } from '@bakes/dastardly-json';

const doc = parse('{"key": "value"}');
console.log(doc.type); // 'Document'
console.log(doc.body.type); // 'Object'

// Access data nodes
const dataNode = doc.body;
```

**Throws:** `ParseError` if source is invalid JSON

#### `serialize(node, options?)`

Serialize AST to JSON string:

```typescript
function serialize(
  node: DocumentNode | DataNode,
  options?: JSONSerializeOptions
): string;
```

**Parameters:**
- `node` - DocumentNode or DataNode to serialize
- `options` - Optional serialization options:
  - `indent?: number | string` - Indentation (number of spaces or string like `'\t'`)
  - `preserveRaw?: boolean` - Preserve raw number representations (e.g., `1.0` vs `1`)
  - `lineEnding?: '\n' | '\r\n'` - Line ending style (default: `'\n'`)

**Example:**

```typescript
import { serialize } from '@bakes/dastardly-json';

// Compact output
serialize(ast); // {"name":"Alice"}

// Pretty-print with 2 spaces
serialize(ast, { indent: 2 });
// {
//   "name": "Alice"
// }

// Custom indent with tabs
serialize(ast, { indent: '\t' });

// Preserve raw number format
serialize(doc, { preserveRaw: true });
// Numbers like 1.0 stay as 1.0 instead of becoming 1
```

## Types

### `JSONSerializeOptions`

Options for JSON serialization:

```typescript
interface JSONSerializeOptions {
  /** Indentation (number of spaces or custom string) */
  indent?: number | string;

  /** Preserve raw number representations (e.g., "1.0" vs "1") */
  preserveRaw?: boolean;

  /** Line ending style */
  lineEnding?: '\n' | '\r\n';
}
```

## Position Tracking

Every node in the AST includes position information:

```typescript
import { parse } from '@bakes/dastardly-json';

const doc = parse('{"name": "Alice"}');

// Position info on every node
console.log(doc.loc);
// {
//   start: { line: 1, column: 0, offset: 0 },
//   end: { line: 1, column: 18, offset: 18 }
// }

console.log(doc.body.properties[0].key.loc);
// Position of the "name" key
```

This enables precise error reporting and source mapping across format conversions.

## Common Patterns

### Working with DataNodes

If you only need the data and not the document wrapper:

```typescript
import { parse } from '@bakes/dastardly-json';

const doc = parse('{"users": [{"name": "Alice"}, {"name": "Bob"}]}');

// Access the data directly
const data = doc.body;
if (data.type === 'Object') {
  const usersProperty = data.properties.find(p => p.key.value === 'users');
  // ... work with data
}
```

### Cross-format Conversion

```typescript
import { parse as parseJSON, serialize as serializeJSON } from '@bakes/dastardly-json';
import { parse as parseYAML, serialize as serializeYAML } from '@bakes/dastardly-yaml';

// JSON → YAML
const jsonDoc = parseJSON('{"name": "Alice", "age": 30}');
const yamlOutput = serializeYAML(jsonDoc);
// name: Alice
// age: 30

// YAML → JSON
const yamlDoc = parseYAML('name: Alice\nage: 30');
const jsonOutput = serializeJSON(yamlDoc, { indent: 2 });
// {
//   "name": "Alice",
//   "age": 30
// }
```

### Error Handling

```typescript
import { parse } from '@bakes/dastardly-json';
import { ParseError } from '@bakes/dastardly-core';

try {
  const doc = parse('{invalid json}');
} catch (error) {
  if (error instanceof ParseError) {
    console.error(`Parse error at line ${error.line}, column ${error.column}`);
    console.error(error.message);
  }
}
```

## Edge Cases

The parser handles all JSON edge cases correctly:

```typescript
import { parse } from '@bakes/dastardly-json';

// Empty structures
parse('{}'); // Empty object
parse('[]'); // Empty array

// Deeply nested
parse('{"a": {"b": {"c": 1}}}');

// Unicode escapes
parse('"\\u0048\\u0065\\u006c\\u006c\\u006f"'); // "Hello"

// Large numbers
parse('9007199254740991'); // Number.MAX_SAFE_INTEGER
parse('1.7976931348623157e+308'); // Near Number.MAX_VALUE

// Whitespace handling
parse('  {  "key"  :  "value"  }  ');
```

## Related Packages

- **[@bakes/dastardly-core](../core)** - Core AST types and utilities
- **[@bakes/dastardly-yaml](../yaml)** - YAML parser and serializer
- **[@bakes/dastardly-csv](../csv)** - CSV parser and serializer

## License

MIT
