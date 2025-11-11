/**
 * @file CSV, PSV, & TSV grammar for tree-sitter
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 *
 * @param {string} dialect
 *
 * @param {string} separator
 *
 * @return {GrammarSchema<any>}
 *
 */
module.exports = function defineGrammar(dialect, separator) {
  return grammar({
    name: dialect,

    externals: $ => [
      $.empty_field,
      $._error_sentinel,
    ],

    // Do not skip whitespace - spaces are significant in CSV fields
    extras: $ => [],

    rules: {
      document: $ => choice(
        seq(repeat1(seq($.row, /\r|\r\n|\n/)), optional($.row)),
        optional($.row),
      ),

      row: $ => seq(
        optional(separator),
        $.field,
        repeat(seq(separator, $.field)),
        optional(separator),
      ),
      // Try boolean/number/float first (more specific), then text (catch-all), then empty_field
      field: $ => choice($.boolean, $.float, $.number, $.text, $.empty_field),

      text: _ => token(choice(
        // Unquoted text: anything except separator, newlines, or quotes
        // Per RFC 4180, spaces ARE allowed in unquoted fields (TEXTDATA includes %x20)
        // Can include hyphens, digits, spaces (e.g., "Employee 1", "2024-01-01")
        new RegExp(`[^${separator}\\r\\n",][^${separator}\\r\\n"]*`),
        // Quoted text: anything inside quotes, with "" for escaped quotes
        seq('"', repeat(choice(/[^"]/, '""')), '"'),
      )),
      number: _ => choice(/\d+/, /0[xX][0-9a-fA-F]+/),
      float: _ => choice(/\d*\.\d+/, /\d+\.\d*/),
      boolean: _ => choice('true', 'false'),
    },
  });
};
