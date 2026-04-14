// This is intentionally the OLD (v9-era) eslint config format that pepr init generated
// before the eslint v10 migration. It uses FlatCompat + __dirname. The migration test
// verifies that pepr format passes with both eslint v9 (old pepr) and eslint v10 (new pepr).
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/node_modules", "**/dist"],
  },
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs"],
        },
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
];
