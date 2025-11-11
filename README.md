# dASTardly

A high-performance data format parser and serializer that uses a common AST (Abstract Syntax Tree) to enable cross-format conversion and validation. Built with Tree-sitter for real-time editor performance.

## Project Status

- **Formats Completed**: 4/6 (JSON, YAML, CSV, core infrastructure)
- **Tests Passing**: 802 across all packages
- **Current Phase**: Ready for additional formats (XML, TOML)
- **Next Step**: XML or TOML implementation

## Supported Formats

- ✅ **JSON** - Full support with position tracking (113 tests)
- ✅ **YAML** - Anchors, aliases, tags, merge keys, block scalars (267 tests)
- ✅ **CSV/TSV/PSV** - RFC 4180 compliant, empty field support via external scanner (98 tests)
- ⏳ **XML** - Planned (attributes, namespaces, CDATA)
- ⏳ **TOML** - Planned (tables, dotted keys, datetime types)

## Features

- **Cross-format conversion**: Seamlessly convert between JSON, YAML, CSV, and more
- **Position tracking**: Accurate source locations for every node
- **Real-time performance**: Optimized for editor integrations (Tree-sitter based)
- **Type-safe**: Full TypeScript support with strict mode
- **Extensible**: Easy to add new format support via FormatPackage interface
- **RFC Compliant**: CSV follows RFC 4180, including empty field support

## Testing

### Unit Tests

Each package has comprehensive unit tests covering parsers, serializers, and utilities:

```bash
# Run all tests
pnpm -r test

# Test specific package
pnpm --filter @dastardly/json test
pnpm --filter @dastardly/yaml test

# Watch mode
pnpm --filter @dastardly/core test:watch
```

### Integration Tests

Cross-format integration tests validate end-to-end functionality:

```bash
# Run integration tests
pnpm --filter @dastardly/integration-tests test

# All tests (unit + integration)
pnpm -r test
```

### Test Coverage

- **@dastardly/core**: 83 tests (AST types, builders, utilities)
- **@dastardly/tree-sitter-runtime**: 36 tests (parser infrastructure)
- **@dastardly/json**: 113 tests (JSON parsing and serialization)
- **@dastardly/yaml**: 267 tests (YAML parsing and serialization with advanced features)
- **@dastardly/csv**: 98 tests (CSV/TSV/PSV parsing, serialization, RFC 4180 compliance)
- **@dastardly/integration-tests**: 99 tests (cross-format conversions, roundtrip, position tracking)

**Total: 696 tests passing** (1 skipped test for CSV variable field counts)

## Benchmarking

Comprehensive performance benchmarks are available for all format packages and validation:

```bash
# Run all benchmarks
pnpm benchmark

# Run specific package benchmarks
pnpm benchmark:json       # JSON vs native JSON.parse/stringify
pnpm benchmark:yaml       # YAML vs js-yaml
pnpm benchmark:csv        # CSV vs csv-parse/csv-stringify
pnpm benchmark:validation # JSON Schema validation vs AJV
```

Each benchmark suite includes:
- **Parse Performance**: String → AST/Object
- **Serialize Performance**: AST/Object → String
- **Roundtrip Performance**: Full cycle benchmarks
- **Memory Usage**: Heap consumption analysis

See individual package benchmark READMEs for detailed results and analysis:
- [JSON Benchmarks](packages/json/benchmarks/README.md)
- [YAML Benchmarks](packages/yaml/benchmarks/README.md)
- [CSV Benchmarks](packages/csv/benchmarks/README.md)
- [Validation Benchmarks](packages/validation/benchmarks/README.md)

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Technical design and implementation details
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Development workflow and coding standards
- **[CLAUDE.md](CLAUDE.md)**: Project context and guidelines for AI assistants

## License

MIT
