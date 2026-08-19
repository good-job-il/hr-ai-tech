import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "uploads/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // Always require braces for if / else / for / while
      curly: ["error", "all"],

      "brace-style": [
        "error",
        "1tbs",
        {
          allowSingleLine: false,
        },
      ],

      // Require blank lines between logical blocks
      "padding-line-between-statements": [
        "error",

        // Allow consecutive variable declarations without blank lines
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },

        // Add a blank line after variable declarations
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },

        // Add a blank line between an expression and a variable declaration
        {
          blankLine: "always",
          prev: "expression",
          next: ["const", "let", "var"],
        },

        // Add a blank line before control-flow blocks
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "switch", "try"],
        },

        // Add a blank line after control-flow blocks
        {
          blankLine: "always",
          prev: ["if", "for", "while", "switch", "try"],
          next: "*",
        },

        // Add a blank line before return
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
      ],
    },
  },
]
