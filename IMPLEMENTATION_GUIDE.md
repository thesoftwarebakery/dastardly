# Format Package Implementation Guide

This guide shows how to implement new format packages (YAML, XML, CSV, TOML, etc.) following the patterns established by `@dastardly/json`.

## Overview

Each format package follows this structure:
```
packages/format-name/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts          # Public API exports
│   ├── parser.ts         # FormatParser class
│   ├── serializer.ts     # serialize() function
│   └── utils.ts          # Format-specific utilities
└── __tests__/
    ├── utils.test.ts
    ├── parser.test.ts
    ├── serializer.test.ts
    └── integration.test.ts
```

## Step 1: Package Setup

### package.json
```json
{
  "name": "@dastardly/format-name",
  "version": "0.1.0",
  "description": "FORMAT parser and serializer for dASTardly",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dastardly/core": "workspace:*",
    "@dastardly/tree-sitter-runtime": "workspace:*",
    "tree-sitter": "^0.21.1",
    "tree-sitter-format-name": "^x.x.x"  // Find appropriate version
  },
  "devDependencies": {
    "@types/node": "^24.10.0",
    "@vitest/ui": "^1.6.1",
    "typescript": "^5.3.0",
    "vitest": "^1.6.1"
  }
}
```

### tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
  },
});
```

## Step 2: Utils Implementation

Create format-specific utilities (see `packages/json/src/utils.ts` as reference).

Common utilities needed:
- **String escaping**: Convert strings to format syntax
- **String unescaping**: Parse format escape sequences
- **Normalization helpers**: Convert options to standard forms

### Example Pattern (JSON)
```typescript
// Escaping
export function escapeString(value: string): string {
  // Handle format-specific escape sequences
}

// Unescaping
export function unescapeString(value: string): string {
  // Parse format-specific escape sequences
}

// Normalization
export function normalizeIndent(indent: number | string | undefined): string {
  if (indent === undefined || indent === 0) return '';
  if (typeof indent === 'number') return ' '.repeat(indent);
  return indent;
}
```

### Key Points
- Handle ALL format-specific escapes
- Validate edge cases (incomplete escapes, invalid sequences)
- Return meaningful defaults for edge cases
- Write comprehensive tests (aim for 100% coverage)

## Step 3: Parser Implementation

Create `FormatParser` class extending `TreeSitterParser`.

### Template
```typescript
import type { DocumentNode, DataNode } from '@dastardly/core';
import { documentNode, objectNode, arrayNode, /* ... */ } from '@dastardly/core';
import {
  TreeSitterParser,
  type ParserRuntime,
  type Language,
  type SyntaxNode,
  nodeToLocation,
  ParseError,
} from '@dastardly/tree-sitter-runtime';
import { unescapeString } from './utils.js';

export class FormatParser extends TreeSitterParser {
  constructor(runtime: ParserRuntime, language: Language) {
    super(runtime, language, 'format-name');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // 1. Extract the value node(s) from document
    // 2. Validate document structure (format-specific rules)
    // 3. Convert to AST
    const valueNode = this.convertValue(/* ... */, source);
    return documentNode(valueNode, loc);
  }

  private convertValue(node: SyntaxNode, source: string): DataNode {
    // Switch on node.type and delegate to specific converters
    switch (node.type) {
      case 'object': return this.convertObject(node, source);
      case 'array': return this.convertArray(node, source);
      case 'string': return this.convertString(node, source);
      // ... handle all value types
      default:
        throw new ParseError(`Unknown node type: ${node.type}`, loc, source);
    }
  }

  private convertObject(node: SyntaxNode, source: string): ObjectNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const properties: PropertyNode[] = [];

    // Extract properties from tree-sitter node
    for (const child of node.children) {
      if (child.type === 'pair') {  // Format-specific node type
        properties.push(this.convertPair(child, source));
      }
    }

    return objectNode(properties, loc);
  }

  private convertString(node: SyntaxNode, source: string): StringNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;
    const value = unescapeString(raw);
    return stringNode(value, loc, raw);
  }

  // ... implement converters for all data types
}
```

### Key Patterns
1. **Use `nodeToLocation(node, this.sourceFormat)`** for all nodes
2. **Use `node.text`** to get raw source text
3. **Use `node.childForFieldName('field')`** for named fields
4. **Validate and throw ParseError** for invalid structures
5. **Preserve raw values** (pass as 3rd argument to node constructors)
6. **Handle format-specific features** (e.g., YAML anchors, XML attributes)

### Tree-Sitter Node Types
Research your format's grammar to find:
- Document structure node type
- Value node types (object, array, string, number, etc.)
- How properties/pairs are represented
- Field names for accessing child nodes

Check `node-types.json` in the tree-sitter grammar package for details.

## Step 4: Serializer Implementation

Create `serialize()` function that converts AST back to format.

### Template
```typescript
import type { DocumentNode, DataNode } from '@dastardly/core';
import { escapeString, normalizeIndent } from './utils.js';

export interface SerializeOptions {
  indent?: number | string;
  preserveRaw?: boolean;
  // Format-specific options
}

export function serialize(
  node: DocumentNode | DataNode,
  options: SerializeOptions = {}
): string {
  const indent = normalizeIndent(options.indent);
  const preserveRaw = options.preserveRaw ?? false;

  if (node.type === 'Document') {
    return serializeValue(node.body, 0, indent, preserveRaw);
  }
  return serializeValue(node, 0, indent, preserveRaw);
}

function serializeValue(
  node: DataNode,
  depth: number,
  indent: string,
  preserveRaw: boolean
): string {
  switch (node.type) {
    case 'Object': return serializeObject(node, depth, indent, preserveRaw);
    case 'Array': return serializeArray(node, depth, indent, preserveRaw);
    case 'String': return serializeString(node, preserveRaw);
    case 'Number': return serializeNumber(node, preserveRaw);
    case 'Boolean': return node.value.toString();
    case 'Null': return 'null';  // Format-specific null representation
  }
}

function serializeObject(
  node: import('@dastardly/core').ObjectNode,
  depth: number,
  indent: string,
  preserveRaw: boolean
): string {
  if (node.properties.length === 0) {
    return '{}';  // Format-specific empty object syntax
  }

  // Compact mode
  if (indent === '') {
    const pairs = node.properties.map((prop) => {
      const key = serializeString(prop.key, preserveRaw);
      const value = serializeValue(prop.value, depth, indent, preserveRaw);
      return `${key}:${value}`;  // Format-specific pair syntax
    });
    return `{${pairs.join(',')}}`;  // Format-specific object syntax
  }

  // Pretty mode
  const pairs = node.properties.map((prop) => {
    const key = serializeString(prop.key, preserveRaw);
    const value = serializeValue(prop.value, depth + 1, indent, preserveRaw);
    return `${indent.repeat(depth + 1)}${key}: ${value}`;  // Format-specific
  });
  return `{\n${pairs.join(',\n')}\n${indent.repeat(depth)}}`;
}

// ... implement serializers for all types
```

### Key Patterns
1. **Support compact mode** (no whitespace) and **pretty mode** (indented)
2. **Use `preserveRaw` option** to maintain original formatting when available
3. **Validate values** (e.g., check for Infinity/NaN in numbers)
4. **Escape strings properly** using format-specific rules
5. **Handle empty structures** (empty objects/arrays)
6. **Respect depth** for nested indentation

## Step 5: Public API

Create `index.ts` to export public API.

### Template
```typescript
import type { DocumentNode, DataNode } from '@dastardly/core';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import FORMAT_LANGUAGE from 'tree-sitter-format-name';

// Re-export main classes and types
export { FormatParser } from './parser.js';
export { serialize, type SerializeOptions } from './serializer.js';
export { /* utils */ } from './utils.js';

import { FormatParser } from './parser.js';
import { serialize as serializeNode } from './serializer.js';

/**
 * Parse FORMAT string into a dASTardly DocumentNode.
 */
export function parse(source: string): DocumentNode {
  const runtime = new NodeTreeSitterRuntime();
  const parser = new FormatParser(runtime, FORMAT_LANGUAGE);
  return parser.parse(source);
}

/**
 * Parse FORMAT string and return just the body (DataNode).
 */
export function parseValue(source: string): DataNode {
  return parse(source).body;
}

/**
 * Serialize a dASTardly AST node to FORMAT string.
 */
export function stringify(
  node: DocumentNode | DataNode,
  indent?: number | string
): string {
  if (indent === undefined) {
    return serializeNode(node, {});
  }
  return serializeNode(node, { indent });
}
```

## Step 6: Testing

Create comprehensive tests following the JSON package pattern.

### Test Files Needed

**1. utils.test.ts** (100% coverage target)
- Test ALL escape/unescape scenarios
- Test edge cases (invalid escapes, incomplete sequences)
- Test normalization functions
- Example: 42 tests for JSON utils

**2. parser.test.ts** (95%+ coverage target)
- Test all primitive types
- Test all container types (objects, arrays)
- Test nested structures
- Test whitespace handling
- Test error cases (empty doc, syntax errors)
- Test position tracking
- Example: 38 tests for JSON parser

**3. serializer.test.ts** (95%+ coverage target)
- Test compact mode
- Test pretty mode (various indents)
- Test preserveRaw option
- Test number edge cases
- Test string escaping
- Test error cases (Infinity, NaN)
- Example: 23 tests for JSON serializer

**4. integration.test.ts** (smoke tests)
- Test public API functions
- Test roundtrip (parse → serialize → parse)
- Test real-world format samples
- Test class reusability
- Example: 12 tests for JSON integration

### Test Helpers
```typescript
import { sourceLocation, position } from '@dastardly/core';

// Create dummy location for AST node construction
const loc = sourceLocation(position(1, 0, 0), position(1, 1, 1), 'format');

// Roundtrip helper
function expectRoundtrip(source: string) {
  const doc1 = parse(source);
  const serialized = stringify(doc1);
  const doc2 = parse(serialized);
  // Verify structural equivalence
}
```

### Coverage Goals
- **Overall**: 90%+ line coverage
- **Utils**: 100% (these are critical)
- **Parser**: 95%+
- **Serializer**: 95%+
- **Integration**: Focus on real-world scenarios

## Step 7: Format-Specific Considerations

### YAML-Specific
- Handle anchors (`&anchor`) and aliases (`*anchor`)
- Handle tags (`!!str`, `!!int`)
- Handle multi-line strings (folded `>`, literal `|`)
- Consider storing YAML-specific features in metadata (or extend AST)
- Multiple documents in one file (use `---` separator)

### XML-Specific
- Handle attributes (store in metadata or extend PropertyNode)
- Handle namespaces
- Handle CDATA sections
- Handle processing instructions
- Text content vs child elements
- Self-closing tags

### CSV-Specific
- Arrays of arrays (no nested objects)
- Header row handling
- Delimiter options (comma, tab, semicolon)
- Quote handling
- Escape sequences
- Type inference (all strings by default)

### TOML-Specific
- Tables (`[table]`) and dotted keys
- Array of tables (`[[array]]`)
- Inline tables `{ key = value }`
- Multi-line strings (`'''` and `"""`)
- Datetime types

## Step 8: Documentation

Create README.md for the package:

```markdown
# @dastardly/format-name

FORMAT parser and serializer for dASTardly.

## Installation

\`\`\`bash
pnpm add @dastardly/format-name
\`\`\`

## Usage

### Parsing
\`\`\`typescript
import { parse, parseValue } from '@dastardly/format-name';

const doc = parse('format source here');
console.log(doc.body); // Access AST
\`\`\`

### Serializing
\`\`\`typescript
import { stringify } from '@dastardly/format-name';

const json = stringify(astNode);
const pretty = stringify(astNode, 2); // Pretty-print with 2 spaces
\`\`\`

### Advanced
\`\`\`typescript
import { FormatParser, serialize } from '@dastardly/format-name';
import { NodeTreeSitterRuntime } from '@dastardly/tree-sitter-runtime';
import FORMAT_LANGUAGE from 'tree-sitter-format-name';

// Reusable parser instance
const runtime = new NodeTreeSitterRuntime();
const parser = new FormatParser(runtime, FORMAT_LANGUAGE);

const doc1 = parser.parse('source 1');
const doc2 = parser.parse('source 2');

// Custom serialization options
const output = serialize(doc1, {
  indent: '\t',
  preserveRaw: true,
});
\`\`\`

## Format-Specific Features

[Document any format-specific features or limitations]

## API Reference

[Link to API docs]
```

## Checklist for New Format Package

- [ ] Package setup (package.json, tsconfig.json, vitest.config.ts)
- [ ] Install dependencies (pnpm install)
- [ ] Research tree-sitter grammar (node types, fields)
- [ ] Implement utils (escape, unescape, normalize)
- [ ] Write utils tests (100% coverage)
- [ ] Implement parser (FormatParser class)
- [ ] Write parser tests (95%+ coverage)
- [ ] Implement serializer (serialize function)
- [ ] Write serializer tests (95%+ coverage)
- [ ] Implement public API (index.ts)
- [ ] Write integration tests (roundtrip, real-world)
- [ ] Run all tests (`pnpm test`)
- [ ] Run typecheck (`pnpm typecheck`)
- [ ] Run build (`pnpm build`)
- [ ] Write README.md
- [ ] Update root README.md (add package to list)
- [ ] Commit with conventional commits format

## Common Pitfalls

1. **Forgetting to unescape strings** - Tree-sitter gives raw text with escape sequences
2. **Not handling empty structures** - Empty objects/arrays need special cases
3. **Not preserving raw values** - Pass raw as 3rd argument to node constructors
4. **Not tracking positions** - Use `nodeToLocation()` for every node
5. **Not handling format edge cases** - Each format has quirks (e.g., YAML null values)
6. **Breaking TypeScript strict mode** - Use `exactOptionalPropertyTypes` correctly
7. **Not testing roundtrips** - parse → serialize → parse should work
8. **Missing error handling** - Throw ParseError with location info

## Reference Implementation

See `packages/json/` for the complete reference implementation:
- `src/utils.ts`: String utilities (195 lines)
- `src/parser.ts`: JSONParser class (205 lines)
- `src/serializer.ts`: serialize function (155 lines)
- `src/index.ts`: Public API (60 lines)
- `__tests__/`: 115 comprehensive tests

Total implementation: ~600 lines of code + 1,500 lines of tests

## Getting Help

- Review `packages/json/` implementation
- Check ARCHITECTURE.md for design patterns
- Read tree-sitter grammar documentation
- Test incrementally (utils → parser → serializer)
