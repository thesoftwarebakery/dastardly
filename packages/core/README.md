# @bakes/dastardly-core

Core AST types and utilities for dASTardly - a high-performance, format-agnostic Abstract Syntax Tree for data interchange formats.

## Installation

```bash
npm install @bakes/dastardly-core
```

```bash
pnpm add @bakes/dastardly-core
```

## Overview

`@bakes/dastardly-core` provides the foundational types and utilities for building and working with dASTardly ASTs. It defines a format-agnostic representation of structured data that can be used across JSON, YAML, XML, CSV, and other formats.

**Key Features:**
- **Format-agnostic AST types** - Common representation for all data formats
- **Position tracking** - Every node tracks source location (line, column, offset)
- **Type-safe** - Full TypeScript support with discriminated unions
- **Builder functions** - Convenient constructors for AST nodes
- **Type guards** - Runtime type checking utilities
- **Traversal utilities** - Visitor pattern for AST manipulation
- **Immutable** - All nodes use readonly properties

## Quick Start

```typescript
import {
  documentNode,
  objectNode,
  propertyNode,
  stringNode,
  numberNode,
  position,
  sourceLocation,
} from '@bakes/dastardly-core';

// Create a simple AST
const loc = sourceLocation(
  position(1, 0, 0),
  position(1, 20, 20),
  'json'
);

const ast = documentNode(
  objectNode([
    propertyNode(
      stringNode('name', loc),
      stringNode('Alice', loc),
      loc
    ),
    propertyNode(
      stringNode('age', loc),
      numberNode(30, loc),
      loc
    ),
  ], loc),
  loc
);

console.log(ast.body.type); // 'Object'
console.log(ast.body.properties[0].key.value); // 'name'
```

## API Reference

### Types

#### Position

Represents a position in source text:

```typescript
interface Position {
  readonly line: number;   // 1-indexed line number
  readonly column: number; // 0-indexed column number
  readonly offset: number; // Byte offset from start
}
```

#### SourceLocation

Represents a range in source text:

```typescript
interface SourceLocation {
  readonly start: Position;
  readonly end: Position;
  readonly source?: string; // Source format (e.g., 'json', 'yaml')
}
```

#### AST Node Types

All AST nodes extend the base `ASTNode` interface:

```typescript
interface ASTNode {
  readonly type: string;
  readonly loc: SourceLocation;
}
```

**Value Nodes:**
- `StringNode` - String values
- `NumberNode` - Numeric values
- `BooleanNode` - Boolean values
- `NullNode` - Null values

**Container Nodes:**
- `ObjectNode` - Key-value pairs (objects/maps)
- `ArrayNode` - Ordered lists
- `PropertyNode` - Object property (key-value pair)

**Document:**
- `DocumentNode` - Root document node containing a single data value

**Type Aliases:**
- `ValueNode` - Union of primitive value nodes
- `DataNode` - Union of all value and container nodes
- `ContainerNode` - Union of Object and Array nodes

### Builder Functions

Builder functions provide a convenient way to create AST nodes:

#### `position(line, column, offset)`

Create a Position:

```typescript
const pos = position(1, 0, 0);
```

#### `sourceLocation(start, end, source?)`

Create a SourceLocation:

```typescript
const loc = sourceLocation(
  position(1, 0, 0),
  position(1, 10, 10),
  'json'
);
```

#### Value Node Builders

```typescript
// String node
const str = stringNode('hello', loc);
const strWithRaw = stringNode('hello', loc, '"hello"');

// Number node
const num = numberNode(42, loc);
const numWithRaw = numberNode(3.14, loc, '3.14');

// Boolean node
const bool = booleanNode(true, loc);
const boolWithRaw = booleanNode(false, loc, 'false');

// Null node
const nil = nullNode(loc);
const nilWithRaw = nullNode(loc, 'null');
```

All value nodes accept an optional third `raw` parameter to preserve the original source representation.

#### Container Node Builders

```typescript
// Property node (key-value pair)
const prop = propertyNode(
  stringNode('key', loc),
  stringNode('value', loc),
  loc
);

// Object node
const obj = objectNode([prop1, prop2], loc);

// Array node
const arr = arrayNode([str, num, bool], loc);
```

#### Document Node

```typescript
const doc = documentNode(obj, loc);
```

### Type Guards

Type guards provide runtime type checking for AST nodes:

```typescript
import {
  isObjectNode,
  isArrayNode,
  isStringNode,
  isNumberNode,
  isBooleanNode,
  isNullNode,
  isValueNode,
  isContainerNode,
  isDocumentNode,
  isPropertyNode,
} from '@bakes/dastardly-core';

if (isObjectNode(node)) {
  // TypeScript knows node is ObjectNode
  console.log(node.properties);
}

if (isValueNode(node)) {
  // node is StringNode | NumberNode | BooleanNode | NullNode
}

if (isContainerNode(node)) {
  // node is ObjectNode | ArrayNode
}
```

### Traversal

Traverse and manipulate AST nodes using the visitor pattern:

#### `visit(node, visitor)`

Visit nodes with a visitor object:

```typescript
import { visit } from '@bakes/dastardly-core';

visit(ast, {
  String(node) {
    console.log('Found string:', node.value);
  },
  Number(node) {
    console.log('Found number:', node.value);
  },
});
```

#### `traverse(node, callback)`

Traverse all nodes with a callback:

```typescript
import { traverse } from '@bakes/dastardly-core';

traverse(ast, (node) => {
  console.log(node.type, node.loc);
});
```

#### `findAll(node, predicate)`

Find all nodes matching a predicate:

```typescript
import { findAll, isStringNode } from '@bakes/dastardly-core';

const stringNodes = findAll(ast, isStringNode);
```

#### `findFirst(node, predicate)`

Find the first node matching a predicate:

```typescript
import { findFirst, isNumberNode } from '@bakes/dastardly-core';

const firstNumber = findFirst(ast, isNumberNode);
```

#### `getChildren(node)`

Get direct children of a node:

```typescript
import { getChildren } from '@bakes/dastardly-core';

const children = getChildren(objectNode);
// Returns array of PropertyNodes
```

### Utilities

#### `toNative(node)`

Convert AST to native JavaScript values:

```typescript
import { toNative } from '@bakes/dastardly-core';

const obj = objectNode([
  propertyNode(
    stringNode('name', loc),
    stringNode('Alice', loc),
    loc
  ),
], loc);

const native = toNative(obj);
// { name: 'Alice' }
```

Converts:
- `ObjectNode` → Plain JavaScript object
- `ArrayNode` → JavaScript array
- `StringNode` → string
- `NumberNode` → number
- `BooleanNode` → boolean
- `NullNode` → null

## Type Safety

All AST types use TypeScript discriminated unions for proper type narrowing:

```typescript
function processNode(node: DataNode) {
  switch (node.type) {
    case 'Object':
      // TypeScript knows node is ObjectNode
      node.properties.forEach(prop => {
        console.log(prop.key.value);
      });
      break;
    case 'Array':
      // TypeScript knows node is ArrayNode
      node.elements.forEach(el => {
        console.log(el.type);
      });
      break;
    case 'String':
      // TypeScript knows node is StringNode
      console.log(node.value);
      break;
    // ... handle other types
  }
}
```

## Position Tracking

Every node includes precise source location information:

```typescript
const node = stringNode('hello', sourceLocation(
  position(1, 5, 5),   // line 1, column 5, offset 5
  position(1, 12, 12), // line 1, column 12, offset 12
  'json'
));

console.log(node.loc.start.line);    // 1
console.log(node.loc.start.column);  // 5
console.log(node.loc.source);        // 'json'
```

This enables:
- Precise error reporting with line/column numbers
- Source maps for transformations
- Cross-format error mapping

## Examples

### Building Complex AST

```typescript
import {
  documentNode,
  objectNode,
  arrayNode,
  propertyNode,
  stringNode,
  numberNode,
  booleanNode,
  position,
  sourceLocation,
} from '@bakes/dastardly-core';

const loc = sourceLocation(
  position(1, 0, 0),
  position(10, 0, 100),
  'json'
);

const ast = documentNode(
  objectNode([
    propertyNode(
      stringNode('users', loc),
      arrayNode([
        objectNode([
          propertyNode(stringNode('name', loc), stringNode('Alice', loc), loc),
          propertyNode(stringNode('age', loc), numberNode(30, loc), loc),
          propertyNode(stringNode('active', loc), booleanNode(true, loc), loc),
        ], loc),
        objectNode([
          propertyNode(stringNode('name', loc), stringNode('Bob', loc), loc),
          propertyNode(stringNode('age', loc), numberNode(25, loc), loc),
          propertyNode(stringNode('active', loc), booleanNode(false, loc), loc),
        ], loc),
      ], loc),
      loc
    ),
  ], loc),
  loc
);
```

### Traversing and Transforming

```typescript
import { visit, isStringNode } from '@bakes/dastardly-core';

// Collect all string values
const strings: string[] = [];
visit(ast, {
  String(node) {
    strings.push(node.value);
  },
});

// Find all objects with a specific property
const usersWithAge = findAll(ast, (node) => {
  if (!isObjectNode(node)) return false;
  return node.properties.some(
    prop => isStringNode(prop.key) && prop.key.value === 'age'
  );
});
```

### Converting to Native Values

```typescript
import { toNative, parseValue } from '@bakes/dastardly-json';

const ast = parseValue('{"name": "Alice", "age": 30}');
const obj = toNative(ast);

console.log(obj.name); // 'Alice'
console.log(obj.age);  // 30
```

## Related Packages

- **[@bakes/dastardly-json](https://www.npmjs.com/package/@bakes/dastardly-json)** - JSON parser and serializer
- **[@bakes/dastardly-tree-sitter-runtime](https://www.npmjs.com/package/@bakes/dastardly-tree-sitter-runtime)** - Tree-sitter runtime abstraction
- **[@bakes/dastardly-yaml](https://www.npmjs.com/package/@bakes/dastardly-yaml)** - YAML parser and serializer (coming soon)

## Documentation

For more information:
- [Main Repository](https://github.com/thesoftwarebakery/dastardly)
- [Architecture Documentation](https://github.com/thesoftwarebakery/dastardly/blob/main/ARCHITECTURE.md)
- [Contributing Guide](https://github.com/thesoftwarebakery/dastardly/blob/main/CONTRIBUTING.md)

## License

MIT
