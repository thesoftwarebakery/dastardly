// Format validation keyword
// Based on ajv-formats: https://github.com/ajv-validator/ajv-formats

import type { KeywordValidator } from '../compiler-types.js';

/**
 * Format validation functions
 * Returns true if valid, false if invalid
 */
type FormatValidator = (value: string) => boolean;

/**
 * Format validators registry
 * Based on JSON Schema Draft 7 and ajv-formats
 */
const formatValidators: Record<string, FormatValidator> = {
  // Date and time formats (RFC 3339)
  'date-time': (str) => {
    // Full date-time: 2023-01-01T12:00:00Z or with timezone offset
    const dateTime = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}):?(\d{2}))$/i;
    return dateTime.test(str) && isValidDate(str);
  },

  'date': (str) => {
    // Full date: 2023-01-01
    const date = /^(\d{4})-(\d{2})-(\d{2})$/;
    return date.test(str) && isValidDate(str);
  },

  'time': (str) => {
    // Time: 12:00:00 or 12:00:00.123 with optional timezone
    const time = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}):?(\d{2}))?$/i;
    if (!time.test(str)) return false;
    const match = str.match(time);
    if (!match) return false;
    const [, hours, minutes, seconds] = match;
    return parseInt(hours!) < 24 && parseInt(minutes!) < 60 && parseInt(seconds!) < 60;
  },

  // Email formats (RFC 5321)
  'email': (str) => {
    // Simplified email validation
    const email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email.test(str) && str.length <= 254;
  },

  'idn-email': (str) => {
    // Internationalized email - allow Unicode
    const idnEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return idnEmail.test(str) && str.length <= 254;
  },

  // Hostname formats (RFC 1123)
  'hostname': (str) => {
    // ASCII hostname
    if (str.length > 253) return false;
    const hostname = /^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostname.test(str);
  },

  'idn-hostname': (str) => {
    // Internationalized hostname - allow Unicode
    if (str.length > 253) return false;
    const parts = str.split('.');
    return parts.every(part => part.length > 0 && part.length <= 63);
  },

  // IP addresses
  'ipv4': (str) => {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4.test(str);
  },

  'ipv6': (str) => {
    // Simplified IPv6 validation
    const ipv6 = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])\.){3}(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])\.){3}(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9]))$/;
    return ipv6.test(str);
  },

  // URI formats (RFC 3986)
  'uri': (str) => {
    // Full URI with scheme
    try {
      const url = new URL(str);
      return url.protocol.length > 0;
    } catch {
      return false;
    }
  },

  'uri-reference': (str) => {
    // URI or relative reference
    const uriRef = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:)?(?:\/\/(?:[^\/?#]*@)?[^\/?#]*)?[^?#]*(?:\?[^#]*)?(?:#.*)?$/;
    return uriRef.test(str);
  },

  'iri': (str) => {
    // Internationalized URI
    const iri = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
    return iri.test(str);
  },

  'iri-reference': (str) => {
    // IRI or relative reference - very permissive
    return str.length > 0;
  },

  // URI template (RFC 6570)
  'uri-template': (str) => {
    // Basic validation - check for balanced braces
    let depth = 0;
    for (const char of str) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  },

  // JSON Pointer (RFC 6901)
  'json-pointer': (str) => {
    if (str === '') return true; // Empty string is valid
    if (!str.startsWith('/')) return false;
    // Check for valid escape sequences
    const segments = str.slice(1).split('/');
    return segments.every(seg => {
      // ~0 and ~1 are valid, ~X (where X is not 0 or 1) is invalid
      let i = 0;
      while (i < seg.length) {
        if (seg[i] === '~') {
          if (i + 1 >= seg.length) return false;
          if (seg[i + 1] !== '0' && seg[i + 1] !== '1') return false;
          i += 2;
        } else {
          i++;
        }
      }
      return true;
    });
  },

  'relative-json-pointer': (str) => {
    // Relative JSON Pointer: starts with non-negative integer
    const relativePointer = /^(?:0|[1-9][0-9]*)(?:#|\/.*)?$/;
    return relativePointer.test(str);
  },

  // Regular expression
  'regex': (str) => {
    try {
      new RegExp(str);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Validate a date string (YYYY-MM-DD or date-time)
 */
function isValidDate(str: string): boolean {
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return false;

  const year = parseInt(match[1]!);
  const month = parseInt(match[2]!);
  const day = parseInt(match[3]!);

  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Days in month
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1]!;
}

/**
 * Check if year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Create a format validator
 *
 * The format keyword is optional in JSON Schema - implementations may choose
 * to not validate formats at all. This implementation validates common formats.
 *
 * @param format - Format name (e.g., "email", "date-time")
 * @returns Keyword validator for format
 */
export function createFormatValidator(format: string): KeywordValidator {
  const validator = formatValidators[format];

  // Unknown formats are ignored per spec (optional to validate)
  if (!validator) {
    return {
      validate() {
        return [];
      },
      appliesTo: () => false,
    };
  }

  return {
    validate(node, pointer, schemaPath) {
      // Format only applies to strings
      if (node.type !== 'String') return [];

      if (!validator(node.value)) {
        return [
          {
            path: pointer,
            message: `String does not match format "${format}"`,
            keyword: 'format',
            schemaPath: `${schemaPath}/format`,
            location: node.loc,
            params: { format },
          },
        ];
      }

      return [];
    },

    appliesTo: (node) => node.type === 'String',
  };
}
