/**
 * Based from
 * - [Vite `react-ts` template](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/.eslintrc.cjs)
 * - [`typescript-eslint` Getting Started page](https://typescript-eslint.io/getting-started/)
 *
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  env: {
    // browser: true, es2020: true

    /**
     * Tells ESLint about the existence of the global `module` variable
     * (used in exporting this config)
     */
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    // "plugin:react-hooks/recommended",
  ],
  ignorePatterns: [
    // "dist", ".eslintrc.cjs"
    "bin/",
  ],
  parser: "@typescript-eslint/parser",
  plugins: [
    // "react-refresh",
    "@typescript-eslint",
  ],
  rules: {
    // "react-refresh/only-export-components": [
    //   "warn",
    //   { allowConstantExport: true },
    // ],

    /**
     * Because of the way Express midlewares are defined,
     * it is possible for some arguments to be unused.
     *
     * However this can be useful for finding unused imports,
     * in which case this rule can be manually enabled, e.g. via the CLI.
     */
    "@typescript-eslint/no-unused-vars": "off",
  },
};
