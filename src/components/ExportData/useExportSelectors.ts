import { useCallback, useEffect, useMemo, useState } from 'react';

import { PanelData } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';

import { extractMetricSelectors, MetricSelector } from './utils';

interface UseExportSelectorsResult {
  validSelectors: MetricSelector[];
  selectedSelectors: string[];
  toggleSelector: (selector: string) => void;
}

export function useExportSelectors(
  datasource: PrometheusDatasource,
  query: PromQuery,
  panelData?: PanelData
): UseExportSelectorsResult {
  const resolvedExpr = useMemo(
    () => datasource.getTemplateSrv().replace(query.expr, panelData?.request?.scopedVars),
    [datasource, query.expr, panelData?.request?.scopedVars]
  );

  const validSelectors = useMemo(() => extractMetricSelectors(resolvedExpr), [resolvedExpr]);

  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSelectors(validSelectors.map((s) => s.selector));
  }, [validSelectors]);

  const toggleSelector = useCallback((selector: string) => {
    setSelectedSelectors((prev) =>
      prev.includes(selector) ? prev.filter((s) => s !== selector) : [...prev, selector]
    );
  }, []);

  return { validSelectors, selectedSelectors, toggleSelector };
}
