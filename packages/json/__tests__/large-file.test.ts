// Test parsing large JSON files (>32KB) to verify buffer size auto-detection

import { describe, it, expect } from 'vitest';
import { json } from '../src/index.js';
import { isArrayNode, isObjectNode } from '@bakes/dastardly-core';

describe('Large JSON file parsing', () => {
  function generateLargeJSON(sizeInKB: number): string {
    const targetBytes = sizeInKB * 1024;
    const items: string[] = [];
    const itemSize = 60; // Approx size per item
    const itemCount = Math.ceil(targetBytes / itemSize);

    for (let i = 0; i < itemCount; i++) {
      items.push(
        `{"id":${i},"name":"Item_${i.toString().padStart(6, '0')}","value":"data"}`
      );
    }

    return `[${items.join(',\n  ')}]`;
  }

  it('should parse 48KB JSON file without error', () => {
    const source = generateLargeJSON(48);
    console.log(`\nParsing ${source.length} bytes (48KB) JSON file...`);

    const doc = json.parse(source);

    expect(doc.type).toBe('Document');
    expect(isArrayNode(doc.body)).toBe(true);

    if (isArrayNode(doc.body)) {
      console.log(`✓ Successfully parsed array with ${doc.body.elements.length} elements`);
    }
  });

  it('should parse 100KB JSON file without error', () => {
    const source = generateLargeJSON(100);
    console.log(`\nParsing ${source.length} bytes (100KB) JSON file...`);

    const doc = json.parse(source);

    expect(doc.type).toBe('Document');
    expect(isArrayNode(doc.body)).toBe(true);

    if (isArrayNode(doc.body)) {
      console.log(`✓ Successfully parsed array with ${doc.body.elements.length} elements`);
    }
  });

  it('should parse 500KB JSON file without error', () => {
    const source = generateLargeJSON(500);
    console.log(`\nParsing ${source.length} bytes (500KB) JSON file...`);

    const doc = json.parse(source);

    expect(doc.type).toBe('Document');
    expect(isArrayNode(doc.body)).toBe(true);

    if (isArrayNode(doc.body)) {
      console.log(`✓ Successfully parsed array with ${doc.body.elements.length} elements`);
    }
  });

  it('should parse 1MB JSON file without error', () => {
    const source = generateLargeJSON(1024);
    console.log(`\nParsing ${source.length} bytes (1MB) JSON file...`);

    const doc = json.parse(source);

    expect(doc.type).toBe('Document');
    expect(isArrayNode(doc.body)).toBe(true);

    if (isArrayNode(doc.body)) {
      console.log(`✓ Successfully parsed array with ${doc.body.elements.length} elements`);
    }
  });

  it('should correctly parse and roundtrip large object', () => {
    const source = generateLargeJSON(100);
    console.log(`\nRoundtrip test: ${source.length} bytes...`);

    const doc = json.parse(source);
    const serialized = json.serialize(doc);
    const reparsed = json.parse(serialized);

    expect(reparsed.type).toBe('Document');
    expect(isArrayNode(reparsed.body)).toBe(true);

    if (isArrayNode(doc.body) && isArrayNode(reparsed.body)) {
      expect(reparsed.body.elements.length).toBe(doc.body.elements.length);
      console.log(`✓ Roundtrip successful: ${doc.body.elements.length} elements preserved`);
    }
  });

  it('should preserve position information in large files', () => {
    const source = generateLargeJSON(50);
    const doc = json.parse(source);

    expect(doc.loc).toBeDefined();
    expect(doc.loc?.source).toBe('json');
    expect(doc.loc?.start.line).toBeGreaterThanOrEqual(0); // JSON uses 1-indexed lines

    if (isArrayNode(doc.body)) {
      const lastElement = doc.body.elements[doc.body.elements.length - 1];
      expect(lastElement?.loc).toBeDefined();

      if (lastElement && isObjectNode(lastElement)) {
        console.log(
          `✓ Position tracking works: Last element at line ${lastElement.loc?.start.line}, column ${lastElement.loc?.start.column}`
        );
      }
    }
  });
});
