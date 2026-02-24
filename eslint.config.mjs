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

// Simple function to force all rules to be warnings regardless of their original configuration
function forceWarnings(config) {
    // Deep clone the config to avoid modifying the original
    const newConfig = { ...config };
    
    // Function to process rules recursively
    function processRules(rules) {
        if (!rules) return {};
        
        const processedRules = {};
        for (const [key, value] of Object.entries(rules)) {
            if (value === "error" || value === 2) {
                processedRules[key] = "warn";
            } else if (Array.isArray(value) && (value[0] === "error" || value[0] === 2)) {
                processedRules[key] = ["warn", ...value.slice(1)];
            } else {
                processedRules[key] = value;
            }
        }
        return processedRules;
    }
    
    // Process rules in the config
    if (newConfig.rules) {
        newConfig.rules = processRules(newConfig.rules);
    }
    
    return newConfig;
};

// Get the base configs but transform them to ensure all rules are warnings
const baseConfigs = compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended")
    .map(config => forceWarnings(config));

export default defineConfig([globalIgnores(["**/node_modules", "**/dist", "**/eslint.config.mjs", ".github/workflows/matrix.js"]), 
    // Apply the modified configurations with all rules as warnings
    ...baseConfigs,
    // Additional specific configuration
    {    
    linterOptions: {
        reportUnusedDisableDirectives: "warn",
    },

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
            project: ["eslint.tsconfig.json"],
        },
    },

    // Additional specific rule configurations - all set to warn
    rules: {
        "@typescript-eslint/no-floating-promises": "warn",
        "class-methods-use-this": "warn",

        complexity: ["warn", {
            max: 10,
        }],

        "consistent-this": "warn",
        eqeqeq: "warn",

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
