import rootConfig from "../../eslint.config.mjs"; // Load your root config

export default [
  ...rootConfig,
  {
    files: ["**/*.ts", "**/*.js"],
    rules: {
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
