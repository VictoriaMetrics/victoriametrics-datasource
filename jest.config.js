// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

// @react-hookz/web and @ver0/deep-equal are provided by .config/jest/utils.js since create-plugin 7.10.1
grafanaESModules.push('monaco-promql');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  testTimeout: 300000,
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'packageName'])],
};
