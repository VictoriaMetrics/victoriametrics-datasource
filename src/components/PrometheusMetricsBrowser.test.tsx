import { buildSelector, SelectableLabel } from './PrometheusMetricsBrowser';

describe('buildSelector', () => {
  it('should wrap special-char metric names in __name__="..." form', () => {
    // Metric names like 'CellTemp(1)[°C]' contain characters outside
    // [a-zA-Z_:][a-zA-Z0-9_:]* and cannot be the leading identifier of a
    // PromQL selector — they must be expressed via __name__ instead.
    const labels: SelectableLabel[] = [
      {
        name: '__name__',
        values: [{ name: 'CellTemp(1)[°C]', selected: true }],
      },
      {
        name: 'station',
        selected: true,
        values: [{ name: 'Moon', selected: true }],
      },
    ];

    expect(buildSelector(labels)).toBe('{__name__="CellTemp(1)[°C]",station="Moon"}');
  });

  it('should keep regular metric names as the leading identifier', () => {
    const labels: SelectableLabel[] = [
      {
        name: '__name__',
        values: [{ name: 'http_requests_total', selected: true }],
      },
      {
        name: 'job',
        selected: true,
        values: [{ name: 'api', selected: true }],
      },
    ];

    expect(buildSelector(labels)).toBe('http_requests_total{job="api"}');
  });

  it('should keep colon-namespaced metric names as leading identifier', () => {
    const labels: SelectableLabel[] = [
      {
        name: '__name__',
        values: [{ name: 'foo:bar:rate1m', selected: true }],
      },
    ];

    expect(buildSelector(labels)).toBe('foo:bar:rate1m{}');
  });

  it('should produce a label-only selector when no metric is selected', () => {
    const labels: SelectableLabel[] = [
      {
        name: 'station',
        selected: true,
        values: [{ name: 'Moon', selected: true }],
      },
    ];

    expect(buildSelector(labels)).toBe('{station="Moon"}');
  });

  it('should escape quotes inside special-char metric names', () => {
    const labels: SelectableLabel[] = [
      {
        name: '__name__',
        values: [{ name: 'weird"name', selected: true }],
      },
    ];

    expect(buildSelector(labels)).toBe('{__name__="weird\\"name"}');
  });
});
