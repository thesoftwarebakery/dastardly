// YAML parser implementation

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
import {
  unescapeDoubleQuoteString,
  unescapeSingleQuoteString,
  parseYAMLNumber,
  normalizeBoolean,
  normalizeNull,
} from './utils.js';

/**
 * Anchor registry for resolving YAML anchors and aliases.
 * Maps anchor names to their resolved AST nodes.
 */
type AnchorRegistry = Map<string, DataNode>;

/**
 * Tracks nodes being resolved to detect circular references.
 */
type ResolutionStack = Set<string>;

/**
 * YAML parser using tree-sitter-yaml.
 */
export class YAMLParser extends TreeSitterParser {
  private anchors: AnchorRegistry = new Map();
  private resolutionStack: ResolutionStack = new Set();

  constructor(runtime: ParserRuntime, language: Language) {
    super(runtime, language, 'yaml');
  }

  protected convertDocument(node: SyntaxNode, source: string): DocumentNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // Reset anchor registry for each document
    this.anchors.clear();
    this.resolutionStack.clear();

    // tree-sitter-yaml document can contain multiple documents separated by ---
    // We'll parse only the first document
    let firstDocument: SyntaxNode | null = null;

    for (const child of node.children) {
      // Look for stream nodes which contain the actual documents
      if (child.type === 'stream') {
        for (const streamChild of child.children) {
          if (streamChild.type === 'document') {
            firstDocument = streamChild;
            break;
          }
        }
        break;
      }
      // Sometimes the document is directly under the root
      if (child.type === 'document') {
        firstDocument = child;
        break;
      }
    }

    if (!firstDocument) {
      throw new ParseError(
        'Empty document: valid YAML requires at least one document',
        loc,
        source
      );
    }

    // Extract the body from the document node
    const bodyNode = this.getDocumentBody(firstDocument);
    if (!bodyNode) {
      throw new ParseError(
        'Document has no body',
        nodeToLocation(firstDocument, this.sourceFormat),
        source
      );
    }

    const valueNode = this.convertValue(bodyNode, source);
    return documentNode(valueNode, loc);
  }

  private getDocumentBody(docNode: SyntaxNode): SyntaxNode | null {
    // Document nodes can have different structures
    // Look for the actual content node
    for (const child of docNode.children) {
      // Skip document markers (---, ...)
      if (child.type !== 'document_start' && child.type !== 'document_end') {
        return child;
      }
    }
    return null;
  }

  private convertValue(node: SyntaxNode, source: string): DataNode {
    // Handle wrapper nodes by extracting their content
    if (node.type === 'flow_node' || node.type === 'block_node') {
      // Find the first child that is not whitespace
      for (const child of node.children) {
        if (child.text.trim() !== '') {
          return this.convertValue(child, source);
        }
      }
    }

    // Handle document markers - skip them and process siblings
    if (node.type === '---' || node.type === '...') {
      const parent = node.parent;
      if (parent) {
        for (const child of parent.children) {
          if (child.type !== '---' && child.type !== '...' && child.text.trim() !== '') {
            return this.convertValue(child, source);
          }
        }
      }
    }

    // Handle nodes with anchors/tags - extract the actual value
    if (node.type === 'anchor' || node.type === 'tag') {
      // Look for sibling value node or parent node
      const parent = node.parent;
      if (parent) {
        for (const child of parent.children) {
          if (child !== node && child.type !== 'anchor' && child.type !== 'tag') {
            return this.convertValue(child, source);
          }
        }
      }
    }

    // Handle sequence/mapping items with anchors/tags
    let anchorName: string | null = null;
    let tagName: string | null = null;

    // Check parent for anchor or tag
    const parent = node.parent;
    if (parent) {
      for (const sibling of parent.children) {
        if (sibling.type === 'anchor') {
          anchorName = sibling.text.substring(1); // Remove &
          // Register anchor early for circular reference detection
          if (anchorName && !this.anchors.has(anchorName)) {
            // Add to resolution stack to detect circular refs
            if (this.resolutionStack.has(anchorName)) {
              const loc = nodeToLocation(node, this.sourceFormat);
              throw new ParseError(
                `Circular reference detected for anchor: ${anchorName}`,
                loc,
                source
              );
            }
            this.resolutionStack.add(anchorName);
          }
        } else if (sibling.type === 'tag') {
          tagName = sibling.text;
        }
      }
    }

    let result: DataNode;

    switch (node.type) {
      case 'block_mapping':
      case 'flow_mapping':
        result = this.convertMapping(node, source);
        break;

      case 'block_sequence':
      case 'flow_sequence':
        result = this.convertSequence(node, source);
        break;

      case 'plain_scalar':
        result = this.convertPlainScalar(node, source);
        break;

      case 'double_quote_scalar':
        result = this.convertDoubleQuoteScalar(node, source);
        break;

      case 'single_quote_scalar':
        result = this.convertSingleQuoteScalar(node, source);
        break;

      case 'block_scalar':
        result = this.convertBlockScalar(node, source);
        break;

      case 'alias':
        result = this.resolveAlias(node, source);
        break;

      case 'null':
        result = this.convertNull(node, source);
        break;

      case 'boolean_scalar':
        result = this.convertBoolean(node, source);
        break;

      case 'integer_scalar':
      case 'float_scalar':
        result = this.convertNumber(node, source);
        break;

      default:
        // Try to handle tagged values
        if (node.type.includes('tag')) {
          const taggedValue = this.convertTaggedValue(node, source);
          if (taggedValue) {
            result = taggedValue;
            break;
          }
        }

        const loc = nodeToLocation(node, this.sourceFormat);
        throw new ParseError(
          `Unknown node type: ${node.type}`,
          loc,
          source
        );
    }

    // Register anchor if present
    if (anchorName) {
      this.anchors.set(anchorName, result);
      // Remove from resolution stack now that we're done
      this.resolutionStack.delete(anchorName);
    }

    // Apply tag coercion if needed
    if (tagName) {
      result = this.applyTag(tagName, result, node, source);
    }

    return result;
  }

  private applyTag(tag: string, value: DataNode, node: SyntaxNode, source: string): DataNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // Handle standard YAML tags
    if (tag === '!!str') {
      const strValue = this.nodeToString(value);
      return stringNode(strValue, loc);
    }

    if (tag === '!!int') {
      const numValue = this.nodeToNumber(value);
      return numberNode(Math.floor(numValue), loc);
    }

    if (tag === '!!float') {
      const numValue = this.nodeToNumber(value);
      return numberNode(numValue, loc);
    }

    if (tag === '!!bool') {
      const boolValue = this.nodeToBoolean(value);
      return booleanNode(boolValue, loc);
    }

    if (tag === '!!null') {
      return nullNode(loc);
    }

    // For custom tags, return the value as-is
    return value;
  }


  private convertMapping(node: SyntaxNode, source: string): ObjectNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const properties: PropertyNode[] = [];
    const mergedProperties: PropertyNode[] = [];

    for (const child of node.children) {
      if (child.type === 'block_mapping_pair' || child.type === 'flow_pair') {
        const pair = this.convertPair(child, source);

        // Check for merge key (<<)
        if (
          pair.key.type === 'String' &&
          (pair.key as StringNode).value === '<<'
        ) {
          // Handle merge key
          const mergedProps = this.handleMergeKey(pair.value, source);
          mergedProperties.push(...mergedProps);
        } else {
          properties.push(pair);
        }
      }
    }

    // Merge properties: explicit keys override merged keys
    const explicitKeys = new Set(properties.map((p) => (p.key as StringNode).value));
    const finalProperties = [
      ...properties,
      ...mergedProperties.filter((p) => !explicitKeys.has((p.key as StringNode).value)),
    ];

    return objectNode(finalProperties, loc);
  }

  private handleMergeKey(valueNode: DataNode, source: string): PropertyNode[] {
    // Merge key value can be:
    // 1. A single mapping (object)
    // 2. An array of mappings

    if (valueNode.type === 'Object') {
      return (valueNode as ObjectNode).properties;
    }

    if (valueNode.type === 'Array') {
      const properties: PropertyNode[] = [];
      for (const element of (valueNode as ArrayNode).elements) {
        if (element.type === 'Object') {
          properties.push(...(element as ObjectNode).properties);
        }
      }
      return properties;
    }

    return [];
  }

  private convertPair(node: SyntaxNode, source: string): PropertyNode {
    const loc = nodeToLocation(node, this.sourceFormat);

    // Check for explicit key marker (?)
    let hasExplicitKeyMarker = false;
    for (const child of node.children) {
      if (child.type === '?') {
        hasExplicitKeyMarker = true;
        break;
      }
    }

    const keyNode = node.childForFieldName('key');
    const valueNode = node.childForFieldName('value');

    if (!keyNode) {
      throw new ParseError(
        'Invalid mapping pair: missing key',
        loc,
        source
      );
    }

    // Check for complex keys (objects or arrays as keys)
    // This includes both explicit `? {...}` syntax and implicit complex keys
    const isComplexKey =
      keyNode.type === 'block_mapping' ||
      keyNode.type === 'flow_mapping' ||
      keyNode.type === 'block_sequence' ||
      keyNode.type === 'flow_sequence' ||
      (hasExplicitKeyMarker && this.isComplexNode(keyNode));

    if (isComplexKey) {
      throw new ParseError(
        'Complex keys (objects or arrays as keys) are not supported',
        nodeToLocation(keyNode, this.sourceFormat),
        source
      );
    }

    const key = this.convertValue(keyNode, source);

    // Ensure key is a string
    let keyString: StringNode;
    if (key.type === 'String') {
      keyString = key as StringNode;
    } else {
      // Coerce to string
      const keyValue = this.coerceToString(key);
      keyString = stringNode(keyValue, key.loc);
    }

    const value = valueNode
      ? this.convertValue(valueNode, source)
      : nullNode(loc);

    return propertyNode(keyString, value, loc);
  }

  private isComplexNode(node: SyntaxNode): boolean {
    // Check if node is or contains a mapping or sequence
    if (
      node.type === 'block_mapping' ||
      node.type === 'flow_mapping' ||
      node.type === 'block_sequence' ||
      node.type === 'flow_sequence'
    ) {
      return true;
    }

    // Check children for wrapper nodes
    for (const child of node.children) {
      if (this.isComplexNode(child)) {
        return true;
      }
    }

    return false;
  }

  private coerceToString(node: DataNode): string {
    switch (node.type) {
      case 'Number':
        return String((node as NumberNode).value);
      case 'Boolean':
        return String((node as BooleanNode).value);
      case 'Null':
        return 'null';
      default:
        return '';
    }
  }

  private convertSequence(node: SyntaxNode, source: string): ArrayNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const elements: DataNode[] = [];

    for (const child of node.children) {
      if (child.type === 'block_sequence_item' || child.type === 'flow_node') {
        // Get the actual value from the item
        const valueNode = this.getSequenceItemValue(child);
        if (valueNode) {
          elements.push(this.convertValue(valueNode, source));
        }
      }
    }

    return arrayNode(elements, loc);
  }

  private getSequenceItemValue(itemNode: SyntaxNode): SyntaxNode | null {
    // block_sequence_item contains the actual value as a child
    for (const child of itemNode.children) {
      // Skip the - indicator and whitespace
      if (child.type !== '-' && child.type !== 'block_sequence_item' && child.text.trim() !== '') {
        return child;
      }
    }
    return null;
  }

  private convertPlainScalar(node: SyntaxNode, source: string): DataNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const text = node.text;

    // Check for null
    const lower = text.toLowerCase();
    if (
      text === '' ||
      text === '~' ||
      lower === 'null' ||
      lower === 'null'
    ) {
      return nullNode(loc);
    }

    // Check for boolean
    const booleans = ['true', 'false', 'yes', 'no', 'on', 'off', 'y', 'n'];
    if (booleans.includes(lower)) {
      return booleanNode(normalizeBoolean(text), loc);
    }

    // Check for number (including special float values)
    if (
      /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text) ||
      /^0x[0-9a-fA-F]+$/i.test(text) ||
      /^0o[0-7]+$/i.test(text) ||
      /^0b[01]+$/i.test(text) ||
      /^[+-]?\.inf$/i.test(text) ||
      /^\.nan$/i.test(text)
    ) {
      return numberNode(parseYAMLNumber(text), loc, text);
    }

    // Default to string
    return stringNode(text, loc);
  }

  private convertDoubleQuoteScalar(node: SyntaxNode, source: string): StringNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;

    // Remove quotes and unescape
    const content = raw.slice(1, -1); // Remove " at start and end
    const value = unescapeDoubleQuoteString(content);

    return stringNode(value, loc, raw);
  }

  private convertSingleQuoteScalar(node: SyntaxNode, source: string): StringNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;

    // Remove quotes and unescape
    const content = raw.slice(1, -1); // Remove ' at start and end
    const value = unescapeSingleQuoteString(content);

    return stringNode(value, loc, raw);
  }

  private convertBlockScalar(node: SyntaxNode, source: string): StringNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const text = node.text;

    // Extract the header line (|, >, |-, >-, |+, >+, etc.)
    const lines = text.split('\n');
    const headerLine = lines[0] || '';
    const isLiteral = headerLine.includes('|');
    const isFolded = headerLine.includes('>');

    // Extract chomping indicator
    let chomping: 'clip' | 'strip' | 'keep' = 'clip';
    if (headerLine.includes('-')) {
      chomping = 'strip';
    } else if (headerLine.includes('+')) {
      chomping = 'keep';
    }

    // Process content lines (skip header)
    const contentLines = lines.slice(1);

    // Find the base indentation (first non-empty line)
    let baseIndent = 0;
    for (const line of contentLines) {
      if (line.trim() !== '') {
        baseIndent = line.length - line.trimStart().length;
        break;
      }
    }

    // Remove base indentation from all lines
    const processedLines = contentLines.map((line) => {
      if (line.trim() === '') return '';
      return line.slice(baseIndent);
    });

    let result: string;

    if (isLiteral) {
      // Literal block scalar: preserve newlines
      result = processedLines.join('\n');
    } else {
      // Folded block scalar: fold single newlines to spaces
      const folded: string[] = [];
      let currentParagraph: string[] = [];

      for (const line of processedLines) {
        if (line.trim() === '') {
          // Empty line - end current paragraph
          if (currentParagraph.length > 0) {
            folded.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
          folded.push('');
        } else {
          currentParagraph.push(line);
        }
      }

      if (currentParagraph.length > 0) {
        folded.push(currentParagraph.join(' '));
      }

      result = folded.join('\n');
    }

    // Apply chomping
    if (chomping === 'strip') {
      result = result.replace(/\n+$/, '');
    } else if (chomping === 'clip') {
      result = result.replace(/\n+$/, '\n');
    }
    // keep: leave trailing newlines as-is

    return stringNode(result, loc);
  }

  private resolveAlias(node: SyntaxNode, source: string): DataNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const aliasName = node.text.substring(1); // Remove * prefix

    // Check for circular reference
    if (this.resolutionStack.has(aliasName)) {
      throw new ParseError(
        `Circular reference detected for anchor: ${aliasName}`,
        loc,
        source
      );
    }

    // Check if anchor exists
    const anchoredNode = this.anchors.get(aliasName);
    if (!anchoredNode) {
      throw new ParseError(
        `Undefined anchor: ${aliasName}`,
        loc,
        source
      );
    }

    // Return a deep copy of the anchored node
    return this.cloneNode(anchoredNode);
  }

  private cloneNode(node: DataNode): DataNode {
    // Deep clone the AST node
    switch (node.type) {
      case 'String':
      case 'Number':
      case 'Boolean':
      case 'Null':
        // Value nodes can be returned as-is (they're immutable)
        return node;

      case 'Object': {
        const objNode = node as ObjectNode;
        const clonedProperties = objNode.properties.map((prop) =>
          propertyNode(
            this.cloneNode(prop.key) as StringNode,
            this.cloneNode(prop.value),
            prop.loc
          )
        );
        return objectNode(clonedProperties, objNode.loc);
      }

      case 'Array': {
        const arrNode = node as ArrayNode;
        const clonedElements = arrNode.elements.map((el) => this.cloneNode(el));
        return arrayNode(clonedElements, arrNode.loc);
      }

      default:
        return node;
    }
  }

  private convertTaggedValue(node: SyntaxNode, source: string): DataNode | null {
    // Find the tag and value
    let tagNode: SyntaxNode | null = null;
    let valueNode: SyntaxNode | null = null;

    for (const child of node.children) {
      if (child.type === 'tag') {
        tagNode = child;
      } else if (child.type !== 'anchor') {
        valueNode = child;
      }
    }

    if (!tagNode || !valueNode) {
      return null;
    }

    const tag = tagNode.text;

    // Handle standard YAML tags
    if (tag === '!!str') {
      // Force string interpretation
      const value = this.convertValue(valueNode, source);
      const strValue = this.nodeToString(value);
      return stringNode(strValue, nodeToLocation(node, this.sourceFormat));
    }

    if (tag === '!!int') {
      // Force integer interpretation
      const value = this.convertValue(valueNode, source);
      const numValue = this.nodeToNumber(value);
      return numberNode(Math.floor(numValue), nodeToLocation(node, this.sourceFormat));
    }

    if (tag === '!!float') {
      // Force float interpretation
      const value = this.convertValue(valueNode, source);
      const numValue = this.nodeToNumber(value);
      return numberNode(numValue, nodeToLocation(node, this.sourceFormat));
    }

    if (tag === '!!bool') {
      // Force boolean interpretation
      const value = this.convertValue(valueNode, source);
      const boolValue = this.nodeToBoolean(value);
      return booleanNode(boolValue, nodeToLocation(node, this.sourceFormat));
    }

    if (tag === '!!null') {
      // Force null
      return nullNode(nodeToLocation(node, this.sourceFormat));
    }

    // For custom tags, just parse the underlying structure
    return this.convertValue(valueNode, source);
  }

  private nodeToString(node: DataNode): string {
    switch (node.type) {
      case 'String':
        return (node as StringNode).value;
      case 'Number':
        return String((node as NumberNode).value);
      case 'Boolean':
        return String((node as BooleanNode).value);
      case 'Null':
        return '';
      default:
        return '';
    }
  }

  private nodeToNumber(node: DataNode): number {
    switch (node.type) {
      case 'Number':
        return (node as NumberNode).value;
      case 'String':
        return parseFloat((node as StringNode).value) || 0;
      case 'Boolean':
        return (node as BooleanNode).value ? 1 : 0;
      case 'Null':
        return 0;
      default:
        return 0;
    }
  }

  private nodeToBoolean(node: DataNode): boolean {
    switch (node.type) {
      case 'Boolean':
        return (node as BooleanNode).value;
      case 'Number':
        return (node as NumberNode).value !== 0;
      case 'String':
        return normalizeBoolean((node as StringNode).value);
      case 'Null':
        return false;
      default:
        return false;
    }
  }

  private convertNumber(node: SyntaxNode, source: string): NumberNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const raw = node.text;
    const value = parseYAMLNumber(raw);

    return numberNode(value, loc, raw);
  }

  private convertBoolean(node: SyntaxNode, source: string): BooleanNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    const value = normalizeBoolean(node.text);
    return booleanNode(value, loc);
  }

  private convertNull(node: SyntaxNode, source: string): NullNode {
    const loc = nodeToLocation(node, this.sourceFormat);
    return nullNode(loc);
  }
}
