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
} from '@bakes/dastardly-core';
import {
  documentNode,
  objectNode,
  arrayNode,
  propertyNode,
  stringNode,
  numberNode,
  booleanNode,
  nullNode,
} from '@bakes/dastardly-core';
import {
  TreeSitterParser,
  type ParserRuntime,
  type Language,
  type SyntaxNode,
  nodeToLocation,
  ParseError,
} from '@bakes/dastardly-tree-sitter-runtime';
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

  /**
   * Convert a tree-sitter node to a DataNode using an iterative algorithm.
   * This avoids stack overflow issues with deeply nested structures.
   */
  private convertValue(node: SyntaxNode, source: string): DataNode {
    // For leaf nodes, handle them directly without the stack
    if (this.isLeafNode(node.type)) {
      return this.convertLeafNode(node, source);
    }

    // Use explicit stack for non-leaf nodes (objects and arrays)
    type StackFrame = {
      node: SyntaxNode;
      type: 'object' | 'array' | 'property';
      properties?: PropertyNode[];
      elements?: DataNode[];
      pendingChildren?: SyntaxNode[];
      keyNode?: SyntaxNode;
      valueNode?: SyntaxNode;
      loc?: ReturnType<typeof nodeToLocation>;
    };

    const stack: StackFrame[] = [];
    // Use a stable key (startIndex-endIndex) instead of object identity
    // Tree-sitter may reuse/recycle SyntaxNode wrapper objects, breaking Map lookups
    const results = new Map<string, DataNode>();
    const nodeKey = (n: SyntaxNode) => `${n.startIndex}-${n.endIndex}`;

    // Push the root node onto the stack
    stack.push({ node, type: node.type as 'object' | 'array', properties: [], elements: [] });

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;

      if (frame.type === 'object') {
        // Process object node
        if (!frame.pendingChildren) {
          // First time processing this object - collect pair nodes
          frame.pendingChildren = [];
          frame.properties = [];
          frame.loc = nodeToLocation(frame.node, this.sourceFormat);

          for (const child of frame.node.children) {
            if (child.type === 'pair') {
              frame.pendingChildren.push(child);
            }
          }
        }

        // Check if all children are processed
        const allChildrenProcessed = frame.pendingChildren.every(
          (child) => {
            const keyNode = child.childForFieldName('key');
            const valueNode = child.childForFieldName('value');
            return keyNode && valueNode && results.has(nodeKey(valueNode));
          }
        );

        if (allChildrenProcessed) {
          // All children processed - create the object node
          for (const pairNode of frame.pendingChildren) {
            const keyNode = pairNode.childForFieldName('key')!;
            const valueNode = pairNode.childForFieldName('value')!;
            const loc = nodeToLocation(pairNode, this.sourceFormat);
            const key = this.convertString(keyNode, source);
            const value = results.get(nodeKey(valueNode))!;
            frame.properties!.push(propertyNode(key, value, loc));
          }

          const result = objectNode(frame.properties!, frame.loc!);
          results.set(nodeKey(frame.node), result);
          stack.pop();
        } else {
          // Push unprocessed value nodes onto stack
          for (const pairNode of frame.pendingChildren) {
            const valueNode = pairNode.childForFieldName('value');
            if (valueNode && !results.has(nodeKey(valueNode))) {
              if (this.isLeafNode(valueNode.type)) {
                // Process leaf nodes immediately
                results.set(nodeKey(valueNode), this.convertLeafNode(valueNode, source));
              } else {
                // Push non-leaf nodes onto stack
                stack.push({
                  node: valueNode,
                  type: valueNode.type as 'object' | 'array',
                  properties: [],
                  elements: [],
                });
              }
            }
          }
        }
      } else if (frame.type === 'array') {
        // Process array node
        if (!frame.pendingChildren) {
          // First time processing this array - collect element nodes
          frame.pendingChildren = [];
          frame.elements = [];
          frame.loc = nodeToLocation(frame.node, this.sourceFormat);

          for (const child of frame.node.children) {
            if (this.isValueNode(child.type)) {
              frame.pendingChildren.push(child);
            }
          }
        }

        // Check if all children are processed
        const allChildrenProcessed = frame.pendingChildren.every((child) =>
          results.has(nodeKey(child))
        );

        if (allChildrenProcessed) {
          // All children processed - create the array node
          for (const elementNode of frame.pendingChildren) {
            frame.elements!.push(results.get(nodeKey(elementNode))!);
          }

          const result = arrayNode(frame.elements!, frame.loc!);
          results.set(nodeKey(frame.node), result);
          stack.pop();
        } else {
          // Push unprocessed element nodes onto stack
          for (const elementNode of frame.pendingChildren) {
            if (!results.has(nodeKey(elementNode))) {
              if (this.isLeafNode(elementNode.type)) {
                // Process leaf nodes immediately
                results.set(nodeKey(elementNode), this.convertLeafNode(elementNode, source));
              } else {
                // Push non-leaf nodes onto stack
                stack.push({
                  node: elementNode,
                  type: elementNode.type as 'object' | 'array',
                  properties: [],
                  elements: [],
                });
              }
            }
          }
        }
      }
    }

    return results.get(nodeKey(node))!;
  }

  /**
   * Check if a node type is a leaf node (not object or array).
   */
  private isLeafNode(type: string): boolean {
    return (
      type === 'string' ||
      type === 'number' ||
      type === 'true' ||
      type === 'false' ||
      type === 'null'
    );
  }

  /**
   * Convert a leaf node (string, number, boolean, null) to a DataNode.
   */
  private convertLeafNode(node: SyntaxNode, source: string): DataNode {
    switch (node.type) {
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
