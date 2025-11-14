// Type definitions for @bakes/dastardly-tree-sitter-csv

// Wrapper objects containing tree-sitter language
// tree-sitter will add nodeTypeInfo and nodeSubclasses to these wrappers
export interface LanguageWrapper {
  language: any; // External tree-sitter language object
  nodeTypeInfo?: any[];
  nodeSubclasses?: any[]; // Added by tree-sitter during setLanguage
}

export const csv: LanguageWrapper;
export const psv: LanguageWrapper;
export const tsv: LanguageWrapper;
