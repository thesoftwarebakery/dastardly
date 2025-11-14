# JSON Parser & Serializer Benchmarks

Comprehensive performance benchmarking of `@bakes/dastardly-json` against native `JSON.parse` and `JSON.stringify`.

## Running Benchmarks

```bash
# From the json package directory
pnpm benchmark

# With garbage collection for more accurate memory measurements
node --expose-gc $(which tsx) benchmarks/run.ts
```

## Benchmark Categories

### 1. Parse Performance
Measures the speed of parsing JSON strings into AST nodes (dASTardly) vs native objects (JSON.parse).

### 2. Serialize Performance
Measures the speed of serializing AST nodes (dASTardly) vs native objects (JSON.stringify) back to JSON strings.

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

## Results

> **Note**: Run benchmarks on your machine for accurate results. These are representative examples.

### Parse Performance

| Fixture | dASTardly | Native JSON.parse | Comparison |
|---------|-----------|-------------------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Serialize Performance

| Fixture | dASTardly | Native JSON.stringify | Comparison |
|---------|-----------|----------------------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Roundtrip Performance

| Fixture | dASTardly | Native JSON | Comparison |
|---------|-----------|-------------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

### Memory Usage

| Fixture | dASTardly | Native JSON | Comparison |
|---------|-----------|-------------|------------|
| tiny | TBD | TBD | TBD |
| small | TBD | TBD | TBD |
| medium | TBD | TBD | TBD |
| large | TBD | TBD | TBD |
| wide | TBD | TBD | TBD |
| arrayHeavy | TBD | TBD | TBD |

## Performance Analysis

### Expected Performance Characteristics

#### Parse Performance
- **Native JSON.parse**: Highly optimized C++ implementation in V8 engine
- **dASTardly**: Tree-sitter parsing + AST construction overhead
- **Expected**: 2-10x slower than native (acceptable for editor use case)

#### Serialize Performance
- **Native JSON.stringify**: Optimized C++ implementation
- **dASTardly**: AST traversal + string building
- **Expected**: Similar or slightly slower performance

#### Key Advantages of dASTardly

1. **Position Tracking**: Every node has precise source location (line, column, offset)
2. **Error Recovery**: Tree-sitter handles malformed JSON gracefully
3. **Incremental Parsing**: Can update AST for changed regions (future feature)
4. **Cross-Format**: AST works with YAML, CSV, XML serializers

### When to Use dASTardly vs Native JSON

| Use Case | Recommendation |
|----------|----------------|
| Simple parsing/serialization | Native JSON |
| Editor integration with error reporting | dASTardly |
| Cross-format conversion (JSON ↔ YAML) | dASTardly |
| High-volume data processing | Native JSON |
| Schema validation with precise errors | dASTardly |
| Position-aware transformations | dASTardly |

## Memory Considerations

dASTardly AST nodes include additional metadata:
- Source location (line, column, offset)
- Node type information
- Raw value storage for formatting preservation

Expected memory overhead: 2-4x compared to plain JavaScript objects.

This is acceptable for editor scenarios where:
- Files are typically < 1 MB
- Position tracking is essential
- Single document parsing (not batch processing)

## Optimization Opportunities

### Current Implementation
- Tree-sitter CST → dASTardly AST conversion
- Position tracking for every node
- Raw value preservation

### Potential Optimizations
1. **Lazy AST construction**: Build nodes on-demand
2. **Shared position objects**: Deduplicate location data
3. **Pooling**: Reuse node objects across parses
4. **Native addon**: Move hot paths to C++

### Non-Goals
- Match native JSON performance (impossible with position tracking)
- Streaming JSON parsing (different use case)
- Schema-aware parsing (handled by validation layer)

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
1. Build the package: `pnpm build`
2. Run benchmarks: `pnpm benchmark`
3. Consistent results across runs (±5%)

## Related Benchmarks

- [Validation Benchmarks](../../validation/benchmarks/README.md) - JSON Schema validation performance
- [YAML Benchmarks](../../yaml/benchmarks/README.md) - YAML parsing/serialization (vs js-yaml)
- [CSV Benchmarks](../../csv/benchmarks/README.md) - CSV parsing/serialization (vs csv-parse)

## References

- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [V8 JSON Performance](https://v8.dev/blog/cost-of-javascript-2019#json)
- [Tree-sitter Performance](https://tree-sitter.github.io/tree-sitter/#performance)
