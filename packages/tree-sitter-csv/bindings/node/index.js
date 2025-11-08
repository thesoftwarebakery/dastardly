const binding = require('node-gyp-build')(__dirname + '/../..');

try {
  binding.csv.nodeTypeInfo = require('../../csv/src/node-types.json');
  binding.tsv.nodeTypeInfo = require('../../tsv/src/node-types.json');
  binding.psv.nodeTypeInfo = require('../../psv/src/node-types.json');
} catch (_) {}

module.exports = binding;
