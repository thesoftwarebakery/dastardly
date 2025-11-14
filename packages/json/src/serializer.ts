// JSON serializer implementation

import type { DocumentNode, DataNode, BaseSerializeOptions } from '@bakes/dastardly-core';
import { escapeString, normalizeIndent } from './utils.js';

/**
 * JSON-specific serialization options.
 */
export interface JSONSerializeOptions extends BaseSerializeOptions {
  /**
   * Indentation for pretty printing.
   * - undefined or 0: compact output (no whitespace)
   * - number: that many spaces per indentation level
   * - string: use this string for each indentation level (e.g., '\t' for tabs)
   *
   * Default: undefined (compact)
   */
  indent?: number | string;

  /**
   * Use raw values from nodes when available.
   * Preserves original number and string formatting from the source.
   *
   * Default: false
   */
  preserveRaw?: boolean;
}

/**
 * Serialize a dASTardly AST node to JSON string.
 */
export function serialize(
  node: DocumentNode | DataNode,
  options: JSONSerializeOptions = {}
): string {
  const indent = normalizeIndent(options.indent);
  const preserveRaw = options.preserveRaw ?? false;

  if (node.type === 'Document') {
    return serializeValue(node.body, 0, indent, preserveRaw);
  }

  return serializeValue(node, 0, indent, preserveRaw);
}

function serializeValue(
  node: DataNode,
  depth: number,
  indent: string,
  preserveRaw: boolean
): string {
  switch (node.type) {
    case 'Object':
      return serializeObject(node, depth, indent, preserveRaw);
    case 'Array':
      return serializeArray(node, depth, indent, preserveRaw);
    case 'String':
      return serializeString(node, preserveRaw);
    case 'Number':
      return serializeNumber(node, preserveRaw);
    case 'Boolean':
      return node.value.toString();
    case 'Null':
      return 'null';
  }
}

function serializeObject(
  node: import('@bakes/dastardly-core').ObjectNode,
  depth: number,
  indent: string,
  preserveRaw: boolean
): string {
  // Empty object
  if (node.properties.length === 0) {
    return '{}';
  }

  // Compact mode
  if (indent === '') {
    const pairs = node.properties.map((prop) => {
      const key = serializeString(prop.key, preserveRaw);
      const value = serializeValue(prop.value, depth, indent, preserveRaw);
      return `${key}:${value}`;
    });
    return `{${pairs.join(',')}}`;
  }

  // Pretty mode
  const pairs = node.properties.map((prop) => {
    const key = serializeString(prop.key, preserveRaw);
    const value = serializeValue(prop.value, depth + 1, indent, preserveRaw);
    return `${indent.repeat(depth + 1)}${key}: ${value}`;
  });

  return `{\n${pairs.join(',\n')}\n${indent.repeat(depth)}}`;
}

function serializeArray(
  node: import('@bakes/dastardly-core').ArrayNode,
  depth: number,
  indent: string,
  preserveRaw: boolean
): string {
  // Empty array
  if (node.elements.length === 0) {
    return '[]';
  }

  // Compact mode
  if (indent === '') {
    const elements = node.elements.map((el) =>
      serializeValue(el, depth, indent, preserveRaw)
    );
    return `[${elements.join(',')}]`;
  }

  // Pretty mode
  const elements = node.elements.map(
    (el) =>
      `${indent.repeat(depth + 1)}${serializeValue(el, depth + 1, indent, preserveRaw)}`
  );

  return `[\n${elements.join(',\n')}\n${indent.repeat(depth)}]`;
}

function serializeString(
  node: import('@bakes/dastardly-core').StringNode,
  preserveRaw: boolean
): string {
  if (preserveRaw && node.raw) {
    return node.raw;
  }
  return escapeString(node.value);
}

function serializeNumber(
  node: import('@bakes/dastardly-core').NumberNode,
  preserveRaw: boolean
): string {
  if (preserveRaw && node.raw) {
    return node.raw;
  }

  const value = node.value;

  // Handle special cases
  if (!isFinite(value)) {
    throw new Error(`Cannot serialize ${value} to JSON (not a finite number)`);
  }

  // Preserve -0
  if (Object.is(value, -0)) {
    return '-0';
  }

  return value.toString();
}
