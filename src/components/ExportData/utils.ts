import { SyntaxNode } from '@lezer/common';
import {
  LabelMatcher,
  LabelMatchers,
  LabelName,
  MatchOp,
  MetricIdentifier,
  parser,
  StringLiteral,
  VectorSelector,
} from 'lezer-metricsql';

export interface MetricSelector {
  /** Full text of the vector selector, e.g. 'http_requests_total{job="api"}' */
  selector: string;
  /**
   * Metric name, e.g. 'http_requests_total'. Resolved either from the leading
   * identifier or from a positive `__name__="..."` label matcher. Empty when
   * neither is present.
   */
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
        const node = nodeRef.node;

        // Skip selectors produced by parser error recovery — e.g. invalid input
        // 'CellTemp(1)[°C]{...}' yields a truncated VectorSelector 'CellTemp(1'
        // surrounded by error nodes. Treating it as valid would silently corrupt
        // downstream API requests.
        if (subtreeHasErrors(node)) {
          return false;
        }

        const selector = expr.substring(nodeRef.from, nodeRef.to);

        if (!seen.has(selector)) {
          seen.add(selector);

          let metric = '';
          const metricNode = node.getChild(MetricIdentifier);
          if (metricNode) {
            metric = expr.substring(metricNode.from, metricNode.to);
          } else {
            // No leading identifier — fall back to a positive `__name__="..."`
            // label matcher, which is semantically the metric name.
            metric = extractNameFromLabelMatchers(expr, node);
          }

          selectors.push({ selector, metric });
        }

        return false;
      }
    },
  });

  return selectors;
}

function subtreeHasErrors(node: SyntaxNode): boolean {
  let found = false;
  node.cursor().iterate((cursor): false | void => {
    if (cursor.type.isError) {
      found = true;
      return false;
    }
  });
  return found;
}

function extractNameFromLabelMatchers(expr: string, vectorSelectorNode: SyntaxNode): string {
  const labelMatchersNode = vectorSelectorNode.getChild(LabelMatchers);
  if (!labelMatchersNode) {
    return '';
  }

  // LabelMatcher is nested under LabelMatchList (which can recurse), so walk
  // the subtree instead of asking for direct children.
  let result = '';
  labelMatchersNode.cursor().iterate((cursor) => {
    if (result !== '' || cursor.type.id !== LabelMatcher) {
      return;
    }
    const matcher = cursor.node;
    const nameNode = matcher.getChild(LabelName);
    const opNode = matcher.getChild(MatchOp);
    const valueNode = matcher.getChild(StringLiteral);
    if (!nameNode || !opNode || !valueNode) {
      return;
    }
    if (expr.substring(nameNode.from, nameNode.to) !== '__name__') {
      return;
    }
    if (expr.substring(opNode.from, opNode.to) !== '=') {
      return;
    }
    // StringLiteral spans the surrounding quotes — strip one char from each end.
    if (valueNode.to - valueNode.from < 2) {
      return;
    }
    result = expr.substring(valueNode.from + 1, valueNode.to - 1);
  });
  return result;
}
