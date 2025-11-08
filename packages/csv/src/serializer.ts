import type { DataNode, ArrayNode, ObjectNode, PropertyNode } from '@dastardly/core';
import { isArrayNode, isObjectNode, isStringNode, propertyNode, stringNode, objectNode } from '@dastardly/core';
import { needsQuoting, normalizeLineEnding, type QuoteStrategy } from './utils.js';

export interface CSVSerializeOptions {
  /**
   * Field delimiter character.
   * @default ','
   */
  delimiter?: ',' | '\t' | '|' | string;

  /**
   * Quote strategy for fields.
   * - 'needed': Only quote fields that need it (contain delimiter, quotes, or newlines)
   * - 'all': Quote all fields
   * - 'nonnumeric': Quote all non-numeric fields
   * - 'none': Never quote fields
   * @default 'needed'
   */
  quoting?: QuoteStrategy;

  /**
   * Line ending style.
   * - 'lf': Unix-style (\n)
   * - 'crlf': Windows-style (\r\n)
   * @default 'lf'
   */
  lineEnding?: 'lf' | 'crlf';

  /**
   * Whether to include headers.
   * - true: Auto-generate from object keys (for array of objects)
   * - false: No headers
   * - string[]: Use provided headers
   * @default true
   */
  headers?: boolean | string[];

  /**
   * How to handle nested objects/arrays.
   * - 'error': Throw error (default)
   * - 'json': JSON.stringify the nested structure
   * - 'flatten': Flatten nested objects with dot notation (e.g., "address.city")
   * @default 'error'
   */
  nestHandling?: 'error' | 'json' | 'flatten';
}

/**
 * Serialize a dASTardly AST to CSV string.
 */
export function serialize(node: DataNode, options: CSVSerializeOptions = {}): string {
  const {
    delimiter = ',',
    quoting = 'needed',
    lineEnding = 'lf',
    headers = true,
    nestHandling = 'error',
  } = options;

  // Must be an array at the top level
  if (!isArrayNode(node)) {
    throw new Error('CSV serialization requires an Array node at the root');
  }

  const arrayNode = node;

  // Empty array
  if (arrayNode.elements.length === 0) {
    return '';
  }

  // Determine if we're serializing objects or arrays
  const firstElement = arrayNode.elements[0]!;
  const isArrayOfObjects = isObjectNode(firstElement);
  const isArrayOfArrays = isArrayNode(firstElement);

  if (!isArrayOfObjects && !isArrayOfArrays) {
    throw new Error('CSV serialization requires array of objects or array of arrays');
  }

  let headerRow: string[] = [];
  let dataRows: string[][] = [];

  if (isArrayOfObjects) {
    // If flattening, flatten all objects first
    const objectsToSerialize: ObjectNode[] = arrayNode.elements.map((element) => {
      if (!isObjectNode(element)) {
        throw new Error('Mixed element types in array - expected all objects');
      }
      return nestHandling === 'flatten' ? flattenObject(element) : element;
    });

    // Extract all unique keys from all objects
    const allKeys = new Set<string>();
    for (const obj of objectsToSerialize) {
      for (const prop of obj.properties) {
        if (isStringNode(prop.key)) {
          allKeys.add(prop.key.value);
        }
      }
    }

    // Determine headers
    if (headers === false) {
      // No headers - just use keys in order they appear
      headerRow = [];
    } else if (Array.isArray(headers)) {
      headerRow = headers;
    } else {
      // Auto-generate from keys
      headerRow = Array.from(allKeys);
    }

    // Serialize each object
    for (const obj of objectsToSerialize) {
      const row = serializeObject(obj, headerRow.length > 0 ? headerRow : Array.from(allKeys), delimiter, nestHandling);
      dataRows.push(row);
    }
  } else {
    // Array of arrays
    if (Array.isArray(headers)) {
      headerRow = headers;
    } else if (headers === true) {
      // Can't auto-generate headers from arrays
      headerRow = [];
    } else {
      headerRow = [];
    }

    // Serialize each array
    for (const element of arrayNode.elements) {
      if (!isArrayNode(element)) {
        throw new Error('Mixed element types in array - expected all arrays');
      }

      const row = serializeArray(element, delimiter, nestHandling);
      dataRows.push(row);
    }
  }

  // Build CSV output
  const lines: string[] = [];

  // Handle empty data (no headers or all rows are empty)
  if (headerRow.length === 0 && (dataRows.length === 0 || dataRows.every((row) => row.length === 0))) {
    return '';
  }

  // Add header row if present
  if (headerRow.length > 0) {
    const quotedHeaders = headerRow.map((header) => applyQuoting(header, delimiter, quoting));
    lines.push(quotedHeaders.join(delimiter));
  }

  // Add data rows
  for (const row of dataRows) {
    const quotedRow = row.map((field) => applyQuoting(field, delimiter, quoting));
    lines.push(quotedRow.join(delimiter));
  }

  // Join with line ending
  const output = lines.join('\n');
  return normalizeLineEnding(output, lineEnding);
}

/**
 * Apply quoting to a field based on the quoting strategy
 */
function applyQuoting(value: string, delimiter: string, quoting: QuoteStrategy): string {
  if (needsQuoting(value, delimiter, quoting)) {
    // Double any internal quotes and wrap in quotes
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Flatten a nested object to a single-level object with dot-notation keys
 */
function flattenObject(obj: ObjectNode, prefix = ''): ObjectNode {
  const flattened: PropertyNode[] = [];

  for (const prop of obj.properties) {
    if (!isStringNode(prop.key)) {
      continue;
    }

    const key = prefix ? `${prefix}.${prop.key.value}` : prop.key.value;

    if (isObjectNode(prop.value)) {
      // Recursively flatten nested objects
      const nestedFlattened = flattenObject(prop.value, key);
      flattened.push(...nestedFlattened.properties);
    } else {
      // Non-object value - add with flattened key
      // Synthetic key gets original key's location, value preserves its location
      flattened.push(
        propertyNode(
          stringNode(key, prop.key.loc),
          prop.value,
          prop.loc
        )
      );
    }
  }

  // Synthetic object gets original object's location
  return objectNode(flattened, obj.loc);
}

/**
 * Serialize an object node to a row of string values
 */
function serializeObject(
  obj: ObjectNode,
  keys: string[],
  delimiter: string,
  nestHandling: 'error' | 'json' | 'flatten',
): string[] {
  const row: string[] = [];

  for (const key of keys) {
    // Find property with this key
    const prop = obj.properties.find((p) => isStringNode(p.key) && p.key.value === key);

    if (!prop) {
      // Missing property - use empty string
      row.push('');
    } else {
      const value = serializeValue(prop.value, '', delimiter, nestHandling);
      row.push(value);
    }
  }

  return row;
}

/**
 * Serialize an array node to a row of string values
 */
function serializeArray(
  arr: ArrayNode,
  delimiter: string,
  nestHandling: 'error' | 'json' | 'flatten',
): string[] {
  return arr.elements.map((element) => serializeValue(element, '', delimiter, nestHandling));
}

/**
 * Serialize a data node to a string value
 */
function serializeValue(
  node: DataNode,
  prefix: string,
  delimiter: string,
  nestHandling: 'error' | 'json' | 'flatten',
): string {
  switch (node.type) {
    case 'String':
      return node.value;

    case 'Number':
      return String(node.value);

    case 'Boolean':
      return String(node.value);

    case 'Null':
      return '';

    case 'Object':
      return serializeNestedObject(node, prefix, delimiter, nestHandling);

    case 'Array':
      return serializeNestedArray(node, prefix, delimiter, nestHandling);

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

/**
 * Serialize a nested object based on nestHandling strategy
 */
function serializeNestedObject(
  obj: ObjectNode,
  prefix: string,
  delimiter: string,
  nestHandling: 'error' | 'json' | 'flatten',
): string {
  if (nestHandling === 'error') {
    throw new Error('Cannot serialize nested object. Use nestHandling option to specify how to handle nested structures.');
  }

  if (nestHandling === 'json') {
    return JSON.stringify(objectNodeToJSON(obj));
  }

  // nestHandling === 'flatten'
  // For flattening, we need to return a representation that can be expanded later
  // This is tricky in a single string value - for now, JSON stringify
  // Proper flattening would need to expand at the row level, not value level
  return JSON.stringify(objectNodeToJSON(obj));
}

/**
 * Serialize a nested array based on nestHandling strategy
 */
function serializeNestedArray(
  arr: ArrayNode,
  prefix: string,
  delimiter: string,
  nestHandling: 'error' | 'json' | 'flatten',
): string {
  if (nestHandling === 'error') {
    throw new Error('Cannot serialize nested array. Use nestHandling option to specify how to handle nested structures.');
  }

  if (nestHandling === 'json') {
    return JSON.stringify(arrayNodeToJSON(arr));
  }

  // nestHandling === 'flatten'
  // Arrays can't really be flattened in CSV, so JSON stringify
  return JSON.stringify(arrayNodeToJSON(arr));
}

/**
 * Convert ObjectNode to plain JavaScript object
 */
function objectNodeToJSON(obj: ObjectNode): Record<string, any> {
  const result: Record<string, any> = {};
  for (const prop of obj.properties) {
    if (isStringNode(prop.key)) {
      result[prop.key.value] = dataNodeToJSON(prop.value);
    }
  }
  return result;
}

/**
 * Convert ArrayNode to plain JavaScript array
 */
function arrayNodeToJSON(arr: ArrayNode): any[] {
  return arr.elements.map(dataNodeToJSON);
}

/**
 * Convert DataNode to plain JavaScript value
 */
function dataNodeToJSON(node: DataNode): any {
  switch (node.type) {
    case 'String':
      return node.value;
    case 'Number':
      return node.value;
    case 'Boolean':
      return node.value;
    case 'Null':
      return null;
    case 'Object':
      return objectNodeToJSON(node);
    case 'Array':
      return arrayNodeToJSON(node);
  }
}
