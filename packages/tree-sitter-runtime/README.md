# @bakes/dastardly-tree-sitter-runtime

Tree-sitter runtime abstraction and base parser for dASTardly.

## Installation

```bash
npm install @bakes/dastardly-tree-sitter-runtime
```

```bash
pnpm add @bakes/dastardly-tree-sitter-runtime
```

## Overview

`@bakes/dastardly-tree-sitter-runtime` provides an abstraction layer over tree-sitter parsers, making it easy to build format-specific parsers that convert tree-sitter's Concrete Syntax Tree (CST) to dASTardly's Abstract Syntax Tree (AST).

**Key Features:**
- **Runtime abstraction** - Works with both Node.js tree-sitter and web-tree-sitter (WASM)
- **Base parser class** - Extend `TreeSitterParser` to build format parsers
- **Position utilities** - Convert tree-sitter positions to dASTardly locations
- **Error handling** - `ParseError` with source location information
- **Type-safe** - Full TypeScript support with strict mode
- **Incremental parsing foundation** - Internal support for future incremental parsing API

## Quick Start

### Using the Base Parser

Extend `TreeSitterParser` to create a format-specific parser:

```typescript
import {
  TreeSitterParser,
  NodeTreeSitterRuntime,
  type DocumentNode,
  type SyntaxNode,
  type ParserRuntime,
  type Language,
  nodeToLocation,
} from '@bakes/dastardly-tree-sitter-runtime';
import { documentNode, stringNode } from '@bakes/dastardly-core';
import MY_LANGUAGE from 'tree-sitter-my-format';

export class MyFormatParser extends TreeSitterParser {
  constructor(runtime: ParserRuntime, language: Language) {
    super(runtime, language, 'my-format');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    // Convert tree-sitter CST to dASTardly AST
    const body = this.convertValue(node, source);
    return documentNode(body, loc);
  }

  private convertValue(node: SyntaxNode, source: string) {
    // Implementation specific to your format
    const loc = nodeToLocation(node, this.sourceFormat);
    return stringNode(node.text, loc);
  }
}

// Usage
const runtime = new NodeTreeSitterRuntime();
const parser = new MyFormatParser(runtime, MY_LANGUAGE);
const ast = parser.parse('source code here');
```

## API Reference

### Runtime

#### `NodeTreeSitterRuntime`

Runtime implementation for Node.js using the native tree-sitter binding:

```typescript
import { NodeTreeSitterRuntime } from '@bakes/dastardly-tree-sitter-runtime';

const runtime = new NodeTreeSitterRuntime();
```

**Methods:**
- `setLanguage(language: Language)` - Set the parser language
- `parse(source: string)` - Parse source into a syntax tree

### Base Parser

#### `TreeSitterParser`

Abstract base class for format-specific parsers:

```typescript
abstract class TreeSitterParser {
  protected readonly runtime: ParserRuntime;
  protected readonly sourceFormat: string;

  constructor(
    runtime: ParserRuntime,
    language: Language,
    sourceFormat: string
  );

  parse(source: string): DocumentNode;

  protected abstract convertDocument(
    node: SyntaxNode,
    source: string
  ): DocumentNode;
}
```

**Usage:**
1. Extend the class
2. Implement `convertDocument()` to convert CST to AST
3. Call `parse()` to parse source strings

### Types

#### `SyntaxNode`

Tree-sitter syntax tree node:

```typescript
interface SyntaxNode {
  readonly type: string;
  readonly text: string;
  readonly startPosition: TreeSitterPoint;
  readonly endPosition: TreeSitterPoint;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly childCount: number;
  readonly children: readonly SyntaxNode[];

  hasError(): boolean;
  child(index: number): SyntaxNode | null;
  childForFieldName(name: string): SyntaxNode | null;
  namedChild(index: number): SyntaxNode | null;
  // ... additional methods
}
```

#### `TreeSitterPoint`

Position in tree-sitter format:

```typescript
interface TreeSitterPoint {
  readonly row: number;    // 0-indexed line
  readonly column: number; // 0-indexed column
}
```

#### `SyntaxTree`

Tree-sitter syntax tree:

```typescript
interface SyntaxTree {
  readonly rootNode: SyntaxNode;
  edit(edit: Edit): void; // For incremental parsing (internal)
}
```

#### `ParserRuntime`

Abstract parser runtime interface:

```typescript
interface ParserRuntime {
  setLanguage(language: Language): void;
  parse(source: string): SyntaxTree;
}
```

### Utilities

#### `nodeToLocation(node, source)`

Convert tree-sitter node to dASTardly SourceLocation:

```typescript
import { nodeToLocation } from '@bakes/dastardly-tree-sitter-runtime';

const loc = nodeToLocation(syntaxNode, 'json');
// Returns: SourceLocation with line, column, offset
```

#### `pointToPosition(point, offset)`

Convert tree-sitter point to dASTardly Position:

```typescript
import { pointToPosition } from '@bakes/dastardly-tree-sitter-runtime';

const pos = pointToPosition(
  { row: 0, column: 5 },
  5
);
// Returns: Position { line: 1, column: 5, offset: 5 }
// Note: line is 1-indexed in Position, 0-indexed in TreeSitterPoint
```

#### `hasError(node)`

Check if a node or its descendants have errors:

```typescript
import { hasError } from '@bakes/dastardly-tree-sitter-runtime';

if (hasError(tree.rootNode)) {
  console.error('Parse errors detected');
}
```

#### `findErrorNode(node)`

Find the first error node in the tree:

```typescript
import { findErrorNode } from '@bakes/dastardly-tree-sitter-runtime';

const errorNode = findErrorNode(tree.rootNode);
if (errorNode) {
  console.error('Error at:', errorNode.startPosition);
}
```

### Errors

#### `ParseError`

Error thrown when parsing fails:

```typescript
class ParseError extends Error {
  constructor(
    message: string,
    public readonly loc: SourceLocation,
    public readonly source: string
  );
}
```

**Usage:**

```typescript
import { ParseError, nodeToLocation } from '@bakes/dastardly-tree-sitter-runtime';

if (tree.rootNode.hasError()) {
  throw new ParseError(
    'Invalid syntax',
    nodeToLocation(tree.rootNode, 'json'),
    source
  );
}
```

## Examples

### Complete Parser Implementation

```typescript
import {
  TreeSitterParser,
  NodeTreeSitterRuntime,
  type DocumentNode,
  type DataNode,
  type SyntaxNode,
  type ParserRuntime,
  type Language,
  nodeToLocation,
  ParseError,
} from '@bakes/dastardly-tree-sitter-runtime';
import {
  documentNode,
  objectNode,
  arrayNode,
  stringNode,
  numberNode,
  propertyNode,
  type PropertyNode,
} from '@bakes/dastardly-core';
import JSON_LANGUAGE from 'tree-sitter-json';

export class JSONParser extends TreeSitterParser {
  constructor(runtime: ParserRuntime, language: Language) {
    super(runtime, language, 'json');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // Get the value node (skip whitespace/comments)
    const valueNode = node.namedChild(0);
    if (!valueNode) {
      throw new ParseError('Empty document', loc, source);
    }

    const body = this.convertValue(valueNode, source);
    return documentNode(body, loc);
  }

  private convertValue(node: SyntaxNode, source: string): DataNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    switch (node.type) {
      case 'object':
        return this.convertObject(node, source);
      case 'array':
        return this.convertArray(node, source);
      case 'string':
        return stringNode(this.unescapeString(node.text), loc, node.text);
      case 'number':
        return numberNode(Number(node.text), loc, node.text);
      // ... handle other types
      default:
        throw new ParseError(`Unknown node type: ${node.type}`, loc, source);
    }
  }

  private convertObject(node: SyntaxNode, source: string) {
    const loc = nodeToLocation(node, this.sourceFormat);
    const properties: PropertyNode[] = [];

    for (const child of node.children) {
      if (child.type === 'pair') {
        properties.push(this.convertPair(child, source));
      }
    }

    return objectNode(properties, loc);
  }

  private convertPair(node: SyntaxNode, source: string): PropertyNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const keyNode = node.childForFieldName('key');
    const valueNode = node.childForFieldName('value');

    if (!keyNode || !valueNode) {
      throw new ParseError('Invalid pair', loc, source);
    }

    const key = this.convertValue(keyNode, source);
    const value = this.convertValue(valueNode, source);

    return propertyNode(key, value, loc);
  }

  private unescapeString(text: string): string {
    // Implementation for unescaping JSON strings
    return text.slice(1, -1); // Simplified
  }
}
```

### Using the Parser

```typescript
import { NodeTreeSitterRuntime } from '@bakes/dastardly-tree-sitter-runtime';
import { JSONParser } from './json-parser';
import JSON_LANGUAGE from 'tree-sitter-json';

const runtime = new NodeTreeSitterRuntime();
const parser = new JSONParser(runtime, JSON_LANGUAGE);

try {
  const ast = parser.parse('{"name": "Alice", "age": 30}');
  console.log(ast.body.type); // 'Object'
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Parse error at line', error.loc.start.line);
    console.error(error.message);
  }
}
```

### Reusing Parser Instances

Parser instances can be reused for better performance:

```typescript
const runtime = new NodeTreeSitterRuntime();
const parser = new JSONParser(runtime, JSON_LANGUAGE);

// Parse multiple sources with the same parser
const doc1 = parser.parse('{"a": 1}');
const doc2 = parser.parse('{"b": 2}');
const doc3 = parser.parse('{"c": 3}');
```

### Error Handling

```typescript
import { ParseError, hasError, findErrorNode } from '@bakes/dastardly-tree-sitter-runtime';

const tree = runtime.parse(source);

if (hasError(tree.rootNode)) {
  const errorNode = findErrorNode(tree.rootNode);
  if (errorNode) {
    throw new ParseError(
      `Syntax error: unexpected ${errorNode.type}`,
      nodeToLocation(errorNode, 'json'),
      source
    );
  }
}
```

## Design Patterns

### Runtime Abstraction

The `ParserRuntime` interface allows swapping between Node.js and browser implementations:

```typescript
// Node.js
const runtime = new NodeTreeSitterRuntime();

// Future: Browser (WASM)
// const runtime = new WasmTreeSitterRuntime();

const parser = new MyFormatParser(runtime, MY_LANGUAGE);
```

### Fail-Fast Parsing

The base parser throws errors immediately on parse failure:

```typescript
try {
  const ast = parser.parse(invalidSource);
} catch (error) {
  // Handle parse error with location info
}
```

### Position Conversion

Tree-sitter uses 0-indexed lines, dASTardly uses 1-indexed:

```typescript
// Tree-sitter: { row: 0, column: 5 }
// dASTardly:  { line: 1, column: 5, offset: 5 }

const pos = pointToPosition({ row: 0, column: 5 }, 5);
console.log(pos.line); // 1 (converted to 1-indexed)
```

## Future Features

### Incremental Parsing (v2)

The foundation for incremental parsing is in place but not exposed in v1. Future versions will support:

```typescript
// Future API (not yet available)
const edit: Edit = {
  startIndex: 10,
  oldEndIndex: 15,
  newEndIndex: 13,
  // ... position info
};

const doc = parser.parseIncremental(newSource, edit);
```

## Related Packages

- **[@bakes/dastardly-core](https://www.npmjs.com/package/@bakes/dastardly-core)** - Core AST types
- **[@bakes/dastardly-json](https://www.npmjs.com/package/@bakes/dastardly-json)** - JSON parser using this runtime
- **[@bakes/dastardly-yaml](https://www.npmjs.com/package/@bakes/dastardly-yaml)** - YAML parser (coming soon)

## Documentation

For more information:
- [Main Repository](https://github.com/thesoftwarebakery/dastardly)
- [Architecture Documentation](https://github.com/thesoftwarebakery/dastardly/blob/main/ARCHITECTURE.md)
- [Implementation Guide](https://github.com/thesoftwarebakery/dastardly/blob/main/IMPLEMENTATION_GUIDE.md)

## License

MIT
