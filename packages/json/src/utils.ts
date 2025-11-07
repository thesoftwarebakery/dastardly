// JSON-specific utility functions

/**
 * Escape a string for JSON output.
 * Handles: " \ / backspace formfeed newline return tab and control characters
 */
export function escapeString(value: string): string {
  let result = '"';

  for (let i = 0; i < value.length; i++) {
    const char = value[i]!;
    const code = char.charCodeAt(0);

    switch (char) {
      case '"':
        result += '\\"';
        break;
      case '\\':
        result += '\\\\';
        break;
      case '/':
        result += '\\/';
        break;
      case '\b':
        result += '\\b';
        break;
      case '\f':
        result += '\\f';
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\t':
        result += '\\t';
        break;
      default:
        // Escape control characters (0x00-0x1F) as \uXXXX
        if (code < 0x20) {
          result += '\\u' + code.toString(16).padStart(4, '0');
        } else {
          result += char;
        }
    }
  }

  result += '"';
  return result;
}

/**
 * Unescape a JSON string (remove quotes and process escape sequences).
 */
export function unescapeString(value: string): string {
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  let result = '';
  let i = 0;

  while (i < value.length) {
    const char = value[i]!;

    if (char === '\\' && i + 1 < value.length) {
      const next = value[i + 1]!;

      switch (next) {
        case '"':
          result += '"';
          i += 2;
          break;
        case '\\':
          result += '\\';
          i += 2;
          break;
        case '/':
          result += '/';
          i += 2;
          break;
        case 'b':
          result += '\b';
          i += 2;
          break;
        case 'f':
          result += '\f';
          i += 2;
          break;
        case 'n':
          result += '\n';
          i += 2;
          break;
        case 'r':
          result += '\r';
          i += 2;
          break;
        case 't':
          result += '\t';
          i += 2;
          break;
        case 'u':
          // Unicode escape: \uXXXX
          if (i + 6 <= value.length) {
            const hex = value.slice(i + 2, i + 6);
            // Check that we have exactly 4 hex digits
            if (hex.length === 4 && /^[0-9a-fA-F]{4}$/.test(hex)) {
              const codePoint = parseInt(hex, 16);
              result += String.fromCharCode(codePoint);
              i += 6;
            } else {
              // Invalid unicode escape - keep the entire sequence as-is
              result += '\\u' + hex;
              i += 6;
            }
          } else {
            // Incomplete unicode escape - keep what we have as-is
            result += value.slice(i);
            i = value.length;
          }
          break;
        default:
          // Unknown escape sequence, keep backslash
          result += char;
          i += 1;
      }
    } else {
      result += char;
      i += 1;
    }
  }

  return result;
}

/**
 * Normalize indent option to a string.
 */
export function normalizeIndent(indent: number | string | undefined): string {
  if (indent === undefined || indent === 0) {
    return '';
  }
  if (typeof indent === 'number') {
    return ' '.repeat(indent);
  }
  return indent;
}
