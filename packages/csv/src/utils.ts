// CSV-specific utility functions

/**
 * Quote strategy for CSV fields.
 */
export type QuoteStrategy = 'needed' | 'all' | 'nonnumeric' | 'none';

/**
 * Escape a field value for CSV output.
 * If the field contains the delimiter, quotes, or newlines, it will be quoted.
 * Quotes within the field are doubled per RFC 4180.
 *
 * @param value - The field value to escape
 * @param delimiter - The delimiter character (e.g., ',', '\t', '|')
 * @returns Escaped field value (quoted if necessary)
 */
export function escapeField(value: string, delimiter: string): string {
  // Empty string doesn't need quoting
  if (value.length === 0) {
    return '';
  }

  // Check if field needs quoting
  const needsQuote =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');

  if (!needsQuote) {
    return value;
  }

  // Quote the field and double any internal quotes
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Unescape a CSV field value.
 * Removes surrounding quotes and converts doubled quotes to single quotes.
 *
 * @param value - The field value to unescape
 * @returns Unescaped field value
 */
export function unescapeField(value: string): string {
  // If field is quoted, remove quotes and unescape doubled quotes
  if (value.startsWith('"') && value.endsWith('"')) {
    const unquoted = value.slice(1, -1);
    return unquoted.replace(/""/g, '"');
  }

  // Unquoted field - return as-is
  return value;
}

/**
 * Determine if a field value needs quoting based on the quote strategy.
 *
 * @param value - The field value
 * @param delimiter - The delimiter character
 * @param quoting - The quote strategy
 * @returns True if the field should be quoted
 */
export function needsQuoting(
  value: string,
  delimiter: string,
  quoting: QuoteStrategy
): boolean {
  switch (quoting) {
    case 'all':
      return true;

    case 'none':
      return false;

    case 'nonnumeric': {
      // Check if value is numeric
      const isNumeric = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value);
      if (isNumeric) {
        return false;
      }
      // Non-numeric values need quoting
      return true;
    }

    case 'needed':
    default: {
      // Quote if contains delimiter, quotes, newlines, or spaces
      // Spaces require quoting per RFC 4180 for proper parsing
      return (
        value.includes(delimiter) ||
        value.includes('"') ||
        value.includes('\n') ||
        value.includes('\r') ||
        value.includes(' ')
      );
    }
  }
}

/**
 * Parse a CSV number from text.
 * Handles integers, floats, exponential notation, and negative zero.
 *
 * @param text - The number text to parse
 * @returns Parsed number value
 */
export function parseCSVNumber(text: string): number {
  return parseFloat(text);
}

/**
 * Normalize line endings in text to the specified style.
 *
 * @param text - The text to normalize
 * @param style - The line ending style ('crlf' or 'lf')
 * @returns Text with normalized line endings
 */
export function normalizeLineEnding(text: string, style: 'crlf' | 'lf'): string {
  if (style === 'crlf') {
    // Convert all line endings to CRLF
    // First normalize CRLF to LF, then LF to CRLF
    return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  } else {
    // Convert all line endings to LF
    return text.replace(/\r\n/g, '\n');
  }
}
