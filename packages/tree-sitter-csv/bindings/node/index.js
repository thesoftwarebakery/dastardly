const binding = require('node-gyp-build')(__dirname + '/../..');

// Add nodeTypeInfo to wrapper objects for tree-sitter 0.21+
// tree-sitter will add nodeSubclasses to these wrapper objects
try {
  binding.csv.nodeTypeInfo = require('../../csv/src/node-types.json');
  binding.psv.nodeTypeInfo = require('../../psv/src/node-types.json');
  binding.tsv.nodeTypeInfo = require('../../tsv/src/node-types.json');
} catch (_) {}

// Export wrapper objects (each contains .language External)
module.exports = binding;
