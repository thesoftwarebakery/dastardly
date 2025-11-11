# YAML Parser & Serializer Benchmarks

Comprehensive performance benchmarking of `@dastardly/yaml` against `js-yaml`.

## Running Benchmarks

```bash
# From the yaml package directory
pnpm benchmark

# With garbage collection for more accurate memory measurements
node --expose-gc $(which tsx) benchmarks/run.ts
```

## Benchmark Categories

### 1. Parse Performance
Measures the speed of parsing YAML strings into AST nodes (dASTardly) vs native objects (js-yaml).

### 2. Serialize Performance
Measures the speed of serializing AST nodes (dASTardly) vs native objects (js-yaml) back to YAML strings.

### 3. Roundtrip Performance
Measures the complete cycle: parse string → data structure → serialize string.

### 4. Memory Usage
Measures heap memory consumption for parsed data structures (100 iterations per fixture).

## Test Fixtures

| Fixture | Description | Size |
|---------|-------------|------|
| tiny | Minimal object | ~100 bytes |
| small | Typical config file | ~1 KB |
| medium | Moderate complexity with nesting | ~10 KB |
| large | Deep nesting (6 levels, 3 branches) | ~100 KB |
| wide | Many properties (200 keys) | ~50 KB |
| arrayHeavy | Large arrays (500 items) | ~100 KB |

## Comparison Library: js-yaml

[js-yaml](https://github.com/nodeca/js-yaml) is the most popular YAML library for JavaScript:
- 19M+ downloads per week
- Pure JavaScript implementation
- YAML 1.2 spec compliant
- No position tracking
- No incremental parsing

## Results

> **Note**: Run benchmarks on your machine for accurate results. These are representative examples.

### Parse Performance

| Fixture | dASTardly | js-yaml | Comparison |
|---------|-----------|---------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Serialize Performance

| Fixture | dASTardly | js-yaml | Comparison |
|---------|-----------|---------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Roundtrip Performance

| Fixture | dASTardly | js-yaml | Comparison |
|---------|-----------|---------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Memory Usage

| Fixture | dASTardly | js-yaml | Comparison |
|---------|-----------|---------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

## Performance Analysis

### Expected Performance Characteristics

#### Parse Performance
- **js-yaml**: Pure JavaScript parser, no native dependencies
- **dASTardly**: Tree-sitter (native C) + AST construction
- **Expected**: Competitive or possibly faster due to tree-sitter optimization

#### Serialize Performance
- **js-yaml**: JavaScript string building
- **dASTardly**: AST traversal + YAML formatting
- **Expected**: Similar performance, may vary by complexity

#### Key Advantages of dASTardly

1. **Position Tracking**: Every node has precise source location (line, column, offset)
2. **Error Recovery**: Tree-sitter handles malformed YAML gracefully
3. **Incremental Parsing**: Can update AST for changed regions (future feature)
4. **Cross-Format**: AST works with JSON, CSV, XML serializers
5. **YAML Features**: Anchors, aliases, tags, block scalars fully supported

### When to Use dASTardly vs js-yaml

| Use Case | Recommendation |
|----------|----------------|
| Simple YAML parsing/serialization | js-yaml |
| Editor integration with error reporting | dASTardly |
| Cross-format conversion (YAML ↔ JSON) | dASTardly |
| High-volume batch processing | js-yaml |
| Schema validation with precise errors | dASTardly |
| Position-aware transformations | dASTardly |
| YAML anchors/aliases with tracking | dASTardly |

## Memory Considerations

dASTardly AST nodes include additional metadata:
- Source location (line, column, offset)
- Node type information
- Raw value storage for formatting preservation
- YAML-specific metadata (anchors, tags)

Expected memory overhead: 2-4x compared to plain JavaScript objects.

This is acceptable for editor scenarios where:
- Files are typically < 1 MB
- Position tracking is essential
- Single document parsing (not batch processing)

## YAML-Specific Features

### Anchors and Aliases
dASTardly resolves anchors and aliases during parsing, maintaining references in metadata:

```yaml
defaults: &defaults
  timeout: 30
  retries: 3

production:
  <<: *defaults
  host: prod.example.com
```

Both libraries handle this correctly, but dASTardly preserves anchor information for round-tripping.

### Block Scalars
Performance for literal (`|`) and folded (`>`) block scalars:
- Both libraries handle block scalars efficiently
- dASTardly preserves exact formatting for round-trips

### Multi-Document YAML
dASTardly currently parses single documents. Multi-document support is planned.

## Optimization Opportunities

### Current Implementation
- Tree-sitter YAML CST → dASTardly AST conversion
- Position tracking for every node
- Anchor/alias resolution
- Block scalar processing

### Potential Optimizations
1. **Lazy anchor resolution**: Resolve on-demand rather than upfront
2. **Shared location objects**: Deduplicate position data
3. **Streaming**: Large document support
4. **Multi-document**: Parse multiple YAML documents in one file

### Non-Goals
- Match or beat js-yaml (position tracking adds overhead)
- Custom YAML extensions (stick to YAML 1.2 spec)
- Ultra-compact AST (prioritize correctness and features)

## Benchmark Methodology

### Hardware Requirements
- Modern CPU (benchmark.js measures ops/sec)
- Sufficient RAM (memory benchmarks use 100 iterations)
- Node.js v18+ (native tree-sitter support)

### Accuracy Notes
- Each benchmark runs until statistical significance
- Warm-up iterations included
- Memory measurements with/without --expose-gc flag
- Results vary by CPU, memory, and Node.js version

### Reproducibility
1. Install dependencies: `pnpm install`
2. Build the package: `pnpm build`
3. Run benchmarks: `pnpm benchmark`
4. Consistent results across runs (±5%)

## Related Benchmarks

- [JSON Benchmarks](../../json/benchmarks/README.md) - JSON parsing/serialization (vs native)
- [CSV Benchmarks](../../csv/benchmarks/README.md) - CSV parsing/serialization (vs csv-parse)
- [Validation Benchmarks](../../validation/benchmarks/README.md) - JSON Schema validation performance

## References

- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [js-yaml Repository](https://github.com/nodeca/js-yaml)
- [YAML 1.2 Specification](https://yaml.org/spec/1.2.2/)
- [Tree-sitter Performance](https://tree-sitter.github.io/tree-sitter/#performance)
