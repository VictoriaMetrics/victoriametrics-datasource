# Changelog

## tip 

* FEATURE: set the default query type to `instant` when creating alerting rules. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/205).

* BUGFIX: removed `/select/`-prefixed part of path for /health endpoint requests. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/208).

## [v0.9.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.9.1)

* BUGFIX: fix parsing dots in the the `label_values` function in the query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/198).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/199).

## [v0.9.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.9.0)

* FEATURE: make retry attempt for datasource requests if returned error is a temporary network error. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/193)

## [v0.8.5](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.5)

* BUGFIX: restore support for Grafana versions below `10.0.0`. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/159).
* BUGFIX: fix issue with forwarding headers from datasource to the backend or proxy. 
  It might be helpful if a user wants to use some kind of authentication. See [this issue](https://github.com/VictoriaMetrics/victorialogs-datasource/issues/54).

## [v0.8.4](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.4)

* BUGFIX: fix label join function in builder mode. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/162).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/174).
* BUGFIX: add missing rollup functions to the builder suggestion list. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/152).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/180).
* BUGFIX: properly apply ad-hoc filters for some rollup functions. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/175).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/180).

## [v0.8.3](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.3)

* BUGFIX: fix an issue with prettify query if the query includes Grafana variables in the lookbehind window. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/166).
* BUGFIX: fix an issue with ad-hoc filters applied to variables in query. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/167). Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/170).

## [v0.8.2](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.2)

* BUGFIX: fix parsing of label names with special characters for the query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/131#issuecomment-2105662179).

## [v0.8.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.1)

* BUGFIX: fix an issue in the template variable service where accessing the `datasource` property of `undefined` caused a failure. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/150).

## [v0.8.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.8.0)

* FEATURE: add variable type selector to optimize API usage, favoring [/api/v1/labels](https://docs.victoriametrics.com/url-examples/#apiv1labels) and [/api/v1/label/.../values](https://docs.victoriametrics.com/url-examples/#apiv1labelvalues) over [/api/v1/series](https://docs.victoriametrics.com/url-examples/#apiv1series). See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/144)

* BUGFIX: correct parsing the Annotations queries when template variables are used. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/146)

## [v0.7.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.7.0)

* FEATURE: add visually highlight partial responses. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/142)

* BUGFIX: correct the queries for `Label Filters` and `Metrics Browser` for metrics with special characters. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/140)

## [v0.6.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.6.0)

* FEATURE: add support metrics with special characters in query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/131)

* BUGFIX: fix the default link to vmui. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/132)
* BUGFIX: fix the parsing logic in `renderLegendFormat` to correctly replace legend label names. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/133)
* BUGFIX: fix query editor which produce a lot of requests for alerting rule evaluation. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/134)

## [v0.5.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.5.1)

* BUGFIX: fix query builder logic to correctly parse metric names with dots. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/128)

## [v0.5.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.5.0)

* FEATURE: add Windows support for backend plugin. See how to build backend plugin for various platforms [here](https://github.com/VictoriaMetrics/victoriametrics-datasource#3-how-to-build-backend-plugin). See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/67).
* FEATURE: migrate to React to prevent warnings about the discontinuation of Angular support. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/102).
* FEATURE: add `--version` flag for backend datasource binary. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/68).
* FEATURE: add a warning window about using `WITH templates` for not yet created dashboards. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/123).
* FEATURE: add a separate scope for storing `WITH templates` for the Explore tab.

* BUGFIX: fix incorrect parsing when switching between code/builder modes in query editor. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/112)

## [v0.4.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.4.0)

* FEATURE: add datasource settings for limiting the number of metrics during discovery. The proper limits should protect users from slowing down the browser when datasource returns big amounts of discovered metrics in response.  See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/82).
* FEATURE: add a `prettify query` icon, which when clicked, formats the query. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/86).
* FEATURE: change the style of the buttons `WITH templates` and `Run in vmui` to icons.

* BUGFIX: correctly handle custom query parameters in annotation queries. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/95)
* BUGFIX: fix the duplication of labels in the legend when using expressions. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/93)
* BUGFIX: fix the loading of metrics in the `metrics browser`. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/98)
* BUGFIX: fix an issue where `metricsql` functions were not properly processed. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/66)

## [v0.3.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.3.0)

* FEATURE: Improvements to WITH Templates (see [this comment](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/35#issuecomment-1578649762)):
  - The management of `WITH templates` has been transferred from datasource settings to the panel editing page;
  - Improved display of templates in auto-complete hints;
  - Enabled auto-complete within curly braces for filters defined in templates;
  - Added support for Grafana variables such as `$__interval`, `$__rate_interval`, etc. in WITH expression validation;
  - Fixed the link to `vmui` when using `WITH templates`.

## [v0.2.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.2.1)

* BUGFIX: respect the time filter change on updating dashboard variables. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/47)

## [v0.2.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.2.0)

* FEATURE: add the ability to define expressions for each panel so that users can define WITH templates once and then reuse them. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/35).
* FEATURE: add support MetricsQL to query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/66).
* FEATURE: add the ability to change the link for [Run in VMUI](https://docs.victoriametrics.com/#vmui) button. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/61).

* BUGFIX: fix the tracing display for Grafana version 9.4.
* BUGFIX: support label with dots in names for template function `label_values()`. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/74).

## [v0.1.3](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.1.3)

Released at 08-03-2022

* FEATURE: Add links to VMUI from the query panel. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/34).
* FEATURE: Add option to show query trace from the query panel. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/36) and [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/53).
* FEATURE: Change license to AGPLv3. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/22).

* BUGFIX: respect time filter for variables update. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/47)

## [v0.1.2](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.1.2)

Released at 21-12-2022

* FEATURE: add annotation support
* FEATURE: add datasource backend

## [v0.1.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.1.1)

Released at 17-11-2022

* BUGFIX: Add enum `AbstractLabelOperator`. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/14)

## [v0.1.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.1.0)

Released at 11-11-2022
