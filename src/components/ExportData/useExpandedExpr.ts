import { useEffect, useMemo, useState } from 'react';

import { DataQueryRequest } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';
import { expandQuery, ExpandWithExprsResult } from '../WithTemplateConfig/api/expandWithExprs';
import { mergeResolvedWithTemplate } from '../WithTemplateConfig/utils/mergeResolvedWithTemplate';

interface UseExpandedExprResult {
  /** The query text that can be parsed locally; empty until a WITH template has been expanded */
  expr: string;
  /** True while VictoriaMetrics expands the WITH templates of the query */
  isLoading: boolean;
  /** Why the WITH templates could not be expanded, null otherwise */
  expandError: string | null;
}

/**
 * The query with its WITH template resolved. A query that uses a WITH template cannot be parsed locally
 * (`up{f}` has no meaning without the template), so it is expanded by VictoriaMetrics while `isOpen`.
 * A successful expansion is kept per query text; a failure is retried the next time the consumer opens.
 */
export function useExpandedExpr(
  datasource: PrometheusDatasource,
  query: PromQuery,
  request: DataQueryRequest | undefined,
  isOpen: boolean
): UseExpandedExprResult {
  const { expr, withTemplate } = query;

  const { interpolatedExpr, needsExpansion } = useMemo(() => {
    const templateSrv = datasource.getTemplateSrv();
    const scopeUID = request?.dashboardUID || request?.app || '';
    const merged = mergeResolvedWithTemplate({ expr, withTemplate }, templateSrv, datasource.withTemplates, scopeUID);
    return {
      interpolatedExpr: templateSrv.replace(merged, request?.scopedVars),
      needsExpansion: merged !== expr,
    };
  }, [datasource, expr, withTemplate, request]);

  const [lastResult, setLastResult] = useState<ExpandWithExprsResult | null>(null);
  // The last result applies only while the query text it was requested for is still the current one
  const result = needsExpansion && lastResult?.query === interpolatedExpr ? lastResult : null;
  const expandedExpr = result && 'expandedExpr' in result ? result.expandedExpr : null;
  const expandError = result && 'error' in result ? result.error : null;
  const isExpanded = expandedExpr !== null;

  useEffect(() => {
    if (!isOpen || !needsExpansion || isExpanded) {
      return;
    }
    let cancelled = false;
    // Drop a previous failure so that reopening retries with the loading state instead of the stale error
    setLastResult(null);
    expandQuery(datasource, interpolatedExpr).then((nextResult) => {
      if (!cancelled) {
        setLastResult(nextResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [datasource, interpolatedExpr, needsExpansion, isOpen, isExpanded]);

  return {
    expr: needsExpansion ? (expandedExpr ?? '') : interpolatedExpr,
    isLoading: isOpen && needsExpansion && !result,
    expandError,
  };
}
