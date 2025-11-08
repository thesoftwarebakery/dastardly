{
  "targets": [
    {
      "target_name": "tree_sitter_csv_binding",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "csv/src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "csv/src/parser.c",
        "psv/src/parser.c",
        "tsv/src/parser.c",
      ],
      "cflags_c": [
        "-std=c99",
      ],
      "defines": [
        "NAPI_VERSION=8",
        "NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
