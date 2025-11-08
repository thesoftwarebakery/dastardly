#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_csv();
extern "C" TSLanguage *tree_sitter_psv();
extern "C" TSLanguage *tree_sitter_tsv();

// "tree-sitter", "language" hashed with BLAKE2
const napi_type_tag LANGUAGE_TYPE_TAG = {
    0x8AF2E5212AD58ABF, 0xD5006CAD83ABBA16
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // CSV grammar - wrap in object so tree-sitter can add nodeSubclasses
    auto csv_language = Napi::External<TSLanguage>::New(env, tree_sitter_csv());
    csv_language.TypeTag(&LANGUAGE_TYPE_TAG);
    auto csv_obj = Napi::Object::New(env);
    csv_obj["language"] = csv_language;
    exports["csv"] = csv_obj;

    // PSV grammar
    auto psv_language = Napi::External<TSLanguage>::New(env, tree_sitter_psv());
    psv_language.TypeTag(&LANGUAGE_TYPE_TAG);
    auto psv_obj = Napi::Object::New(env);
    psv_obj["language"] = psv_language;
    exports["psv"] = psv_obj;

    // TSV grammar
    auto tsv_language = Napi::External<TSLanguage>::New(env, tree_sitter_tsv());
    tsv_language.TypeTag(&LANGUAGE_TYPE_TAG);
    auto tsv_obj = Napi::Object::New(env);
    tsv_obj["language"] = tsv_language;
    exports["tsv"] = tsv_obj;

    return exports;
}

NODE_API_MODULE(tree_sitter_csv_binding, Init)
