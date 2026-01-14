import { defineConfig } from 'eslint/config';
import grafanaConfig from '@grafana/eslint-config/flat.js';
import emotion from '@emotion/eslint-plugin';
import lodash from 'eslint-plugin-lodash';
import jest from 'eslint-plugin-jest';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig([
  {
    ignores: [
      '**/.git',
      '**/.github',
      '**/.yarn',
      '**/build',
      '**/compiled',
      '**/data',
      '**/deployment_tools_config.json',
      '**/devenv',
      '**/dist',
      'e2e/tmp',
      '**/node_modules',
      '**/pkg',
      'public/lib/monaco',
      'scripts/grafana-server/tmp',
      '**/vendor',
      '**/*.gen.ts',
      'public/locales/_build/',
      'public/locales/**/*.js',
      'packages/grafana-ui/src/components/Icon/iconBundle.ts',
      'src/components/monaco-query-field/monaco-completion-provider/situation.ts',
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/node_modules/',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/bin/',
      '**/dist/',
      '**/victoriametrics-datasource/',
      '**/plugins/',
      '**/artifacts/',
      '**/work/',
      '**/ci/',
      '**/e2e-results/',
      'packages/lezer-metricsql/src/parser.js',
      'packages/lezer-metricsql/src/parser.terms.js',
      '**/.idea',
      '**/.vscode',
      '**/.npm',
      '**/.eslintcache',
      'cypress/report.json',
      'cypress/videos',
      '**/.cache',
      '**/gocache-for-docker',
    ],
  },
  ...grafanaConfig,
  {
    plugins: {
      '@emotion': emotion,
      lodash: lodash,
      jest: jest,
      import: importPlugin,
      'unused-imports': unusedImports,
    },

    rules: {
      'unused-imports/no-unused-imports': 'error',
      'react/prop-types': 'off',
      '@emotion/jsx-import': 'error',
      'object-curly-spacing': [2, 'always'],
      'lodash/import-scope': [2, 'member'],
      'jest/no-focused-tests': 'error',
      '@typescript-eslint/array-type': 0,

      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
          },
        },
      ],

      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error'],
    },

    settings: {
      'import/internal-regex': '^(src/)|(@grafana)',
      'import/external-module-folders': ['node_modules', '.yarn'],
    },
  },
]);
