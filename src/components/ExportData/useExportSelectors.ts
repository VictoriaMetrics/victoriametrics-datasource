import { useCallback, useEffect, useMemo, useState } from 'react';

import { PanelData } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';

import { useExpandedExpr } from './useExpandedExpr';
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

/** Vector selectors of the query to export and which of them the user keeps selected */
export function useExportSelectors(
  datasource: PrometheusDatasource,
  query: PromQuery,
  panelData: PanelData | undefined,
  isOpen: boolean
): UseExportSelectorsResult {
  const { expr, isLoading, expandError } = useExpandedExpr(datasource, query, panelData?.request, isOpen);
  const validSelectors = useMemo(() => extractMetricSelectors(expr), [expr]);
  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSelectors(validSelectors.map((s) => s.selector));
  }, [validSelectors]);

  const toggleSelector = useCallback((selector: string) => {
    setSelectedSelectors((prev) =>
      prev.includes(selector) ? prev.filter((s) => s !== selector) : [...prev, selector]
    );
  }, []);

  return { validSelectors, selectedSelectors, toggleSelector, isLoading, expandError };
}
