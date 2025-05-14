import tsParser from '@typescript-eslint/parser'

export default [
  {
    languageOptions: {
      parser: tsParser,
    }
  },
  {
    files: [
      "**/capabilities/**/*.cts",
      "**/capabilities/**/*.mts",
      "**/capabilities/**/*.ts",
      "**/pepr.cts",
      "**/pepr.mts",
      "**/pepr.ts",
      "**/src/**/*.cts",
      "**/src/**/*.mts",
      "**/src/**/*.ts",
      "_helpers/**/*.cts",
      "_helpers/**/*.mts",
      "_helpers/**/*.ts",
    ]
  }];
