# Changelog

## tip

* BUGFIX: fix unpredictable behavior when determining an interval for a range query. See [#383](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/383)

## v0.19.2

* BUGFIX: fix the issue with dashboards showing no data when the `format` field was undefined. Now the `format` defaults to `time_series` when not explicitly set, ensuring proper data visualization for existing queries and dashboards. See [#377](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/377)

## v0.19.1

* BUGFIX: fix duplication of statistics panels. See [#372](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/372)

## v0.19.0

* FEATURE: upgrade Go builder from Go1.24.2 to Go1.25. See [Go1.25 release notes](https://tip.golang.org/doc/go1.25).

* BUGFIX: fix incorrect field unmarshalling when rendering query results as a table. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/354)
* BUGFIX: fix issue with concurrent map writes when performing multiple requests to the datasource. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/363)

## v0.18.3

* BUGFIX: fix the calculation of the `step` parameter and lookbehind window for the `range` queries if the `$__rate_interval` variable is used. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/347).
* BUGFIX: fix parsing of the datasource settings, enable usage of the scrape interval when the lookbehind window is calculated for the query url. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/349).
* BUGFIX: fix handling of the 'auto' legend mode so series labels are generated correctly. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/350).
* BUGFIX: fix an issue where line charts were incorrectly connecting data points across missing (null) values despite the "Connect null values" panel setting being set to "Never". See [#364](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/364).

## v0.18.2

* BUGFIX: fix regression of the plugin that cause the plugin to not work with `values`, `with template` and `names` queries. Fix comments after the plugin verification procedure.

## v0.18.1

* BUGFIX: upgrade `jest` library version to fix vulnerability warning.

## v0.18.0

* BREAKING: increase minimum required Grafana version to `>=10.4.0` to ensure compatibility with [`@grafana/plugin-ui`](https://github.com/grafana/plugin-ui). This drops support for older Grafana versions.

* FEATURE: preserve variable expression when switching between compatible variable types. See [#332](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/332).

## v0.17.0

* FEATURE: add support for the `default` binary operator in the visual query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/296).

* BUGFIX: add a rollup field to rollup_rate function. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/316).

## v0.16.0

* FEATURE: add support dots in label name. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/205).
* FEATURE: update Visual Query Builder code from Grafana upstream.
  Thanks to @SammyVimes for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/318).

* BUGFIX: fix label filter value loading for metric names with special characters. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/131).
* BUGFIX: fix an issue in Grafana 10.1.5 where creating a variable using label_values is not possible. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/319).

## v0.15.1

* Added PDC support. See [this issue](https://github.com/VictoriaMetrics/VictoriaMetrics/issues/5624).

## v0.15.0

* Added PDC support. See [this issue](https://github.com/VictoriaMetrics/VictoriaMetrics/issues/5624).

## v0.15.0-alpha2

* BUGFIX: removed version constraint for secure proxy configuration

## v0.15.0-alpha1

**Update Note 1:** This is an alpha release. We do not recommend using it in production.

* Added PDC support. See [this issue](https://github.com/VictoriaMetrics/VictoriaMetrics/issues/5624).

## v0.14.0

* FEATURE: automatically escape metric and label names in the query builder. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/266).

* BUGFIX: fix an issue where the `vmui` link had an incorrect address of the type `about:blank`. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/288).
* BUGFIX: fix change of the selected time range when aligning query intervals. See [#275](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/275).

## v0.13.4

* BUGFIX: fix error when response detected as not a wide series. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/286).
* BUGFIX: fix the inspector query while press on refresh button.
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/239).

## v0.13.3

* BUGFIX: correctly calculate step for the instant query, use `5m` step for the alerting queries if interval wasn't explicitly set by user. This change reduces alerts flapping for Grafana managed alerts. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/276).

## v0.13.2

* BUGFIX: use `5m` step for the alerting queries if interval wasn't explicitly set by user. This change reduces alerts flapping for Grafana managed alerts. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/276). 

## v0.13.1

* BUGFIX: cleanup README.md for the plugin. Clarify how to make release. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/269).

## v0.13.0

* FEATURE: enable plugin sign procedure for new releases. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/264) and [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/265).

## v0.12.2

* FEATURE: change `localStorage` key names to avoid collisions with other systems. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/259).

* BUGFIX: clean up the plugin codebase after the plugin verification procedure. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/260) and [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/261).

## v0.12.1

* BUGFIX: fix issue with including the lezer-metricsql package to the build and fix public folder. See [this PR](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/256).
* BUGFIX: fix plugin loading for query formatting in the editor. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/234).
* BUGFIX: fix issue with "Prettify query" functionality corrupting dashboard JSON model. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/242).

## v0.12.0

⚠️ **Breaking Change: Plugin ID Updated**  
**Update Note 1:**  
In the new version of the plugin, the plugin ID has been updated. The new plugin ID is `victoriametrics-metrics-datasource`. **This is a breaking change**: Grafana will treat this as a new plugin.
- You must update the `allow_loading_unsigned_plugins` field in the `grafana.ini` or `defaults.ini` configuration file.  
  **Example:**
    ```ini  
    allow_loading_unsigned_plugins = victoriametrics-metrics-datasource  
    ```
- If you are using provisioning, update the `type` field to `victoriametrics-metrics-datasource` in your provisioning configuration.
- After making these changes, you must restart the Grafana server for the updates to take effect.

* FEATURE: update plugin id name to `victoriametrics-metrics-datasource` after the review while sign procedure. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/233).

## v0.11.1

* BUGFIX: fix checksum calculation for release files.

## v0.11.0

* FEATURE: include request url in the `got unexpected response status code` error message for troubleshooting.
  Thanks to @chenlujjj for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/243).

* BUGFIX: fix issue with variables not working in adhoc filters. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/235).
* BUGFIX: fix query type switching when creating alerts in Grafana. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/237)


## [v0.10.3](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.10.3)

* BUGFIX: fix query loading when using multiple visible queries in a panel. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/223).
* BUGFIX: fix escaping when selecting metrics in the metrics browser. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/214).
* BUGFIX: fix incorrect step calculation in annotation queries. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/217).

## [v0.10.2](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.10.2)

* BUGFIX: fix the inspector query while press on refresh button. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/215).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/216).

* BUGFIX: fix shows the value after prettified request in the table view. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/218).
  Thanks to @yincongcyincong for [the pull request](https://github.com/VictoriaMetrics/victoriametrics-datasource/pull/219).

## [v0.10.1](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.10.1)

* BUGFIX: fixed healthcheck

## [v0.10.0](https://github.com/VictoriaMetrics/victoriametrics-datasource/releases/tag/v0.10.0)

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

* FEATURE: add variable type selector to optimize API usage, favoring [/api/v1/labels](https://docs.victoriametrics.com/victoriametrics/url-examples/#apiv1labels) and [/api/v1/label/.../values](https://docs.victoriametrics.com/victoriametrics/url-examples/#apiv1labelvalues) over [/api/v1/series](https://docs.victoriametrics.com/victoriametrics/url-examples/#apiv1series). See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/144)

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
* FEATURE: add the ability to change the link for [Run in VMUI](https://docs.victoriametrics.com/victoriametrics/#vmui) button. See [this issue](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/61).

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
