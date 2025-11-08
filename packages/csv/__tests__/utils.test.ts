import { describe, it, expect } from 'vitest';
import {
  escapeField,
  unescapeField,
  needsQuoting,
  parseCSVNumber,
  normalizeLineEnding,
} from '../src/utils.js';

describe('escapeField', () => {
  it('quotes and escapes field with comma', () => {
    expect(escapeField('hello, world', ',')).toBe('"hello, world"');
  });

  it('quotes and escapes field with double quotes', () => {
    expect(escapeField('say "hello"', ',')).toBe('"say ""hello"""');
    expect(escapeField('"', ',')).toBe('""""');
  });

  it('quotes and escapes field with newlines', () => {
    expect(escapeField('line1\nline2', ',')).toBe('"line1\nline2"');
    expect(escapeField('line1\r\nline2', ',')).toBe('"line1\r\nline2"');
  });

  it('quotes field with both quotes and commas', () => {
    expect(escapeField('hello, "world"', ',')).toBe('"hello, ""world"""');
  });

  it('returns unquoted field when safe', () => {
    expect(escapeField('hello', ',')).toBe('hello');
    expect(escapeField('test123', ',')).toBe('test123');
    expect(escapeField('simple_text', ',')).toBe('simple_text');
  });

  it('handles different delimiters', () => {
    expect(escapeField('hello\tworld', '\t')).toBe('"hello\tworld"');
    expect(escapeField('hello|world', '|')).toBe('"hello|world"');
    expect(escapeField('hello;world', ';')).toBe('"hello;world"');
  });

  it('handles empty strings', () => {
    expect(escapeField('', ',')).toBe('');
  });
});

describe('unescapeField', () => {
  it('unescapes quoted field with comma', () => {
    expect(unescapeField('"hello, world"')).toBe('hello, world');
  });

  it('unescapes doubled quotes', () => {
    expect(unescapeField('"say ""hello"""')).toBe('say "hello"');
    expect(unescapeField('""""')).toBe('"');
  });

  it('preserves newlines in quoted fields', () => {
    expect(unescapeField('"line1\nline2"')).toBe('line1\nline2');
    expect(unescapeField('"line1\r\nline2"')).toBe('line1\r\nline2');
  });

  it('handles unquoted fields', () => {
    expect(unescapeField('hello')).toBe('hello');
    expect(unescapeField('test123')).toBe('test123');
  });

  it('handles empty strings', () => {
    expect(unescapeField('')).toBe('');
    expect(unescapeField('""')).toBe('');
  });

  it('handles fields with quotes and commas', () => {
    expect(unescapeField('"hello, ""world"""')).toBe('hello, "world"');
  });
});

describe('needsQuoting', () => {
  describe('quoting="needed"', () => {
    it('returns true for fields with delimiter', () => {
      expect(needsQuoting('hello, world', ',', 'needed')).toBe(true);
      expect(needsQuoting('hello\tworld', '\t', 'needed')).toBe(true);
    });

    it('returns true for fields with quotes', () => {
      expect(needsQuoting('say "hello"', ',', 'needed')).toBe(true);
    });

    it('returns true for fields with newlines', () => {
      expect(needsQuoting('line1\nline2', ',', 'needed')).toBe(true);
      expect(needsQuoting('line1\r\nline2', ',', 'needed')).toBe(true);
    });

    it('returns false for simple fields', () => {
      expect(needsQuoting('hello', ',', 'needed')).toBe(false);
      expect(needsQuoting('test123', ',', 'needed')).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(needsQuoting('', ',', 'needed')).toBe(false);
    });
  });

  describe('quoting="all"', () => {
    it('returns true for all fields', () => {
      expect(needsQuoting('hello', ',', 'all')).toBe(true);
      expect(needsQuoting('test123', ',', 'all')).toBe(true);
      expect(needsQuoting('', ',', 'all')).toBe(true);
    });
  });

  describe('quoting="nonnumeric"', () => {
    it('returns false for numeric fields', () => {
      expect(needsQuoting('123', ',', 'nonnumeric')).toBe(false);
      expect(needsQuoting('3.14', ',', 'nonnumeric')).toBe(false);
      expect(needsQuoting('-42', ',', 'nonnumeric')).toBe(false);
    });

    it('returns true for non-numeric fields', () => {
      expect(needsQuoting('hello', ',', 'nonnumeric')).toBe(true);
      expect(needsQuoting('test123', ',', 'nonnumeric')).toBe(true);
    });

    it('returns true for fields that need quoting anyway', () => {
      expect(needsQuoting('hello, world', ',', 'nonnumeric')).toBe(true);
    });
  });

  describe('quoting="none"', () => {
    it('returns false for all fields', () => {
      expect(needsQuoting('hello', ',', 'none')).toBe(false);
      expect(needsQuoting('hello, world', ',', 'none')).toBe(false);
      expect(needsQuoting('', ',', 'none')).toBe(false);
    });
  });
});

describe('parseCSVNumber', () => {
  it('parses integers', () => {
    expect(parseCSVNumber('123')).toBe(123);
    expect(parseCSVNumber('0')).toBe(0);
    expect(parseCSVNumber('-42')).toBe(-42);
  });

  it('parses floats', () => {
    expect(parseCSVNumber('3.14')).toBe(3.14);
    expect(parseCSVNumber('-2.5')).toBe(-2.5);
    expect(parseCSVNumber('0.5')).toBe(0.5);
  });

  it('parses exponential notation', () => {
    expect(parseCSVNumber('1e10')).toBe(1e10);
    expect(parseCSVNumber('1.5e-5')).toBe(1.5e-5);
    expect(parseCSVNumber('2.5E3')).toBe(2500);
  });

  it('handles negative zero', () => {
    expect(parseCSVNumber('-0')).toBe(-0);
    expect(Object.is(parseCSVNumber('-0'), -0)).toBe(true);
  });

  it('handles leading zeros', () => {
    expect(parseCSVNumber('007')).toBe(7);
    expect(parseCSVNumber('00.5')).toBe(0.5);
  });
});

describe('normalizeLineEnding', () => {
  it('converts LF to CRLF', () => {
    expect(normalizeLineEnding('line1\nline2\nline3', 'crlf')).toBe('line1\r\nline2\r\nline3');
  });

  it('converts CRLF to LF', () => {
    expect(normalizeLineEnding('line1\r\nline2\r\nline3', 'lf')).toBe('line1\nline2\nline3');
  });

  it('handles mixed line endings to CRLF', () => {
    expect(normalizeLineEnding('line1\nline2\r\nline3\n', 'crlf')).toBe('line1\r\nline2\r\nline3\r\n');
  });

  it('handles mixed line endings to LF', () => {
    expect(normalizeLineEnding('line1\nline2\r\nline3\n', 'lf')).toBe('line1\nline2\nline3\n');
  });

  it('returns same string when already correct format', () => {
    expect(normalizeLineEnding('line1\r\nline2', 'crlf')).toBe('line1\r\nline2');
    expect(normalizeLineEnding('line1\nline2', 'lf')).toBe('line1\nline2');
  });

  it('handles strings with no line endings', () => {
    expect(normalizeLineEnding('hello', 'crlf')).toBe('hello');
    expect(normalizeLineEnding('hello', 'lf')).toBe('hello');
  });
});
