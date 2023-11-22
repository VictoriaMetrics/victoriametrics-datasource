module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  testTimeout: 300000,
  transformIgnorePatterns: [
    "node_modules/(?!(d3-color|d3-interpolate|monaco-promql|ol)/)"
  ],
};
