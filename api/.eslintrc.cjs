/**
 * Based from
 * - [Vite `react-ts` template](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/.eslintrc.cjs)
 * - [`typescript-eslint` Getting Started page](https://typescript-eslint.io/getting-started/)
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
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: [
    // "react-refresh",
    "@typescript-eslint",
  ],
  // rules: {
  //   "react-refresh/only-export-components": [
  //     "warn",
  //     { allowConstantExport: true },
  //   ],
  // },
};
