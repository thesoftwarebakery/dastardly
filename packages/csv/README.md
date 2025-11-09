# @dastardly/csv

High-performance CSV/TSV/PSV parser and serializer for dASTardly, built with Tree-sitter.

## Installation

```bash
npm install @dastardly/csv @dastardly/core
```

```bash
pnpm add @dastardly/csv @dastardly/core
```

## Overview

`@dastardly/csv` provides a blazing-fast CSV parser and serializer that converts CSV to dASTardly's format-agnostic AST. Built on tree-sitter for real-time editor performance with full position tracking for precise error reporting.

**Key Features:**
- **High performance** - Tree-sitter-based parsing for real-time editor feedback
- **Multiple delimiters** - Support for CSV (`,`), TSV (`\t`), and PSV (`|`)
- **Position tracking** - Every node tracks source location (line, column, offset)
- **Flexible headers** - Auto-detect, custom headers, or no headers mode
- **Type inference** - Optional automatic type detection for numbers and booleans
- **Quote strategies** - Configurable quoting: needed, all, nonnumeric, or none
- **Type-safe** - Full TypeScript support with strict mode
- **Format-agnostic AST** - Convert to/from other formats (JSON, YAML, etc.)

## Quick Start

### Parsing

```typescript
import { parse } from '@dastardly/csv';

// Parse CSV with headers to DocumentNode
const doc = parse('name,age\nAlice,30\nBob,25');
console.log(doc.type); // 'Document'
console.log(doc.body.type); // 'Array'

// Access the data directly
const data = doc.body;
if (data.type === 'Array') {
  console.log(data.elements.length); // 2
  // Each element is an Object with properties from headers
}
```

### Serializing

```typescript
import { serialize } from '@dastardly/csv';

// Serialize with default options (comma delimiter, auto-headers)
const csv = serialize(doc);
// name,age
// Alice,30
// Bob,25

// Serialize as TSV (tab-separated)
const tsv = serialize(doc, { delimiter: '\t' });
// name	age
// Alice	30
// Bob	25

// Serialize with all fields quoted
const quoted = serialize(doc, { quoting: 'all' });
// "name","age"
// "Alice","30"
// "Bob","25"
```

### Roundtrip

```typescript
import { parse, serialize } from '@dastardly/csv';

const source = 'name,age\nAlice,30\nBob,25';
const doc = parse(source);
const output = serialize(doc);
// Preserves data structure, can reformat with different options
```

## API Reference

### Package Object

The package exports a `csv` object implementing the `FormatPackage` interface:

```typescript
import { csv } from '@dastardly/csv';

const doc = csv.parse('name,age\nAlice,30', { inferTypes: true });
const output = csv.serialize(doc, { delimiter: '\t' });
```

### Convenience Functions

For convenience, `parse` and `serialize` are also exported as standalone functions:

#### `parse(source, options?)`

Parse CSV string into a DocumentNode:

```typescript
function parse(
  source: string,
  options?: CSVParseOptions
): DocumentNode;
```

**Parameters:**
- `source` - CSV string to parse
- `options` - Optional parse options:
  - `delimiter?: string` - Field delimiter (`,`, `\t`, or `|`). Default: `,`
  - `headers?: boolean | string[]` - Header handling:
    - `true` (default) - First row is headers
    - `false` - No headers (produces array of arrays)
    - `string[]` - Custom header names
  - `inferTypes?: boolean` - Auto-detect numbers and booleans. Default: `false`

**Example:**

```typescript
import { parse } from '@dastardly/csv';

// Basic parsing with headers
const doc1 = parse('name,age\nAlice,30');
console.log(doc1.body.type); // 'Array'

// Parse with type inference
const doc2 = parse('name,score\nAlice,100', { inferTypes: true });
// score will be Number(100) instead of String("100")

// Parse without headers (array of arrays)
const doc3 = parse('Alice,30\nBob,25', { headers: false });
// Produces: [["Alice", "30"], ["Bob", "25"]]

// Parse TSV with custom headers
const doc4 = parse('Alice\t30\nBob\t25', {
  delimiter: '\t',
  headers: ['name', 'age']
});
```

**Throws:** `ParseError` if source is invalid CSV

#### `serialize(node, options?)`

Serialize AST to CSV string:

```typescript
function serialize(
  node: DocumentNode | DataNode,
  options?: CSVSerializeOptions
): string;
```

**Parameters:**
- `node` - DocumentNode or DataNode to serialize (must be Array of Objects or Array of Arrays)
- `options` - Optional serialization options:
  - `delimiter?: string` - Field delimiter. Default: `,`
  - `quoting?: 'needed' | 'all' | 'nonnumeric' | 'none'` - Quote strategy. Default: `'needed'`
  - `lineEnding?: '\n' | '\r\n'` - Line ending style. Default: `'\n'`
  - `headers?: boolean | string[]` - Header handling:
    - `true` (default for Objects) - Auto-generate from object keys
    - `false` - No header row
    - `string[]` - Custom header names

**Example:**

```typescript
import { serialize } from '@dastardly/csv';

// Default: comma-separated with auto-headers
serialize(doc);
// name,age
// Alice,30

// Tab-separated (TSV)
serialize(doc, { delimiter: '\t' });
// name	age
// Alice	30

// Pipe-separated (PSV)
serialize(doc, { delimiter: '|' });
// name|age
// Alice|30

// Quote all fields
serialize(doc, { quoting: 'all' });
// "name","age"
// "Alice","30"

// Quote only non-numeric fields
serialize(doc, { quoting: 'nonnumeric' });
// "name",age
// "Alice",30

// Custom line endings (Windows-style)
serialize(doc, { lineEnding: '\r\n' });

// No headers
serialize(doc, { headers: false });
// Alice,30
// Bob,25
```

## Types

### `CSVParseOptions`

Options for CSV parsing:

```typescript
interface CSVParseOptions {
  /** Field delimiter (`,`, `\t`, `|`). Default: `,` */
  delimiter?: string;

  /**
   * Header handling:
   * - `true` (default): First row is headers
   * - `false`: No headers (array of arrays)
   * - `string[]`: Custom header names
   */
  headers?: boolean | string[];

  /** Auto-detect and convert numbers/booleans. Default: `false` */
  inferTypes?: boolean;
}
```

### `CSVSerializeOptions`

Options for CSV serialization:

```typescript
interface CSVSerializeOptions {
  /** Field delimiter. Default: `,` */
  delimiter?: string;

  /**
   * Quote strategy:
   * - `'needed'`: Quote fields that require it (contains delimiter, newline, quote)
   * - `'all'`: Quote all fields
   * - `'nonnumeric'`: Quote non-numeric fields
   * - `'none'`: Never quote (may produce invalid CSV)
   */
  quoting?: 'needed' | 'all' | 'nonnumeric' | 'none';

  /** Line ending style. Default: `'\n'` */
  lineEnding?: '\n' | '\r\n';

  /**
   * Header handling:
   * - `true` (default for Objects): Auto-generate from keys
   * - `false`: No header row
   * - `string[]`: Custom header names
   */
  headers?: boolean | string[];
}
```

## Position Tracking

Every node in the AST includes position information:

```typescript
import { parse } from '@dastardly/csv';

const doc = parse('name,age\nAlice,30');

// Position info on every node
console.log(doc.loc);
// {
//   start: { line: 1, column: 0, offset: 0 },
//   end: { line: 2, column: 8, offset: 17 }
// }

// Even individual cells have positions
const data = doc.body;
if (data.type === 'Array' && data.elements[0]?.type === 'Object') {
  const firstRow = data.elements[0];
  console.log(firstRow.properties[0]?.value.loc);
  // Position of "Alice" in the CSV
}
```

## Common Patterns

### Type Inference

```typescript
import { parse } from '@dastardly/csv';

const doc = parse('name,age,active\nAlice,30,true', { inferTypes: true });

const data = doc.body;
if (data.type === 'Array' && data.elements[0]?.type === 'Object') {
  const row = data.elements[0];
  // age is Number, not String
  // active is Boolean, not String
}
```

### Headerless CSV (Array of Arrays)

```typescript
import { parse, serialize } from '@dastardly/csv';

// Parse without headers
const doc = parse('Alice,30\nBob,25', { headers: false });

// Produces array of arrays:
// [
//   ["Alice", "30"],
//   ["Bob", "25"]
// ]

// Serialize array of arrays
const output = serialize(doc, { headers: false });
// Alice,30
// Bob,25
```

### Custom Headers

```typescript
import { parse, serialize } from '@dastardly/csv';

// Parse with custom headers (source has no header row)
const doc = parse('Alice,30\nBob,25', {
  headers: ['name', 'age']
});

// Override headers when serializing
const output = serialize(doc, {
  headers: ['person', 'years']
});
// person,years
// Alice,30
// Bob,25
```

### Cross-format Conversion

```typescript
import { parse as parseCSV, serialize as serializeCSV } from '@dastardly/csv';
import { parse as parseJSON, serialize as serializeJSON } from '@dastardly/json';

// CSV → JSON
const csvDoc = parseCSV('name,age\nAlice,30\nBob,25');
const jsonOutput = serializeJSON(csvDoc, { indent: 2 });
// [
//   {
//     "name": "Alice",
//     "age": "30"
//   },
//   ...
// ]

// JSON → CSV
const jsonDoc = parseJSON('[{"name":"Alice","age":30}]');
const csvOutput = serializeCSV(jsonDoc);
// name,age
// Alice,30
```

### Error Handling

```typescript
import { parse } from '@dastardly/csv';
import { ParseError } from '@dastardly/core';

try {
  // Malformed CSV (unclosed quote)
  const doc = parse('name,age\n"Alice,30');
} catch (error) {
  if (error instanceof ParseError) {
    console.error(`Parse error at line ${error.line}, column ${error.column}`);
  }
}
```

## Edge Cases

### Empty Fields

```typescript
import { parse } from '@dastardly/csv';

// Empty fields become empty strings
const doc = parse('name,age\nAlice,\n,30');
// Alice has empty age, second row has empty name
```

### Special Characters

```typescript
import { parse, serialize } from '@dastardly/csv';

// Fields with commas are quoted automatically
const doc = parse('name,location\n"Alice","New York, NY"');

// Quotes within fields are escaped with double quotes
const doc2 = parse('quote\n"She said ""hello"""');
// Value: She said "hello"
```

### Large Numbers

```typescript
import { parse } from '@dastardly/csv';

// With type inference, numbers are parsed as numbers
const doc = parse('id\n9007199254740991', { inferTypes: true });
// Gets Number.MAX_SAFE_INTEGER

// Without type inference, stays as string
const doc2 = parse('id\n9007199254740991');
// Gets string "9007199254740991"
```

## Limitations

- **Variable field counts**: Rows with different numbers of fields are not currently supported
- **Multi-line values**: Only supported within quoted fields
- **Nested structures**: CSV is flat - nested objects/arrays require special handling (see serializer options)

## Related Packages

- **[@dastardly/core](../core)** - Core AST types and utilities
- **[@dastardly/json](../json)** - JSON parser and serializer
- **[@dastardly/yaml](../yaml)** - YAML parser and serializer

## License

MIT
