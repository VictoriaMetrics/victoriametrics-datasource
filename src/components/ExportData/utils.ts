import { MetricIdentifier, parser, VectorSelector } from 'lezer-metricsql';

export interface MetricSelector {
  /** Full text of the vector selector, e.g. 'http_requests_total{job="api"}' */
  selector: string;
  /** Metric name, e.g. 'http_requests_total'. Empty string if selector has only labels */
  metric: string;
}

/**
 * Extracts all unique vector selectors from a PromQL/MetricsQL expression.
 * A vector selector is a metric name + optional label matchers,
 * e.g. http_requests_total{job="api"}
 *
 * @param expr - The PromQL/MetricsQL expression string
 * @returns Array of unique MetricSelector objects
 */
export function extractMetricSelectors(expr: string): MetricSelector[] {
  if (!expr || !expr.trim()) {
    return [];
  }

  const tree = parser.parse(expr);
  const seen = new Set<string>();
  const selectors: MetricSelector[] = [];

  tree.iterate({
    enter: (nodeRef): false | void => {
      if (nodeRef.type.id === VectorSelector) {
        const selector = expr.substring(nodeRef.from, nodeRef.to);

        if (!seen.has(selector)) {
          seen.add(selector);

          let metric = '';
          // Look for MetricIdentifier child node to extract metric name
          const node = nodeRef.node;
          const metricNode = node.getChild(MetricIdentifier);
          if (metricNode) {
            metric = expr.substring(metricNode.from, metricNode.to);
          }

          selectors.push({ selector, metric });
        }

        return false;
      }
    },
  });

  return selectors;
}
