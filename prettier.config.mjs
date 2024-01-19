/**
 * - https://github.com/prettier/prettier/issues/15942
 * - https://github.com/prettier/prettier/issues/15956
 */
export default {
  overrides: [
    {
      files: ["tsconfig*.json"],
      options: {
        parser: "json",
      },
    },
  ],
};
