#### any

`any(q) by (group_labels)` returns a single series per `group_labels` out of time series returned by `q`. See also [group](#group).

#### avg

`avg(q) by (group_labels)` returns the average value per `group_labels` for time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### bottomk

`bottomk(k, q)` returns up to `k` points with the smallest values across all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL. See also [topk](#topk).

#### bottomk_avg

`bottomk_avg(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the smallest averages. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_avg(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest averages plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [topk_avg](#topk_avg).

#### bottomk_last

`bottomk_last(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the smallest last values. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [topk_last](#topk_last).

#### bottomk_max

`bottomk_max(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the smallest maximums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [topk_max](#topk_max).

#### bottomk_median

`bottomk_median(k, q, "other_label=other_value")` returns up to `k` time series from `q with the smallest medians. If an optional`other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_median(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest medians plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [topk_median](#topk_median).

#### bottomk_min

`bottomk_min(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the smallest minimums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `bottomk_min(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the smallest minimums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [topk_min](#topk_min).

#### count

`count(q) by (group_labels)` returns the number of non-empty points per `group_labels` for time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### count_values

`count_values("label", q)` counts the number of points with the same value and stores the counts in a time series with an additional `label`, which contains each initial value. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### distinct

`distinct(q)` calculates the number of unique values per each group of points with the same timestamp.

#### geomean

`geomean(q)` calculates geometric mean per each group of points with the same timestamp.

#### group

`group(q) by (group_labels)` returns `1` per each `group_labels` for time series returned by `q`. This function is supported by PromQL. See also [any](#any).

#### histogram

`histogram(q)` calculates [VictoriaMetrics histogram](https://valyala.medium.com/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) per each group of points with the same timestamp. Useful for visualizing big number of time series via a heatmap. See [this article](https://medium.com/@valyala/improving-histogram-usability-for-prometheus-and-grafana-bc7e5df0e350) for more details.

#### limitk

`limitk(k, q) by (group_labels)` returns up to `k` time series per each `group_labels` out of time series returned by `q`. The returned set of time series remain the same across calls. See also [limit_offset](#limit_offset).

#### mad

`mad(q) by (group_labels)` returns the [Median absolute deviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. See also [outliers_mad](#outliers_mad) and [stddev](#stddev).

#### max

`max(q) by (group_labels)` returns the maximum value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### median

`median(q) by (group_labels)` returns the median value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.

#### min

`min(q) by (group_labels)` returns the minimum value per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### mode

`mode(q) by (group_labels)` returns [mode](https://en.wikipedia.org/wiki/Mode_(statistics)) per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.

#### outliers_mad

`outliers_mad(tolerance, q)` returns time series from `q` with at least a single point outside [Median absolute deviation](https://en.wikipedia.org/wiki/Median_absolute_deviation) (aka MAD) multiplied by `tolerance`. E.g. it returns time series with at least a single point below `median(q) - mad(q)` or a single point above `median(q) + mad(q)`. See also [outliersk](#outliersk) and [mad](#mad).

#### outliersk

`outliersk(k, q)` returns up to `k` time series with the biggest standard deviation (aka outliers) out of time series returned by `q`. See also [outliers_mad](#outliers_mad).

#### quantile

`quantile(phi, q) by (group_labels)` calculates `phi`-quantile per each `group_labels` for all the time series returned by `q`. `phi` must be in the range `[0...1]`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL. See also [quantiles](#quantiles).

#### quantiles

`quantiles("phiLabel", phi1, ..., phiN, q)` calculates `phi*`-quantiles for all the time series returned by `q` and return them in time series with `{phiLabel="phi*"}` label. `phi*` must be in the range `[0...1]`. The aggregate is calculated individually per each group of points with the same timestamp. See also [quantile](#quantile).

#### stddev

`stddev(q) by (group_labels)` calculates standard deviation per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### stdvar

`stdvar(q) by (group_labels)` calculates standard variance per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### sum

`sum(q) by (group_labels)` returns the sum per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL.

#### sum2

`sum2(q) by (group_labels)` calculates the sum of squares per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp.

#### topk

`topk(k, q)` returns up to `k` points with the biggest values across all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. This function is supported by PromQL. See also [bottomk](#bottomk).

#### topk_avg

`topk_avg(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the biggest averages. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_avg(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest averages plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [bottomk_avg](#bottomk_avg).

#### topk_last

`topk_last(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the biggest last values. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [bottomk_last](#bottomk_last).

#### topk_max

`topk_max(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the biggest maximums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_max(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest maximums plus a time series with `{job="other"}` label with the sum of the remaining series if any. See also [bottomk_max](#bottomk_max).

#### topk_median

`topk_median(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the biggest medians. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_median(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest medians plus a time series with `{job="other"}` label with the sum of the remaining series if any.  See also [bottomk_median](#bottomk_median).

#### topk_min

`topk_min(k, q, "other_label=other_value")` returns up to `k` time series from `q` with the biggest minimums. If an optional `other_label=other_value` arg is set, then the sum of the remaining time series is returned with the given label. For example, `topk_min(3, sum(process_resident_memory_bytes) by (job), "job=other")` would return up to 3 time series with the biggest minimums plus a time series with `{job="other"}` label with the sum of the remaining series if any.  See also [bottomk_min](#bottomk_min).

#### zscore

`zscore(q) by (group_labels)` returns [z-score](https://en.wikipedia.org/wiki/Standard_score) values per each `group_labels` for all the time series returned by `q`. The aggregate is calculated individually per each group of points with the same timestamp. Useful for detecting anomalies in the group of related time series.
