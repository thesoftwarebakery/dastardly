# dASTardly Architecture

This document describes the architectural design and technical decisions for dASTardly.

> **See also**: [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and [CLAUDE.md](CLAUDE.md) for project context

## Overview

dASTardly is a cross-format data parser and serializer that uses a common Abstract Syntax Tree (AST) as an intermediate representation. This enables lossless conversion between formats (where possible) and cross-format validation.

## Design Goals

1. **Real-time Performance**: Parse on every keystroke in a text editor without lag
2. **Position Preservation**: Maintain accurate source locations for error reporting
3. **Format Agnostic**: Common AST representation independent of source format
4. **Extensible**: Easy to add new formats without modifying existing code
5. **Type Safe**: Full TypeScript support with strict mode

## Key Design Decisions

### Parser Runtime
- **Primary**: Native `tree-sitter` npm package for Node.js (optimal performance)
- **Future**: Design with `web-tree-sitter` (WASM) compatibility in mind for browser support
- **Architecture**: Abstract parser interface to allow runtime swapping

### Error Handling Strategy
- **Parsing**: Fail fast - throw errors immediately on parse failure
- **Validation**: Collect all errors by default, with optional fail-fast mode
- **Serialization**: Throw errors for impossible conversions (e.g., nested objects to CSV)

### Implementation Order
1. **Phase 0**: Core AST package (in progress)
2. **Phase 1a**: JSON parser and serializer
3. **Phase 1b**: YAML parser and serializer
4. **Phase 2**: Additional formats (XML, CSV, TOML)
5. **Phase 3**: Schema validation

### Technology Stack
- **Package Manager**: pnpm (monorepo with workspaces)
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest
- **Formatting**: Prettier

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  User Applications                      │
│              (Editors, CLI tools, etc.)                 │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  Format Packages                        │
│     (@dastardly/json, @dastardly/yaml, etc.)           │
│                                                         │
│  ┌──────────────┐              ┌──────────────┐        │
│  │   Parser     │              │  Serializer  │        │
│  │              │              │              │        │
│  │ tree-sitter  │              │  AST → Text  │        │
│  │   → AST      │              │              │        │
│  └──────────────┘              └──────────────┘        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Core AST (@dastardly/core)                 │
│                                                         │
│  • AST Node Types (Object, Array, String, etc.)        │
│  • Source Location Types (Position, Span)              │
│  • Visitor Pattern                                     │
│  • Utilities                                           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│         Tree-sitter Runtime Utilities                   │
│       (@dastardly/tree-sitter-runtime)                  │
│                                                         │
│  • Tree-sitter wrapper                                 │
│  • CST → AST conversion helpers                        │
│  • Incremental parsing support                         │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Tree-sitter (Native)                       │
│         Incremental parsing engine                      │
└─────────────────────────────────────────────────────────┘
```

## Core AST Design

### Node Types

The AST represents structured data with these node types:

- **ObjectNode**: Key-value pairs (maps/dictionaries)
- **ArrayNode**: Ordered lists
- **StringNode**: Text values
- **NumberNode**: Numeric values
- **BooleanNode**: True/false values
- **NullNode**: Null/nil/none values

### Position Tracking

Every node contains source location information:

```typescript
interface Position {
  line: number;    // 1-indexed line number
  column: number;  // 0-indexed column number
  offset: number;  // Byte offset from start of file
}

interface SourceLocation {
  start: Position;
  end: Position;
  source?: string; // Original format (e.g., "json", "yaml")
}

interface ASTNode {
  type: string;
  loc: SourceLocation;
  // ... node-specific fields
}
```

This enables:
- Precise error reporting with line/column numbers
- Source map generation
- Incremental re-parsing of changed regions
- Cross-format error mapping (validate YAML against JSON schema, report YAML line numbers)

### Format-Specific Metadata

Some formats have unique features that don't map to the common AST:

- **XML**: Attributes, namespaces, processing instructions
- **YAML**: Anchors, aliases, explicit tags
- **CSV**: Headers, delimiters

These are stored in optional metadata fields:

```typescript
interface ObjectNode extends ASTNode {
  type: 'Object';
  properties: PropertyNode[];
  metadata?: {
    xml?: {
      tagName: string;
      attributes: Record<string, string>;
      namespace?: string;
    };
  };
}
```

## Parser Architecture

### Tree-sitter Integration

All parsers use tree-sitter for lexing and parsing. The architecture supports both native and WASM runtimes:

```typescript
// Abstract parser runtime interface for compatibility
interface ParserRuntime {
  parse(source: string): SyntaxTree;
  setLanguage(language: Language): void;
}

// Base parser class
abstract class TreeSitterParser {
  protected runtime: ParserRuntime;

  constructor(runtime: ParserRuntime, language: Language) {
    this.runtime = runtime;
    this.runtime.setLanguage(language);
  }

  parse(source: string): DocumentNode {
    const tree = this.runtime.parse(source);
    if (tree.rootNode.hasError) {
      throw new ParseError(
        'Failed to parse document',
        this.getErrorLocation(tree.rootNode, source),
        source
      );
    }
    return this.convert(tree.rootNode, source);
  }

  protected abstract convert(
    node: SyntaxNode,
    source: string
  ): DocumentNode;
}
```

This abstraction allows switching between:
- `tree-sitter` (native C++ bindings for Node.js)
- `web-tree-sitter` (WASM for browsers)

Without changing format-specific parser implementations.

### Why Tree-sitter?

1. **Incremental Parsing**: Only re-parses changed text
   - Stores previous parse tree
   - Uses edit operations to update tree
   - 10-100x faster than full re-parse for small edits

2. **Error Recovery**: Produces valid tree even for invalid input
   - Continues parsing after errors
   - Marks error nodes in tree
   - Enables validation while typing

3. **Performance**: Written in C, optimized for speed
   - Parses on every keystroke without lag
   - Used in production editors (VS Code, GitHub)

4. **Position Tracking**: Native support for source locations
   - Every node has start/end position
   - Line/column tracking built-in

### Incremental Parsing Support

Tree-sitter's incremental parsing is a key performance feature for real-time editing scenarios.

#### Current Status (v1)

The foundation for incremental parsing is in place but **not exposed** in the public API:

- `ParserRuntime.parse()` accepts an optional `oldTree` parameter
- `SyntaxTree` interface includes an `edit()` method
- `Edit` and `Point` types define the edit operation structure

These are marked `@internal` and not part of the stable v1 API.

#### Future Support (v2+)

Full incremental parsing will be exposed in a future version:

**API Design (planned):**
```typescript
const parser = new JSONParser();

// Initial parse
const doc1 = parser.parse('{"name": "Alice"}');

// User edits source - provide edit info for incremental parsing
const edit: Edit = {
  startIndex: 10,
  oldEndIndex: 15,
  newEndIndex: 13,
  startPosition: { row: 0, column: 10 },
  oldEndPosition: { row: 0, column: 15 },
  newEndPosition: { row: 0, column: 13 },
};

const doc2 = parser.parseIncremental('{"name": "Bob"}', edit);
```

**Key Design Points:**
- Tree-sitter reuses unchanged CST nodes internally for performance
- dASTardly AST remains **immutable** - each parse returns a new AST
- Performance benefit comes from CST-level optimization, not AST mutation
- Parser caches the tree-sitter tree between parses

**Why Defer to v2:**
1. Complexity: Requires tracking source changes and calculating edits
2. Use case: Most initial users parse complete documents
3. Testing: Incremental parsing requires sophisticated test scenarios
4. API surface: Keep v1 focused on core parsing and serialization

The current v1 architecture **does not block** future incremental parsing support.

### Parser Workflow

```
Source Text
    ↓
tree-sitter grammar
    ↓
Concrete Syntax Tree (CST)
    ↓
Format-specific converter
    ↓
dASTardly AST
```

Example (JSON):

```typescript
// Input
const source = '{"name": "Alice", "age": 30}';

// Tree-sitter produces CST with position info
const cst = parser.parse(source);

// Convert to dASTardly AST
const ast: DocumentNode = {
  type: 'Document',
  body: {
    type: 'Object',
    properties: [
      {
        type: 'Property',
        key: { type: 'String', value: 'name', loc: {...} },
        value: { type: 'String', value: 'Alice', loc: {...} },
        loc: { start: {line: 1, column: 1}, end: {line: 1, column: 16} }
      },
      {
        type: 'Property',
        key: { type: 'String', value: 'age', loc: {...} },
        value: { type: 'Number', value: 30, loc: {...} },
        loc: { start: {line: 1, column: 18}, end: {line: 1, column: 28} }
      }
    ],
    loc: { start: {line: 1, column: 0}, end: {line: 1, column: 31} }
  },
  loc: { start: {line: 1, column: 0}, end: {line: 1, column: 31} }
};
```

## Serializer Architecture

Serializers convert AST back to text format:

```typescript
interface SerializerOptions {
  indent?: number | string;
  preserveFormatting?: boolean;

  // Format-specific options
  xml?: { attributeStrategy?: 'preserve' | 'as-property' };
  csv?: { delimiter?: string; headers?: boolean };
}

class Serializer {
  serialize(ast: DocumentNode, options?: SerializerOptions): string;
}
```

### Handling Incompatibilities

Some conversions are lossy or impossible:

| Source → Target | Challenge | Strategy |
|----------------|-----------|----------|
| XML → JSON | Attributes | Convert to `@attribute` properties |
| XML → CSV | Nested objects | Flatten with dot notation or error |
| YAML → JSON | Anchors/aliases | Resolve to values |
| JSON → CSV | Nested objects | Error or flatten with config |
| Any → CSV | Non-tabular | Require array of objects |

Serializers should:
1. **Throw descriptive errors** for impossible conversions
2. **Provide options** for ambiguous cases
3. **Preserve data** where possible
4. **Document behavior** clearly

## Validation Architecture

(Future feature - Phase 3)

```typescript
interface ValidationError {
  message: string;
  path: string[];        // JSON path to error
  loc: SourceLocation;   // Original source location
  schemaPath: string[];  // Path in schema
}

interface ValidationOptions {
  failFast?: boolean;    // Stop at first error (default: false)
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

class SchemaValidator {
  validate(
    ast: DocumentNode,
    schema: JSONSchema,
    options?: ValidationOptions
  ): ValidationResult {
    // Validate AST (format-agnostic) against schema
    // Collect all errors unless failFast is true
    // Return errors with original source positions
  }
}
```

This enables:
- Validate YAML against JSON Schema
- Report errors at YAML line numbers
- Same schema works for any format
- User can choose to see all errors or stop at first error

## Monorepo Structure

### Package Dependencies

```
@dastardly/json ──┐
@dastardly/yaml ──┼──→ @dastardly/tree-sitter-runtime ──→ @dastardly/core
@dastardly/xml  ──┤                                              ↑
@dastardly/csv  ──┘                                              │
@dastardly/validator ────────────────────────────────────────────┘
```

### Why Monorepo?

1. **Shared types**: Core AST types used by all packages
2. **Coordinated releases**: Breaking changes affect all packages
3. **Easier testing**: Test cross-format conversions
4. **Developer experience**: Work on multiple packages simultaneously

### Package Publishing

- All packages versioned together
- Published to npm with `@dastardly/` scope
- Users can install only formats they need:
  ```bash
  npm install @dastardly/json @dastardly/yaml
  ```

## Performance Characteristics

### Expected Performance

Based on tree-sitter benchmarks:

| File Size | Format | Initial Parse | Incremental Update |
|-----------|--------|---------------|-------------------|
| 1 KB      | JSON   | < 1ms        | < 0.1ms          |
| 10 KB     | JSON   | < 5ms        | < 0.5ms          |
| 100 KB    | JSON   | < 50ms       | < 2ms            |
| 1 MB      | JSON   | < 500ms      | < 10ms           |

YAML is ~2-3x slower than JSON due to complexity.

### Optimization Strategies

1. **Lazy parsing**: Only parse visible regions (future)
2. **Incremental updates**: Reuse unchanged nodes
3. **Stream processing**: For very large files (future)
4. **Worker threads**: Parse in background (future)

## Error Handling

### Parser Errors

```typescript
class ParseError extends Error {
  constructor(
    message: string,
    public loc: SourceLocation,
    public source: string
  ) {
    super(`${message} at ${loc.start.line}:${loc.start.column}`);
  }
}
```

### Serialization Errors

```typescript
class SerializationError extends Error {
  constructor(
    message: string,
    public node: ASTNode,
    public targetFormat: string
  ) {
    super(
      `Cannot serialize ${node.type} from ${node.loc.source} ` +
      `to ${targetFormat} at ${node.loc.start.line}:${node.loc.start.column}`
    );
  }
}
```

## Future Considerations

### Schema Evolution

- Support for additional schema formats (RelaxNG, XSD)
- Schema generation from AST
- Schema migration tools

### Advanced Features

- **Source maps**: Generate source maps for transformations
- **Formatting**: Preserve original formatting on roundtrip
- **Streaming**: Parse/serialize large files incrementally
- **Plugins**: User-defined node types and transformations

### Editor Integration

- Language Server Protocol (LSP) implementation
- VS Code extension
- Real-time validation
- Auto-completion based on schema

## Format Package Pattern (Established with JSON)

Each format package follows a consistent pattern. See `IMPLEMENTATION_GUIDE.md` for full details.

### Package Structure
```
packages/format-name/
├── src/
│   ├── index.ts          # Public API (parse, stringify, etc.)
│   ├── parser.ts         # FormatParser extends TreeSitterParser
│   ├── serializer.ts     # serialize() function
│   └── utils.ts          # Format-specific utilities
└── __tests__/
    ├── utils.test.ts
    ├── parser.test.ts
    ├── serializer.test.ts
    └── integration.test.ts
```

### Implementation Pattern

**Parser Class**:
- Extends `TreeSitterParser` from `@dastardly/tree-sitter-runtime`
- Implements `convertDocument(node, source): DocumentNode`
- Uses tree-sitter CST → dASTardly AST conversion
- Preserves source positions with `nodeToLocation()`
- Stores raw values for formatting preservation

**Serializer Function**:
- Exports `serialize(node, options)` function
- Supports compact and pretty-print modes
- Optional `preserveRaw` to maintain original formatting
- Handles format-specific escaping/encoding

**Public API**:
- `parse(source): DocumentNode` - Convenience parser
- `parseValue(source): DataNode` - Returns just body
- `stringify(node, indent?): string` - Convenience serializer
- Exports main classes and utilities

### Testing Standards
- **Utils**: 100% coverage (critical for correctness)
- **Parser**: 95%+ coverage (all types, errors, positions)
- **Serializer**: 95%+ coverage (modes, options, edge cases)
- **Integration**: Roundtrip tests, real-world samples
- **Target**: 115+ tests per package (JSON has 115)

### JSON Package (Reference Implementation)
- **Status**: ✅ Complete
- **Lines of Code**: ~600 production, ~1,500 tests
- **Test Coverage**: 115 tests, all passing
- **Implementation Time**: ~15-20 hours
- **Key Files**:
  - `packages/json/src/parser.ts` - 205 lines
  - `packages/json/src/serializer.ts` - 155 lines
  - `packages/json/src/utils.ts` - 195 lines
  - `packages/json/__tests__/` - 4 test files

### Remaining Packages
| Package | Status | Tree-Sitter Grammar | Estimated Effort |
|---------|--------|---------------------|------------------|
| YAML    | ⏳ Pending | tree-sitter-yaml | ~20 hours |
| XML     | ⏳ Pending | tree-sitter-xml | ~25 hours |
| CSV     | ⏳ Pending | Custom parser | ~15 hours |
| TOML    | ⏳ Pending | tree-sitter-toml | ~20 hours |

### Format-Specific Considerations

**YAML**: Anchors, aliases, tags, multi-line strings, multiple documents
**XML**: Attributes, namespaces, CDATA, processing instructions
**CSV**: Header handling, delimiter options, type inference
**TOML**: Tables, array of tables, inline tables, datetime types

See `IMPLEMENTATION_GUIDE.md` for detailed instructions on implementing each format.

## References

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [JSON RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259)
- [YAML 1.2.2 Spec](https://yaml.org/spec/1.2.2/)
- [JSON Schema](https://json-schema.org/)
- [XML 1.0 Spec](https://www.w3.org/TR/xml/)
- [CSV RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180)
- [TOML v1.0.0](https://toml.io/en/v1.0.0)
