/**
 * @file External scanner for CSV/TSV/PSV empty field detection
 * @author dASTardly Project
 * @license MIT
 *
 * This external scanner enables detection of empty fields in CSV files,
 * which cannot be expressed in tree-sitter's grammar DSL due to the
 * prohibition against rules matching empty strings.
 *
 * Empty fields occur in these patterns:
 * - Consecutive separators: ,,
 * - Separator at line end: ,\n or ,\r
 * - Separator at EOF: ,<EOF>
 * - Line start with separator (handled by grammar + this scanner)
 */

#include "tree_sitter/parser.h"
#include <wctype.h>

enum TokenType {
  EMPTY_FIELD,
  ERROR_SENTINEL,
};

/**
 * Create scanner state.
 * Returns NULL for stateless scanner (no state needed for empty field detection).
 */
void *tree_sitter_csv_external_scanner_create() {
  return NULL;
}

void *tree_sitter_psv_external_scanner_create() {
  return tree_sitter_csv_external_scanner_create();
}

void *tree_sitter_tsv_external_scanner_create() {
  return tree_sitter_csv_external_scanner_create();
}

/**
 * Destroy scanner state.
 * No-op for stateless scanner.
 */
void tree_sitter_csv_external_scanner_destroy(void *payload) {
  // No-op for stateless scanner
}

void tree_sitter_psv_external_scanner_destroy(void *payload) {
  tree_sitter_csv_external_scanner_destroy(payload);
}

void tree_sitter_tsv_external_scanner_destroy(void *payload) {
  tree_sitter_csv_external_scanner_destroy(payload);
}

/**
 * Serialize scanner state.
 * Returns 0 for stateless scanner (nothing to serialize).
 */
unsigned tree_sitter_csv_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

unsigned tree_sitter_psv_external_scanner_serialize(void *payload, char *buffer) {
  return tree_sitter_csv_external_scanner_serialize(payload, buffer);
}

unsigned tree_sitter_tsv_external_scanner_serialize(void *payload, char *buffer) {
  return tree_sitter_csv_external_scanner_serialize(payload, buffer);
}

/**
 * Deserialize scanner state.
 * No-op for stateless scanner.
 */
void tree_sitter_csv_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  // Nothing to restore for stateless scanner
}

void tree_sitter_psv_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  tree_sitter_csv_external_scanner_deserialize(payload, buffer, length);
}

void tree_sitter_tsv_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  tree_sitter_csv_external_scanner_deserialize(payload, buffer, length);
}

/**
 * Check if character is a CSV separator (comma, tab, or pipe).
 * This handles all three variants: CSV, TSV, PSV.
 */
static inline bool is_separator(int32_t c) {
  return c == ',' || c == '\t' || c == '|';
}

/**
 * Check if character is a line ending.
 */
static inline bool is_newline(int32_t c) {
  return c == '\n' || c == '\r';
}

/**
 * Main scanning function.
 * Detects empty field tokens at appropriate positions.
 *
 * Empty fields are detected when the current position is between:
 * - Two separators: ,,
 * - Separator and newline: ,\n
 * - Separator and EOF: ,<EOF>
 * - Start of line and separator (handled by grammar + zero-width token)
 *
 * This scanner generates zero-width tokens by calling mark_end() before
 * examining lookahead, ensuring no input is consumed.
 */
bool tree_sitter_csv_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  // Error recovery sentinel - don't interfere with parser error recovery
  if (valid_symbols[ERROR_SENTINEL]) {
    return false;
  }

  // Only proceed if empty_field token is grammatically valid at this position
  if (!valid_symbols[EMPTY_FIELD]) {
    return false;
  }

  // Mark end BEFORE examining lookahead to create zero-width token
  // This is critical - we detect empty fields without consuming any input
  lexer->mark_end(lexer);

  // Detect empty field by checking what follows the current position:
  //
  // Pattern 1: Another separator follows (consecutive separators)
  //   Example: a,,c  →  position between commas is empty field
  //
  // Pattern 2: Newline follows (empty at end of row)
  //   Example: a,b,\n  →  position after last comma is empty field
  //
  // Pattern 3: EOF follows (empty at end of file)
  //   Example: a,b,<EOF>  →  position after last comma is empty field
  //
  // Pattern 4: Beginning of row (handled by grammar recognizing separator immediately)
  //   Example: ,b,c  →  grammar sees separator, scanner confirms empty before it

  // Check if next character indicates an empty field
  // Note: We check for separator or newline, but NOT EOF alone,
  // to prevent creating phantom rows after trailing newlines
  if (is_separator(lexer->lookahead)) {
    lexer->result_symbol = EMPTY_FIELD;
    return true;
  }

  if (is_newline(lexer->lookahead)) {
    lexer->result_symbol = EMPTY_FIELD;
    return true;
  }

  // No empty field detected at this position
  return false;
}

bool tree_sitter_psv_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  return tree_sitter_csv_external_scanner_scan(payload, lexer, valid_symbols);
}

bool tree_sitter_tsv_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  return tree_sitter_csv_external_scanner_scan(payload, lexer, valid_symbols);
}
