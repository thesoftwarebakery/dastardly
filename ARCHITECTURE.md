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
├── README.md             # Package documentation
├── package.json
├── tsconfig.json
├── vitest.config.ts
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

All format packages must implement the `FormatPackage` interface from `@dastardly/core`.

**Parser Class**:
- Extends `TreeSitterParser` from `@dastardly/tree-sitter-runtime`
- Implements `convertDocument(node, source): DocumentNode`
- Uses tree-sitter CST → dASTardly AST conversion
- Preserves source positions with `nodeToLocation()`
- Stores raw values for formatting preservation

**Serializer Function**:
- Exports `serialize(node, options)` function with format-specific options
- Format options extend `BaseSerializeOptions` (minimal/universal only)
- Supports format-appropriate output (indent for JSON/YAML, delimiter for CSV, etc.)
- Handles format-specific escaping/encoding

**Public API** (Required by `FormatPackage` interface):
```typescript
// Format with both parse and serialize options (e.g., CSV)
export const formatName: FormatPackage<FormatSerializeOptions, FormatParseOptions> = {
  parse(source: string, options?: FormatParseOptions): DocumentNode;
  serialize(node: DocumentNode | DataNode, options?: FormatSerializeOptions): string;
};

// Format with only serialize options (e.g., JSON, YAML)
// TParseOptions defaults to BaseParseOptions if omitted
export const json: FormatPackage<JSONSerializeOptions> = {
  parse(source, options): DocumentNode;  // options inferred as BaseParseOptions
  serialize(node, options?): string;
};

// Convenience exports for destructuring
export const { parse, serialize } = formatName;

// Export public types
export type { FormatSerializeOptions, FormatParseOptions };
```

**Internal Implementation**:
- Parser classes (e.g., `JSONParser`, `YAMLParser`, `CSVParser`) are internal implementation details
- Utility functions (e.g., `escapeString`, `parseYAMLNumber`) are internal
- Users interact with format packages via the exported object and convenience functions only

**Serialization Options**:
Each format defines its own options extending `BaseSerializeOptions`:
```typescript
export interface FormatSerializeOptions extends BaseSerializeOptions {
  // Format-specific options only
  // e.g., indent for JSON/YAML, delimiter for CSV
}
```

**Parse Options** (optional):
Formats that need parse-time configuration define parse options:
```typescript
export interface FormatParseOptions extends BaseParseOptions {
  // Format-specific parse options
  // e.g., inferTypes, delimiter, headers for CSV
}
```

**Do not add options to `BaseSerializeOptions` or `BaseParseOptions` unless they apply to ALL formats.**

**Type Safety**:
- TypeScript enforces the interface at compile time
- Missing methods or incorrect signatures cause build errors
- Strong guarantee of API consistency across all formats

**Example Usage**:
```typescript
import { json } from '@dastardly/json';
import { yaml } from '@dastardly/yaml';

// Parse JSON
const jsonAst = json.parse('{"name": "Alice"}');

// Convert to YAML
const yamlOutput = yaml.serialize(jsonAst, { indent: 2 });
```

### Testing Standards
- **Utils**: 100% coverage (critical for correctness)
- **Parser**: 95%+ coverage (all types, errors, positions)
- **Serializer**: 95%+ coverage (modes, options, edge cases)
- **Integration**: Roundtrip tests, real-world samples
- **Target**: 115+ tests per package (JSON has 115)

### Integration Testing Strategy

The `packages/integration-tests` package validates cross-format functionality and real-world usage scenarios.

#### Purpose
- **Cross-format validation**: Verify seamless conversion between formats (JSON ↔ YAML, etc.)
- **Data integrity**: Ensure structural equivalence is preserved across conversions
- **Position tracking**: Validate source locations remain accurate through format changes
- **Real-world testing**: Test with actual configuration files from popular tools
- **Regression prevention**: Catch breaking changes in cross-package interactions

#### Package Structure
```
packages/integration-tests/
├── fixtures/
│   ├── json/          # JSON test data (primitives, collections, real-world, edge-cases)
│   ├── yaml/          # YAML test data (scalars, collections, real-world, yaml-specific)
│   └── expected/      # Expected conversion outputs
├── __tests__/
│   ├── cross-format.test.ts       # JSON ↔ YAML conversion tests
│   ├── position-tracking.test.ts  # Source location accuracy
│   ├── roundtrip.test.ts          # Parse-serialize-parse fidelity
│   └── helpers/
│       ├── fixtures.ts            # Fixture loading utilities
│       └── assertions.ts          # Custom AST assertions
```

#### Test Coverage Goals
- **Cross-format conversions**: 100% coverage of format pairs (JSON ↔ YAML, JSON ↔ XML, etc.)
- **Position tracking**: All node types validated for accurate source locations
- **Roundtrip fidelity**: Every format tested for parse → serialize → parse stability
- **Real-world fixtures**: Minimum 3-5 real configuration files per format
- **Edge cases**: Special values (Infinity, NaN, -0), unicode, deeply nested structures

#### When to Update Integration Tests
1. **New format added**: Add cross-format tests with all existing formats
2. **Core AST modified**: Verify changes don't break format conversions
3. **Format-specific features**: Test how features map across formats (YAML anchors, XML attributes)
4. **Bug fixes**: Add regression tests for conversion issues

#### Benefits
- **Early detection**: Catch breaking changes before they reach users
- **Documentation**: Fixtures serve as usage examples
- **Confidence**: High assurance that cross-format conversions work correctly
- **Extensibility**: Easy to add new format pairs as packages are added

The integration test suite runs automatically with `pnpm -r test` to ensure comprehensive validation on every change.

### Documentation Standards
- **README.md Required**: Every package must have a comprehensive README.md
- **Completeness**: README should document all public APIs, usage patterns, and format-specific behavior
- **Consistency**: Follow the template in `IMPLEMENTATION_GUIDE.md` Step 8
- **Examples**: Include real-world usage examples and edge cases
- **References**: Link to `packages/json/README.md` as the reference implementation
- **User-Facing**: README serves as primary documentation for npm users

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

### YAML Package
- **Status**: ✅ Complete
- **Lines of Code**: ~900 production, ~2,000 tests
- **Test Coverage**: 245 tests, all passing
- **Implementation Time**: ~25-30 hours
- **Key Files**:
  - `packages/yaml/src/parser.ts` - 340 lines
  - `packages/yaml/src/serializer.ts` - 285 lines
  - `packages/yaml/src/utils.ts` - 225 lines
  - `packages/yaml/__tests__/` - 5 test files
- **Special Features**:
  - Anchor and alias resolution
  - Explicit type tags
  - Merge keys (`<<`)
  - Block scalars (literal `|` and folded `>`)
  - Flow and block styles in serialization

### CSV Package
- **Status**: ✅ Complete (Phase 2 - RFC 4180 Compliant)
- **Lines of Code**: ~700 production, ~1,100 tests, ~200 external scanner (C)
- **Test Coverage**: 99 tests (98 passing, 1 skipped for variable field counts)
- **Implementation Time**: ~25-30 hours (includes migration + external scanner)
- **Key Files**:
  - `packages/csv/src/parser.ts` - 220 lines
  - `packages/csv/src/serializer.ts` - 360 lines
  - `packages/csv/src/utils.ts` - 130 lines
  - `packages/csv/__tests__/` - 4 test files
  - `packages/tree-sitter-csv/` - Forked, migrated to node-addon-api
  - `packages/tree-sitter-csv/src/scanner.c` - External scanner for empty fields
- **Special Features**:
  - Multiple delimiter support (CSV, TSV, PSV)
  - Header handling (auto-detect, custom, or none)
  - Type inference (optional)
  - Quote strategies (needed, all, nonnumeric, none)
  - Line ending options (LF, CRLF)
  - Nested structure handling (error, json, flatten)
  - Produces array-of-objects or array-of-arrays
  - **RFC 4180 empty field support via external scanner**
- **Grammar Improvements**:
  - ✅ Single-character text fields supported (Phase 1 - regex fix)
  - ✅ CRLF line endings working (Phase 1)
  - ✅ Empty fields supported (Phase 2 - external scanner)
  - Grammar uses single separators between fields
  - Document grammar handles trailing newlines
  - Unified whitespace handling with `\s`
- **External Scanner** (Phase 2):
  - Stateless C scanner in `src/scanner.c`
  - Detects zero-width empty field tokens
  - Exports symbols for all three variants (csv/tsv/psv)
  - Zero-width tokens via `mark_end()` before lookahead
  - Prevents phantom rows at EOF
- **Remaining Limitations**:
  - Variable field counts not supported (lower priority)
  - See `packages/csv/LIMITATIONS.md` for details
- **Tree-sitter Tooling**:
  - Uses system tree-sitter CLI for grammar generation (development only)
  - Commits generated `parser.c` and `scanner.c` files for consumers
  - Post-processes `node-types.json` for CLI 0.25+ → runtime 0.21.1 compatibility

### Remaining Packages
| Package | Status | Tree-Sitter Grammar | Estimated Effort |
|---------|--------|---------------------|------------------|
| XML     | ⏳ Pending | tree-sitter-xml | ~25 hours |
| TOML    | ⏳ Pending | tree-sitter-toml | ~20 hours |

### Format-Specific Considerations

**YAML** (✅ Implemented): Anchors, aliases, tags, multi-line strings, multiple documents, merge keys
**CSV** (✅ Implemented): Header handling, delimiter options, type inference, quote strategies, nested structure handling, RFC 4180 compliance (with documented grammar limitations)
**XML** (Pending): Attributes, namespaces, CDATA, processing instructions
**TOML** (Pending): Tables, array of tables, inline tables, datetime types

See `IMPLEMENTATION_GUIDE.md` for detailed instructions on implementing each format.

## Project Roadmap

### Immediate Next Steps

#### CSV Integration Tests ✅ **COMPLETED**
CSV successfully integrated into the cross-format integration test suite.

**Completed**:
- ✅ Added 18 CSV fixtures to `packages/integration-tests/fixtures/csv/`
  - Real-world examples (employee data, product catalog, sales data)
  - Edge cases (empty fields, quoted fields, special characters)
- ✅ Added CSV ↔ JSON conversion tests (23 tests)
- ✅ Added CSV ↔ YAML conversion tests (11 tests)
- ✅ Added CSV roundtrip tests (25 tests)
- ✅ Added CSV position tracking tests (18 tests)
- ✅ Extended FormatPackage interface to support parse options
- ✅ Implemented CSVParseOptions (inferTypes, delimiter, headers)
- ✅ All 161 integration tests passing (77 CSV-specific)

**Results**:
- Caught and fixed empty field handling edge cases
- Validated CSV ↔ JSON/YAML type preservation with inferTypes option
- Confirmed RFC 4180 compliance in roundtrip scenarios
- Established pattern for adding future formats to integration tests

### Short-term Goals

#### TOML Support (20-25 hours)
Implement `@dastardly/toml` package following established patterns.

**Key Features**:
- Tables and dotted keys
- Array of tables syntax
- Inline tables
- Datetime type handling
- Multi-line strings

**Tree-sitter Grammar**: Use `@tree-sitter-grammars/tree-sitter-toml`

**Justification**: TOML is simpler than XML (no attributes/namespaces), making it a good next step after CSV. Popular for config files (Cargo.toml, pyproject.toml). Provides good learning curve progression: JSON (simple) → YAML (complex) → CSV (flat) → TOML (middle ground) → XML (very complex).

**Estimated Effort**: 20-25 hours (simpler than YAML/XML)

#### XML Support (25-30 hours)
Implement `@dastardly/xml` package with full attribute and namespace support.

**Key Features**:
- Elements with attributes (stored in metadata)
- Namespace handling (prefixes, xmlns declarations)
- CDATA sections
- Processing instructions
- Mixed content (text + elements)
- Entity references

**Tree-sitter Grammar**: Use `@tree-sitter-grammars/tree-sitter-xml`

**Justification**: Complex format demonstrating metadata storage patterns. Widely used for config files, data exchange, document formats. Last format before moving to Phase 3 (validation).

**Estimated Effort**: 25-30 hours (similar to YAML complexity)

### Long-term Goals

#### Phase 3: Validation Infrastructure (40+ hours)
Implement cross-format schema validation - the core value proposition.

**Key Features**:
- JSON Schema validator
- Cross-format schema validation
- Error reporting with source positions (from original format)
- Fail-fast option for validation
- Schema generation from AST

**Use Case Example**:
```typescript
// Validate YAML against JSON Schema, report errors at YAML line numbers
const schema = loadJSONSchema('config.schema.json');
const yamlDoc = yaml.parse(yamlSource);
const result = validator.validate(yamlDoc, schema);
// result.errors contain YAML source locations
```

**Justification**: This is the ultimate goal - enabling text editors to validate any format against any schema with accurate error reporting.

**Estimated Effort**: 40+ hours

### Roadmap Timeline

| Milestone | Estimated Effort | Target |
|-----------|-----------------|--------|
| CSV Integration Tests | 3-5 hours | Immediate |
| TOML Support | 20-25 hours | Short-term |
| XML Support | 25-30 hours | Short-term |
| Phase 3: Validation | 40+ hours | Long-term |

**Total Remaining**: ~90-100 hours to complete all planned features

## References

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [JSON RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259)
- [YAML 1.2.2 Spec](https://yaml.org/spec/1.2.2/)
- [JSON Schema](https://json-schema.org/)
- [XML 1.0 Spec](https://www.w3.org/TR/xml/)
- [CSV RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180)
- [TOML v1.0.0](https://toml.io/en/v1.0.0)
