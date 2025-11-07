// Error classes for parsing

import type { SourceLocation } from '@dastardly/core';

/**
 * Error thrown when parsing fails.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly loc: SourceLocation,
    public readonly source: string
  ) {
    super(`${message} at ${loc.start.line}:${loc.start.column}`);
    this.name = 'ParseError';
  }
}
