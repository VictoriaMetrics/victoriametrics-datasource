import { extractMetricSelectors } from './utils';

describe('extractMetricSelectors', () => {
  it('should return empty array for empty string', () => {
    expect(extractMetricSelectors('')).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    expect(extractMetricSelectors('   ')).toEqual([]);
  });

  it('should return empty array for expression without vector selectors', () => {
    expect(extractMetricSelectors('1 + 2')).toEqual([]);
  });

  it('should extract single metric name', () => {
    expect(extractMetricSelectors('http_requests_total')).toEqual([
      { selector: 'http_requests_total', metric: 'http_requests_total' },
    ]);
  });

  it('should extract metric with labels', () => {
    expect(extractMetricSelectors('http_requests_total{job="api"}')).toEqual([
      { selector: 'http_requests_total{job="api"}', metric: 'http_requests_total' },
    ]);
  });

  it('should extract metric with multiple labels', () => {
    expect(extractMetricSelectors('http_requests_total{job="api", instance=~".*:8080"}')).toEqual([
      { selector: 'http_requests_total{job="api", instance=~".*:8080"}', metric: 'http_requests_total' },
    ]);
  });

  it('should extract metric from rate function', () => {
    expect(extractMetricSelectors('rate(http_requests_total[5m])')).toEqual([
      { selector: 'http_requests_total', metric: 'http_requests_total' },
    ]);
  });

  it('should extract metric with labels from rate function', () => {
    expect(extractMetricSelectors('rate(http_requests_total{job="api"}[5m])')).toEqual([
      { selector: 'http_requests_total{job="api"}', metric: 'http_requests_total' },
    ]);
  });

  it('should extract metric from nested functions', () => {
    expect(extractMetricSelectors('sum(rate(http_requests_total{job="api"}[5m]))')).toEqual([
      { selector: 'http_requests_total{job="api"}', metric: 'http_requests_total' },
    ]);
  });

  it('should extract two selectors from binary expression', () => {
    const result = extractMetricSelectors('metric_a{foo="bar"} + metric_b{baz="qux"}');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ selector: 'metric_a{foo="bar"}', metric: 'metric_a' });
    expect(result[1]).toEqual({ selector: 'metric_b{baz="qux"}', metric: 'metric_b' });
  });

  it('should extract two selectors from complex division expression', () => {
    const result = extractMetricSelectors('sum(rate(a{x="1"}[5m])) / sum(rate(b{y="2"}[5m]))');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ selector: 'a{x="1"}', metric: 'a' });
    expect(result[1]).toEqual({ selector: 'b{y="2"}', metric: 'b' });
  });

  it('should deduplicate identical selectors', () => {
    const result = extractMetricSelectors('metric_a + metric_a');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ selector: 'metric_a', metric: 'metric_a' });
  });

  it('should deduplicate identical selectors with labels', () => {
    const result = extractMetricSelectors('rate(foo{bar="baz"}[5m]) + rate(foo{bar="baz"}[1m])');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ selector: 'foo{bar="baz"}', metric: 'foo' });
  });

  it('should extract label-only selector with empty metric', () => {
    const result = extractMetricSelectors('{job="api"}');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ selector: '{job="api"}', metric: '' });
  });

  it('should handle aggregation with by clause', () => {
    expect(extractMetricSelectors('sum by (job) (http_requests_total)')).toEqual([
      { selector: 'http_requests_total', metric: 'http_requests_total' },
    ]);
  });

  it('should extract multiple different selectors from complex expression', () => {
    const result = extractMetricSelectors(
      'sum(rate(requests_total{job="api"}[5m])) / ignoring(job) sum(rate(errors_total{job="api"}[5m]))'
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ selector: 'requests_total{job="api"}', metric: 'requests_total' });
    expect(result[1]).toEqual({ selector: 'errors_total{job="api"}', metric: 'errors_total' });
  });

  it('should handle metric with colon in name', () => {
    expect(extractMetricSelectors('foo:metric:rate1m')).toEqual([
      { selector: 'foo:metric:rate1m', metric: 'foo:metric:rate1m' },
    ]);
  });

  it('should handle metric comparison with scalar', () => {
    const result = extractMetricSelectors('metric > 0.001');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ selector: 'metric', metric: 'metric' });
  });
});
