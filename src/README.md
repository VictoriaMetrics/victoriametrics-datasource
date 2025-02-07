# VictoriaMetrics datasource for Grafana

The VictoriaMetrics Grafana plugin allows Grafana to query, visualize,
and interact with [VictoriaMetrics](https://docs.victoriametrics.com/),
a high-performance metrics storage and processing system.

<img alt="Grafana Dashboard Screenshot" src="https://raw.githubusercontent.com/VictoriaMetrics/victoriametrics-datasource/b8bf7398a9a14ba917094385d8fee08cb7e303a1/src/img/dashboard.png">

## Capabilities

1. Use [MetricsQL](https://docs.victoriametrics.com/metricsql/) to query metrics in Grafana.
1. Use Explore mode with Grafana.
1. Build dashboards and setup alerts.
1. Use Ad Hoc filters.
1. [Template](https://github.com/VictoriaMetrics/victoriametrics-datasource/blob/main/src/README.md#how-to-use-with-templates) queries and expressions.
1. Get insights about query execution bottlenecks via [tracing](https://docs.victoriametrics.com/#query-tracing).
1. Automatically format queries via `Prettify` button.

Try it at [VictoriaMetrics playground](https://play-grafana.victoriametrics.com/d/oS7Bi_0Wz_vm)!

## Installation

For detailed instructions on how to install the plugin on Grafana Cloud or locally, please checkout the [Plugin installation docs](https://grafana.com/docs/grafana/latest/plugins/installation/).

### Manual configuration via UI

Once the plugin is installed on your Grafana instance, follow [these instructions](https://grafana.com/docs/grafana/latest/datasources/add-a-data-source/)
to add a new VictoriaMetrics data source, and enter configuration options.

### Configuration via file

Provision of Grafana plugin requires to create [datasource config file](http://docs.grafana.org/administration/provisioning/#datasources):

```yaml
apiVersion: 1
datasources:
  - name: VictoriaMetrics
    type: victoriametrics-metrics-datasource
    access: proxy
    url: http://victoriametrics:8428
    isDefault: true
    
  - name: VictoriaMetrics - cluster
    type: victoriametrics-metrics-datasource
    access: proxy
    url: http://vmselect:8481/select/0/prometheus
    isDefault: false
```

## Building queries

VictoriaMetrics query language is [MetricsQL](https://docs.victoriametrics.com/metricsql/) - query language inspired by PromQL. 
MetricsQL is backwards-compatible with PromQL, so Grafana dashboards backed by Prometheus datasource should work the same
after switching from Prometheus to VictoriaMetrics. However, there are some [intentional differences](https://medium.com/@romanhavronenko/victoriametrics-promql-compliance-d4318203f51e)
between these two languages.

Queries can be built using raw MetricsQL or via QueryBuilder. Overall, dashboarding experience
is the same as with Prometheus datasource.

See panels examples at [VictoriaMetrics playground](https://play-grafana.victoriametrics.com/d/oS7Bi_0Wz_vm).

## How to use WITH templates

The `WITH` templates feature simplifies the construction and management of complex queries. You can try this feature in the [WITH templates playground](https://play.victoriametrics.com/select/accounting/1/6a716b0f-38bc-4856-90ce-448fd713e3fe/prometheus/graph/#/expand-with-exprs).

The "WITH templates" section allows you to create expressions with templates that can be used in dashboards.

WITH expressions are stored in the datasource object. If the dashboard gets exported, the associated WITH templates will not be included in the resulting JSON (due to technical limitations) and need to be migrated separately.

### Defining WITH Expressions

1. Navigate to the dashboard where you want to add a template.<br/>
   *Note: templates are available within the dashboard scope.*
1. Click the `WITH templates` button.
1. Enter the expression in the input field. Once done, press the `Save` button to apply the changes. For example:
```
commonFilters = {instance=~"$node:$port",job=~"$job"},

\# cpuCount is the number of CPUs on the node
cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu)),

\# cpuIdle is the sum of idle CPU cores
cpuIdle = sum(rate(node_cpu_seconds_total{mode='idle',commonFilters}[5m]))
```

   You can specify a comment before the variable and use markdown in it. The comment will be displayed as a hint during
   auto-completion. The comment can span multiple lines.

### Using WITH Expressions

After saving the template, you can enter it into the query editor field:

```
((cpuCount - cpuIdle) * 100) / cpuCount
```

Thus, the entire query will look as follows:

```
WITH (
 commonFilters = {instance=~"$node:$port",job=~"$job"},
 cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu)),
 cpuIdle = sum(rate(node_cpu_seconds_total{mode='idle',commonFilters}[5m]))
)
((cpuCount - cpuIdle) * 100) / cpuCount
```

To view the raw query in the interface, enable the `Raw` toggle.

## FAQ

### How to convert dashboard from Prometheus to VictoriaMetrics datasource?

Make sure that VictoriaMetrics datasource plugin is [installed](#installation), and a new datasource is created from the plugin.

Each panel in Grafana dashboard has a datasource dropdown when in Edit mode. Just choose the VictoriaMetrics datasource instead of Prometheus datasource in dropdown.

If datasource is configured via Grafana variable, then change variable to VictoriaMetrics datasource type.

### Why VictoriaMetrics datasource doesn't support alerting?

Grafana doesn't allow forwarding Alert requests to alerting API `/api/v1/rules` for plugins which are not of Prometheus or Loki type. 
See more details [here](https://github.com/VictoriaMetrics/victoriametrics-datasource/issues/59#issuecomment-1541456768).

## License

This project is licensed under
the [AGPL-3.0-only](https://github.com/VictoriaMetrics/victoriametrics-datasource/blob/main/LICENSE).

