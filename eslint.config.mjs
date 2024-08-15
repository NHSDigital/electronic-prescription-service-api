import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import eslintJsPlugin from "@eslint/js";
import importNewlines from "eslint-plugin-import-newlines";

const commonConfig = {
  plugins: {
    "@typescript-eslint": tsPlugin,
    "import-newlines": importNewlines,
  },
  rules: {
    ...tsPlugin.configs.recommended.rules,
    "@typescript-eslint/array-type": [
      "error",
      {
        default: "generic",
      },
    ],

    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "never",
      },
    ],

    "block-spacing": "error",
    "brace-style": ["error", "1tbs"],
    "comma-dangle": ["error", "never"],

    "comma-spacing": [
      "error",
      {
        before: false,
        after: true,
      },
    ],

    "dot-location": ["error", "property"],
    "eol-last": ["error", "always"],
    eqeqeq: "error",
    "func-call-spacing": "error",

    "func-style": [
      "error",
      "declaration",
      {
        allowArrowFunctions: true,
      },
    ],

    "import-newlines/enforce": [
      "error",
      {
        items: 3,
        "max-len": 120,
        semi: false,
      },
    ],

    indent: [
      "error",
      2,
      {
        SwitchCase: 1,
      },
    ],

    "max-len": ["error", 120],
    "no-multi-spaces": "error",

    "no-multiple-empty-lines": [
      "error",
      {
        max: 1,
      },
    ],

    "no-trailing-spaces": "error",
    "object-curly-spacing": ["error", "never"],

    quotes: [
      "error",
      "double",
      {
        allowTemplateLiterals: true,
        avoidEscape: true,
      },
    ],

    semi: ["error", "never"],
  },
};

export default [
  {
    ignores: ["**/lib/*", "**/coverage/*", "**/dist/**"],
  },
  {
    rules: eslintJsPlugin.configs.recommended.rules,
  },
  {
    files: ["**/*.ts"],

    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
    ...commonConfig,
  },
  {
    files: ["**/tests/**/*.ts", "**/specs/**/*.ts", "**/step_definitions/**/*.ts", "**/*.spec.ts", "helpers.ts", "live.test.ts", "sandbox.test.ts"],

    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    ...commonConfig,
  },
];
