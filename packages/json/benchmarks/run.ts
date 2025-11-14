/**
 * JSON Parser & Serializer Benchmarks
 *
 * Compares @bakes/dastardly-json against native JSON.parse/stringify
 *
 * Run with: npx tsx benchmarks/run.ts
 */

import Benchmark from 'benchmark';
import { json } from '../src/index.js';
import { fixtures, printFixtureSummary, type Fixture } from './fixtures.js';
import type { DocumentNode } from '@bakes/dastardly-core';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function formatOpsPerSec(hz: number): string {
  if (hz >= 1_000_000) {
    return `${(hz / 1_000_000).toFixed(2)}M ops/sec`;
  } else if (hz >= 1_000) {
    return `${(hz / 1_000).toFixed(2)}K ops/sec`;
  } else {
    return `${hz.toFixed(2)} ops/sec`;
  }
}

function formatMemory(bytes: number): string {
  if (bytes >= 1_024_024) {
    return `${(bytes / 1_024_024).toFixed(2)} MB`;
  } else if (bytes >= 1_024) {
    return `${(bytes / 1_024).toFixed(2)} KB`;
  } else {
    return `${bytes} bytes`;
  }
}

function calculateSpeedup(faster: number, slower: number): string {
  const ratio = faster / slower;
  if (ratio > 1) {
    return `${ratio.toFixed(1)}x faster`;
  } else {
    return `${(1 / ratio).toFixed(1)}x slower`;
  }
}

// Parse benchmarks: JSON string → AST/Object
function runParseBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Parse: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly JSON', () => {
        json.parse(fixture.json);
      })
      .add('Native JSON.parse', () => {
        JSON.parse(fixture.json);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const native = this[1];
        const speedup = calculateSpeedup(native.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ Native is ${speedup}${colors.reset}`);
        resolve();
      })
      .run();
  });
}

// Serialize benchmarks: AST/Object → JSON string
function runSerializeBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Serialize: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    // Pre-parse data for both
    const dastardlyAST = json.parse(fixture.json);
    const nativeObj = JSON.parse(fixture.json);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly JSON', () => {
        json.serialize(dastardlyAST);
      })
      .add('Native JSON.stringify', () => {
        JSON.stringify(nativeObj);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const native = this[1];
        const speedup = calculateSpeedup(native.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ Native is ${speedup}${colors.reset}`);
        resolve();
      })
      .run();
  });
}

// Roundtrip benchmarks: JSON string → AST/Object → JSON string
function runRoundtripBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Roundtrip: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly JSON', () => {
        const ast = json.parse(fixture.json);
        json.serialize(ast);
      })
      .add('Native JSON', () => {
        const obj = JSON.parse(fixture.json);
        JSON.stringify(obj);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const native = this[1];
        const speedup = calculateSpeedup(native.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ Native is ${speedup}${colors.reset}`);
        resolve();
      })
      .run();
  });
}

// Memory benchmarks
function runMemoryBenchmarks(): void {
  console.log(`\n${colors.blue}━━━ Memory Usage ━━━${colors.reset}\n`);

  for (const fixture of fixtures) {
    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const beforeDastardly = process.memoryUsage().heapUsed;
    const astNodes: DocumentNode[] = [];
    for (let i = 0; i < 100; i++) {
      astNodes.push(json.parse(fixture.json));
    }
    const afterDastardly = process.memoryUsage().heapUsed;
    const dastardlyMem = afterDastardly - beforeDastardly;

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const beforeNative = process.memoryUsage().heapUsed;
    const nativeObjs: unknown[] = [];
    for (let i = 0; i < 100; i++) {
      nativeObjs.push(JSON.parse(fixture.json));
    }
    const afterNative = process.memoryUsage().heapUsed;
    const nativeMem = afterNative - beforeNative;

    const ratio = dastardlyMem / nativeMem;
    const ratioStr = ratio > 1
      ? `${colors.red}${ratio.toFixed(1)}x more${colors.reset}`
      : `${colors.green}${(1/ratio).toFixed(1)}x less${colors.reset}`;

    console.log(`  ${fixture.name.padEnd(12)}: dASTardly ${formatMemory(dastardlyMem).padEnd(10)} | Native ${formatMemory(nativeMem).padEnd(10)} | ${ratioStr}`);

    // Keep references to prevent GC
    astNodes.length = 0;
    nativeObjs.length = 0;
  }
}

// Main benchmark runner
async function main(): Promise<void> {
  console.log(`${colors.bright}${colors.green}`);
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║           JSON Parser & Serializer Benchmarks                 ║');
  console.log('║                                                               ║');
  console.log('║  Comparing @bakes/dastardly-json vs Native JSON.parse/stringify     ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  printFixtureSummary();

  console.log(`${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                   PARSE BENCHMARKS                        ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  for (const fixture of fixtures) {
    await runParseBenchmarks(fixture);
  }

  console.log(`\n${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                 SERIALIZE BENCHMARKS                      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  for (const fixture of fixtures) {
    await runSerializeBenchmarks(fixture);
  }

  console.log(`\n${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                 ROUNDTRIP BENCHMARKS                      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  for (const fixture of fixtures) {
    await runRoundtripBenchmarks(fixture);
  }

  console.log(`\n${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║                   MEMORY BENCHMARKS                       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  runMemoryBenchmarks();

  console.log(`\n${colors.bright}${colors.green}✓ Benchmarks complete!${colors.reset}`);
  console.log(`${colors.yellow}💡 Run with --expose-gc for more accurate memory measurements: node --expose-gc $(which tsx) benchmarks/run.ts${colors.reset}\n`);
}

main().catch(console.error);
