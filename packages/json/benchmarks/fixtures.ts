/**
 * Test fixtures for JSON parsing/serialization benchmarks
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
  json: string;
  description: string;
  size: number;
}

// Tiny: ~100 bytes - minimal object
const tiny: Fixture = {
  name: 'tiny',
  description: 'Minimal object (~100 bytes)',
  json: JSON.stringify({
    name: 'Alice',
    age: 30,
    active: true
  }),
  size: 0
};
tiny.size = tiny.json.length;

// Small: ~1 KB - typical configuration file
const small: Fixture = {
  name: 'small',
  description: 'Typical config (~1 KB)',
  json: JSON.stringify({
    name: 'my-app',
    version: '1.0.0',
    description: 'A sample application',
    main: 'index.js',
    scripts: {
      build: 'tsc',
      test: 'vitest run',
      lint: 'eslint .',
      format: 'prettier --write .'
    },
    dependencies: {
      express: '^4.18.0',
      'body-parser': '^1.20.0',
      cors: '^2.8.5'
    },
    devDependencies: {
      typescript: '^5.0.0',
      vitest: '^1.0.0',
      eslint: '^8.0.0',
      prettier: '^3.0.0'
    },
    keywords: ['app', 'server', 'api'],
    author: 'Test Author',
    license: 'MIT'
  }, null, 2),
  size: 0
};
small.size = small.json.length;

// Medium: ~10 KB - moderate complexity with nesting
const mediumData = {
  users: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
    profile: {
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      age: 20 + (i % 50),
      address: {
        street: `${100 + i} Main St`,
        city: 'Springfield',
        state: 'IL',
        zip: `6200${i % 10}`
      },
      preferences: {
        theme: i % 2 === 0 ? 'dark' : 'light',
        notifications: i % 3 === 0,
        language: 'en'
      }
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      lastLogin: '2024-01-20T12:00:00Z'
    }
  }))
};

const medium: Fixture = {
  name: 'medium',
  description: 'Moderate complexity (~10 KB)',
  json: JSON.stringify(mediumData, null, 2),
  size: 0
};
medium.size = medium.json.length;

// Large: ~50 KB - deep nesting
const createDeepObject = (depth: number, breadth: number): unknown => {
  if (depth === 0) {
    return {
      value: Math.random(),
      text: 'leaf node',
      flag: true,
      count: 42
    };
  }

  const obj: Record<string, unknown> = {
    level: depth,
    metadata: {
      id: Math.floor(Math.random() * 1000),
      timestamp: '2024-01-01T00:00:00Z',
      description: 'Nested at ' + depth
    }
  };

  for (let i = 0; i < breadth; i++) {
    obj[`child${i}`] = createDeepObject(depth - 1, breadth);
  }

  return obj;
};

const large: Fixture = {
  name: 'large',
  description: 'Deep nesting (~10 KB)',
  json: JSON.stringify(createDeepObject(4, 3), null, 2),
  size: 0
};
large.size = large.json.length;

// Wide: ~30 KB - many properties at same level
const wideData: Record<string, unknown> = {
  metadata: {
    version: '1.0.0',
    generated: '2024-01-01T00:00:00Z'
  }
};

for (let i = 0; i < 100; i++) {
  wideData[`prop${i}`] = {
    id: i,
    name: `Prop ${i}`,
    value: Math.random() * 100,
    enabled: i % 2 === 0,
    tags: ['tag1', 'tag2'],
    config: {
      opt1: true,
      opt2: false,
      setting: `val${i}`
    }
  };
}

const wide: Fixture = {
  name: 'wide',
  description: 'Many properties (~30 KB)',
  json: JSON.stringify(wideData, null, 2),
  size: 0
};
wide.size = wide.json.length;

// ArrayHeavy: ~25 KB - large arrays
const arrayHeavyData = {
  items: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    sku: `SKU-${String(i).padStart(6, '0')}`,
    name: `Product ${i}`,
    price: (Math.random() * 1000).toFixed(2),
    inStock: i % 3 !== 0,
    categories: ['cat1', 'cat2'],
    ratings: {
      average: (Math.random() * 5).toFixed(1),
      count: Math.floor(Math.random() * 1000)
    }
  })),
  metadata: {
    total: 100,
    page: 1,
    pageSize: 100
  }
};

const arrayHeavy: Fixture = {
  name: 'arrayHeavy',
  description: 'Large arrays (~25 KB)',
  json: JSON.stringify(arrayHeavyData, null, 2),
  size: 0
};
arrayHeavy.size = arrayHeavy.json.length;

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
