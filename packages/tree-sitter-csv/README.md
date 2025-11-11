# @dastardly/tree-sitter-csv

CSV, PSV, and TSV grammars for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

**dASTardly fork** with enhancements:
- RFC 4180 compliant with external scanner for empty field support
- Migrated from deprecated `nan` to `node-addon-api` for modern Node.js compatibility
- Tree-sitter 0.21+ compatibility
- Used by [@dastardly/csv](https://npmjs.com/package/@dastardly/csv) parser

Original grammar by [Amaan Qureshi](https://github.com/amaanq/tree-sitter-csv).

## Installation

```bash
npm install @dastardly/tree-sitter-csv
```

```bash
pnpm add @dastardly/tree-sitter-csv
```

**Note:** This package requires build tools (node-gyp, C compiler) for installation. The native bindings will be compiled during `npm install`.

## Usage

This module exports three tree-sitter grammars for different delimiter types:

```js
const { csv, psv, tsv } = require('@dastardly/tree-sitter-csv');

// CSV grammar (comma-delimited)
const Parser = require('tree-sitter');
const parser = new Parser();
parser.setLanguage(csv);

// PSV grammar (pipe-delimited)
parser.setLanguage(psv);

// TSV grammar (tab-delimited)
parser.setLanguage(tsv);
```

## Features

- **RFC 4180 Compliant** - Full support for CSV specification including empty fields
- **External Scanner** - C-based scanner for accurate empty field detection
- **Three Dialects** - CSV (`,`), TSV (`\t`), and PSV (`|`) support
- **Modern Node.js** - Uses `node-addon-api` instead of deprecated `nan`
- **Tree-sitter 0.21+** - Compatible with latest tree-sitter versions

## Building from Source

If you need to regenerate the parsers:

```bash
# Install tree-sitter CLI
npm install -g tree-sitter-cli

# Regenerate all three grammars
pnpm generate

# Or regenerate individually
cd csv && tree-sitter generate
cd psv && tree-sitter generate
cd tsv && tree-sitter generate
```

## License

MIT
