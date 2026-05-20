import { buildSelector, SelectableLabel } from './PrometheusMetricsBrowser';

const metric = (name: string): SelectableLabel => ({
  name: '__name__',
  selected: true,
  values: [{ name, selected: true }],
});

const label = (name: string, value: string): SelectableLabel => ({
  name,
  selected: true,
  values: [{ name: value, selected: true }],
});

describe('buildSelector', () => {
  it('builds a bare-metric selector for a plain identifier', () => {
    expect(buildSelector([metric('http_requests_total')])).toBe('http_requests_total{}');
  });

  it('builds a label-only selector when no metric is selected', () => {
    expect(buildSelector([label('job', 'api')])).toBe('{job="api"}');
  });

  it('wraps metric names with non-identifier characters into __name__="..." matcher', () => {
    expect(buildSelector([metric('CellTemp(1)[°C]'), label('station', 'Solvallen2')])).toBe(
      '{__name__="CellTemp(1)[°C]",station="Solvallen2"}'
    );
  });

  it('keeps plain metric names as a bare prefix even with labels', () => {
    expect(buildSelector([metric('http_requests_total'), label('job', 'api')])).toBe(
      'http_requests_total{job="api"}'
    );
  });

  it('wraps metric names containing a dot', () => {
    expect(buildSelector([metric('my.metric.name')])).toBe('{__name__="my.metric.name"}');
  });

  it('escapes embedded quotes in metric names inside __name__ matcher', () => {
    expect(buildSelector([metric('weird"name')])).toBe('{__name__="weird\\"name"}');
  });
});
