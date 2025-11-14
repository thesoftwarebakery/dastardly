# dASTardly - Project Context for Claude

## Project Overview

dASTardly is a high-performance data format parser and serializer that uses a common Abstract Syntax Tree (AST) to enable cross-format conversion and validation. The project enables seamless conversion between JSON, YAML, XML, CSV, TOML, and other data formats while preserving source location information for precise error reporting.

**Key Use Case**: Real-time schema validation across multiple formats in text editors, with accurate line/column error reporting regardless of the source format.

## Documentation Structure

This project has several documentation files, each serving a specific purpose:

- **CLAUDE.md** (this file): AI assistant context, project overview, and working guidelines
- **README.md**: User-facing project introduction and quick start
- **ARCHITECTURE.md**: Detailed technical design, architecture decisions, and implementation details
- **CONTRIBUTING.md**: Contributor guidelines, development workflow, coding standards
- **Package READMEs** (`packages/*/README.md`): Per-package documentation with usage examples and API reference for npm publishing
- **.claude/commands/**: Slash commands for common development tasks

**When to update documentation:**
- **ARCHITECTURE.md**: When making design decisions, changing core abstractions, or modifying the parser/serializer pipeline
- **CONTRIBUTING.md**: When changing development workflow, coding standards, or adding new tools
- **README.md**: When adding features, changing installation steps, or updating examples
- **CLAUDE.md**: When changing project structure or adding new concepts
- **Package README.md**: When creating new format packages or adding/changing format-specific features

**IMPORTANT**: Always check if documentation needs updating after making significant code changes. Use the `/check-docs` slash command to verify documentation consistency.

## Architecture Decisions

### Tree-sitter for Parsing
- **Why**: Designed for real-time editor parsing with incremental updates
- **Performance**: Parses on every keystroke without lag (36-52x faster than traditional parsers)
- **Position Tracking**: Native support for line/column/offset tracking in CST
- **Error Recovery**: Handles incomplete/invalid documents gracefully
- **Proven**: Used by GitHub, VS Code, Neovim

### Monorepo Structure (pnpm)
- **Package Manager**: pnpm (already configured)
- **Workspaces**: Each format parser/serializer is a separate package
- **Core Package**: `@bakes/dastardly-core` contains shared AST types

```
dastardly/
├── packages/
│   ├── core/                    # Core AST types & utilities
│   ├── tree-sitter-runtime/     # Shared tree-sitter utilities
│   ├── json/                    # JSON parser/serializer
│   ├── yaml/                    # YAML parser/serializer
│   ├── csv/                     # CSV parser/serializer (RFC 4180 compliant)
│   ├── validation/              # JSON Schema validator
│   ├── integration-tests/       # Cross-format integration tests
│   └── (see GitHub issues for planned formats)
```

### AST Design Principles

1. **Position Preservation**: Every node tracks source location (line, column, offset)
2. **Format Agnostic**: Common AST represents data structures, not syntax
3. **Lossless Where Possible**: Preserve formatting information for roundtrips
4. **Format-Specific Metadata**: Store format-specific features (XML attributes, YAML anchors) in metadata fields
5. **Error Handling**: Graceful degradation for incompatible conversions

### Current Core AST (packages/core/src/index.ts)

The core defines:
- `Position` and `SourceLocation` types for source locations
- Discriminated union of node types: `DocumentNode`, `DataNode` (Object, Array, String, Number, Boolean, Null)
- `PropertyNode` for object key-value pairs
- Builder functions: `documentNode()`, `objectNode()`, `arrayNode()`, etc.
- Type guards: `isObjectNode()`, `isArrayNode()`, etc.
- Visitor pattern support for AST traversal
- 78 comprehensive tests covering all functionality

## Coding Standards

### TypeScript
- **Strict Mode**: Enabled (`strict: true`)
- **Module System**: ESM (`"type": "module"`, `"module": "nodenext"`)
- **Target**: `esnext`
- **Additional Strictness**:
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`

### Naming Conventions
- **Packages**: `@bakes/dastardly-package-name`
- **Classes**: PascalCase with "Dastardly" prefix for core types (e.g., `DastardlyNode`)
- **Interfaces**: PascalCase
- **Files**: kebab-case for TypeScript files

### Code Organization
- Each package has `src/`, `dist/` (compiled), and tests
- Export all public APIs through `index.ts`
- Keep AST node definitions in `packages/core/src/ast/`

### Git Commit Standards
- **Format**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Breaking Changes**: Use `!` suffix or `BREAKING CHANGE:` footer
- **Message Body**: Explain the why, not the what
- **DO NOT include**: Claude Code footer or co-author attribution in commit messages

## Development Workflow

### Building
```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter @bakes/dastardly-core build
```

### Testing
```bash
# Run all tests (once implemented)
pnpm -r test

# Test specific package
pnpm --filter @bakes/dastardly-json test
```

## Implementing New Format Packages

When implementing a new format package, follow the established pattern:

1. **Create package structure** following JSON/YAML/CSV examples
2. **Implement `FormatPackage<TSerializeOptions, TParseOptions>` interface**:
   - Export object implementing all required methods (`parse`, `serialize`)
   - Define format-specific `FormatSerializeOptions` extending `BaseSerializeOptions`
   - Define format-specific `FormatParseOptions` extending `BaseParseOptions` (if needed)
   - `TParseOptions` defaults to `BaseSerializeOptions` for formats without parse-time options
   - Export destructured convenience functions (`parse`, `serialize`)
   - Export public types (`FormatSerializeOptions`, `FormatParseOptions`)
   - Keep Parser classes and utility functions internal (not exported)
3. **Extend `TreeSitterParser`** for parser implementation (internal)
4. **Add comprehensive tests** matching existing packages (95%+ coverage)
5. **Update documentation** with format-specific behavior

The TypeScript compiler enforces the `FormatPackage` interface contract.

**Public API Pattern**:
```typescript
// Export package object implementing FormatPackage
export const formatName: FormatPackage<FormatSerializeOptions, FormatParseOptions> = {
  parse(source, options) { /* ... */ },
  serialize(node, options) { /* ... */ }
};

// Export convenience functions (destructured from package object)
export const { parse, serialize } = formatName;

// Export public types
export type { FormatSerializeOptions, FormatParseOptions };

// Parser classes, utility functions remain internal (not exported)
```

**Roadmap**: See GitHub issues (`gh issue list`) for planned formats and features.

## Key Design Challenges

### 1. Format Capability Mismatches
- **Problem**: XML has attributes, YAML has anchors, CSV is flat
- **Solution**: Format-specific metadata fields + strategy pattern for handling incompatibilities

### 2. Type Coercion
- **Problem**: CSV treats everything as strings, JSON has typed numbers
- **Solution**: Configurable type inference at serialization time

### 3. Position Mapping
- **Problem**: Maintaining accurate line numbers across format conversions
- **Solution**: Each AST node preserves original source location; validation errors reference original positions

### 4. Incremental Parsing
- **Problem**: Re-parsing entire documents on every keystroke is slow
- **Solution**: Tree-sitter's incremental parsing only updates changed sections

## When Working on This Project

### Always Consider:
1. **Performance**: This is for real-time editor feedback - optimize for speed
2. **Position Tracking**: Never lose source location information
3. **Error Messages**: Users need precise line/column information
4. **Format Correctness**: Don't invent syntax - follow specs exactly
5. **Test Coverage**: Parser edge cases are critical
6. **Documentation**: Keep docs in sync with code changes

### Before Adding Code:
1. Check if it belongs in `@bakes/dastardly-core` (shared) or format-specific package
2. Ensure TypeScript strict mode compliance
3. Add position tracking to any new AST nodes
4. Consider how it affects cross-format conversion
5. **Check if documentation needs updating** (especially ARCHITECTURE.md)
6. Plan to create package README.md when adding new format packages

### After Making Changes:
1. Update relevant documentation (see "Documentation Structure" above)
2. Run `/check-docs` to verify consistency
3. Update tests to match new behavior
4. Rebuild affected packages

### Common Patterns:
- Use `tree-sitter` for all parsing (don't write custom lexers)
- Store format-specific features in optional metadata fields
- Throw descriptive errors with source locations
- Write tests that verify position tracking accuracy
- Document architectural decisions in ARCHITECTURE.md

## External Resources

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [tree-sitter-json](https://github.com/tree-sitter/tree-sitter-json)
- [tree-sitter-yaml](https://github.com/ikatyang/tree-sitter-yaml)
- [tree-sitter-csv](https://github.com/amaanq/tree-sitter-csv) (forked as @bakes/dastardly-tree-sitter-csv)
- [JSON Specification](https://www.json.org/)
- [YAML 1.2 Specification](https://yaml.org/spec/1.2.2/)
- [RFC 4180 CSV Specification](https://www.rfc-editor.org/rfc/rfc4180.html)
- [JSON Schema](https://json-schema.org/)

## Notes

- The project name is styled as "dASTardly" (with AST capitalized)
- Original motivation: Cross-format JSON Schema validation for a text editor
- Priority: Correctness > Features > Performance (but performance is still critical)
