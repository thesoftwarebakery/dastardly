/**
 * Test fixtures for CSV parsing/serialization benchmarks
 *
 * Six complexity levels to test different performance characteristics:
 * - tiny: ~100 bytes (3 rows, 3 columns)
 * - small: ~1 KB (50 rows, 5 columns)
 * - medium: ~10 KB (500 rows, 5 columns)
 * - large: ~25 KB (1000 rows, 5 columns - limited by tree-sitter)
 * - wide: ~25 KB (250 rows, 20 columns - limited by tree-sitter)
 * - arrayHeavy: ~20 KB (2000 rows, 3 columns - limited by tree-sitter)
 *
 * Note: Tree-sitter has practical limits around 25-30KB for complex nested structures.
 */

export interface Fixture {
  name: string;
  csv: string;
  description: string;
  size: number;
}

// Tiny: ~100 bytes - minimal CSV
const tiny: Fixture = {
  name: 'tiny',
  description: 'Minimal CSV (~100 bytes)',
  csv: `name,age,active
Alice,30,true
Bob,25,false
Charlie,35,true
`,
  size: 0
};
tiny.size = tiny.csv.length;

// Small: ~1 KB - typical small dataset
const smallLines: string[] = ['id,name,email,department,salary'];
for (let i = 1; i <= 50; i++) {
  smallLines.push(`${i},Employee ${i},emp${i}@example.com,Dept${(i % 5) + 1},${50000 + (i * 1000)}`);
}

const small: Fixture = {
  name: 'small',
  description: 'Typical dataset (~1 KB)',
  csv: smallLines.join('\n') + '\n',
  size: 0
};
small.size = small.csv.length;

// Medium: ~10 KB - moderate dataset
const mediumLines: string[] = ['id,sku,name,price,inStock'];
for (let i = 1; i <= 500; i++) {
  const sku = `SKU-${String(i).padStart(6, '0')}`;
  const price = (Math.random() * 1000).toFixed(2);
  const inStock = i % 3 !== 0;
  mediumLines.push(`${i},${sku},Product ${i},${price},${inStock}`);
}

const medium: Fixture = {
  name: 'medium',
  description: 'Moderate dataset (~10 KB)',
  csv: mediumLines.join('\n') + '\n',
  size: 0
};
medium.size = medium.csv.length;

// Large: ~25 KB - large dataset
const largeLines: string[] = ['id,user_id,timestamp,action,ip_address'];
for (let i = 1; i <= 1000; i++) {
  const userId = Math.floor(Math.random() * 1000);
  const timestamp = `2024-01-${String((i % 31) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`;
  const actions = ['login', 'logout', 'view', 'edit', 'delete'];
  const action = actions[i % actions.length];
  const ip = `192.168.${(i % 256)}.${((i * 7) % 256)}`;
  largeLines.push(`${i},${userId},${timestamp},${action},${ip}`);
}

const large: Fixture = {
  name: 'large',
  description: 'Large dataset (~25 KB)',
  csv: largeLines.join('\n') + '\n',
  size: 0
};
large.size = large.csv.length;

// Wide: ~25 KB - many columns
const wideHeaders = ['id', 'name', 'email', 'age', 'city', 'state', 'zip',
  'phone', 'company', 'title', 'department', 'salary', 'hired',
  'rating', 'active', 'notes', 'manager', 'team', 'project', 'status'];

const wideLines: string[] = [wideHeaders.join(',')];
for (let i = 1; i <= 250; i++) {
  const row = [
    i.toString(),
    `Emp ${i}`,
    `emp${i}@example.com`,
    (20 + (i % 50)).toString(),
    `City${i % 50}`,
    'CA',
    `9${String(i).padStart(4, '0')}`,
    `555-${String(i).padStart(4, '0')}`,
    `Co ${(i % 10) + 1}`,
    `Title ${(i % 5) + 1}`,
    `Dept ${(i % 8) + 1}`,
    (50000 + (i * 1000)).toString(),
    '2024-01-01',
    (Math.random() * 5).toFixed(1),
    (i % 2 === 0).toString(),
    `"Notes ${i}"`,
    `Mgr ${(i % 20) + 1}`,
    `Team ${(i % 10) + 1}`,
    `Proj ${(i % 15) + 1}`,
    i % 3 === 0 ? 'active' : 'inactive'
  ];
  wideLines.push(row.join(','));
}

const wide: Fixture = {
  name: 'wide',
  description: 'Many columns (~25 KB)',
  csv: wideLines.join('\n') + '\n',
  size: 0
};
wide.size = wide.csv.length;

// ArrayHeavy: ~20 KB - very large dataset with fewer columns
const arrayHeavyLines: string[] = ['id,name,value'];
for (let i = 1; i <= 2000; i++) {
  arrayHeavyLines.push(`${i},Item ${i},${(Math.random() * 100).toFixed(2)}`);
}

const arrayHeavy: Fixture = {
  name: 'arrayHeavy',
  description: 'Very large dataset (~20 KB)',
  csv: arrayHeavyLines.join('\n') + '\n',
  size: 0
};
arrayHeavy.size = arrayHeavy.csv.length;

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
