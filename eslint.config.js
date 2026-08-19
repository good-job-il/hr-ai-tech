import globals from "globals"
import pluginJs from "@eslint/js"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import pluginUnusedImports from "eslint-plugin-unused-imports"

export default [
  {
    ignores: ["backend/**", "coverage/**", "dist/**", "node_modules/**", "public/**"],
  },

  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],

    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    ...pluginReact.configs.flat["jsx-runtime"],

    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },

    rules: {
      "no-unused-vars": "off",

      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      "react/jsx-newline": [
        "error",
        {
          prevent: false,
        },
      ],

      "react/jsx-one-expression-per-line": "off",

      "react/prop-types": "off",

      "react/no-unknown-property": [
        "error",
        {
          ignore: ["cmdk-input-wrapper", "toast-close"],
        },
      ],

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Require {} for if / else / for / while
      curly: ["error", "all"],

      // Don't allow single-line blocks
      "brace-style": [
        "error",
        "1tbs",
        {
          allowSingleLine: false,
        },
      ],

      // Blank lines between logical blocks
      "padding-line-between-statements": [
        "error",

        // Consecutive variable declarations may stay together
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },

        // Blank line after variable declarations
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },

        // expression -> variable declaration
        {
          blankLine: "always",
          prev: "expression",
          next: ["const", "let", "var"],
        },

        // Before control flow
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "for", "while", "switch", "try"],
        },

        // After control flow
        {
          blankLine: "always",
          prev: ["if", "for", "while", "switch", "try"],
          next: "*",
        },

        // Before return
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
      ],
    },
  },
]
