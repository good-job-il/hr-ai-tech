module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-refresh'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // Enforce absolute imports
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../*', '../*'],
            message: 'Please use absolute imports from @/ instead of relative imports',
          },
        ],
      },
    ],

    // Prevent relative imports deeper than 2 levels
    'no-relative-imports': [
      'error',
      {
        maxDepth: 2,
        message: 'Relative imports should not go deeper than 2 levels',
      },
    ],

    // Prevent cross-feature imports
    'no-restricted-paths': [
      'warn',
      {
        zones: [
          // Each feature can only import from within itself or from shared/
          {
            target: 'src/features/*',
            from: 'src/features/*',
            except: ['.'],
            message: 'Cross-feature imports are not allowed. Use barrel exports.',
          },
        ],
      },
    ],

    // No inline styles
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXAttribute[name.name="style"]',
        message: 'Inline styles are forbidden. Use Tailwind CSS classes instead.',
      },
    ],

    // No console.log in production
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // No unused variables
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // Enforce proper imports
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Best practices
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'object-shorthand': 'warn',

    // Import ordering (enforce via eslint-plugin-import if added)
    'sort-imports': [
      'warn',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
  },

  overrides: [
    {
      files: ['src/features/**/index.ts', 'src/features/**/index.js'],
      rules: {
        'no-restricted-exports': 'off',
      },
    },
  ],
};