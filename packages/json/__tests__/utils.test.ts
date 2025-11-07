import { describe, it, expect } from 'vitest';
import { escapeString, unescapeString, normalizeIndent } from '../src/utils.js';

describe('escapeString', () => {
  it('escapes basic string without special characters', () => {
    expect(escapeString('hello')).toBe('"hello"');
    expect(escapeString('world')).toBe('"world"');
    expect(escapeString('test123')).toBe('"test123"');
  });

  it('escapes double quotes', () => {
    expect(escapeString('say "hello"')).toBe('"say \\"hello\\""');
    expect(escapeString('"')).toBe('"\\""');
  });

  it('escapes backslash', () => {
    expect(escapeString('path\\to\\file')).toBe('"path\\\\to\\\\file"');
    expect(escapeString('\\')).toBe('"\\\\"');
  });

  it('escapes forward slash', () => {
    expect(escapeString('a/b')).toBe('"a\\/b"');
    expect(escapeString('http://example.com')).toBe('"http:\\/\\/example.com"');
  });

  it('escapes backspace', () => {
    expect(escapeString('a\bb')).toBe('"a\\bb"');
  });

  it('escapes form feed', () => {
    expect(escapeString('a\fb')).toBe('"a\\fb"');
  });

  it('escapes newline', () => {
    expect(escapeString('line1\nline2')).toBe('"line1\\nline2"');
    expect(escapeString('\n')).toBe('"\\n"');
  });

  it('escapes carriage return', () => {
    expect(escapeString('line1\rline2')).toBe('"line1\\rline2"');
    expect(escapeString('\r')).toBe('"\\r"');
  });

  it('escapes tab', () => {
    expect(escapeString('a\tb')).toBe('"a\\tb"');
    expect(escapeString('\t')).toBe('"\\t"');
  });

  it('escapes control characters as unicode', () => {
    expect(escapeString('\x00')).toBe('"\\u0000"');
    expect(escapeString('\x01')).toBe('"\\u0001"');
    expect(escapeString('\x1F')).toBe('"\\u001f"');
  });

  it('does not escape regular unicode characters', () => {
    expect(escapeString('日本語')).toBe('"日本語"');
    expect(escapeString('café')).toBe('"café"');
    expect(escapeString('😀')).toBe('"😀"');
  });

  it('escapes empty string', () => {
    expect(escapeString('')).toBe('""');
  });

  it('escapes mixed special characters', () => {
    expect(escapeString('line1\nline2\ttab')).toBe('"line1\\nline2\\ttab"');
    expect(escapeString('say "hello"\nworld')).toBe('"say \\"hello\\"\\nworld"');
  });

  it('escapes all standard escapes in one string', () => {
    const input = '"\\\b\f\n\r\t/';
    const expected = '"\\"\\\\\\b\\f\\n\\r\\t\\/"';
    expect(escapeString(input)).toBe(expected);
  });
});

describe('unescapeString', () => {
  it('unescapes string without quotes', () => {
    expect(unescapeString('hello')).toBe('hello');
  });

  it('removes surrounding quotes', () => {
    expect(unescapeString('"hello"')).toBe('hello');
    expect(unescapeString('"world"')).toBe('world');
  });

  it('unescapes double quote', () => {
    expect(unescapeString('\\"')).toBe('"');
    expect(unescapeString('say \\"hello\\"')).toBe('say "hello"');
  });

  it('unescapes backslash', () => {
    expect(unescapeString('\\\\')).toBe('\\');
    expect(unescapeString('path\\\\to\\\\file')).toBe('path\\to\\file');
  });

  it('unescapes forward slash', () => {
    expect(unescapeString('\\/')).toBe('/');
    expect(unescapeString('http:\\/\\/example.com')).toBe('http://example.com');
  });

  it('unescapes backspace', () => {
    expect(unescapeString('\\b')).toBe('\b');
    expect(unescapeString('a\\bb')).toBe('a\bb');
  });

  it('unescapes form feed', () => {
    expect(unescapeString('\\f')).toBe('\f');
    expect(unescapeString('a\\fb')).toBe('a\fb');
  });

  it('unescapes newline', () => {
    expect(unescapeString('\\n')).toBe('\n');
    expect(unescapeString('line1\\nline2')).toBe('line1\nline2');
  });

  it('unescapes carriage return', () => {
    expect(unescapeString('\\r')).toBe('\r');
    expect(unescapeString('line1\\rline2')).toBe('line1\rline2');
  });

  it('unescapes tab', () => {
    expect(unescapeString('\\t')).toBe('\t');
    expect(unescapeString('a\\tb')).toBe('a\tb');
  });

  it('unescapes valid unicode escapes', () => {
    expect(unescapeString('\\u0041')).toBe('A');
    expect(unescapeString('\\u0042')).toBe('B');
    expect(unescapeString('\\u0043')).toBe('C');
    expect(unescapeString('\\u65E5')).toBe('日');
    expect(unescapeString('\\u672C')).toBe('本');
  });

  it('handles invalid unicode escapes (non-hex)', () => {
    expect(unescapeString('\\uZZZZ')).toBe('\\uZZZZ');
    expect(unescapeString('\\uGGGG')).toBe('\\uGGGG');
  });

  it('handles incomplete unicode escapes', () => {
    expect(unescapeString('\\u')).toBe('\\u');
    expect(unescapeString('\\u0')).toBe('\\u0');
    expect(unescapeString('\\u00')).toBe('\\u00');
    expect(unescapeString('\\u004')).toBe('\\u004');
  });

  it('handles unknown escape sequences', () => {
    expect(unescapeString('\\x')).toBe('\\x');
    expect(unescapeString('\\k')).toBe('\\k');
    expect(unescapeString('\\z')).toBe('\\z');
  });

  it('handles trailing backslash', () => {
    expect(unescapeString('test\\')).toBe('test\\');
  });

  it('unescapes empty string', () => {
    expect(unescapeString('')).toBe('');
    expect(unescapeString('""')).toBe('');
  });

  it('unescapes multiple escape sequences', () => {
    expect(unescapeString('\\n\\t\\r')).toBe('\n\t\r');
    expect(unescapeString('a\\nb\\tc')).toBe('a\nb\tc');
  });

  it('unescapes all standard escapes', () => {
    const input = '\\"\\\\\\b\\f\\n\\r\\t\\/';
    const expected = '"\\\b\f\n\r\t/';
    expect(unescapeString(input)).toBe(expected);
  });

  it('handles mixed escaped and unescaped content', () => {
    expect(unescapeString('hello\\nworld')).toBe('hello\nworld');
    expect(unescapeString('say \\"hi\\" to me')).toBe('say "hi" to me');
  });

  it('handles consecutive unicode escapes', () => {
    expect(unescapeString('\\u0041\\u0042\\u0043')).toBe('ABC');
  });

  it('handles unicode escapes mixed with other content', () => {
    expect(unescapeString('Hello \\u0041B\\u0043')).toBe('Hello ABC');
  });

  it('handles string with quotes and escapes', () => {
    expect(unescapeString('"hello\\nworld"')).toBe('hello\nworld');
    expect(unescapeString('"say \\"hi\\""')).toBe('say "hi"');
  });
});

describe('normalizeIndent', () => {
  it('returns empty string for undefined', () => {
    expect(normalizeIndent(undefined)).toBe('');
  });

  it('returns empty string for 0', () => {
    expect(normalizeIndent(0)).toBe('');
  });

  it('converts number to spaces', () => {
    expect(normalizeIndent(1)).toBe(' ');
    expect(normalizeIndent(2)).toBe('  ');
    expect(normalizeIndent(4)).toBe('    ');
    expect(normalizeIndent(8)).toBe('        ');
  });

  it('returns string as-is', () => {
    expect(normalizeIndent('\t')).toBe('\t');
    expect(normalizeIndent('  ')).toBe('  ');
    expect(normalizeIndent('    ')).toBe('    ');
    expect(normalizeIndent('x')).toBe('x');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeIndent('')).toBe('');
  });

  it('handles custom indent strings', () => {
    expect(normalizeIndent('>>>')).toBe('>>>');
    expect(normalizeIndent('....')).toBe('....');
  });
});
