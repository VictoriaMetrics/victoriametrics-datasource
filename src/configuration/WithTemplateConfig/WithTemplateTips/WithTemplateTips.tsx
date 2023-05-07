import React from 'react'

import { useStyles2 } from "@grafana/ui";

import getStyles from "./style";

const playgroundUrl = "https://play.victoriametrics.com/select/accounting/1/6a716b0f-38bc-4856-90ce-448fd713e3fe/expand-with-exprs"

const exampleWithExpr = `commonFilters = {instance=~"$node:$port",job=~"$job"},
cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu)),
cpuIdle = sum(rate(node_cpu_seconds_total{mode='idle',commonFilters}[5m]))`

const exampleUsage = `((cpuCount - cpuIdle) * 100) / cpuCount`

const exampleFullQuery = `WITH (
${exampleWithExpr}
) 
${exampleUsage}`

const WithTemplateTips = () => {

  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      <p className={styles.paragraph}>
        This feature simplifies writing and managing complex queries.
        Go to <a className="text-link" href={playgroundUrl}>WITH templates playground</a> and try it.
      </p>
      <p className={styles.paragraph}>
        The <code>WITH templates</code> settings section allows you to create expressions with templates that can be used in
        dashboards to create flexible and adaptive queries for metrics.
      </p>

      <div className={styles.section}>
        <h6>
          <b>Configuration:</b>
        </h6>
        <p className={styles.paragraph}>
          <ol>
            <li>Open the datasource settings and find the <code>WITH templates</code> section.</li>
            <li>Find the dashboard for which you want to add a with template expression.</li>
            <li>
              Enter the expression in the input field:
              <pre><code>{exampleWithExpr}</code></pre>
            </li>
            <li>Save the datasource changes.</li>
            <li>
              Open the panel inside the dashboard for which you created the with template expression
              and enter the query in the input field:
              <pre><code>{exampleUsage}</code></pre>
            </li>
            <li>
              Thus, the entire query will look as follows:
              <pre><code>{exampleFullQuery}</code></pre>
              To view the raw query in the interface, enable the <code>Raw</code> toggle.
            </li>
          </ol>
        </p>
      </div>
    </div>
  )
}

export default WithTemplateTips;
