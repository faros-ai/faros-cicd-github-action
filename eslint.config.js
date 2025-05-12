const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "simple-import-sort": simpleImportSort,
    },

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ),

    rules: {
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/no-use-before-define": "off",

        "no-restricted-globals": [
            "error",
            "closed",
            "event",
            "fdescribe",
            "length",
            "location",
            "name",
            "parent",
            "top",
        ],

        "simple-import-sort/imports": "error",
    },
}, globalIgnores([
    "bin/",
    "lib/",
    "out/",
    "**/dist/",
    "**/lib/",
    "**/node_modules/",
    "**/jest.config.js",
]), {
    files: ["test/**/*.ts"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
    },
}]);
