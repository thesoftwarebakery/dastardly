# Contributing to dASTardly

Thank you for your interest in contributing to dASTardly! This document provides guidelines and information for contributors.

## Documentation

For more information about the project:
- **ARCHITECTURE.md**: Technical design and implementation details
- **CLAUDE.md**: AI assistant context and project overview
- **README.md**: User-facing documentation

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dastardly

# Install dependencies
pnpm install

# Build all packages
pnpm -r build
```

## Project Structure

```
dastardly/
├── packages/
│   ├── core/                    # Core AST types & utilities
│   ├── tree-sitter-runtime/     # Shared tree-sitter utilities (planned)
│   ├── json/                    # JSON parser/serializer (planned)
│   └── ...                      # Other format packages
├── CLAUDE.md                    # AI assistant context
├── ARCHITECTURE.md              # Architecture documentation
└── CONTRIBUTING.md              # This file
```

## Development Workflow

### Building

```bash
# Build all packages
pnpm -r build

# Build a specific package
pnpm --filter @bakes/dastardly-core build
```

### Testing

```bash
# Run all tests
pnpm -r test

# Run tests for a specific package
pnpm --filter @bakes/dastardly-json test

# Run tests in watch mode
pnpm --filter @bakes/dastardly-json test:watch
```

### Code Quality

```bash
# Type checking
pnpm -r typecheck

# Linting (once configured)
pnpm -r lint

# Formatting (once configured)
pnpm -r format
```

## Coding Standards

### TypeScript

- **Strict mode is required** - All code must pass TypeScript strict mode
- **Use ESM** - All packages use ES modules (`"type": "module"`)
- **Explicit types** - Avoid `any`, prefer explicit typing
- **No implicit returns** - Functions should have explicit return types

### Naming Conventions

- **Files**: kebab-case (e.g., `ast-node.ts`)
- **Classes**: PascalCase (e.g., `DastardlyNode`)
- **Interfaces**: PascalCase (e.g., `SourceLocation`)
- **Functions**: camelCase (e.g., `parseJSON`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MAX_DEPTH`)

### Code Organization

- Each package exports through a single `index.ts`
- Keep files focused and small (< 300 lines ideally)
- Group related functionality in subdirectories
- Tests should mirror source structure

### Comments

- Document **why**, not **what** (code should be self-documenting for "what")
- Use JSDoc for public APIs
- Add comments for complex algorithms or non-obvious logic

## Creating a New Package

To add support for a new format:

1. **Create the package structure**:
   ```bash
   mkdir -p packages/<format-name>/src
   cd packages/<format-name>
   ```

2. **Create package.json**:
   ```json
   {
     "name": "@bakes/dastardly-<format-name>",
     "version": "0.1.0",
     "description": "<Format> parser and serializer for dASTardly",
     "type": "module",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "test": "vitest"
     },
     "dependencies": {
       "@bakes/dastardly-core": "workspace:^",
       "tree-sitter": "^0.21.0"
     },
     "devDependencies": {
       "typescript": "^5.3.0",
       "vitest": "^1.0.0"
     }
   }
   ```

3. **Create tsconfig.json** extending root config:
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "dist",
       "rootDir": "src"
     },
     "include": ["src"]
   }
   ```

4. **Implement the parser and serializer**:
   - `src/parser.ts` - Tree-sitter integration
   - `src/serializer.ts` - AST to format conversion
   - `src/index.ts` - Public exports

5. **Write comprehensive tests**:
   - Test valid input parsing
   - Test invalid input handling
   - Test position tracking accuracy
   - Test roundtrip conversion (parse → serialize → parse)
   - Test edge cases specific to the format

6. **Create package README.md**:
   - Location: `packages/<format-name>/README.md`
   - Should document:
     - Format name and description
     - Installation instructions (npm/pnpm)
     - Basic usage examples (parsing and serializing)
     - API reference for all public functions and classes
     - Format-specific features and limitations
     - Links to related packages and main documentation
   - Use `IMPLEMENTATION_GUIDE.md` Step 8 as a template
   - Reference `packages/json/README.md` for a complete example

## Versioning and Dependencies

### Coordinated Releases

All dASTardly packages are versioned together using **coordinated releases**. When one package is updated, all packages receive the same version number. This ensures compatibility and simplifies the user experience.

**Example**: If `@bakes/dastardly-core` moves from v0.1.0 to v0.2.0, all other packages (`@bakes/dastardly-json`, `@bakes/dastardly-tree-sitter-runtime`, etc.) also move to v0.2.0, even if they have no code changes.

### Internal Dependencies

Use `workspace:^` for all internal package dependencies:

```json
{
  "dependencies": {
    "@bakes/dastardly-core": "workspace:^",
    "@bakes/dastardly-tree-sitter-runtime": "workspace:^"
  }
}
```

**Why workspace:^?**

- During development, `workspace:^` resolves to the local package
- When published, `workspace:^` converts to a caret range (e.g., `^0.1.0`)
- Caret ranges allow patch and minor updates while preventing major version mismatches
- This is the **industry standard** for monorepos with coordinated releases

**What gets published:**

```json
// Before publish (in monorepo)
"@bakes/dastardly-core": "workspace:^"

// After publish (on npm)
"@bakes/dastardly-core": "^0.1.0"
```

**User benefits:**
- Users can independently update packages for bug fixes
- Example: Install `@bakes/dastardly-json@0.1.0`, later update just `@bakes/dastardly-core` to `0.1.5` for a critical fix
- Version ranges prevent incompatible major version combinations

### External Dependencies

Use standard semver ranges for external dependencies:

```json
{
  "dependencies": {
    "tree-sitter": "^0.21.0",           // Caret range for minor updates
    "tree-sitter-json": "^0.24.5"       // Caret range for minor updates
  }
}
```

### Version Consistency

- All packages share the same version number
- Breaking changes in any package trigger a major version bump for all packages
- Follow [Semantic Versioning](https://semver.org/) strictly
- Use conventional commits to track changes

## Testing Guidelines

### Test Categories

dASTardly uses two levels of testing:

1. **Unit Tests**: Test individual functions, parsers, and serializers in isolation (located in each package)
2. **Integration Tests**: Test cross-package interactions, format conversions, and real-world scenarios (located in `packages/integration-tests`)

### What to Test

1. **Position Tracking**: Verify line/column/offset accuracy for every node
2. **Format Compliance**: Follow the official specification exactly
3. **Error Handling**: Graceful failures with helpful error messages
4. **Edge Cases**: Large files, unicode, special characters, nested structures
5. **Cross-format Conversion**: Verify data integrity when converting between formats

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { parseJSON } from './parser';

describe('JSON Parser', () => {
  describe('position tracking', () => {
    it('tracks object positions correctly', () => {
      const source = '{"key": "value"}';
      const ast = parseJSON(source);
      expect(ast.loc.start.line).toBe(1);
      expect(ast.loc.start.column).toBe(0);
      // ...
    });
  });

  describe('error handling', () => {
    it('reports helpful errors for invalid JSON', () => {
      expect(() => parseJSON('{invalid}')).toThrow(/position/);
    });
  });
});
```

### Integration Testing

The `packages/integration-tests` package contains comprehensive tests for cross-format functionality.

#### Running Integration Tests

```bash
# Run integration tests
pnpm --filter @bakes/dastardly-integration-tests test

# Run all tests (including integration tests)
pnpm -r test
```

#### Adding Test Fixtures

When adding integration tests:

1. **Add fixture file** to appropriate `fixtures/` subdirectory:
   - `fixtures/json/` for JSON test data
   - `fixtures/yaml/` for YAML test data
   - `fixtures/expected/` for expected outputs

2. **Create corresponding test** in `__tests__/`:
   - `cross-format.test.ts` - Cross-format conversions
   - `position-tracking.test.ts` - Source location accuracy
   - `roundtrip.test.ts` - Parse-serialize-parse fidelity

3. **Use fixture helpers** from `__tests__/helpers/fixtures.ts`:

```typescript
import { loadJSONFixture, loadYAMLFixture } from './helpers/fixtures.js';

it('converts package.json to YAML', () => {
  const jsonSource = loadJSONFixture('real-world/package');
  // ... test implementation
});
```

#### Integration Test Categories

- **Cross-format**: JSON ↔ YAML conversions and data preservation
- **Position tracking**: Source location accuracy across formats
- **Roundtrip**: Parse-serialize-parse fidelity tests
- **Real-world**: Actual configuration files (package.json, docker-compose.yml, etc.)
- **Edge cases**: Boundary conditions and special values

#### When to Add Integration Tests

Add integration tests when:

1. **Creating a new format package**: Add cross-format conversion tests with existing formats
2. **Modifying core AST**: Verify changes don't break cross-format conversions
3. **Adding format-specific features**: Test how features are handled in conversions
4. **Finding conversion bugs**: Add regression tests to prevent recurrence

Integration tests validate the core value proposition of dASTardly: seamless format conversion while preserving data integrity and source locations.

#### Pattern: Adding a New Format to Integration Tests

After implementing a new format package (e.g., CSV, TOML, XML), follow this checklist:

**1. Create Format Fixtures** (Est. 30-60 minutes)

Add to `packages/integration-tests/fixtures/<format>/`:

```bash
fixtures/<format>/
├── primitives.<ext>         # Simple data types
├── collections.<ext>        # Arrays, objects/tables
├── real-world/
│   ├── example1.<ext>      # Real configuration file
│   └── example2.<ext>      # Another real example
└── edge-cases/
    ├── empty-values.<ext>   # Empty/null handling
    └── special-chars.<ext>  # Special character escaping
```

**2. Add Cross-Format Conversion Tests** (Est. 1-1.5 hours)

Update `packages/integration-tests/__tests__/cross-format.test.ts`:

```typescript
describe('<Format> ↔ JSON Conversions', () => {
  it('converts <format> to JSON', () => {
    const source = load<Format>Fixture('primitives');
    const doc = <format>.parse(source);
    const jsonOutput = json.serialize(doc.body);
    // Verify structure preserved
  });

  it('converts JSON to <format>', () => {
    const source = loadJSONFixture('primitives');
    const doc = json.parse(source);
    const output = <format>.serialize(doc.body);
    // Verify valid <format> output
  });
});

describe('<Format> ↔ YAML Conversions', () => {
  // Similar tests with YAML
});
```

**3. Add Roundtrip Tests** (Est. 30-45 minutes)

Update `packages/integration-tests/__tests__/roundtrip.test.ts`:

```typescript
describe('<Format> Roundtrip', () => {
  it('preserves data through parse-serialize-parse cycle', () => {
    const original = load<Format>Fixture('primitives');
    const doc = <format>.parse(original);
    const serialized = <format>.serialize(doc.body);
    const reparsed = <format>.parse(serialized);

    // Compare ASTs for structural equality
    expect(reparsed.body).toMatchObject(doc.body);
  });
});
```

**4. Add Position Tracking Tests** (Est. 30 minutes)

Update `packages/integration-tests/__tests__/position-tracking.test.ts`:

```typescript
describe('<Format> Position Tracking', () => {
  it('tracks positions for all node types', () => {
    const source = load<Format>Fixture('primitives');
    const doc = <format>.parse(source);

    // Verify all nodes have valid source locations
    visitAST(doc.body, (node) => {
      expect(node.loc).toBeDefined();
      expect(node.loc.start.line).toBeGreaterThan(0);
      expect(node.loc.start.column).toBeGreaterThanOrEqual(0);
    });
  });
});
```

**5. Update Integration Tests README** (Est. 15 minutes)

Add format to `packages/integration-tests/README.md`:
- Document fixture organization
- Note any format-specific conversion considerations
- Document structural differences (e.g., CSV is flat vs nested JSON/YAML)

**Total Estimated Time**: 3-5 hours per new format

**Special Considerations**:

- **CSV**: Flat structure (array-of-objects) vs nested JSON/YAML - test conversions that make sense
- **TOML**: Datetime types need special handling in conversions
- **XML**: Attributes stored in metadata - test attribute preservation/conversion

## Benchmarking

All format packages include comprehensive performance benchmarks comparing dASTardly against industry-standard libraries.

### Running Benchmarks

```bash
# Run all benchmarks
pnpm benchmark

# Run specific package benchmarks
pnpm benchmark:json       # JSON vs native JSON.parse/stringify
pnpm benchmark:yaml       # YAML vs js-yaml
pnpm benchmark:csv        # CSV vs csv-parse/csv-stringify
pnpm benchmark:validation # JSON Schema validation vs AJV

# Run from within a package
cd packages/json
pnpm benchmark

# With garbage collection for accurate memory measurements
node --expose-gc $(which tsx) benchmarks/run.ts
```

### Benchmark Structure

Each format package includes:

```
packages/<format>/
├── benchmarks/
│   ├── fixtures.ts    # Test data (6 complexity levels)
│   ├── run.ts         # Benchmark runner
│   └── README.md      # Results and analysis
```

### Benchmark Categories

1. **Parse Performance**: String → AST/Object
2. **Serialize Performance**: AST/Object → String
3. **Roundtrip Performance**: Full parse-serialize-parse cycle
4. **Memory Usage**: Heap consumption analysis (100 iterations)

### Test Fixtures

All benchmarks use 6 complexity levels:

| Fixture | Size | Description |
|---------|------|-------------|
| tiny | ~100 bytes | Minimal data |
| small | ~1 KB | Typical config file |
| medium | ~10 KB | Moderate complexity |
| large | ~100 KB | Large dataset |
| wide | ~50 KB | Many properties/columns |
| arrayHeavy | ~100 KB | Large arrays |

### Adding Benchmarks for New Formats

When creating a new format package, add benchmarks following this pattern:

**1. Install Dependencies** (package.json):

```json
{
  "scripts": {
    "benchmark": "pnpm build && npx tsx benchmarks/run.ts"
  },
  "devDependencies": {
    "@types/benchmark": "^2.1.5",
    "benchmark": "^2.1.4",
    "<comparison-library>": "^x.x.x"
  }
}
```

**2. Create fixtures.ts** with 6 complexity levels matching the format's characteristics.

**3. Create run.ts** using Benchmark.js:

```typescript
import Benchmark from 'benchmark';
import { format } from '../src/index.js';
import { fixtures } from './fixtures.js';
import * as comparisonLib from '<comparison-library>';

// Parse benchmarks
function runParseBenchmarks(fixture) {
  return new Promise((resolve) => {
    new Benchmark.Suite()
      .add('dASTardly', () => format.parse(fixture.data))
      .add('Comparison Lib', () => comparisonLib.parse(fixture.data))
      .on('complete', function() {
        // Log results
        resolve();
      })
      .run();
  });
}
```

**4. Create README.md** documenting:
- How to run benchmarks
- Benchmark categories
- Test fixtures
- Comparison library details
- Expected results (add actual results after running)
- Performance analysis
- When to use dASTardly vs comparison library

**5. Add to Root Benchmark Scripts** (root package.json):

```json
{
  "scripts": {
    "benchmark": "... && pnpm benchmark:<format>",
    "benchmark:<format>": "pnpm --filter @bakes/dastardly-<format> benchmark"
  }
}
```

### Benchmark Comparison Libraries

| Format | Comparison Library | Notes |
|--------|-------------------|-------|
| JSON | Native JSON.parse/stringify | V8 built-in, highly optimized |
| YAML | js-yaml | Most popular, 19M+ downloads/week |
| CSV | csv-parse/csv-stringify | Popular streaming library, 2M+ downloads/week |
| Validation | AJV | Industry standard, JIT compilation |

### Performance Expectations

dASTardly prioritizes **correctness** and **position tracking** over raw speed:

**Expected Performance Characteristics:**
- **Parse**: 2-10x slower than native/optimized libraries (acceptable for editor use)
- **Serialize**: Competitive performance
- **Memory**: 2-4x higher due to position tracking and AST metadata
- **Unique advantages**: Position tracking, cross-format conversion, error recovery

**Performance Goals:**
- Parse files < 100 KB in < 100ms
- No blocking on editor keystroke (with incremental parsing)
- Memory usage proportional to file size

### When to Run Benchmarks

Run benchmarks:
- **After performance optimizations** - Verify improvements
- **Before releases** - Ensure no regressions
- **When adding features** - Check performance impact
- **Comparing approaches** - Data-driven decisions

Don't over-optimize prematurely. Profile first, optimize hot paths only.

## Performance Considerations

This library is designed for **real-time editor feedback**, so performance is critical:

1. **Use tree-sitter** - Don't write custom parsers
2. **Leverage incremental parsing** - Only re-parse changed sections
3. **Avoid unnecessary allocations** - Reuse objects where possible
4. **Benchmark new features** - Ensure no performance regressions
5. **Profile before optimizing** - Measure first, optimize second

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This enables automatic versioning and changelog generation.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature (triggers minor version bump)
- **fix**: Bug fix (triggers patch version bump)
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code refactoring without changing behavior
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files

### Scopes

- **core**: Changes to `@bakes/dastardly-core`
- **json**: Changes to `@bakes/dastardly-json`
- **yaml**: Changes to `@bakes/dastardly-yaml`
- **runtime**: Changes to `@bakes/dastardly-tree-sitter-runtime`
- **docs**: Documentation changes
- **repo**: Repository-level changes

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or append `!` after the type/scope:

```
feat(core)!: redesign AST node structure

BREAKING CHANGE: Node constructors now require different parameters
```

This triggers a major version bump.

### Examples

```
feat(json): add JSON parser implementation
fix(core): correct position tracking in nested objects
docs(readme): update installation instructions
chore(deps): upgrade tree-sitter to v0.21.0
```

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Write tests** for new functionality
3. **Ensure all tests pass**: `pnpm -r test`
4. **Ensure type checking passes**: `pnpm -r build`
5. **Update documentation** if adding new features
6. **Follow commit message conventions** (see above)
7. **Submit PR** with a clear description of changes

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Motivation
Why is this change needed?

## Changes
- List of specific changes made
- ...

## Testing
How was this tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated (README.md created for new packages)
- [ ] All tests passing
- [ ] TypeScript strict mode passing
```

## Design Principles

When contributing, keep these principles in mind:

1. **Position Preservation**: Never lose source location information
2. **Format Correctness**: Follow specifications exactly
3. **Performance**: Optimize for real-time editing
4. **Clarity**: Code should be readable and maintainable
5. **Error Messages**: Users need precise, helpful error information

## Questions?

- Check `ARCHITECTURE.md` for design details
- Check `CLAUDE.md` for project context
- Open an issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
