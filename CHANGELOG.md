# Changelog

## tip

* BUGFIX: correctly handle custom query parameters in annotation queries. See [this issue](https://github.com/VictoriaMetrics/grafana-datasource/issues/95)

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
