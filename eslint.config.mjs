import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/node_modules", "**/dist"]), {
    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
        },

        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json"],
        },
    },

    rules: {
        "@typescript-eslint/no-floating-promises": "warn",
        "class-methods-use-this": "warn",

        complexity: ["warn", {
            max: 10,
        }],

        "consistent-this": "warn",
        eqeqeq: "error",

        "max-depth": ["warn", {
            max: 3,
        }],

        "max-nested-callbacks": ["warn", {
            max: 4,
        }],

        "max-params": ["warn", {
            max: 4,
        }],

        "max-statements": ["warn", {
            max: 20,
        }, {
            ignoreTopLevelFunctions: true,
        }],

        "no-invalid-this": "warn",
    },
}]);