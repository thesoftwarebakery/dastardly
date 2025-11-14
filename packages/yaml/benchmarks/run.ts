/**
 * YAML Parser & Serializer Benchmarks
 *
 * Compares @bakes/dastardly-yaml against js-yaml
 *
 * Run with: npx tsx benchmarks/run.ts
 */

import Benchmark from 'benchmark';
import { yaml } from '../src/index.js';
import { fixtures, printFixtureSummary, type Fixture } from './fixtures.js';
import type { DocumentNode } from '@bakes/dastardly-core';
import * as jsYaml from 'js-yaml';

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

// Parse benchmarks: YAML string → AST/Object
function runParseBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Parse: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly YAML', () => {
        yaml.parse(fixture.yaml);
      })
      .add('js-yaml', () => {
        jsYaml.load(fixture.yaml);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const jsYamlBench = this[1];
        const speedup = calculateSpeedup(jsYamlBench.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ js-yaml is ${speedup}${colors.reset}`);
        resolve();
      })
      .run();
  });
}

// Serialize benchmarks: AST/Object → YAML string
function runSerializeBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Serialize: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    // Pre-parse data for both
    const dastardlyAST = yaml.parse(fixture.yaml);
    const jsYamlObj = jsYaml.load(fixture.yaml);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly YAML', () => {
        yaml.serialize(dastardlyAST);
      })
      .add('js-yaml', () => {
        jsYaml.dump(jsYamlObj);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const jsYamlBench = this[1];
        const speedup = calculateSpeedup(jsYamlBench.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ js-yaml is ${speedup}${colors.reset}`);
        resolve();
      })
      .run();
  });
}

// Roundtrip benchmarks: YAML string → AST/Object → YAML string
function runRoundtripBenchmarks(fixture: Fixture): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}━━━ Roundtrip: ${fixture.name} (${fixture.description}) ━━━${colors.reset}`);

    const suite = new Benchmark.Suite();

    suite
      .add('dASTardly YAML', () => {
        const ast = yaml.parse(fixture.yaml);
        yaml.serialize(ast);
      })
      .add('js-yaml', () => {
        const obj = jsYaml.load(fixture.yaml);
        jsYaml.dump(obj);
      })
      .on('cycle', (event: Benchmark.Event) => {
        const bench = event.target;
        console.log(`  ${bench.name}: ${formatOpsPerSec(bench.hz!)}`);
      })
      .on('complete', function(this: Benchmark.Suite) {
        const dastardly = this[0];
        const jsYamlBench = this[1];
        const speedup = calculateSpeedup(jsYamlBench.hz!, dastardly.hz!);
        console.log(`  ${colors.yellow}→ js-yaml is ${speedup}${colors.reset}`);
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
      astNodes.push(yaml.parse(fixture.yaml));
    }
    const afterDastardly = process.memoryUsage().heapUsed;
    const dastardlyMem = afterDastardly - beforeDastardly;

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const beforeJsYaml = process.memoryUsage().heapUsed;
    const jsYamlObjs: unknown[] = [];
    for (let i = 0; i < 100; i++) {
      jsYamlObjs.push(jsYaml.load(fixture.yaml));
    }
    const afterJsYaml = process.memoryUsage().heapUsed;
    const jsYamlMem = afterJsYaml - beforeJsYaml;

    const ratio = dastardlyMem / jsYamlMem;
    const ratioStr = ratio > 1
      ? `${colors.red}${ratio.toFixed(1)}x more${colors.reset}`
      : `${colors.green}${(1/ratio).toFixed(1)}x less${colors.reset}`;

    console.log(`  ${fixture.name.padEnd(12)}: dASTardly ${formatMemory(dastardlyMem).padEnd(10)} | js-yaml ${formatMemory(jsYamlMem).padEnd(10)} | ${ratioStr}`);

    // Keep references to prevent GC
    astNodes.length = 0;
    jsYamlObjs.length = 0;
  }
}

// Main benchmark runner
async function main(): Promise<void> {
  console.log(`${colors.bright}${colors.green}`);
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║          YAML Parser & Serializer Benchmarks                  ║');
  console.log('║                                                               ║');
  console.log('║         Comparing @bakes/dastardly-yaml vs js-yaml                  ║');
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
