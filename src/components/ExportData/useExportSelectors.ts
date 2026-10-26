import { useCallback, useEffect, useMemo, useState } from 'react';

import { PanelData } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { expandWithExprs } from '../WithTemplateConfig/api/expandWithExprs';
import { mergeTemplateWithQuery } from '../WithTemplateConfig/utils/getArrayFromTemplate';
import { resolveWithTemplate } from '../WithTemplateConfig/utils/resolveWithTemplate';

import { extractMetricSelectors, MetricSelector } from './utils';

interface UseExportSelectorsResult {
  validSelectors: MetricSelector[];
  selectedSelectors: string[];
  toggleSelector: (selector: string) => void;
  /** True while VictoriaMetrics expands the WITH templates of the query */
  isLoading: boolean;
  /** Why the WITH templates could not be expanded, null otherwise */
  expandError: string | null;
}

interface Expansion {
  /** The query the expansion was requested for, so a stale response is never applied to a newer query */
  source: string;
  expr: string;
  error: string | null;
}

/**
 * Vector selectors of the query to export. A query that uses a WITH template cannot be parsed locally
 * (`up{f}` has no meaning without the template), so it is expanded by VictoriaMetrics first.
 */
export function useExportSelectors(
  datasource: PrometheusDatasource,
  query: PromQuery,
  panelData: PanelData | undefined,
  isOpen: boolean
): UseExportSelectorsResult {
  const { expr, withTemplate } = query;
  const request = panelData?.request;

  const { resolvedExpr, needsExpansion } = useMemo(() => {
    const templateSrv = datasource.getTemplateSrv();
    const scopeUID = request?.dashboardUID || request?.app || '';
    const templateExpr = resolveWithTemplate({ withTemplate }, templateSrv, datasource.withTemplates, scopeUID);
    const template = templateExpr ? { uid: scopeUID, expr: templateExpr } : undefined;
    const merged = mergeTemplateWithQuery(expr, template);
    return {
      resolvedExpr: templateSrv.replace(merged, request?.scopedVars),
      needsExpansion: merged !== expr,
    };
  }, [datasource, expr, withTemplate, request]);

  const [expansion, setExpansion] = useState<Expansion | null>(null);

  useEffect(() => {
    if (!isOpen || !needsExpansion) {
      return;
    }
    let cancelled = false;
    expandWithExprs(datasource, resolvedExpr)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.status === 'success' && response.expr) {
          setExpansion({ source: resolvedExpr, expr: response.expr, error: null });
        } else {
          setExpansion({ source: resolvedExpr, expr: '', error: response.error || 'Unable to expand WITH templates' });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setExpansion({ source: resolvedExpr, expr: '', error: getErrorMessage(e) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [datasource, resolvedExpr, needsExpansion, isOpen]);

  const currentExpansion = needsExpansion && expansion?.source === resolvedExpr ? expansion : null;
  const isLoading = isOpen && needsExpansion && !currentExpansion;
  const exprToParse = needsExpansion ? (currentExpansion?.expr ?? '') : resolvedExpr;

  const validSelectors = useMemo(() => extractMetricSelectors(exprToParse), [exprToParse]);

  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSelectors(validSelectors.map((s) => s.selector));
  }, [validSelectors]);

  const toggleSelector = useCallback((selector: string) => {
    setSelectedSelectors((prev) =>
      prev.includes(selector) ? prev.filter((s) => s !== selector) : [...prev, selector]
    );
  }, []);

  return {
    validSelectors,
    selectedSelectors,
    toggleSelector,
    isLoading,
    expandError: currentExpansion?.error ?? null,
  };
}
