import tsParser from '@typescript-eslint/parser'

export default [
  {
    languageOptions: {
      parser: tsParser,
    }
  },
  {
    files: [
      "**/*.ts",
      "**/*.cts",
      "**.*.mts"
    ]
  }];
