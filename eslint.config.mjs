import stylistic from '@stylistic/eslint-plugin';
import {defineConfig} from 'eslint/config';
import grafanaEslintConfig from '@grafana/eslint-config/flat.js';
import react from 'eslint-plugin-react';
import jest from 'eslint-plugin-jest';
import lodash from 'eslint-plugin-lodash';
import prettier from 'eslint-config-prettier';
import * as emotionPlugin from '@emotion/eslint-plugin';
import {fixupPluginRules} from "@eslint/compat";
import importPlugin from 'eslint-plugin-import-x';

export default defineConfig([
  grafanaEslintConfig,
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
      'react': react,
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
        project: './tsconfig.json',
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
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Disable new react-hooks v7 rules to keep existing behavior
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/void-use-memo': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
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
