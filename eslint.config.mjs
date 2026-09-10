import stylistic from '@stylistic/eslint-plugin';
import {defineConfig} from 'eslint/config';
import grafanaEslintConfig from '@grafana/eslint-config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jest from 'eslint-plugin-jest';
import lodash from 'eslint-plugin-lodash';
import prettier from 'eslint-config-prettier';
import * as emotionPlugin from '@emotion/eslint-plugin';
import {fixupPluginRules} from "@eslint/compat";
import importPlugin from 'eslint-plugin-import-x';

// eslint-plugin-react 7.x still relies on context APIs removed in ESLint 10,
// so wrap only that plugin (including the instance registered by @grafana/eslint-config).
const reactCompat = fixupPluginRules(react);

// Switch off every rule the plugin ships - including the ones @grafana/eslint-config does not
// enable today - so a plugin release cannot turn new rules on here unnoticed. Derived from the
// plugin instead of hand-listed, because eslint-plugin-react-hooks@7 alone added a dozen rules.
// The two rules this project does enforce are re-enabled explicitly in `rules` below.
const reactHooksRulesOff = Object.fromEntries(
  Object.keys(reactHooks.rules).map((rule) => [`react-hooks/${rule}`, 'off'])
);
const grafanaConfig = grafanaEslintConfig.map((config) =>
  config.plugins?.react ? { ...config, plugins: { ...config.plugins, react: reactCompat } } : config
);

export default defineConfig([
  ...grafanaConfig,
  prettier,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.yarn/**',
      '**/.cache/**',
      '**/.config/**',
      '**/vendor/**',
      '**/pkg/**',
      '**/plugins/**',
      '**/bin/**',
      '**/*.min.js',
      '**/packages/**',
      '.prettierrc.js',
      'webpack.config.ts',
      'jest.config.js',
      'jest-setup.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react': reactCompat,
      'jest': jest,
      'lodash': lodash,
      '@emotion': fixupPluginRules(emotionPlugin),
      'import-x': importPlugin,
      '@stylistic': stylistic,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },


    rules: {
      ...reactHooksRulesOff,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        enableAutofixRemoval: { imports: true }
      }],
      'no-console': ['warn', {allow: ['warn', 'error']}],
      "react/prop-types": "off",
      "@emotion/jsx-import": "error",
      "object-curly-spacing": [2, "always"],
      "lodash/import-scope": [2, "member"],
      "jest/no-focused-tests": "error",
      "@typescript-eslint/array-type": 0,
      "no-useless-escape": 0,
      "no-prototype-builtins": 0,
      '@stylistic/indent': ['error', 2, {
        'SwitchCase': 1,
        'FunctionDeclaration': {'parameters': 'first'},
        'FunctionExpression': {'parameters': 'first'},
        'CallExpression': {'arguments': 1},
        'ObjectExpression': 'first',
        'ignoredNodes': [
          'TSTypeAnnotation *',
        ],
      }],
      '@stylistic/jsx-max-props-per-line': ['error', {
        maximum: 1,
        when: 'multiline'
      }],
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
      '@stylistic/jsx-closing-bracket-location': ['error', 'tag-aligned'],
      "import-x/order": [
        "error",
        {
          "groups": [["builtin", "external"], "internal", "parent", "sibling", "index"],
          'pathGroups': [
            {
              pattern: '@grafana/**',
              group: 'external',
              position: 'after'
            }
          ],
          'pathGroupsExcludedImportTypes': ['react', 'react-dom'],
          "newlines-between": "always",
          "alphabetize": {"order": "asc"}
        }
      ],
      'react/jsx-tag-spacing': ['error', {beforeSelfClosing: 'always'}],
      'jsx-quotes': ['error', 'prefer-single'],
      quotes: ['error', 'single', {avoidEscape: true}],

      // Use typescript's no-redeclare for compatibility with overrides
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": ["error"]
    },
  },

  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**'],
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
