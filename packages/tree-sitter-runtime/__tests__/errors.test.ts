import { describe, it, expect } from 'vitest';
import { ParseError } from '../src/index.js';
import { sourceLocation, position } from '@dastardly/core';

describe('ParseError', () => {
  it('creates an error with message and location', () => {
    const loc = sourceLocation(position(1, 0, 0), position(1, 5, 5), 'json');
    const error = new ParseError('Syntax error', loc, '{"invalid"}');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ParseError);
    expect(error.message).toContain('Syntax error');
    expect(error.message).toContain('1:0'); // Line:column
    expect(error.loc).toEqual(loc);
    expect(error.source).toBe('{"invalid"}');
  });

  it('includes position in error message', () => {
    const loc = sourceLocation(position(5, 10, 100), position(5, 15, 105), 'yaml');
    const error = new ParseError('Unexpected token', loc, 'some: yaml');

    expect(error.message).toContain('5:10');
  });

  it('has correct error name', () => {
    const loc = sourceLocation(position(1, 0, 0), position(1, 1, 1));
    const error = new ParseError('Test error', loc, 'test');

    expect(error.name).toBe('ParseError');
  });

  it('preserves stack trace', () => {
    const loc = sourceLocation(position(1, 0, 0), position(1, 1, 1));
    const error = new ParseError('Test', loc, 'source');

    expect(error.stack).toBeDefined();
  });
});
