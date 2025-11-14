/**
 * Benchmarking suite comparing @bakes/dastardly-validation with AJV
 *
 * Benchmarks:
 * 1. Schema compilation time
 * 2. Validation performance (warm cache)
 * 3. End-to-end performance (parse + validate)
 * 4. Memory usage
 */

import Benchmark from 'benchmark';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { json } from '@bakes/dastardly-json';
import { Validator } from '../src/validator.js';
import { schemas, testData } from './schemas.js';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatOpsPerSec(ops: number): string {
  if (ops > 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M ops/sec`;
  if (ops > 1_000) return `${(ops / 1_000).toFixed(2)}K ops/sec`;
  return `${ops.toFixed(0)} ops/sec`;
}

function printHeader(title: string) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80) + colors.reset);
}

function printSubHeader(title: string) {
  console.log('\n' + colors.bright + colors.blue + title + colors.reset);
  console.log('-'.repeat(80));
}

// Benchmark 1: Schema Compilation
function benchmarkCompilation() {
  printHeader('Benchmark 1: Schema Compilation Time');

  for (const [schemaName, schema] of Object.entries(schemas)) {
    printSubHeader(`Schema: ${schemaName}`);

    const suite = new Benchmark.Suite();

    suite
      .add('AJV compilation', () => {
        const ajv = new Ajv({ strict: false });
        addFormats(ajv);
        ajv.compile(schema);
      })
      .add('Dastardly compilation', () => {
        new Validator(schema);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const fastest = this.filter('fastest').map('name');
        const benches = Array.from(this);
        const ajvBench = benches.find((b: any) => b.name === 'AJV compilation');
        const dastardlyBench = benches.find((b: any) => b.name === 'Dastardly compilation');

        if (ajvBench && dastardlyBench) {
          const ratio = (dastardlyBench.hz! / ajvBench.hz! * 100).toFixed(1);
          console.log(colors.green + `  Fastest: ${fastest}` + colors.reset);
          console.log(colors.yellow + `  Dastardly is ${ratio}% of AJV speed` + colors.reset);
        }
      })
      .run({ async: false });
  }
}

// Benchmark 2: Pure Validation (Pre-compiled, Pre-parsed)
function benchmarkValidation() {
  printHeader('Benchmark 2: Pure Validation Performance (Warm Cache)');

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const data = testData[schemaName as keyof typeof testData];
    if (!data) continue;

    printSubHeader(`Schema: ${schemaName} (valid data)`);

    // Pre-compile validators
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const ajvValidate = ajv.compile(schema);
    const dastardlyValidator = new Validator(schema);

    // Pre-parse data for Dastardly
    const jsonString = JSON.stringify(data.valid);
    const document = json.parse(jsonString);

    const suite = new Benchmark.Suite();

    suite
      .add('AJV validation', () => {
        ajvValidate(data.valid);
      })
      .add('Dastardly validation', () => {
        dastardlyValidator.validate(document);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const fastest = this.filter('fastest').map('name');
        const benches = Array.from(this);
        const ajvBench = benches.find((b: any) => b.name === 'AJV validation');
        const dastardlyBench = benches.find((b: any) => b.name === 'Dastardly validation');

        if (ajvBench && dastardlyBench) {
          const ratio = (dastardlyBench.hz! / ajvBench.hz! * 100).toFixed(1);
          console.log(colors.green + `  Fastest: ${fastest}` + colors.reset);
          console.log(colors.yellow + `  Dastardly is ${ratio}% of AJV speed` + colors.reset);
        }
      })
      .run({ async: false });
  }
}

// Benchmark 3: End-to-End (Parse + Validate)
function benchmarkEndToEnd() {
  printHeader('Benchmark 3: End-to-End Performance (Parse + Validate)');

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const data = testData[schemaName as keyof typeof testData];
    if (!data) continue;

    printSubHeader(`Schema: ${schemaName} (valid data)`);

    // Pre-compile validators
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const ajvValidate = ajv.compile(schema);
    const dastardlyValidator = new Validator(schema);

    const jsonString = JSON.stringify(data.valid);

    const suite = new Benchmark.Suite();

    suite
      .add('AJV (JSON.parse + validate)', () => {
        const obj = JSON.parse(jsonString);
        ajvValidate(obj);
      })
      .add('Dastardly (json.parse + validate)', () => {
        const document = json.parse(jsonString);
        dastardlyValidator.validate(document);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const fastest = this.filter('fastest').map('name');
        const benches = Array.from(this);
        const ajvBench = benches.find((b: any) => b.name === 'AJV (JSON.parse + validate)');
        const dastardlyBench = benches.find((b: any) => b.name === 'Dastardly (json.parse + validate)');

        if (ajvBench && dastardlyBench) {
          const ratio = (dastardlyBench.hz! / ajvBench.hz! * 100).toFixed(1);
          console.log(colors.green + `  Fastest: ${fastest}` + colors.reset);
          console.log(colors.yellow + `  Dastardly is ${ratio}% of AJV speed` + colors.reset);
        }
      })
      .run({ async: false });
  }
}

// Benchmark 4: Memory Usage
function benchmarkMemory() {
  printHeader('Benchmark 4: Memory Usage');

  const memBefore = process.memoryUsage();

  // Create multiple validators
  const ajvInstances = Object.values(schemas).map(schema => {
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    return ajv.compile(schema);
  });

  const memAfterAjv = process.memoryUsage();

  const dastardlyInstances = Object.values(schemas).map(schema => {
    return new Validator(schema);
  });

  const memAfterDastardly = process.memoryUsage();

  const ajvHeap = (memAfterAjv.heapUsed - memBefore.heapUsed) / 1024 / 1024;
  const dastardlyHeap = (memAfterDastardly.heapUsed - memAfterAjv.heapUsed) / 1024 / 1024;

  console.log(`\nCompiled ${Object.keys(schemas).length} schemas:`);
  console.log(`  AJV heap usage: ${ajvHeap.toFixed(2)} MB`);
  console.log(`  Dastardly heap usage: ${dastardlyHeap.toFixed(2)} MB`);
  console.log(`  Ratio: ${(dastardlyHeap / ajvHeap).toFixed(2)}x`);

  // Prevent optimization
  console.log(`  (Validators: ${ajvInstances.length}, ${dastardlyInstances.length})`);
}

// Main execution
async function main() {
  console.log(colors.bright + '\n📊 JSON Schema Validator Benchmarks' + colors.reset);
  console.log(colors.cyan + 'Comparing @bakes/dastardly-validation with AJV\n' + colors.reset);

  benchmarkCompilation();
  benchmarkValidation();
  benchmarkEndToEnd();
  benchmarkMemory();

  printHeader('Benchmark Complete ✅');
}

main().catch(console.error);
