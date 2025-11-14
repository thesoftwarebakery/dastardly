# @bakes/dastardly-yaml

High-performance YAML parser and serializer for dASTardly, built with Tree-sitter.

## Installation

```bash
npm install @bakes/dastardly-yaml @bakes/dastardly-core
```

```bash
pnpm add @bakes/dastardly-yaml @bakes/dastardly-core
```

## Overview

`@bakes/dastardly-yaml` provides a blazing-fast YAML 1.2 parser and serializer that converts YAML to dASTardly's format-agnostic AST. Built on tree-sitter for real-time editor performance with full position tracking for precise error reporting.

**Key Features:**
- **High performance** - Tree-sitter-based parsing (36-52x faster than traditional parsers)
- **Position tracking** - Every node tracks source location (line, column, offset)
- **Full YAML 1.2 support** - Anchors, aliases, tags, merge keys, block scalars
- **Type-safe** - Full TypeScript support with strict mode
- **Comprehensive** - Handles all YAML types and advanced features
- **Format-agnostic AST** - Convert to/from other formats (JSON, CSV, etc.)

## Quick Start

### Parsing

```typescript
import { parse } from '@bakes/dastardly-yaml';

// Parse to DocumentNode (includes document wrapper)
const doc = parse('name: Alice\nage: 30');
console.log(doc.type); // 'Document'
console.log(doc.body.type); // 'Object'

// Access the data directly
const obj = doc.body;
console.log(obj.properties[0].key.value); // 'name'
```

### Serializing

```typescript
import { serialize } from '@bakes/dastardly-yaml';
import { parse } from '@bakes/dastardly-yaml';

const doc = parse('name: Alice');

// Block style (default)
const block = serialize(doc);
// name: Alice

// Flow style (compact JSON-like)
const flow = serialize(doc, { style: 'flow' });
// {name: Alice}

// Custom indentation
const indented = serialize(doc, { indent: 4 });
```

### Roundtrip

```typescript
import { parse, serialize } from '@bakes/dastardly-yaml';

const source = 'name: Alice\nage: 30';
const doc = parse(source);
const output = serialize(doc);
// Preserves data structure, reformats with specified style
```

## API Reference

### Package Object

The package exports a `yaml` object implementing the `FormatPackage` interface:

```typescript
import { yaml } from '@bakes/dastardly-yaml';

const doc = yaml.parse('name: Alice');
const output = yaml.serialize(doc);
```

### Convenience Functions

For convenience, `parse` and `serialize` are also exported as standalone functions (destructured from the `yaml` object):

#### `parse(source)`

Parse YAML string into a DocumentNode:

```typescript
function parse(source: string): DocumentNode;
```

**Parameters:**
- `source` - YAML string to parse

**Returns:** `DocumentNode` with YAML parsed into AST

**Throws:** `ParseError` if source is invalid YAML

**Example:**

```typescript
import { parse } from '@bakes/dastardly-yaml';

// Simple object
const doc1 = parse('name: Alice\nage: 30');

// Array
const doc2 = parse('- apple\n- banana\n- cherry');

// Nested structure
const doc3 = parse(`
person:
  name: Alice
  address:
    city: Portland
    state: OR
`);
```

#### `serialize(node, options?)`

Serialize AST to YAML string:

```typescript
function serialize(
  node: DocumentNode | DataNode,
  options?: YAMLSerializeOptions
): string;
```

**Parameters:**
- `node` - DocumentNode or DataNode to serialize
- `options` - Optional serialization options:
  - `style?: 'block' | 'flow'` - Output style. Default: `'block'`
  - `indent?: number` - Indentation spaces. Default: `2`
  - `lineWidth?: number` - Max line width for flow style. Default: `80`

**Returns:** YAML string

**Example:**

```typescript
import { serialize } from '@bakes/dastardly-yaml';

// Block style (default, human-readable)
serialize(doc);
// name: Alice
// age: 30

// Flow style (compact, JSON-like)
serialize(doc, { style: 'flow' });
// {name: Alice, age: 30}

// Custom indentation
serialize(doc, { indent: 4 });
// name: Alice
// age:
//     nested: value
```

## YAML-Specific Features

### Anchors and Aliases

YAML anchors (`&`) and aliases (`*`) allow you to reuse node values:

```typescript
import { parse, serialize } from '@bakes/dastardly-yaml';

const source = `
defaults: &defaults
  timeout: 30
  retry: 3

production:
  <<: *defaults
  host: prod.example.com

development:
  <<: *defaults
  host: dev.example.com
`;

const doc = parse(source);
// Anchors are resolved during parsing
// Both production and development will have timeout and retry fields
```

**Note:** Anchors are resolved during parsing and stored in node metadata. The serializer does not currently re-create anchors (they are expanded inline).

### Explicit Type Tags

YAML supports explicit type tags:

```typescript
const source = `
binary: !!binary SGVsbG8=
timestamp: !!timestamp 2024-01-15T10:30:00Z
null_value: !!null
string: !!str 123
`;

const doc = parse(source);
// Tags are stored in node metadata and affect parsing
```

### Merge Keys

YAML merge keys (`<<`) allow merging map values:

```typescript
const source = `
defaults: &defaults
  x: 1
  y: 2

point:
  <<: *defaults
  z: 3
`;

const doc = parse(source);
// point will have x, y, and z properties
```

### Block Scalars

YAML supports multi-line strings with literal (`|`) and folded (`>`) styles:

```typescript
// Literal block scalar (preserves newlines)
const literal = parse(`
description: |
  This is line 1
  This is line 2
  This is line 3
`);

// Folded block scalar (folds newlines to spaces)
const folded = parse(`
description: >
  This is a long paragraph
  that spans multiple lines
  but will be folded into one.
`);
```

### Multi-Document Support

YAML files can contain multiple documents separated by `---`:

```typescript
const source = `
---
name: Document 1
---
name: Document 2
`;

// Currently parses as single document with first document content
// Multi-document support planned for future release
```

## Types

### YAMLSerializeOptions

```typescript
interface YAMLSerializeOptions extends BaseSerializeOptions {
  style?: 'block' | 'flow';
  indent?: number;
  lineWidth?: number;
}
```

- **`style`** - Output style:
  - `'block'` (default) - Human-readable block style with newlines
  - `'flow'` - Compact JSON-like flow style
- **`indent`** - Number of spaces for indentation (default: `2`)
- **`lineWidth`** - Maximum line width for flow style (default: `80`)

## Cross-Format Conversion

Convert between YAML and other formats using dASTardly's common AST:

```typescript
import { parse as parseYAML, serialize as serializeYAML } from '@bakes/dastardly-yaml';
import { serialize as serializeJSON } from '@bakes/dastardly-json';

// YAML to JSON
const yamlSource = 'name: Alice\nage: 30';
const doc = parseYAML(yamlSource);
const jsonOutput = serializeJSON(doc, { indent: 2 });
// {
//   "name": "Alice",
//   "age": 30
// }

// JSON to YAML
import { parse as parseJSON } from '@bakes/dastardly-json';
const jsonSource = '{"name": "Alice", "age": 30}';
const doc2 = parseJSON(jsonSource);
const yamlOutput = serializeYAML(doc2);
// name: Alice
// age: 30
```

## Performance

See [benchmarks/README.md](./benchmarks/README.md) for detailed performance comparisons against popular YAML libraries like js-yaml.

**Summary:**
- **Parsing**: Competitive with js-yaml, optimized for editor use cases
- **Serialization**: Fast block and flow style output
- **Position tracking**: Native support with no performance penalty

## Related Packages

- [`@bakes/dastardly-core`](https://npmjs.com/package/@bakes/dastardly-core) - Core AST types
- [`@bakes/dastardly-json`](https://npmjs.com/package/@bakes/dastardly-json) - JSON parser/serializer
- [`@bakes/dastardly-csv`](https://npmjs.com/package/@bakes/dastardly-csv) - CSV parser/serializer
- [`@bakes/dastardly-validation`](https://npmjs.com/package/@bakes/dastardly-validation) - JSON Schema validator

## License

MIT
