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
- **.claude/commands/**: Slash commands for common development tasks

**When to update documentation:**
- **ARCHITECTURE.md**: When making design decisions, changing core abstractions, or modifying the parser/serializer pipeline
- **CONTRIBUTING.md**: When changing development workflow, coding standards, or adding new tools
- **README.md**: When adding features, changing installation steps, or updating examples
- **CLAUDE.md**: When changing project structure, adding new concepts, or updating implementation phases

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
- **Core Package**: `@dastardly/core` contains shared AST types

```
dastardly/
├── packages/
│   ├── core/                    # Core AST types & utilities
│   ├── tree-sitter-runtime/     # Shared tree-sitter utilities
│   ├── json/                    # JSON parser/serializer
│   ├── yaml/                    # YAML parser/serializer
│   ├── xml/                     # XML parser/serializer
│   ├── csv/                     # CSV parser/serializer
│   └── toml/                    # TOML parser/serializer
```

### AST Design Principles

1. **Position Preservation**: Every node tracks source location (line, column, offset)
2. **Format Agnostic**: Common AST represents data structures, not syntax
3. **Lossless Where Possible**: Preserve formatting information for roundtrips
4. **Format-Specific Metadata**: Store format-specific features (XML attributes, YAML anchors) in metadata fields
5. **Error Handling**: Graceful degradation for incompatible conversions

### Current Core AST (packages/core/src/index.ts)

The core defines:
- `Position` and `Span` types for source locations
- `NodeType` enum (Object, Array, String, Number, Boolean, Null)
- `DastardlyNode` base class with position tracking
- Concrete node classes for each type

**Note**: The current implementation has some TypeScript issues that need addressing (base class constructor signature doesn't match concrete classes).

## Coding Standards

### TypeScript
- **Strict Mode**: Enabled (`strict: true`)
- **Module System**: ESM (`"type": "module"`, `"module": "nodenext"`)
- **Target**: `esnext`
- **Additional Strictness**:
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`

### Naming Conventions
- **Packages**: `@dastardly/package-name`
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
pnpm --filter @dastardly/core build
```

### Testing
```bash
# Run all tests (once implemented)
pnpm -r test

# Test specific package
pnpm --filter @dastardly/json test
```

## Implementation Phases

### Phase 0: Foundation & Tooling (CURRENT)
- [x] Set up monorepo structure
- [x] Create core AST types (initial implementation)
- [x] Create project documentation (CLAUDE.md, ARCHITECTURE.md, CONTRIBUTING.md)
- [x] Set up slash commands and tooling
- [ ] Review and fix core AST implementation
- [ ] Design final core AST API
- [ ] Set up testing infrastructure (Vitest)
- [ ] Document design decisions

### Phase 1a: JSON Support
- [ ] Create `@dastardly/tree-sitter-runtime` package
- [ ] Implement abstract parser runtime (tree-sitter + web-tree-sitter compatibility)
- [ ] Integrate tree-sitter-json
- [ ] Implement JSON → AST parser
- [ ] Implement AST → JSON serializer
- [ ] Comprehensive tests (position tracking, edge cases, roundtrip)
- [ ] Handle edge cases (large numbers, unicode, etc.)

### Phase 1b: YAML Support
- [ ] Integrate tree-sitter-yaml
- [ ] Implement YAML → AST parser
- [ ] Handle YAML-specific features (anchors, aliases, tags)
- [ ] Implement AST → YAML serializer
- [ ] Cross-format conversion tests (JSON ↔ YAML)
- [ ] Document conversion limitations

### Phase 2: Additional Formats
- [ ] XML support (attributes, namespaces)
- [ ] CSV support (tabular data mapping)
- [ ] TOML support

### Phase 3: Validation
- [ ] JSON Schema validator
- [ ] Cross-format schema validation
- [ ] Error reporting with source positions
- [ ] Fail-fast option for validation

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
1. Check if it belongs in `@dastardly/core` (shared) or format-specific package
2. Ensure TypeScript strict mode compliance
3. Add position tracking to any new AST nodes
4. Consider how it affects cross-format conversion
5. **Check if documentation needs updating** (especially ARCHITECTURE.md)

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
- [JSON Specification](https://www.json.org/)
- [YAML 1.2 Specification](https://yaml.org/spec/1.2.2/)
- [JSON Schema](https://json-schema.org/)

## Notes

- The project name is styled as "dASTardly" (with AST capitalized)
- Original motivation: Cross-format JSON Schema validation for a text editor
- Priority: Correctness > Features > Performance (but performance is still critical)
