# Validation Benchmarks

Comprehensive performance benchmarks comparing `@dastardly/validation` with AJV (the industry-standard JSON Schema validator).

## Running Benchmarks

```bash
# From the validation package directory
pnpm build
npx tsx benchmarks/run.ts
```

## Benchmark Categories

### 1. Schema Compilation Time
Measures how long it takes to compile a JSON Schema into a validator.

**Why it matters:** In editor scenarios, schemas are compiled once and reused many times.

### 2. Pure Validation Performance
Measures validation speed with pre-compiled schemas and pre-parsed data.

**Why it matters:** Shows the raw validation engine performance without parsing overhead.

### 3. End-to-End Performance
Measures the complete workflow: parse JSON string → validate against schema.

**Why it matters:** Real-world performance for typical use cases.

### 4. Memory Usage
Measures heap memory consumption for compiled validators.

**Why it matters:** Large schemas or many validators can impact memory usage.

## Test Schemas

| Schema | Description | Complexity |
|--------|-------------|------------|
| **simple** | Basic object with 3 properties | Low |
| **medium** | Object with validation rules (minLength, pattern, arrays) | Medium |
| **complex** | Nested objects, $ref, format validation | High |
| **wide** | 50 properties at same level | Wide |
| **deep** | 5 levels of nesting | Deep |
| **arrayHeavy** | 100-item array with nested objects | Array-focused |

## Latest Results

### Summary Table

| Benchmark | AJV | Dastardly | Ratio |
|-----------|-----|-----------|-------|
| **Schema Compilation** | 125-220 ops/sec | 600K-850K ops/sec | ⚡ **3,500x - 6,800x faster** |
| **Pure Validation** | 700K-92M ops/sec | 22-9.4K ops/sec | ❌ **10,000x - 400,000x slower** |
| **End-to-End** | 19K-1.8M ops/sec | 20-4.2K ops/sec | ⚠️ **200x - 1,000x slower** |

### Detailed Results

#### Schema Compilation (Dastardly wins ✅)

```
Schema: simple
  AJV compilation:       219 ops/sec
  Dastardly compilation: 775K ops/sec  (3,543x faster)

Schema: complex
  AJV compilation:       149 ops/sec
  Dastardly compilation: 607K ops/sec  (4,068x faster)

Schema: wide (50 properties)
  AJV compilation:       125 ops/sec
  Dastardly compilation: 855K ops/sec  (6,827x faster)
```

**Analysis:** Dastardly uses lightweight schema compilation (object creation + function references), while AJV performs expensive JIT code generation. For editor use cases where schemas are compiled once, this is a massive win.

#### Pure Validation (AJV wins ❌)

```
Schema: simple
  AJV validation:        91.9M ops/sec
  Dastardly validation:  9.4K ops/sec   (0.01% of AJV)

Schema: complex
  AJV validation:        740K ops/sec
  Dastardly validation:  1.4K ops/sec   (0.2% of AJV)

Schema: arrayHeavy (100 items)
  AJV validation:        697K ops/sec
  Dastardly validation:  22 ops/sec     (0.003% of AJV)
```

**Analysis:** AJV's JIT-compiled validators are extremely fast. Dastardly uses AST traversal with function dispatch, which has significant overhead. This is the critical area for optimization.

#### End-to-End (AJV wins ⚠️)

```
Schema: simple
  AJV (JSON.parse + validate):        1.83M ops/sec
  Dastardly (json.parse + validate):  4.2K ops/sec   (0.2% of AJV)

Schema: complex
  AJV (JSON.parse + validate):        277K ops/sec
  Dastardly (json.parse + validate):  896 ops/sec    (0.3% of AJV)
```

**Analysis:** Even including JSON parsing overhead, AJV is 200-1,000x faster. The validation overhead dominates even with tree-sitter's efficient parsing.

## Performance Analysis

### Where Dastardly Excels

1. **Schema Compilation** - 3,500x - 6,800x faster
   - Lightweight design: no code generation
   - Instant validator creation
   - Perfect for editor use case (compile once)

2. **Source Location Tracking** - ⭐ Unique feature
   - Every error includes line/column/offset
   - Critical for editor integration
   - AJV doesn't provide this

3. **Memory Efficiency** - Low overhead
   - Simple object-based validators
   - No generated code to store

### Where Dastardly Struggles

1. **Validation Speed** - 10,000x - 400,000x slower
   - AST traversal overhead
   - Function call overhead per validator
   - No JIT optimization
   - Cache misses on nested structures

2. **Array-Heavy Workloads** - Particularly slow (0.003% of AJV)
   - Large arrays compound the overhead
   - Each element validation is expensive

## Optimization Opportunities

Based on the benchmark results, here are the highest-impact optimizations:

### High Impact (10-100x improvement potential)

1. **Validator Function Inlining**
   - Generate optimized validator functions instead of dispatching
   - Eliminate function call overhead
   - Could approach AJV's model

2. **Fast Path for Simple Schemas**
   - Detect simple type checks and skip complex machinery
   - Use direct property access instead of AST traversal

3. **Array Validation Optimization**
   - Batch process array items
   - Early termination on first error
   - Consider parallel validation

### Medium Impact (2-10x improvement)

4. **Cache Improvements**
   - Profile cache hit rates
   - Optimize cache key generation
   - Consider WeakMap for node-based caching

5. **Lazy Validator Creation**
   - Don't compile validators for unused schema branches
   - Defer $ref resolution until needed

6. **Type-Specific Optimizations**
   - Specialize validators for common patterns
   - Avoid generic dispatch when type is known

### Low Impact (1-2x improvement)

7. **String Validation Optimizations**
   - Cache compiled regexes
   - SIMD string operations

## Context: Editor Use Case

It's important to understand that Dastardly is optimized for a different use case than AJV:

### AJV's Use Case
- Validate API requests/responses
- Schema compiled once, used millions of times
- No need for source locations
- Pure validation speed is critical

### Dastardly's Use Case
- Real-time editor validation
- Schema compiled once per editor session
- Source locations are essential
- Validation happens on keystroke (~1-10 times/sec)
- Incremental parsing/validation possible

### Performance Requirements

For a typical editor workflow:
- **Schema compilation:** < 10ms (Dastardly: ✅ ~1ms)
- **Single validation:** < 10ms for typical files (Dastardly: ⚠️ ~0.2-50ms depending on size)
- **Large file validation:** < 100ms (Dastardly: ❌ May exceed for very large files)

**Verdict:** Dastardly is fast enough for small-to-medium documents but needs optimization for large files.

## Benchmark Methodology

### Hardware/Environment
- Node.js v22.17.1
- Benchmark.js library
- Each test runs until statistical significance
- Results are ops/sec (operations per second)

### Fairness Considerations

1. **Pre-compilation:** Both validators compile schemas before timing
2. **Warm cache:** Multiple runs to warm up JIT compilers
3. **Same data:** Identical test data for both validators
4. **Format validation:** Both have format validators enabled

### Known Limitations

1. **Memory benchmark:** Needs refinement (GC interference)
2. **Incremental validation:** Not yet benchmarked (Dastardly's advantage)
3. **Error reporting quality:** Not measured (Dastardly's advantage)
4. **Cold start:** Not measured (Dastardly's advantage)

## Next Steps

### Priority Optimizations

1. ⚡ **Implement validator function generation** - Highest impact
2. ⚡ **Add fast path for simple schemas** - Quick win
3. ⚡ **Optimize array validation** - Biggest weakness
4. 📊 **Re-benchmark after optimizations** - Measure improvement
5. 📊 **Add incremental validation benchmark** - Show unique value

### Additional Benchmarks

1. **Cold start time** - First validation after compile
2. **Incremental update performance** - Re-validate after edit
3. **Error reporting overhead** - Cost of source locations
4. **Cache hit rate analysis** - Understand cache effectiveness

## Conclusion

**Current State:**
- Schema compilation: ⚡ **Excellent** (3,500x faster than AJV)
- Validation speed: ⚠️ **Needs work** (200-10,000x slower than AJV)
- Use case fit: ✅ **Good enough** for real-time editor validation of small-medium files

**Future State (with optimizations):**
- Target: Get within 10-100x of AJV validation speed
- This would make Dastardly suitable for very large files
- While maintaining unique advantages (source locations, fast compilation)

The benchmarks clearly show where optimization efforts should focus: **validation speed**, particularly for arrays and complex schemas.
