// JSON parser implementation

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
} from '@dastardly/core';
import {
  documentNode,
  objectNode,
  arrayNode,
  propertyNode,
  stringNode,
  numberNode,
  booleanNode,
  nullNode,
} from '@dastardly/core';
import {
  TreeSitterParser,
  type ParserRuntime,
  type Language,
  type SyntaxNode,
  nodeToLocation,
  ParseError,
} from '@dastardly/tree-sitter-runtime';
import { unescapeString } from './utils.js';

/**
 * JSON parser using tree-sitter-json.
 */
export class JSONParser extends TreeSitterParser {
  constructor(runtime: ParserRuntime, language: Language) {
    super(runtime, language, 'json');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // tree-sitter-json document can have multiple values or no values
    // Standard JSON requires exactly one value
    const values: SyntaxNode[] = [];
    for (const child of node.children) {
      // Skip whitespace and comments
      if (child.type !== 'comment' && child.text.trim() !== '') {
        values.push(child);
      }
    }

    if (values.length === 0) {
      throw new ParseError(
        'Empty document: valid JSON requires a value',
        loc,
        source
      );
    }

    if (values.length > 1) {
      throw new ParseError(
        'Multiple top-level values: valid JSON requires exactly one value',
        loc,
        source
      );
    }

    const valueNode = this.convertValue(values[0]!, source);
    return documentNode(valueNode, loc);
  }

  private convertValue(node: SyntaxNode, source: string): DataNode {
    switch (node.type) {
      case 'object':
        return this.convertObject(node, source);
      case 'array':
        return this.convertArray(node, source);
      case 'string':
        return this.convertString(node, source);
      case 'number':
        return this.convertNumber(node, source);
      case 'true':
      case 'false':
        return this.convertBoolean(node, source);
      case 'null':
        return this.convertNull(node, source);
      default:
        const loc = nodeToLocation(node, this.sourceFormat);
        throw new ParseError(
          `Unknown node type: ${node.type}`,
          loc,
          source
        );
    }
  }

  private convertObject(node: SyntaxNode, source: string): ObjectNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const properties: PropertyNode[] = [];

    for (const child of node.children) {
      if (child.type === 'pair') {
        properties.push(this.convertPair(child, source));
      }
    }

    return objectNode(properties, loc);
  }

  private convertPair(node: SyntaxNode, source: string): PropertyNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    const keyNode = node.childForFieldName('key');
    const valueNode = node.childForFieldName('value');

    if (!keyNode || !valueNode) {
      throw new ParseError(
        'Invalid object pair: missing key or value',
        loc,
        source
      );
    }

    const key = this.convertString(keyNode, source);
    const value = this.convertValue(valueNode, source);

    return propertyNode(key, value, loc);
  }

  private convertArray(node: SyntaxNode, source: string): ArrayNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const elements: DataNode[] = [];

    for (const child of node.children) {
      // Skip structural tokens like [ ] ,
      if (this.isValueNode(child.type)) {
        elements.push(this.convertValue(child, source));
      }
    }

    return arrayNode(elements, loc);
  }

  private convertString(node: SyntaxNode, source: string): StringNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;

    // Unescape the string content
    const value = unescapeString(raw);

    return stringNode(value, loc, raw);
  }

  private convertNumber(node: SyntaxNode, source: string): NumberNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;
    const value = parseFloat(raw);

    // Validate number
    if (isNaN(value)) {
      throw new ParseError(`Invalid number: ${raw}`, loc, source);
    }

    if (!isFinite(value)) {
      throw new ParseError(
        `Invalid number: ${raw} (Infinity not allowed in JSON)`,
        loc,
        source
      );
    }

    return numberNode(value, loc, raw);
  }

  private convertBoolean(node: SyntaxNode, source: string): BooleanNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const value = node.type === 'true';
    return booleanNode(value, loc);
  }

  private convertNull(node: SyntaxNode, source: string): NullNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    return nullNode(loc);
  }

  /**
   * Check if a node type represents a value node.
   */
  private isValueNode(type: string): boolean {
    return (
      type === 'object' ||
      type === 'array' ||
      type === 'string' ||
      type === 'number' ||
      type === 'true' ||
      type === 'false' ||
      type === 'null'
    );
  }
}
