# Changelog

## tip

## [v0.7.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.7.0)

* FEATURE: add visually highlight partial responses. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/142)

* BUGFIX: correct the queries for `Label Filters` and `Metrics Browser` for metrics with special characters. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/140)

## [v0.6.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.6.0)

* FEATURE: add support metrics with special characters in query builder. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/131)

* BUGFIX: fix the default link to vmui. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/132)
* BUGFIX: fix the parsing logic in `renderLegendFormat` to correctly replace legend label names. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/133)
* BUGFIX: fix query editor which produce a lot of requests for alerting rule evaluation. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/134)

## [v0.5.1](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.5.1)

* BUGFIX: fix query builder logic to correctly parse metric names with dots. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/128)

## [v0.5.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.5.0)

* FEATURE: add Windows support for backend plugin. See how to build backend plugin for various platforms [here](https://github.com/VictoriaMetrics/grafana-datasource#3-how-to-build-backend-plugin). See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/67).  
* FEATURE: migrate to React to prevent warnings about the discontinuation of Angular support. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/102).
* FEATURE: add `--version` flag for backend datasource binary. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/68).
* FEATURE: add a warning window about using `WITH templates` for not yet created dashboards. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/123).
* FEATURE: add a separate scope for storing `WITH templates` for the Explore tab.

* BUGFIX: fix incorrect parsing when switching between code/builder modes in query editor. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/112)

## [v0.4.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.4.0)

* FEATURE: add datasource settings for limiting the number of metrics during discovery. The proper limits should protect users from slowing down the browser when datasource returns big amounts of discovered metrics in response.  See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/82).
* FEATURE: add a `prettify query` icon, which when clicked, formats the query. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/86).
* FEATURE: change the style of the buttons `WITH templates` and `Run in vmui` to icons.

* BUGFIX: correctly handle custom query parameters in annotation queries. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/95)
* BUGFIX: fix the duplication of labels in the legend when using expressions. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/93)
* BUGFIX: fix the loading of metrics in the `metrics browser`. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/98)
* BUGFIX: fix an issue where `metricsql` functions were not properly processed. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/66)

## [v0.3.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.3.0)

* FEATURE: Improvements to WITH Templates (see [this comment](https://github.com/VictoriaMetrics/grafana-datasource/issues/35#issuecomment-1578649762)):
  - The management of `WITH templates` has been transferred from datasource settings to the panel editing page;
  - Improved display of templates in auto-complete hints;
  - Enabled auto-complete within curly braces for filters defined in templates;
  - Added support for Grafana variables such as `$__interval`, `$__rate_interval`, etc. in WITH expression validation;
  - Fixed the link to `vmui` when using `WITH templates`.

## [v0.2.1](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.2.1)

* BUGFIX: respect the time filter change on updating dashboard variables. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/47)

## [v0.2.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.2.0)

* FEATURE: add the ability to define expressions for each panel so that users can define WITH templates once and then reuse them. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/35).
* FEATURE: add support MetricsQL to query builder. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/66).
* FEATURE: add the ability to change the link for [Run in VMUI](https://docs.victoriametrics.com/#vmui) button. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/61).

* BUGFIX: fix the tracing display for Grafana version 9.4.
* BUGFIX: support label with dots in names for template function `label_values()`. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/74).

## [v0.1.3](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.1.3)

Released at 08-03-2022

* FEATURE: Add links to VMUI from the query panel. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/34).
* FEATURE: Add option to show query trace from the query panel. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/36) and [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/53).
* FEATURE: Change license to AGPLv3. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/22).

* BUGFIX: respect time filter for variables update. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/47)

## [v0.1.2](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.1.2)

Released at 21-12-2022

* FEATURE: add annotation support
* FEATURE: add datasource backend

## [v0.1.1](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.1.1)

Released at 17-11-2022

* BUGFIX: Add enum `AbstractLabelOperator`. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/14)

## [v0.1.0](https://github.com/VictoriaMetrics/grafana-datasource/releases/tag/v0.1.0)

Released at 11-11-2022
