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
      field: $ => choice($.text, $.number, $.float, $.boolean, $.empty_field),

      text: _ => token(choice(
        new RegExp(`[^${separator}\\d\\s"][^${separator}\\s"]*`),
        seq('"', repeat(choice(/[^"]/, '""')), '"'),
      )),
      number: _ => choice(/\d+/, /0[xX][0-9a-fA-F]+/),
      float: _ => choice(/\d*\.\d+/, /\d+\.\d*/),
      boolean: _ => choice('true', 'false'),
    },
  });
};
