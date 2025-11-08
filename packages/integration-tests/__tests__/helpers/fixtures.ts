import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base fixtures directory
const FIXTURES_DIR = join(__dirname, '../../fixtures');

/**
 * Load a fixture file by path relative to fixtures directory
 */
export function loadFixture(relativePath: string): string {
  const fullPath = join(FIXTURES_DIR, relativePath);
  return readFileSync(fullPath, 'utf-8');
}

/**
 * Load a JSON fixture by name
 * @param name - Name with optional category prefix (e.g., 'primitives/string' or 'package')
 */
export function loadJSONFixture(name: string): string {
  const path = name.includes('/') ? name : `${name}.json`;
  const fullPath = path.endsWith('.json') ? path : `${path}.json`;
  return loadFixture(`json/${fullPath}`);
}

/**
 * Load a YAML fixture by name
 * @param name - Name with optional category prefix (e.g., 'scalars/plain-string' or 'docker-compose')
 */
export function loadYAMLFixture(name: string): string {
  const path = name.includes('/') ? name : `${name}.yaml`;
  const fullPath = path.endsWith('.yaml') || path.endsWith('.yml') ? path : `${path}.yaml`;
  return loadFixture(`yaml/${fullPath}`);
}

/**
 * Load a CSV fixture by name
 * @param name - Name with optional category prefix (e.g., 'primitives/simple' or 'employee-data')
 */
export function loadCSVFixture(name: string): string {
  const path = name.includes('/') ? name : `${name}.csv`;
  const fullPath = path.endsWith('.csv') ? path : `${path}.csv`;
  return loadFixture(`csv/${fullPath}`);
}

/**
 * Load an expected output fixture
 * @param category - One of: 'json-to-yaml', 'yaml-to-json', 'roundtrip'
 * @param name - Fixture name
 */
export function loadExpectedOutput(category: string, name: string): string {
  return loadFixture(`expected/${category}/${name}`);
}
