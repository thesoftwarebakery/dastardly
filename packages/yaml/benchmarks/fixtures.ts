/**
 * Test fixtures for YAML parsing/serialization benchmarks
 *
 * Six complexity levels to test different performance characteristics:
 * - tiny: ~100 bytes (minimal object)
 * - small: ~1 KB (typical config)
 * - medium: ~10 KB (moderate complexity)
 * - large: ~10 KB (deep nesting - limited by tree-sitter recursion depth)
 * - wide: ~30 KB (many properties)
 * - arrayHeavy: ~25 KB (large arrays - limited by tree-sitter)
 *
 * Note: Tree-sitter has practical limits around 25-30KB for complex nested structures
 * and recursion depth of ~4 levels for highly branching trees.
 */

export interface Fixture {
  name: string;
  yaml: string;
  description: string;
  size: number;
}

// Tiny: ~100 bytes - minimal object
const tiny: Fixture = {
  name: 'tiny',
  description: 'Minimal object (~100 bytes)',
  yaml: `name: Alice
age: 30
active: true
`,
  size: 0
};
tiny.size = tiny.yaml.length;

// Small: ~1 KB - typical configuration file
const small: Fixture = {
  name: 'small',
  description: 'Typical config (~1 KB)',
  yaml: `name: my-app
version: 1.0.0
description: A sample application
main: index.js
scripts:
  build: tsc
  test: vitest run
  lint: eslint .
  format: prettier --write .
dependencies:
  express: ^4.18.0
  body-parser: ^1.20.0
  cors: ^2.8.5
devDependencies:
  typescript: ^5.0.0
  vitest: ^1.0.0
  eslint: ^8.0.0
  prettier: ^3.0.0
keywords:
  - app
  - server
  - api
author: Test Author
license: MIT
`,
  size: 0
};
small.size = small.yaml.length;

// Medium: ~10 KB - moderate complexity with nesting
const mediumYaml = `users:
${Array.from({ length: 20 }, (_, i) => `  - id: ${i + 1}
    username: user${i + 1}
    email: user${i + 1}@example.com
    profile:
      firstName: First${i + 1}
      lastName: Last${i + 1}
      age: ${20 + (i % 50)}
      address:
        street: ${100 + i} Main St
        city: Springfield
        state: IL
        zip: "6200${i % 10}"
      preferences:
        theme: ${i % 2 === 0 ? 'dark' : 'light'}
        notifications: ${i % 3 === 0}
        language: en
    metadata:
      createdAt: "2024-01-01T00:00:00Z"
      updatedAt: "2024-01-15T00:00:00Z"
      lastLogin: "2024-01-20T12:00:00Z"`).join('\n')}
`;

const medium: Fixture = {
  name: 'medium',
  description: 'Moderate complexity (~10 KB)',
  yaml: mediumYaml,
  size: 0
};
medium.size = medium.yaml.length;

// Helper to create deep nested YAML
function createDeepYAML(depth: number, breadth: number, indent: number = 0): string {
  const spaces = ' '.repeat(indent);

  if (depth === 0) {
    return `${spaces}value: ${Math.random()}
${spaces}text: "leaf node with some text content"
${spaces}flag: true
${spaces}count: 42`;
  }

  const lines: string[] = [
    `${spaces}level: ${depth}`,
    `${spaces}metadata:`,
    `${spaces}  id: ${Math.floor(Math.random() * 1000)}`,
    `${spaces}  timestamp: "2024-01-01T00:00:00Z"`,
    `${spaces}  description: "A nested object at depth ${depth}"`
  ];

  for (let i = 0; i < breadth; i++) {
    lines.push(`${spaces}child${i}:`);
    lines.push(createDeepYAML(depth - 1, breadth, indent + 2));
  }

  return lines.join('\n');
}

// Large: ~10 KB - deep nesting
const large: Fixture = {
  name: 'large',
  description: 'Deep nesting (~10 KB)',
  yaml: createDeepYAML(4, 3, 0),
  size: 0
};
large.size = large.yaml.length;

// Wide: ~30 KB - many properties at same level
const wideLines: string[] = [
  'metadata:',
  '  version: 1.0.0',
  '  generated: "2024-01-01T00:00:00Z"'
];

for (let i = 0; i < 100; i++) {
  wideLines.push(`prop${i}:
  id: ${i}
  name: Prop ${i}
  value: ${(Math.random() * 100).toFixed(2)}
  enabled: ${i % 2 === 0}
  tags:
    - tag1
    - tag2
  config:
    opt1: true
    opt2: false
    setting: val${i}`);
}

const wide: Fixture = {
  name: 'wide',
  description: 'Many properties (~30 KB)',
  yaml: wideLines.join('\n'),
  size: 0
};
wide.size = wide.yaml.length;

// ArrayHeavy: ~25 KB - large arrays
const arrayHeavyLines: string[] = ['items:'];
for (let i = 0; i < 100; i++) {
  const sku = `SKU-${String(i).padStart(6, '0')}`;
  arrayHeavyLines.push(`  - id: ${i}
    sku: "${sku}"
    name: Product ${i}
    price: "${(Math.random() * 1000).toFixed(2)}"
    inStock: ${i % 3 !== 0}
    categories:
      - cat1
      - cat2
    ratings:
      average: "${(Math.random() * 5).toFixed(1)}"
      count: ${Math.floor(Math.random() * 1000)}`);
}
arrayHeavyLines.push('metadata:');
arrayHeavyLines.push('  total: 100');
arrayHeavyLines.push('  page: 1');
arrayHeavyLines.push('  pageSize: 100');

const arrayHeavy: Fixture = {
  name: 'arrayHeavy',
  description: 'Large arrays (~25 KB)',
  yaml: arrayHeavyLines.join('\n'),
  size: 0
};
arrayHeavy.size = arrayHeavy.yaml.length;

export const fixtures: Fixture[] = [
  tiny,
  small,
  medium,
  large,
  wide,
  arrayHeavy
];

// Helper to get a specific fixture
export function getFixture(name: string): Fixture {
  const fixture = fixtures.find(f => f.name === name);
  if (!fixture) {
    throw new Error(`Fixture "${name}" not found`);
  }
  return fixture;
}

// Print fixture summary
export function printFixtureSummary(): void {
  console.log('\n📊 Benchmark Fixtures:');
  console.log('┌─────────────┬──────────────────────────────┬───────────┐');
  console.log('│ Name        │ Description                  │ Size      │');
  console.log('├─────────────┼──────────────────────────────┼───────────┤');
  for (const fixture of fixtures) {
    const sizeKB = (fixture.size / 1024).toFixed(1);
    const sizePadded = `${sizeKB} KB`.padStart(9);
    console.log(`│ ${fixture.name.padEnd(11)} │ ${fixture.description.padEnd(28)} │ ${sizePadded} │`);
  }
  console.log('└─────────────┴──────────────────────────────┴───────────┘\n');
}
