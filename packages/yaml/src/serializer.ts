// YAML serializer implementation

import type {
  DocumentNode,
  DataNode,
  ObjectNode,
  ArrayNode,
  PropertyNode,
  StringNode,
  NumberNode,
  BooleanNode,
  NullNode,
  BaseSerializeOptions,
} from '@bakes/dastardly-core';
import {
  escapeDoubleQuoteString,
  isPlainSafe,
  normalizeIndent,
} from './utils.js';

/**
 * YAML-specific serialization options.
 */
export interface YAMLSerializeOptions extends BaseSerializeOptions {
  /**
   * Indentation for block collections.
   * - undefined or 2: two spaces (YAML standard)
   * - number: that many spaces per indentation level (block syntax)
   * - string: use this string for each indentation level (e.g., '\t' for tabs)
   *
   * Default: 2 spaces
   */
  indent?: number | string;
}

/**
 * Serialize a dASTardly AST node to YAML string.
 *
 * @param node - DocumentNode or DataNode to serialize
 * @param options - YAML serialization options
 * @returns YAML string
 */
export function serialize(
  node: DocumentNode | DataNode,
  options: YAMLSerializeOptions = {}
): string {
  const indent = normalizeIndent(options.indent);

  if (node.type === 'Document') {
    return serializeValue(node.body, 0, indent);
  }

  return serializeValue(node, 0, indent);
}

function serializeValue(
  node: DataNode,
  depth: number,
  indent: string
): string {
  switch (node.type) {
    case 'Object':
      return serializeObject(node, depth, indent);
    case 'Array':
      return serializeArray(node, depth, indent);
    case 'String':
      return serializeString(node, depth, indent);
    case 'Number':
      return serializeNumber(node);
    case 'Boolean':
      return node.value.toString();
    case 'Null':
      return 'null';
  }
}

function serializeObject(
  node: ObjectNode,
  depth: number,
  indent: string
): string {
  // Empty object
  if (node.properties.length === 0) {
    return '{}';
  }

  // Compact mode (flow syntax)
  if (indent === '') {
    const pairs = node.properties.map((prop) => {
      const key = serializeKey(prop.key, false);
      const value = serializeValue(prop.value, depth, indent);
      return `${key}: ${value}`;
    });
    return `{${pairs.join(', ')}}`;
  }

  // Block mode
  const pairs = node.properties.map((prop, index) => {
    const key = serializeKey(prop.key, true);
    const value = prop.value;

    // For nested structures, put them on the next line
    if (value.type === 'Object' || value.type === 'Array') {
      const serializedValue = serializeValue(value, depth + 1, indent);

      // Check if it's a flow-style empty collection
      if (serializedValue === '{}' || serializedValue === '[]') {
        return `${indent.repeat(depth)}${key}: ${serializedValue}`;
      }

      // Block-style collection needs newline
      const indentedValue = serializedValue
        .split('\n')
        .map((line, i) => {
          // First line doesn't need extra indent (it's already indented)
          if (i === 0) return line;
          return line;
        })
        .join('\n');

      return `${indent.repeat(depth)}${key}:\n${indentedValue}`;
    }

    // Scalar value on same line
    const serializedValue = serializeValue(value, depth, indent);
    return `${indent.repeat(depth)}${key}: ${serializedValue}`;
  });

  return pairs.join('\n');
}

function serializeArray(
  node: ArrayNode,
  depth: number,
  indent: string
): string {
  // Empty array
  if (node.elements.length === 0) {
    return '[]';
  }

  // Compact mode (flow syntax)
  if (indent === '') {
    const elements = node.elements.map((el) =>
      serializeValue(el, depth, indent)
    );
    return `[${elements.join(', ')}]`;
  }

  // Block mode
  const elements = node.elements.map((el) => {
    // If element is an object, inline the first property
    if (el.type === 'Object' && (el as ObjectNode).properties.length > 0) {
      const obj = el as ObjectNode;
      // Serialize at same depth - properties will be at depth level
      const value = serializeValue(el, depth, indent);
      const lines = value.split('\n');

      // First property on the same line as the dash
      const firstLine = `${indent.repeat(depth)}- ${lines[0]}`;
      // Rest of the properties are already properly indented at depth level,
      // but we need them to align under the first property (2 extra spaces)
      const restLines = lines.slice(1).map(line =>
        `${indent.repeat(depth)}  ${line}`
      );

      return [firstLine, ...restLines].join('\n');
    }

    // If element is an array, nest it properly
    if (el.type === 'Array') {
      const value = serializeValue(el, depth, indent);
      const lines = value.split('\n');
      return lines.map((line, i) => {
        if (i === 0) {
          return `${indent.repeat(depth)}- ${line}`;
        }
        return `${indent.repeat(depth)}  ${line}`;
      }).join('\n');
    }

    // Scalar value
    const value = serializeValue(el, depth + 1, indent);
    return `${indent.repeat(depth)}- ${value}`;
  });

  return elements.join('\n');
}

function serializeString(
  node: StringNode,
  depth: number,
  indent: string
): string {
  const value = node.value;

  // Handle multi-line strings with block scalars (only in block mode)
  if (indent !== '' && value.includes('\n')) {
    const lines = value.split('\n');

    // Determine chomping indicator for lossless round-tripping
    // In YAML, | by default clips to single trailing newline (clip mode)
    // |- strips all trailing newlines (strip mode)
    // |+ keeps all trailing newlines (keep mode)
    let chomping = '';

    // Count trailing newlines in original value
    const match = value.match(/\n+$/);
    const trailingNewlines = match ? match[0].length : 0;

    if (trailingNewlines === 0) {
      // No trailing newline - use strip to prevent adding one
      chomping = '-';
    } else if (trailingNewlines === 1) {
      // Exactly one trailing newline - default | behavior (clip)
      chomping = '';
    } else {
      // Multiple trailing newlines - use keep
      chomping = '+';
    }

    // Build block scalar
    const header = `|${chomping}`;
    const indentedLines = lines.map(line =>
      line === '' ? '' : `${indent.repeat(depth + 1)}${line}`
    );

    return `${header}\n${indentedLines.join('\n')}`;
  }

  // In compact mode, must quote strings with control characters
  if (indent === '' && (value.includes('\n') || value.includes('\t') || value.includes('\\'))) {
    return `"${escapeDoubleQuoteString(value)}"`;
  }

  // Check if plain safe
  if (isPlainSafe(value)) {
    return value;
  }

  // Quote the string
  return `"${escapeDoubleQuoteString(value)}"`;
}

function serializeKey(node: StringNode, isBlockMode: boolean): string {
  const value = node.value;

  // Keys with internal spaces should be quoted for clarity
  if (value.includes(' ')) {
    return `"${escapeDoubleQuoteString(value)}"`;
  }

  // Check if key needs quoting
  if (isPlainSafe(value)) {
    return value;
  }

  // Quote the key
  return `"${escapeDoubleQuoteString(value)}"`;
}

function serializeNumber(node: NumberNode): string {
  const value = node.value;

  // Handle special float values
  if (value === Infinity) {
    return '.inf';
  }
  if (value === -Infinity) {
    return '-.inf';
  }
  if (Number.isNaN(value)) {
    return '.nan';
  }

  // Preserve -0
  if (Object.is(value, -0)) {
    return '-0';
  }

  return value.toString();
}
