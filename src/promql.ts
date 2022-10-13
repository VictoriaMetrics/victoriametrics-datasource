import { Grammar } from 'prismjs';

import { CompletionItem } from '@grafana/ui';


// When changing RATE_RANGES, check if Loki/LogQL ranges should be changed too
export const RATE_RANGES: CompletionItem[] = [
  { label: '$__interval', sortValue: '$__interval' },
  { label: '$__rate_interval', sortValue: '$__rate_interval' },
  { label: '$__range', sortValue: '$__range' },
  { label: '1m', sortValue: '00:01:00' },
  { label: '5m', sortValue: '00:05:00' },
  { label: '10m', sortValue: '00:10:00' },
  { label: '30m', sortValue: '00:30:00' },
  { label: '1h', sortValue: '01:00:00' },
  { label: '1d', sortValue: '24:00:00' },
];

export const OPERATORS = ['by', 'group_left', 'group_right', 'ignoring', 'on', 'offset', 'without'];
export const LOGICAL_OPERATORS = ['or', 'and', 'unless'];

const ROLLUP_FUNCTIONS: CompletionItem[] = [
  {
    label: 'absent_over_time',
    insertText: 'absent_over_time',
    detail: 'absent_over_time(series_selector[d])',
    documentation: 'returns 1 if the given lookbehind window `d` doesn\'t contain raw samples. Otherwise it returns an empty result. See also `present_over_time`.'
  },
  {
    label: 'aggr_over_time',
    insertText: 'aggr_over_time',
    detail: 'aggr_over_time(("rollup_func1", "rollup_func2", ...), series_selector[d])',
    documentation: 'calculates all the listed `rollup_func*` for raw samples on the given lookbehind window `d`. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). `rollup_func*` can contain any rollup function. For instance, `aggr_over_time(("min_over_time", "max_over_time", "rate"), m[d])` would calculate `min_over_time` for `m[d]`.'
  },
  {
    label: 'ascent_over_time',
    insertText: 'ascent_over_time',
    detail: 'ascent_over_time(series_selector[d])',
    documentation: 'calculates ascent of raw sample values on the given lookbehind window `d`. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Useful for tracking height gains in GPS tracking. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'avg_over_time',
    insertText: 'avg_over_time',
    detail: 'avg_over_time(series_selector[d])',
    documentation: 'calculates the average value over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `median_over_time`.'
  },
  {
    label: 'changes',
    insertText: 'changes',
    detail: 'changes(series_selector[d])',
    documentation: 'calculates the number of times the raw samples changed on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Unlike `changes()` in Prometheus it takes into account the change from the last sample before the given lookbehind window `d`. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'changes_prometheus',
    insertText: 'changes_prometheus',
    detail: 'changes_prometheus(series_selector[d])',
    documentation: 'calculates the number of times the raw samples changed on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It doesn\'t take into account the change from the last sample before the given lookbehind window `d` in the same way as Prometheus does. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'count_eq_over_time',
    insertText: 'count_eq_over_time',
    detail: 'count_eq_over_time(series_selector[d], eq)',
    documentation: 'calculates the number of raw samples on the given lookbehind window `d`, which are equal to `eq`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'count_gt_over_time',
    insertText: 'count_gt_over_time',
    detail: 'count_gt_over_time(series_selector[d], gt)',
    documentation: 'calculates the number of raw samples on the given lookbehind window `d`, which are bigger than `gt`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'count_le_over_time',
    insertText: 'count_le_over_time',
    detail: 'count_le_over_time(series_selector[d], le)',
    documentation: 'calculates the number of raw samples on the given lookbehind window `d`, which don\'t exceed `le`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'count_ne_over_time',
    insertText: 'count_ne_over_time',
    detail: 'count_ne_over_time(series_selector[d], ne)',
    documentation: 'calculates the number of raw samples on the given lookbehind window `d`, which aren\'t equal to `ne`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'count_over_time',
    insertText: 'count_over_time',
    detail: 'count_over_time(series_selector[d])',
    documentation: 'calculates the number of raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'decreases_over_time',
    insertText: 'decreases_over_time',
    detail: 'decreases_over_time(series_selector[d])',
    documentation: 'calculates the number of raw sample value decreases over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'default_rollup',
    insertText: 'default_rollup',
    detail: 'default_rollup(series_selector[d])',
    documentation: 'returns the last raw sample value on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering).'
  },
  {
    label: 'delta',
    insertText: 'delta',
    detail: 'delta(series_selector[d])',
    documentation: 'calculates the difference between the last sample before the given lookbehind window `d` and the last sample at the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The behaviour of `delta()` function in MetricsQL is slightly different to the behaviour of `delta()` function in Prometheus. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'delta_prometheus',
    insertText: 'delta_prometheus',
    detail: 'delta_prometheus(series_selector[d])',
    documentation: 'calculates the difference between the first and the last samples at the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The behaviour of `delta_prometheus()` is close to the behaviour of `delta()` function in Prometheus. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'deriv',
    insertText: 'deriv',
    detail: 'deriv(series_selector[d])',
    documentation: 'calculates per-second derivative over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The derivative is calculated using linear regression. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'deriv_fast',
    insertText: 'deriv_fast',
    detail: 'deriv_fast(series_selector[d])',
    documentation: 'calculates per-second derivative using the first and the last raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'descent_over_time',
    insertText: 'descent_over_time',
    detail: 'descent_over_time(series_selector[d])',
    documentation: 'calculates descent of raw sample values on the given lookbehind window `d`. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Useful for tracking height loss in GPS tracking. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'distinct_over_time',
    insertText: 'distinct_over_time',
    detail: 'distinct_over_time(series_selector[d])',
    documentation: 'returns the number of distinct raw sample values on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'duration_over_time',
    insertText: 'duration_over_time',
    detail: 'duration_over_time(series_selector[d], max_interval)',
    documentation: 'returns the duration in seconds when time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering) were present over the given lookbehind window `d`. It is expected that intervals between adjacent samples per each series don\'t exceed the `max_interval`. Otherwise such intervals are considered as gaps and aren\'t counted. See also `lifetime`.'
  },
  {
    label: 'first_over_time',
    insertText: 'first_over_time',
    detail: 'first_over_time(series_selector[d])',
    documentation: 'returns the first raw sample value on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `last_over_time`.'
  },
  {
    label: 'geomean_over_time',
    insertText: 'geomean_over_time',
    detail: 'geomean_over_time(series_selector[d])',
    documentation: 'calculates [geometric mean](https://en.wikipedia.org/wiki/Geometric_mean) over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'histogram_over_time',
    insertText: 'histogram_over_time',
    detail: 'histogram_over_time(series_selector[d])',
    documentation: 'calculates [VictoriaMetrics histogram](https://godoc.org/github.com/VictoriaMetrics/metrics#Histogram) over raw samples on the given lookbehind window `d`. It is calculated individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The resulting histograms are useful to pass to `histogram_quantile``.'
  },
  {
    label: 'hoeffding_bound_lower',
    insertText: 'hoeffding_bound_lower',
    detail: 'hoeffding_bound_lower(phi, series_selector[d])',
    documentation: 'calculates lower [Hoeffding bound](https://en.wikipedia.org/wiki/Hoeffding%27s_inequality) for the given `phi` in the range `[0...1]`. See also `hoeffding_bound_upper`.'
  },
  {
    label: 'hoeffding_bound_upper',
    insertText: 'hoeffding_bound_upper',
    detail: 'hoeffding_bound_upper(phi, series_selector[d])',
    documentation: 'calculates upper [Hoeffding bound](https://en.wikipedia.org/wiki/Hoeffding%27s_inequality) for the given `phi` in the range `[0...1]`. See also `hoeffding_bound_lower`.'
  },
  {
    label: 'holt_winters',
    insertText: 'holt_winters',
    detail: 'holt_winters(series_selector[d], sf, tf)',
    documentation: 'calculates Holt-Winters value (aka [double exponential smoothing](https://en.wikipedia.org/wiki/Exponential_smoothing#Double_exponential_smoothing)) for raw samples over the given lookbehind window `d` using the given smoothing factor `sf` and the given trend factor `tf`. Both `sf` and `tf` must be in the range `[0...1]`. It is expected that the [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering) returns time series of [gauge type](https://docs.victoriametrics.com/keyConcepts.html#gauge).'
  },
  {
    label: 'idelta',
    insertText: 'idelta',
    detail: 'idelta(series_selector[d])',
    documentation: 'calculates the difference between the last two raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'ideriv',
    insertText: 'ideriv',
    detail: 'ideriv(series_selector[d])',
    documentation: 'calculates the per-second derivative based on the last two raw samples over the given lookbehind window `d`. The derivative is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'increase',
    insertText: 'increase',
    detail: 'increase(series_selector[d])',
    documentation: 'calculates the increase over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that the `series_selector` returns time series of [counter type](https://docs.victoriametrics.com/keyConcepts.html#counter). Unlike Prometheus it takes into account the last sample before the given lookbehind window `d` when calculating the result. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'increase_prometheus',
    insertText: 'increase_prometheus',
    detail: 'increase_prometheus(series_selector[d])',
    documentation: 'calculates the increase over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that the `series_selector` returns time series of [counter type](https://docs.victoriametrics.com/keyConcepts.html#counter). It doesn\'t take into account the last sample before the given lookbehind window `d` when calculating the result in the same way as Prometheus does. See [this article](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e) for details. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'increase_pure',
    insertText: 'increase_pure',
    detail: 'increase_pure(series_selector[d])',
    documentation: 'works the same as `increase` ignores the first value in a series if it is too big.'
  },
  {
    label: 'increases_over_time',
    insertText: 'increases_over_time',
    detail: 'increases_over_time(series_selector[d])',
    documentation: 'calculates the number of raw sample value increases over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'integrate',
    insertText: 'integrate',
    detail: 'integrate(series_selector[d])',
    documentation: 'calculates the integral over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'irate',
    insertText: 'irate',
    detail: 'irate(series_selector[d])',
    documentation: 'calculates the "instant" per-second increase rate over the last two raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that the `series_selector` returns time series of [counter type](https://docs.victoriametrics.com/keyConcepts.html#counter). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'lag',
    insertText: 'lag',
    detail: 'lag(series_selector[d])',
    documentation: 'returns the duration in seconds between the last sample on the given lookbehind window `d` and the timestamp of the current point. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'last_over_time',
    insertText: 'last_over_time',
    detail: 'last_over_time(series_selector[d])',
    documentation: 'returns the last raw sample value on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `first_over_time`.'
  },
  {
    label: 'lifetime',
    insertText: 'lifetime',
    detail: 'lifetime(series_selector[d])',
    documentation: 'returns the duration in seconds between the last and the first sample on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'max_over_time',
    insertText: 'max_over_time',
    detail: 'max_over_time(series_selector[d])',
    documentation: 'calculates the maximum value over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `tmax_over_time`.'
  },
  {
    label: 'median_over_time',
    insertText: 'median_over_time',
    detail: 'median_over_time(series_selector[d])',
    documentation: 'calculates median value over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `avg_over_time`.'
  },
  {
    label: 'min_over_time',
    insertText: 'min_over_time',
    detail: 'min_over_time(series_selector[d])',
    documentation: 'calculates the minimum value over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). See also `tmin_over_time`.'
  },
  {
    label: 'mode_over_time',
    insertText: 'mode_over_time',
    detail: 'mode_over_time(series_selector[d])',
    documentation: 'calculates [mode](https://en.wikipedia.org/wiki/Mode_(statistics)) for raw samples on the given lookbehind window `d`. It is calculated individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that raw sample values are discrete.'
  },
  {
    label: 'predict_linear',
    insertText: 'predict_linear',
    detail: 'predict_linear(series_selector[d], t)',
    documentation: 'calculates the value `t` seconds in the future using linear interpolation over raw samples on the given lookbehind window `d`. The predicted value is calculated individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering).'
  },
  {
    label: 'present_over_time',
    insertText: 'present_over_time',
    detail: 'present_over_time(series_selector[d])',
    documentation: 'returns 1 if there is at least a single raw sample on the given lookbehind window `d`. Otherwise an empty result is returned. Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'quantile_over_time',
    insertText: 'quantile_over_time',
    detail: 'quantile_over_time(phi, series_selector[d])',
    documentation: 'calculates `phi`-quantile over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The `phi` value must be in the range `[0...1]`. See also `quantiles_over_time`.'
  },
  {
    label: 'quantiles_over_time',
    insertText: 'quantiles_over_time',
    detail: 'quantiles_over_time("phiLabel", phi1, ..., phiN, series_selector[d])',
    documentation: 'calculates `phi*`-quantiles over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). The function returns individual series per each `phi*` with `{phiLabel="phi*"}` label. `phi*` values must be in the range `[0...1]`. See also `quantile_over_time`.'
  },
  {
    label: 'range_over_time',
    insertText: 'range_over_time',
    detail: 'range_over_time(series_selector[d])',
    documentation: 'calculates value range over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). E.g. it calculates `max_over_time(series_selector[d]) - min_over_time(series_selector[d])`. Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'rate',
    insertText: 'rate',
    detail: 'rate(series_selector[d])',
    documentation: 'calculates the average per-second increase rate over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that the `series_selector` returns time series of [counter type](https://docs.victoriametrics.com/keyConcepts.html#counter). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'rate_over_sum',
    insertText: 'rate_over_sum',
    detail: 'rate_over_sum(series_selector[d])',
    documentation: 'calculates per-second rate over the sum of raw samples on the given lookbehind window `d`. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'resets',
    insertText: 'resets',
    detail: 'resets(series_selector[d])',
    documentation: 'returns the number of [counter](https://docs.victoriametrics.com/keyConcepts.html#counter) resets over the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). It is expected that the `series_selector` returns time series of [counter type](https://docs.victoriametrics.com/keyConcepts.html#counter). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'rollup',
    insertText: 'rollup',
    detail: 'rollup(series_selector[d])',
    documentation: 'calculates `min`, `max` and `avg` values for raw samples on the given lookbehind window `d`. These values are calculated individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering).'
  },
  {
    label: 'rollup_candlestick',
    insertText: 'rollup_candlestick',
    detail: 'rollup_candlestick(series_selector[d])',
    documentation: 'calculates `open`, `high`, `low` and `close` values (aka OHLC) over raw samples on the given lookbehind window `d`. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). This function is useful for financial applications.'
  },
  {
    label: 'rollup_delta',
    insertText: 'rollup_delta',
    detail: 'rollup_delta(series_selector[d])',
    documentation: 'calculates differences between adjacent raw samples on the given lookbehind window `d` and returns `min`, `max` and `avg` values for the calculated differences. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'rollup_deriv',
    insertText: 'rollup_deriv',
    detail: 'rollup_deriv(series_selector[d])',
    documentation: 'calculates per-second derivatives for adjacent raw samples on the given lookbehind window `d` and returns `min`, `max` and `avg` values for the calculated per-second derivatives. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'rollup_increase',
    insertText: 'rollup_increase',
    detail: 'rollup_increase(series_selector[d])',
    documentation: 'calculates increases for adjacent raw samples on the given lookbehind window `d` and returns `min`, `max` and `avg` values for the calculated increases. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'rollup_rate',
    insertText: 'rollup_rate',
    detail: 'rollup_rate(series_selector[d])',
    documentation: 'calculates per-second change rates for adjacent raw samples on the given lookbehind window `d` and returns `min`, `max` and `avg` values for the calculated per-second change rates. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'rollup_scrape_interval',
    insertText: 'rollup_scrape_interval',
    detail: 'rollup_scrape_interval(series_selector[d])',
    documentation: 'calculates the interval in seconds between adjacent raw samples on the given lookbehind window `d` and returns `min`, `max` and `avg` values for the calculated interval. The calculations are performed individually per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'scrape_interval',
    insertText: 'scrape_interval',
    detail: 'scrape_interval(series_selector[d])',
    documentation: 'calculates the average interval in seconds between raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'share_gt_over_time',
    insertText: 'share_gt_over_time',
    detail: 'share_gt_over_time(series_selector[d], gt)',
    documentation: 'returns share (in the range `[0...1]`) of raw samples on the given lookbehind window `d`, which are bigger than `gt`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'share_le_over_time',
    insertText: 'share_le_over_time',
    detail: 'share_le_over_time(series_selector[d], le)',
    documentation: 'returns share (in the range `[0...1]`) of raw samples on the given lookbehind window `d`, which are smaller or equal to `le`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'stale_samples_over_time',
    insertText: 'stale_samples_over_time',
    detail: 'stale_samples_over_time(series_selector[d])',
    documentation: 'calculates the number of [staleness markers](https://docs.victoriametrics.com/vmagent.html#prometheus-staleness-markers) on the given lookbehind window `d` per each time series matching the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'stddev_over_time',
    insertText: 'stddev_over_time',
    detail: 'stddev_over_time(series_selector[d])',
    documentation: 'calculates standard deviation over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'stdvar_over_time',
    insertText: 'stdvar_over_time',
    detail: 'stdvar_over_time(series_selector[d])',
    documentation: 'calculates standard variance over raw samples on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'sum_over_time',
    insertText: 'sum_over_time',
    detail: 'sum_over_time(series_selector[d])',
    documentation: 'calculates the sum of raw sample values on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'sum2_over_time',
    insertText: 'sum2_over_time',
    detail: 'sum2_over_time(series_selector[d])',
    documentation: 'calculates the sum of squares for raw sample values on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'timestamp',
    insertText: 'timestamp',
    detail: 'timestamp(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the last raw sample on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'timestamp_with_name',
    insertText: 'timestamp_with_name',
    detail: 'timestamp_with_name(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the last raw sample on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are preserved in the resulting rollups. See also `timestamp`.'
  },
  {
    label: 'tfirst_over_time',
    insertText: 'tfirst_over_time',
    detail: 'tfirst_over_time(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the first raw sample on the given lookbehind window `d` per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'tlast_change_over_time',
    insertText: 'tlast_change_over_time',
    detail: 'tlast_change_over_time(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the last change per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering) on the given lookbehind window `d`. Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'tlast_over_time',
    insertText: 'tlast_over_time',
    detail: 'tlast_over_time(series_selector[d])',
    documentation: 'is an alias for `timestamp`.'
  },
  {
    label: 'tmax_over_time',
    insertText: 'tmax_over_time',
    detail: 'tmax_over_time(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the raw sample with the maximum value on the given lookbehind window `d`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'tmin_over_time',
    insertText: 'tmin_over_time',
    detail: 'tmin_over_time(series_selector[d])',
    documentation: 'returns the timestamp in seconds for the raw sample with the minimum value on the given lookbehind window `d`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names`.'
  },
  {
    label: 'zscore_over_time',
    insertText: 'zscore_over_time',
    detail: 'zscore_over_time(series_selector[d])',
    documentation: 'calculates returns [z-score](https://en.wikipedia.org/wiki/Standard_score) for raw samples on the given lookbehind window `d`. It is calculated independently per each time series returned from the given [series_selector](https://docs.victoriametrics.com/keyConcepts.html#filtering). Metric names are stripped from the resulting rollups. Add `keep_metric_names` modifier in order to keep metric names.'
  }
]

const TRANSFORM_FUNCTIONS: CompletionItem[] = [
  {
    label: 'abs',
    insertText: 'abs',
    detail: 'abs(q)',
    documentation: 'calculates the absolute value for every point of every time series returned by `q`.'
  },
  {
    label: 'absent',
    insertText: 'absent',
    detail: 'absent(q)',
    documentation: 'returns 1 if `q` has no points. Otherwise returns an empty result.'
  },
  {
    label: 'acos',
    insertText: 'acos',
    detail: 'acos(q)',
    documentation: 'returns [inverse cosine](https://en.wikipedia.org/wiki/Inverse_trigonometric_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'acosh',
    insertText: 'acosh',
    detail: 'acosh(q)',
    documentation: 'returns [inverse hyperbolic cosine](https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions#Inverse_hyperbolic_cosine) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'asin',
    insertText: 'asin',
    detail: 'asin(q)',
    documentation: 'returns [inverse sine](https://en.wikipedia.org/wiki/Inverse_trigonometric_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'asinh',
    insertText: 'asinh',
    detail: 'asinh(q)',
    documentation: 'returns [inverse hyperbolic sine](https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions#Inverse_hyperbolic_sine) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'atan',
    insertText: 'atan',
    detail: 'atan(q)',
    documentation: 'returns [inverse tangent](https://en.wikipedia.org/wiki/Inverse_trigonometric_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'atanh',
    insertText: 'atanh',
    detail: 'atanh(q)',
    documentation: 'returns [inverse hyperbolic tangent](https://en.wikipedia.org/wiki/Inverse_hyperbolic_functions#Inverse_hyperbolic_tangent) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'bitmap_and',
    insertText: 'bitmap_and',
    detail: 'bitmap_and(q, mask)',
    documentation: '- calculates bitwise `v & mask` for every `v` point of every time series returned from `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'bitmap_or',
    insertText: 'bitmap_or',
    detail: 'bitmap_or(q, mask)',
    documentation: 'calculates bitwise `v | mask` for every `v` point of every time series returned from `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'bitmap_xor',
    insertText: 'bitmap_xor',
    detail: 'bitmap_xor(q, mask)',
    documentation: 'calculates bitwise `v ^ mask` for every `v` point of every time series returned from `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'buckets_limit',
    insertText: 'buckets_limit',
    detail: 'buckets_limit(limit, buckets)',
    documentation: 'limits the number of [histogram buckets](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) to the given `limit`. See also `prometheus_buckets`.'
  },
  {
    label: 'ceil',
    insertText: 'ceil',
    detail: 'ceil(q)',
    documentation: 'rounds every point for every time series returned by `q` to the upper nearest integer. See also `floor`.'
  },
  {
    label: 'clamp',
    insertText: 'clamp',
    detail: 'clamp(q, min, max)',
    documentation: 'clamps every point for every time series returned by `q` with the given `min` and `max` values. See also `clamp_min`.'
  },
  {
    label: 'clamp_max',
    insertText: 'clamp_max',
    detail: 'clamp_max(q, max)',
    documentation: 'clamps every point for every time series returned by `q` with the given `max` value. See also `clamp`.'
  },
  {
    label: 'clamp_min',
    insertText: 'clamp_min',
    detail: 'clamp_min(q, min)',
    documentation: 'clamps every point for every time series returned by `q` with the given `min` value. See also `clamp`.'
  },
  {
    label: 'cos',
    insertText: 'cos',
    detail: 'cos(q)',
    documentation: 'returns `cos(v)` for every `v` point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'cosh',
    insertText: 'cosh',
    detail: 'cosh(q)',
    documentation: 'returns [hyperbolic cosine](https://en.wikipedia.org/wiki/Hyperbolic_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'day_of_month',
    insertText: 'day_of_month',
    detail: 'day_of_month(q)',
    documentation: 'returns the day of month for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[1...31]`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'day_of_week',
    insertText: 'day_of_week',
    detail: 'day_of_week(q)',
    documentation: 'returns the day of week for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[0...6]`, where `0` means Sunday and `6` means Saturday. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'days_in_month',
    insertText: 'days_in_month',
    detail: 'days_in_month(q)',
    documentation: 'returns the number of days in the month identified by every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[28...31]`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'deg',
    insertText: 'deg',
    detail: 'deg(q)',
    documentation: 'converts [Radians to degrees](https://en.wikipedia.org/wiki/Radian#Conversions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'end',
    insertText: 'end',
    detail: 'end()',
    documentation: 'returns the unix timestamp in seconds for the last point. See also `start`.'
  },
  {
    label: 'exp',
    insertText: 'exp',
    detail: 'exp(q)',
    documentation: 'calculates the `e^v` for every point `v` of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'floor',
    insertText: 'floor',
    detail: 'floor(q)',
    documentation: 'rounds every point for every time series returned by `q` to the lower nearest integer. See also `ceil`.'
  },
  {
    label: 'histogram_avg',
    insertText: 'histogram_avg',
    detail: 'histogram_avg(buckets)',
    documentation: 'calculates the average value for the given `buckets`. It can be used for calculating the average over the given time range across multiple time series. For example, `histogram_avg(sum(histogram_over_time(response_time_duration_seconds[5m])) by (vmrange,job))` would return the average response time per each `job` over the last 5 minutes.'
  },
  {
    label: 'histogram_quantile',
    insertText: 'histogram_quantile',
    detail: 'histogram_quantile(phi, buckets)',
    documentation: 'calculates `phi`-quantile over the given [histogram buckets](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350). `phi` must be in the range `[0...1]`. For example, `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m]) by (le))` would return median request duration for all the requests during the last 5 minutes. It accepts optional third arg - `boundsLabel`. In this case it returns `lower` and `upper` bounds for the estimated percentile. See [this issue for details](https://github.com/prometheus/prometheus/issues/5706). This function is supported by PromQL (except of the `boundLabel` arg). See also `histogram_quantiles`.'
  },
  {
    label: 'histogram_quantiles',
    insertText: 'histogram_quantiles',
    detail: 'histogram_quantiles("phiLabel", phi1, ..., phiN, buckets)',
    documentation: 'calculates the given `phi*`-quantiles over the given [histogram buckets](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350). Argument `phi*` must be in the range `[0...1]`. For example, `histogram_quantiles(\'le\', 0.3, 0.5, sum(rate(http_request_duration_seconds_bucket[5m]) by (le))`. Each calculated quantile is returned in a separate time series with the corresponding `{phiLabel="phi*"}` label. See also `histogram_quantile`.'
  },
  {
    label: 'histogram_share',
    insertText: 'histogram_share',
    detail: 'histogram_share(le, buckets)',
    documentation: 'calculates the share (in the range `[0...1]`) for `buckets` that fall below `le`. Useful for calculating SLI and SLO. This is inverse to `histogram_quantile`.'
  },
  {
    label: 'histogram_stddev',
    insertText: 'histogram_stddev',
    detail: 'histogram_stddev(buckets)',
    documentation: 'calculates standard deviation for the given `buckets`.'
  },
  {
    label: 'histogram_stdvar',
    insertText: 'histogram_stdvar',
    detail: 'histogram_stdvar(buckets)',
    documentation: 'calculates standard variance for the given `buckets`. It can be used for calculating standard deviation over the given time range across multiple time series. For example, `histogram_stdvar(sum(histogram_over_time(temperature[24])) by (vmrange,country))` would return standard deviation for the temperature per each country over the last 24 hours.'
  },
  {
    label: 'hour',
    insertText: 'hour',
    detail: 'hour(q)',
    documentation: 'returns the hour for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[0...23]`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'interpolate',
    insertText: 'interpolate',
    detail: 'interpolate(q)',
    documentation: 'fills gaps with linearly interpolated values calculated from the last and the next non-empty points per each time series returned by `q`. See also `keep_last_value`.'
  },
  {
    label: 'keep_last_value',
    insertText: 'keep_last_value',
    detail: 'keep_last_value(q)',
    documentation: 'fills gaps with the value of the last non-empty point in every time series returned by `q`. See also `keep_next_value`.'
  },
  {
    label: 'keep_next_value',
    insertText: 'keep_next_value',
    detail: 'keep_next_value(q)',
    documentation: 'fills gaps with the value of the next non-empty point in every time series returned by `q`. See also `keep_last_value`.'
  },
  {
    label: 'limit_offset',
    insertText: 'limit_offset',
    detail: 'limit_offset(limit, offset, q)',
    documentation: 'skips `offset` time series from series returned by `q` and then returns up to `limit` of the remaining time series per each group. This allows implementing simple paging for `q` time series. See also `limitk`.'
  },
  {
    label: 'ln',
    insertText: 'ln',
    detail: 'ln(q)',
    documentation: 'calculates `ln(v)` for every point `v` of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'log2',
    insertText: 'log2',
    detail: 'log2(q)',
    documentation: 'calculates `log2(v)` for every point `v` of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'log10',
    insertText: 'log10',
    detail: 'log10(q)',
    documentation: 'calculates `log10(v)` for every point `v` of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'minute',
    insertText: 'minute',
    detail: 'minute(q)',
    documentation: 'returns the minute for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[0...59]`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'month',
    insertText: 'month',
    detail: 'month(q)',
    documentation: 'returns the month for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. The returned values are in the range `[1...12]`, where `1` means January and `12` means December. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'now',
    insertText: 'now',
    detail: 'now()',
    documentation: 'returns the current timestamp as a floating-point value in seconds. See also `time`.'
  },
  {
    label: 'pi',
    insertText: 'pi',
    detail: 'pi()',
    documentation: 'returns [Pi number](https://en.wikipedia.org/wiki/Pi).'
  },
  {
    label: 'rad',
    insertText: 'rad',
    detail: 'rad(q)',
    documentation: 'converts [degrees to Radians](https://en.wikipedia.org/wiki/Radian#Conversions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'prometheus_buckets',
    insertText: 'prometheus_buckets',
    detail: 'prometheus_buckets(buckets)',
    documentation: 'converts [VictoriaMetrics histogram buckets](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) with `vmrange` labels to Prometheus histogram buckets with `le` labels. This may be useful for building heatmaps in Grafana. See also `histogram_quantile`.'
  },
  {
    label: 'rand',
    insertText: 'rand',
    detail: 'rand(seed)',
    documentation: 'returns pseudo-random numbers on the range `[0...1]` with even distribution. Optional `seed` can be used as a seed for pseudo-random number generator. See also `rand_normal`.'
  },
  {
    label: 'rand_exponential',
    insertText: 'rand_exponential',
    detail: 'rand_exponential(seed)',
    documentation: 'returns pseudo-random numbers with [exponential distribution](https://en.wikipedia.org/wiki/Exponential_distribution). Optional `seed` can be used as a seed for pseudo-random number generator. See also `rand`.'
  },
  {
    label: 'rand_normal',
    insertText: 'rand_normal',
    detail: 'rand_normal(seed)',
    documentation: 'returns pseudo-random numbers with [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution). Optional `seed` can be used as a seed for pseudo-random number generator. See also `rand`.'
  },
  {
    label: 'range_avg',
    insertText: 'range_avg',
    detail: 'range_avg(q)',
    documentation: 'calculates the avg value across points per each time series returned by `q`.'
  },
  {
    label: 'range_first',
    insertText: 'range_first',
    detail: 'range_first(q)',
    documentation: 'returns the value for the first point per each time series returned by `q`.'
  },
  {
    label: 'range_last',
    insertText: 'range_last',
    detail: 'range_last(q)',
    documentation: 'returns the value for the last point per each time series returned by `q`.'
  },
  {
    label: 'range_max',
    insertText: 'range_max',
    detail: 'range_max(q)',
    documentation: 'calculates the max value across points per each time series returned by `q`.'
  },
  {
    label: 'range_median',
    insertText: 'range_median',
    detail: 'range_median(q)',
    documentation: 'calculates the median value across points per each time series returned by `q`.'
  },
  {
    label: 'range_min',
    insertText: 'range_min',
    detail: 'range_min(q)',
    documentation: 'calculates the min value across points per each time series returned by `q`.'
  },
  {
    label: 'range_quantile',
    insertText: 'range_quantile',
    detail: 'range_quantile(phi, q)',
    documentation: 'returns `phi`-quantile across points per each time series returned by `q`. `phi` must be in the range `[0...1]`.'
  },
  {
    label: 'range_sum',
    insertText: 'range_sum',
    detail: 'range_sum(q)',
    documentation: 'calculates the sum of points per each time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'remove_resets',
    insertText: 'remove_resets',
    detail: 'remove_resets(q)',
    documentation: 'removes counter resets from time series returned by `q`.'
  },
  {
    label: 'round',
    insertText: 'round',
    detail: 'round(q, nearest)',
    documentation: 'round every point of every time series returned by `q` to the `nearest` multiple. If `nearest` is missing then the rounding is performed to the nearest integer. See also `floor`.'
  },
  {
    label: 'ru',
    insertText: 'ru',
    detail: 'ru(free, max)',
    documentation: 'calculates resource utilization in the range `[0%...100%]` for the given `free` and `max` resources. For instance, `ru(node_memory_MemFree_bytes, node_memory_MemTotal_bytes)` returns memory utilization over [node_exporter](https://github.com/prometheus/node_exporter) metrics.'
  },
  {
    label: 'running_avg',
    insertText: 'running_avg',
    detail: 'running_avg(q)',
    documentation: 'calculates the running avg per each time series returned by `q`.'
  },
  {
    label: 'running_max',
    insertText: 'running_max',
    detail: 'running_max(q)',
    documentation: 'calculates the running max per each time series returned by `q`.'
  },
  {
    label: 'running_min',
    insertText: 'running_min',
    detail: 'running_min(q)',
    documentation: 'calculates the running min per each time series returned by `q`.'
  },
  {
    label: 'running_sum',
    insertText: 'running_sum',
    detail: 'running_sum(q)',
    documentation: 'calculates the running sum per each time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'scalar',
    insertText: 'scalar',
    detail: 'scalar(q)',
    documentation: 'returns `q` if `q` contains only a single time series. Otherwise it returns nothing.'
  },
  {
    label: 'sgn',
    insertText: 'sgn',
    detail: 'sgn(q)',
    documentation: 'returns `1` if `v>0`, `-1` if `v<0` and `0` if `v==0` for every point `v` of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'sin',
    insertText: 'sin',
    detail: 'sin(q)',
    documentation: 'returns `sin(v)` for every `v` point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'sinh',
    insertText: 'sinh',
    detail: 'sinh(q)',
    documentation: 'returns [hyperbolic sine](https://en.wikipedia.org/wiki/Hyperbolic_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'tan',
    insertText: 'tan',
    detail: 'tan(q)',
    documentation: 'returns `tan(v)` for every `v` point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'tanh',
    insertText: 'tanh',
    detail: 'tanh(q)',
    documentation: 'returns [hyperbolic tangent](https://en.wikipedia.org/wiki/Hyperbolic_functions) for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names`.'
  },
  {
    label: 'smooth_exponential',
    insertText: 'smooth_exponential',
    detail: 'smooth_exponential(q, sf)',
    documentation: 'smooths points per each time series returned by `q` using [exponential moving average](https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average) with the given smooth factor `sf`.'
  },
  {
    label: 'sort',
    insertText: 'sort',
    detail: 'sort(q)',
    documentation: 'sorts series in ascending order by the last point in every time series returned by `q`. See also `sort_desc`.'
  },
  {
    label: 'sort_by_label',
    insertText: 'sort_by_label',
    detail: 'sort_by_label(q, label1, ... labelN)',
    documentation: 'sorts series in ascending order by the given set of labels. For example, `sort_by_label(foo, "bar")` would sort `foo` series by values of the label `bar` in these series. See also `sort_by_label_desc`.'
  },
  {
    label: 'sort_by_label_desc',
    insertText: 'sort_by_label_desc',
    detail: 'sort_by_label_desc(q, label1, ... labelN)',
    documentation: 'sorts series in descending order by the given set of labels. For example, `sort_by_label(foo, "bar")` would sort `foo` series by values of the label `bar` in these series. See also `sort_by_label`.'
  },
  {
    label: 'sort_by_label_numeric',
    insertText: 'sort_by_label_numeric',
    detail: 'sort_by_label_numeric(q, label1, ... labelN)',
    documentation: 'sorts series in ascending order by the given set of labels using [numeric sort](https://www.gnu.org/software/coreutils/manual/html_node/Version-sort-is-not-the-same-as-numeric-sort.html). For example, if `foo` series have `bar` label with values `1`, `101`, `15` and `2`, then `sort_by_label_numeric(foo, "bar")` would return series in the following order of `bar` label values: `1`, `2`, `15` and `101`.'
  },
  {
    label: 'sort_by_label_numeric_desc',
    insertText: 'sort_by_label_numeric_desc',
    detail: 'sort_by_label_numeric_desc(q, label1, ... labelN)',
    documentation: 'sorts series in descending order by the given set of labels using [numeric sort](https://www.gnu.org/software/coreutils/manual/html_node/Version-sort-is-not-the-same-as-numeric-sort.html). For example, if `foo` series have `bar` label with values `1`, `101`, `15` and `2`, then `sort_by_label_numeric(foo, "bar")` would return series in the following order of `bar` label values: `101`, `15`, `2` and `1`.'
  },
  {
    label: 'sort_desc',
    insertText: 'sort_desc',
    detail: 'sort_desc(q)',
    documentation: 'sorts series in descending order by the last point in every time series returned by `q`. See also `sort`.'
  },
  {
    label: 'sqrt',
    insertText: 'sqrt',
    detail: 'sqrt(q)',
    documentation: 'calculates square root for every point of every time series returned by `q`. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  },
  {
    label: 'start',
    insertText: 'start',
    detail: 'start()',
    documentation: 'returns unix timestamp in seconds for the first point. See also `end`.'
  },
  {
    label: 'step',
    insertText: 'step',
    detail: 'step()',
    documentation: 'returns the step in seconds (aka interval) between the returned points. It is known as `step` query arg passed to [/api/v1/query_range](https://docs.victoriametrics.com/keyConcepts.html#range-query).'
  },
  {
    label: 'time',
    insertText: 'time',
    detail: 'time()',
    documentation: 'returns unix timestamp for every returned point.'
  },
  {
    label: 'timezone_offset',
    insertText: 'timezone_offset',
    detail: 'timezone_offset(tz)',
    documentation: 'returns offset in seconds for the given timezone `tz` relative to UTC. This can be useful when combining with datetime-related functions. For example, `day_of_week(time()+timezone_offset("America/Los_Angeles"))` would return weekdays for `America/Los_Angeles` time zone. Special `Local` time zone can be used for returning an offset for the time zone set on the host where VictoriaMetrics runs. See [the list of supported timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).'
  },
  {
    label: 'ttf',
    insertText: 'ttf',
    detail: 'ttf(free)',
    documentation: 'estimates the time in seconds needed to exhaust `free` resources. For instance, `ttf(node_filesystem_avail_byte)` returns the time to storage space exhaustion. This function may be useful for capacity planning.'
  },
  {
    label: 'union',
    insertText: 'union',
    detail: 'union(q1, ..., qN)',
    documentation: 'returns a union of time series returned from `q1`, ..., `qN`. The `union` function name can be skipped - the following queries are equivalent: `union(q1, q2)` and `(q1, q2)`. It is expected that each `q*` query returns time series with unique sets of labels. Otherwise only the first time series out of series with identical set of labels is returned. Use `alias` functions for giving unique labelsets per each `q*` query:'
  },
  {
    label: 'vector',
    insertText: 'vector',
    detail: 'vector(q)',
    documentation: 'returns `q`, e.g. it does nothing in MetricsQL.'
  },
  {
    label: 'year',
    insertText: 'year',
    detail: 'year(q)',
    documentation: 'returns the year for every point of every time series returned by `q`. It is expected that `q` returns unix timestamps. Metric names are stripped from the resulting series. Add `keep_metric_names` modifier in order to keep metric names.'
  }
]

const MANIPULATION_FUNCTIONS: CompletionItem[] = [
  {
    label: 'alias',
    insertText: 'alias',
    detail: 'alias(q, "name")',
    documentation: 'sets the given `name` to all the time series returned by `q`. For example, `alias(up, "foobar")` would rename `up` series to `foobar` series.'
  },
  {
    label: 'drop_common_labels',
    insertText: 'drop_common_labels',
    detail: 'drop_common_labels(q1, ...., qN)',
    documentation: 'drops common `label="value"` pairs among time series returned from `q1, ..., qN`.'
  },
  {
    label: 'label_copy',
    insertText: 'label_copy',
    detail: 'label_copy(q, "src_label1", "dst_label1", ..., "src_labelN", "dst_labelN")',
    documentation: 'copies label values from `src_label*` to `dst_label*` for all the time series returned by `q`. If `src_label` is empty, then the corresponding `dst_label` is left untouched.'
  },
  {
    label: 'label_del',
    insertText: 'label_del',
    detail: 'label_del(q, "label1", ..., "labelN")',
    documentation: 'deletes the given `label*` labels from all the time series returned by `q`.'
  },
  {
    label: 'label_graphite_group',
    insertText: 'label_graphite_group',
    detail: 'label_graphite_group(q, groupNum1, ... groupNumN)',
    documentation: 'replaces metric names returned from `q` with the given Graphite group values concatenated via `.` char. For example, `label_graphite_group({__graphite__="foo*.bar.*"}, 0, 2)` would substitute `foo<any_value>.bar.<other_value>` metric names with `foo<any_value>.<other_value>`. This function is useful for aggregating Graphite metrics with `aggregate functions`. For example, the following query would return per-app memory usage:'
  },
  {
    label: 'label_join',
    insertText: 'label_join',
    detail: 'label_join(q, "dst_label", "separator", "src_label1", ..., "src_labelN")',
    documentation: 'joins `src_label*` values with the given `separator` and stores the result in `dst_label`. This is performed individually per each time series returned by `q`. For example, `label_join(up{instance="xxx",job="yyy"}, "foo", "-", "instance", "job")` would store `xxx-yyy` label value into `foo` label.'
  },
  {
    label: 'label_keep',
    insertText: 'label_keep',
    detail: 'label_keep(q, "label1", ..., "labelN")',
    documentation: 'deletes all the labels except of the listed `label*` labels in all the time series returned by `q`.'
  },
  {
    label: 'label_lowercase',
    insertText: 'label_lowercase',
    detail: 'label_lowercase(q, "label1", ..., "labelN")',
    documentation: 'lowercases values for the given `label*` labels in all the time series returned by `q`.'
  },
  {
    label: 'label_map',
    insertText: 'label_map',
    detail: 'label_map(q, "label", "src_value1", "dst_value1", ..., "src_valueN", "dst_valueN")',
    documentation: 'maps `label` values from `src_*` to `dst*` for all the time series returned by `q`.'
  },
  {
    label: 'label_match',
    insertText: 'label_match',
    detail: 'label_match(q, "label", "regexp")',
    documentation: 'drops time series from `q` with `label` not matching the given `regexp`. This function can be useful after `rollup`.'
  },
  {
    label: 'label_mismatch',
    insertText: 'label_mismatch',
    detail: 'label_mismatch(q, "label", "regexp")',
    documentation: 'drops time series from `q` with `label` matching the given `regexp`. This function can be useful after `rollup`.'
  },
  {
    label: 'label_move',
    insertText: 'label_move',
    detail: 'label_move(q, "src_label1", "dst_label1", ..., "src_labelN", "dst_labelN")',
    documentation: 'moves label values from `src_label*` to `dst_label*` for all the time series returned by `q`. If `src_label` is empty, then the corresponding `dst_label` is left untouched.'
  },
  {
    label: 'label_replace',
    insertText: 'label_replace',
    detail: 'label_replace(q, "dst_label", "replacement", "src_label", "regex")',
    documentation: 'applies the given `regex` to `src_label` and stores the `replacement` in `dst_label` if the given `regex` matches `src_label`. The `replacement` may contain references to regex captures such as `$1`, `$2`, etc. These references are substituted by the corresponding regex captures. For example, `label_replace(up{job="node-exporter"}, "foo", "bar-$1", "job", "node-(.+)")` would store `bar-exporter` label value into `foo` label.'
  },
  {
    label: 'label_set',
    insertText: 'label_set',
    detail: 'label_set(q, "label1", "value1", ..., "labelN", "valueN")',
    documentation: 'sets `{label1="value1", ..., labelN="valueN"}` labels to all the time series returned by `q`.'
  },
  {
    label: 'label_transform',
    insertText: 'label_transform',
    detail: 'label_transform(q, "label", "regexp", "replacement")',
    documentation: 'substitutes all the `regexp` occurrences by the given `replacement` in the given `label`.'
  },
  {
    label: 'label_uppercase',
    insertText: 'label_uppercase',
    detail: 'label_uppercase(q, "label1", ..., "labelN")',
    documentation: 'uppercases values for the given `label*` labels in all the time series returned by `q`.'
  },
  {
    label: 'label_value',
    insertText: 'label_value',
    detail: 'label_value(q, "label")',
    documentation: 'returns number values for the given `label` for every time series returned by `q`. For example, if `label_value(foo, "bar")` is applied to `foo{bar="1.234"}`, then it will return a time series `foo{bar="1.234"}` with `1.234` value.'
  }
]

const AGGREGATE_FUNCTIONS: CompletionItem[] = [
  {
    label: 'any',
    insertText: 'any',
    detail: 'any(q) by (group_labels)',
    documentation: 'returns a single series per `group_labels` out of time series returned by `q`. See also `group`.'
  },
  {
    label: 'avg',
    insertText: 'avg',
    detail: 'avg(q) by (group_labels)',
    documentation: 'returns the average value per `group_labels` for time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'bottomk',
    insertText: 'bottomk',
    detail: 'bottomk(k, q)',
    documentation: 'returns up to `k` points with the smallest values across all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. See also `topk`.'
  },
  {
    label: 'bottomk_avg',
    insertText: 'bottomk_avg',
    detail: 'bottomk_avg(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the smallest averages. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_avg(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest averages plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `topk_avg`.'
  },
  {
    label: 'bottomk_last',
    insertText: 'bottomk_last',
    detail: 'bottomk_last(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the smallest last values. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `topk_last`.'
  },
  {
    label: 'bottomk_max',
    insertText: 'bottomk_max',
    detail: 'bottomk_max(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the smallest maximums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `topk_max`.'
  },
  {
    label: 'bottomk_median',
    insertText: 'bottomk_median',
    detail: 'bottomk_median(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q with the smallest medians. If an optional`other_label=other_value`arg is set, then the sum of the remaining time series is returned with the given label. For example,`bottomk_median(3, sum(process_resident_memory_bytes) by (job), "job=other")`would return up to 3 time series with the smallest medians plus a time series with`{job="other"}\\` label with the sum of the remaining series if any. See also `topk_median`.'
  },
  {
    label: 'bottomk_min',
    insertText: 'bottomk_min',
    detail: 'bottomk_min(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the smallest minimums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_min(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest minimums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `topk_min`.'
  },
  {
    label: 'count',
    insertText: 'count',
    detail: 'count(q) by (group_labels)',
    documentation: 'returns the number of non-empty points per `group_labels` for time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'count_values',
    insertText: 'count_values',
    detail: 'count_values("label", q)',
    documentation: 'counts the number of points with the same value and stores the counts in a time series with an additional `label`, which contains each initial value. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'distinct',
    insertText: 'distinct',
    detail: 'distinct(q)',
    documentation: 'calculates the number of unique values per each group of points with the same timestamp.'
  },
  {
    label: 'geomean',
    insertText: 'geomean',
    detail: 'geomean(q)',
    documentation: 'calculates geometric mean per each group of points with the same timestamp.'
  },
  {
    label: 'group',
    insertText: 'group',
    detail: 'group(q) by (group_labels)',
    documentation: 'returns `1` per each `group_labels` for time series returned by `q`. See also `any`.'
  },
  {
    label: 'histogram',
    insertText: 'histogram',
    detail: 'histogram(q)',
    documentation: 'calculates [VictoriaMetrics histogram](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) per each group of points with the same timestamp. Useful for visualizing big number of time series via a heatmap. See [this article](https://medium.com/@valyala/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) for more details.'
  },
  {
    label: 'limitk',
    insertText: 'limitk',
    detail: 'limitk(k, q) by (group_labels)',
    documentation: 'returns up to `k` time series per each `group_labels` out of time series returned by `q`. The returned set of time series remain the same across calls. See also `limit_offset`.'
  },
  {
    label: 'mad',
    insertText: 'mad',
    detail: 'mad(q) by (group_labels)',
    documentation: 'returns the [Median absolute deviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. See also `outliers_mad`.'
  },
  {
    label: 'max',
    insertText: 'max',
    detail: 'max(q) by (group_labels)',
    documentation: 'returns the maximum value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'median',
    insertText: 'median',
    detail: 'median(q) by (group_labels)',
    documentation: 'returns the median value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'min',
    insertText: 'min',
    detail: 'min(q) by (group_labels)',
    documentation: 'returns the minimum value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'mode',
    insertText: 'mode',
    detail: 'mode(q) by (group_labels)',
    documentation: 'returns [mode](https://en.wikipedia.org/wiki/Mode_(statistics)) per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'outliers_mad',
    insertText: 'outliers_mad',
    detail: 'outliers_mad(tolerance, q)',
    documentation: 'returns time series from `q` with at least a single point outside [Median absolute deviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) (aka MAD) multiplied by `tolerance`. E.g. it returns time series with at least a single point below `median(q) - mad(q)` or a single point above `median(q) + mad(q)`. See also `outliersk`.'
  },
  {
    label: 'outliersk',
    insertText: 'outliersk',
    detail: 'outliersk(k, q)',
    documentation: 'returns up to `k` time series with the biggest standard deviation (aka outliers) out of time series returned by `q`. See also `outliers_mad`.'
  },
  {
    label: 'quantile',
    insertText: 'quantile',
    detail: 'quantile(phi, q) by (group_labels)',
    documentation: 'calculates `phi`-quantile per each `group_labels` for all the time series returned by `q`. `phi` must be in the range `[0...1]`. The aggregate is calculated individually per each group of points with the same timestamp. See also `quantiles`.'
  },
  {
    label: 'quantiles',
    insertText: 'quantiles',
    detail: 'quantiles("phiLabel", phi1, ..., phiN, q)',
    documentation: 'calculates `phi*`-quantiles for all the time series returned by `q` and return them in time series with `{phiLabel="phi*"}` label. `phi*` must be in the range `[0...1]`. The aggregate is calculated individually per each group of points with the same timestamp. See also `quantile`.'
  },
  {
    label: 'stddev',
    insertText: 'stddev',
    detail: 'stddev(q) by (group_labels)',
    documentation: 'calculates standard deviation per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'stdvar',
    insertText: 'stdvar',
    detail: 'stdvar(q) by (group_labels)',
    documentation: 'calculates standard variance per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'sum',
    insertText: 'sum',
    detail: 'sum(q) by (group_labels)',
    documentation: 'returns the sum per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'sum2',
    insertText: 'sum2',
    detail: 'sum2(q) by (group_labels)',
    documentation: 'calculates the sum of squares per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.'
  },
  {
    label: 'topk',
    insertText: 'topk',
    detail: 'topk(k, q)',
    documentation: 'returns up to `k` points with the biggest values across all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. See also `bottomk`.'
  },
  {
    label: 'topk_avg',
    insertText: 'topk_avg',
    detail: 'topk_avg(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the biggest averages. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_avg(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest averages plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `bottomk_avg`.'
  },
  {
    label: 'topk_last',
    insertText: 'topk_last',
    detail: 'topk_last(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the biggest last values. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `bottomk_last`.'
  },
  {
    label: 'topk_max',
    insertText: 'topk_max',
    detail: 'topk_max(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the biggest maximums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `bottomk_max`.'
  },
  {
    label: 'topk_median',
    insertText: 'topk_median',
    detail: 'topk_median(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the biggest medians. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_median(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest medians plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `bottomk_median`.'
  },
  {
    label: 'topk_min',
    insertText: 'topk_min',
    detail: 'topk_min(k, q, "other_label=other_value")',
    documentation: 'returns up to `k` time series from `q` with the biggest minimums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_min(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest minimums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also `bottomk_min`.'
  },
  {
    label: 'zscore',
    insertText: 'zscore',
    detail: 'zscore(q) by (group_labels)',
    documentation: 'returns [z-score](https://en.wikipedia.org/wiki/Standard_score) values per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. Useful for detecting anomalies in the group of related time series.'
  }
]

export const FUNCTIONS = [
  ...ROLLUP_FUNCTIONS,
  ...TRANSFORM_FUNCTIONS,
  ...MANIPULATION_FUNCTIONS,
  ...AGGREGATE_FUNCTIONS,
  {
    insertText: 'count_scalar',
    label: 'count_scalar',
    detail: 'count_scalar(v instant-vector)',
    documentation:
      'Returns the number of elements in a time series vector as a scalar. This is in contrast to the `count()` aggregation operator, which always returns a vector (an empty one if the input vector is empty) and allows grouping by labels via a `by` clause.',
  }
];

export const PROM_KEYWORDS = FUNCTIONS.map((keyword) => keyword.label);

export const promqlGrammar: Grammar = {
  comment: {
    pattern: /#.*/,
  },
  'context-aggregation': {
    pattern: /((by|without)\s*)\([^)]*\)/, // by ()
    lookbehind: true,
    inside: {
      'label-key': {
        pattern: /[^(),\s][^,)]*[^),\s]*/,
        alias: 'attr-name',
      },
      punctuation: /[()]/,
    },
  },
  'context-labels': {
    pattern: /\{[^}]*(?=}?)/,
    greedy: true,
    inside: {
      comment: {
        pattern: /#.*/,
      },
      'label-key': {
        pattern: /[a-z_]\w*(?=\s*(=|!=|=~|!~))/,
        alias: 'attr-name',
        greedy: true,
      },
      'label-value': {
        pattern: /"(?:\\.|[^\\"])*"/,
        greedy: true,
        alias: 'attr-value',
      },
      punctuation: /[{]/,
    },
  },
  function: new RegExp(`\\b(?:${FUNCTIONS.map((f) => f.label).join('|')})(?=\\s*\\()`, 'i'),
  'context-range': [
    {
      pattern: /\[[^\]]*(?=])/, // [1m]
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
    {
      pattern: /(offset\s+)\w+/, // offset 1m
      lookbehind: true,
      inside: {
        'range-duration': {
          pattern: /\b\d+[smhdwy]\b/i,
          alias: 'number',
        },
      },
    },
  ],
  idList: {
    pattern: /\d+(\|\d+)+/,
    alias: 'number',
  },
  number: /\b-?\d+((\.\d*)?([eE][+-]?\d+)?)?\b/,
  operator: new RegExp(`/[-+*/=%^~]|&&?|\\|?\\||!=?|<(?:=>?|<|>)?|>[>=]?|\\b(?:${OPERATORS.join('|')})\\b`, 'i'),
  punctuation: /[{};()`,.]/,
};

export default promqlGrammar;
