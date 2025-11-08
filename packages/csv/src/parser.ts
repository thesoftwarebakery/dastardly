import {
  type DocumentNode,
  type DataNode,
  type SourceLocation,
  documentNode,
  arrayNode,
  objectNode,
  stringNode,
  numberNode,
  booleanNode,
  nullNode,
  propertyNode,
} from '@dastardly/core';
import {
  TreeSitterParser,
  type ParserRuntime,
  type SyntaxNode,
  nodeToLocation,
} from '@dastardly/tree-sitter-runtime';
import { unescapeField } from './utils.js';

// Import the grammars (wrapper objects containing .language)
import type { LanguageWrapper } from '@dastardly/tree-sitter-csv';
import * as csvGrammars from '@dastardly/tree-sitter-csv';

export interface CSVParseOptions {
  /**
   * Whether the first row contains headers.
   * - true: first row is headers, parse as array of objects
   * - false: no headers, parse as array of arrays
   * - string[]: use provided headers, parse as array of objects
   * @default true
   */
  headers?: boolean | string[];

  /**
   * Field delimiter character.
   * @default ','
   */
  delimiter?: ',' | '\t' | '|' | string;

  /**
   * Whether to infer data types (numbers, booleans, null).
   * @default false
   */
  inferTypes?: boolean;
}

export interface CSVParseResult {
  root: DataNode;
}

/**
 * Select the appropriate tree-sitter language wrapper based on delimiter
 */
function selectGrammar(delimiter: string): LanguageWrapper {
  switch (delimiter) {
    case ',':
      return csvGrammars.csv;
    case '\t':
      return csvGrammars.tsv;
    case '|':
      return csvGrammars.psv;
    default:
      // Default to CSV grammar for custom delimiters
      return csvGrammars.csv;
  }
}

/**
 * Infer the type of a field value
 */
function inferType(value: string, inferTypes: boolean, loc: SourceLocation): DataNode {
  if (!inferTypes) {
    return stringNode(value, loc);
  }

  // Check for null
  if (value === 'null' || value === 'NULL') {
    return nullNode(loc);
  }

  // Check for boolean
  if (value === 'true' || value === 'false') {
    return booleanNode(value === 'true', loc);
  }

  // Check for number
  const num = parseFloat(value);
  if (!isNaN(num) && value.trim() !== '') {
    return numberNode(num, loc);
  }

  return stringNode(value, loc);
}

export class CSVParser extends TreeSitterParser {
  private options: Required<CSVParseOptions>;

  constructor(runtime: ParserRuntime, languageWrapper: LanguageWrapper, options: CSVParseOptions = {}) {
    super(runtime, languageWrapper, 'csv');
    this.options = {
      headers: options.headers ?? true,
      delimiter: options.delimiter ?? ',',
      inferTypes: options.inferTypes ?? false,
    };
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    if (node.type !== 'document') {
      throw new Error(`Expected document node, got ${node.type}`);
    }

    const rows: SyntaxNode[] = [];
    for (const child of node.children) {
      if (child.type === 'row') {
        rows.push(child);
      }
    }

    // Empty CSV
    if (rows.length === 0) {
      const loc = nodeToLocation(node, this.sourceFormat);
      return documentNode(
        arrayNode([], loc),
        loc
      );
    }

    // Determine headers
    let headerNames: string[] | null = null;
    let headerRow: SyntaxNode | null = null;
    let dataRows = rows;

    if (this.options.headers === true) {
      // First row is headers
      headerRow = rows[0] ?? null;
      if (headerRow) {
        // Literal false matches overload, returns string[]
        headerNames = this.extractFieldValues(headerRow, source, false);
        dataRows = rows.slice(1);
      }
    } else if (Array.isArray(this.options.headers)) {
      // Use provided headers
      headerNames = this.options.headers;
      dataRows = rows;
    }

    // Parse data rows
    let dataNodes: DataNode[];

    if (headerNames) {
      // Parse as array of objects
      dataNodes = dataRows.map((row) => {
        const fieldValues = this.extractFieldValues(row, source, this.options.inferTypes);
        const properties = headerNames!.map((header, index) => {
          const value = fieldValues[index];

          // Get location for the field
          const fieldNode = this.getFieldNode(row, index);
          const fieldLoc = fieldNode
            ? nodeToLocation(fieldNode, this.sourceFormat)
            : nodeToLocation(row, this.sourceFormat);

          // Create value node with location
          let valueNode: DataNode;
          if (value === undefined) {
            valueNode = stringNode('', fieldLoc);
          } else if (typeof value === 'string') {
            valueNode = inferType(value, this.options.inferTypes, fieldLoc);
          } else {
            // value is already a DataNode with location
            valueNode = value;
          }

          // Get location for the key from header row if available
          const headerFieldNode = headerRow ? this.getFieldNode(headerRow, index) : null;
          const keyLoc = headerFieldNode
            ? nodeToLocation(headerFieldNode, this.sourceFormat)
            : fieldLoc; // Fallback to field location if no header node

          return propertyNode(
            stringNode(header, keyLoc),
            valueNode,
            fieldLoc,
          );
        });

        return objectNode(properties, nodeToLocation(row, this.sourceFormat));
      });
    } else {
      // Parse as array of arrays
      dataNodes = dataRows.map((row) => {
        const fieldValues = this.extractFieldValues(row, source, this.options.inferTypes);
        const children = fieldValues.map((value, index) => {
          const fieldNode = this.getFieldNode(row, index);
          const fieldLoc = fieldNode
            ? nodeToLocation(fieldNode, this.sourceFormat)
            : nodeToLocation(row, this.sourceFormat);

          const valueNode = typeof value === 'string'
            ? inferType(value, this.options.inferTypes, fieldLoc)
            : value;

          return valueNode;
        });

        return arrayNode(children, nodeToLocation(row, this.sourceFormat));
      });
    }

    // Create location for the array spanning all data rows
    const arrayLoc = dataRows.length > 0
      ? nodeToLocation(dataRows[0]!, this.sourceFormat)
      : nodeToLocation(node, this.sourceFormat);

    return documentNode(
      arrayNode(dataNodes, arrayLoc),
      nodeToLocation(node, this.sourceFormat)
    );
  }

  /**
   * Extract field values from a row node.
   * When inferTypes is false (literal), returns string[].
   * When inferTypes is true (literal), returns (string | DataNode)[].
   * When inferTypes is runtime boolean, returns union type.
   */
  private extractFieldValues(row: SyntaxNode, source: string, inferTypes: false): string[];
  private extractFieldValues(row: SyntaxNode, source: string, inferTypes: true): (string | DataNode)[];
  private extractFieldValues(row: SyntaxNode, source: string, inferTypes: boolean): string[] | (string | DataNode)[];
  private extractFieldValues(
    row: SyntaxNode,
    source: string,
    inferTypes: boolean,
  ): string[] | (string | DataNode)[] {
    const fields: (string | DataNode)[] = [];

    for (const child of row.children) {
      if (child.type === 'field') {
        const fieldValue = this.extractFieldValue(child, source, inferTypes);
        fields.push(fieldValue);
      }
    }

    return fields;
  }

  /**
   * Extract value from a field node
   */
  private extractFieldValue(
    field: SyntaxNode,
    source: string,
    inferTypes: boolean,
  ): string | DataNode {
    // Field should have exactly one child
    if (field.children.length === 0) {
      return '';
    }

    const child = field.children[0]!;
    const location = nodeToLocation(child, this.sourceFormat);

    switch (child.type) {
      case 'text': {
        const text = child.text;
        const unescaped = unescapeField(text);
        return inferTypes ? inferType(unescaped, true, location) : unescaped;
      }
      case 'number': {
        const num = parseInt(child.text, 10);
        return inferTypes ? numberNode(num, location) : child.text;
      }
      case 'float': {
        const num = parseFloat(child.text);
        return inferTypes ? numberNode(num, location) : child.text;
      }
      case 'boolean': {
        const value = child.text === 'true';
        return inferTypes ? booleanNode(value, location) : child.text;
      }
      case 'empty_field': {
        // Empty field detected by external scanner
        return inferTypes ? stringNode('', location) : '';
      }
      default:
        return child.text;
    }
  }

  /**
   * Get the field node at a specific index in a row
   */
  private getFieldNode(row: SyntaxNode, index: number): SyntaxNode | null {
    let fieldIndex = 0;
    for (const child of row.children) {
      if (child.type === 'field') {
        if (fieldIndex === index) {
          return child;
        }
        fieldIndex++;
      }
    }
    return null;
  }
}

/**
 * Parse CSV source into an AST
 * This is primarily for testing - production code should use the format package API
 */
export function parseCSV(source: string, options: CSVParseOptions = {}): CSVParseResult {
  const delimiter = options.delimiter ?? ',';
  const grammar = selectGrammar(delimiter);

  // Import runtime here to avoid circular dependencies
  const { NodeTreeSitterRuntime } = require('@dastardly/tree-sitter-runtime');
  const runtime = new NodeTreeSitterRuntime();

  const parser = new CSVParser(runtime, grammar, options);
  const doc = parser.parse(source);
  return { root: doc.body };
}
