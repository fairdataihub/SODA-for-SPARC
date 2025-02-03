import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: { ...globals.browser, $: "readonly" },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  pluginJs.configs.recommended,
];
