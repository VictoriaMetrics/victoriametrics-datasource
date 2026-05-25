import { useCallback, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { DataFrame, PanelData } from '@grafana/data';
import { ComboboxOption } from '@grafana/ui';

import { PrometheusDatasource } from '../../datasource';

interface UseExportLabelsArgs {
  datasource: PrometheusDatasource;
  isOpen: boolean;
  isCsv: boolean;
  selectors: string[];
  panelData?: PanelData;
}

interface UseExportLabelsResult {
  availableLabels: Array<ComboboxOption<string>>;
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  isLoading: boolean;
}

const SEPARATOR = '__separator__';

function collectSeriesLabels(series?: DataFrame[]): string[] {
  const labelSet = new Set<string>();
  series?.forEach((frame) => {
    frame.fields.forEach((field) => {
      if (field.labels) {
        Object.keys(field.labels).forEach((key) => {
          if (key !== '__name__') {
            labelSet.add(key);
          }
        });
      }
    });
  });
  return Array.from(labelSet).sort();
}

export function useExportLabels({
  datasource,
  isOpen,
  isCsv,
  selectors,
  panelData,
}: UseExportLabelsArgs): UseExportLabelsResult {
  const seriesLabels = useMemo(() => collectSeriesLabels(panelData?.series), [panelData?.series]);
  const [override, setOverride] = useState<string[] | null>(null);
  const shouldFetch = isOpen && isCsv && selectors.length > 0;
  const selectorsKey = selectors.join(SEPARATOR);

  const {
    value: fetchedLabels,
    loading: isLoading,
    error: fetchError,
  } = useAsync(async (): Promise<string[]> => {
    if (!shouldFetch) {
      return [];
    }
    const tags = (await datasource.getTagKeys({ series: selectors })) as Array<{ text: string }>;
    const labelSet = new Set<string>();
    tags.forEach(({ text }) => {
      if (text !== '__name__') {
        labelSet.add(text);
      }
    });
    return Array.from(labelSet).sort();
  }, [datasource, shouldFetch, selectorsKey]);

  const availableValues = useMemo<string[]>(() => {
    const fromApi = fetchedLabels ?? [];
    if (fetchError || (!isLoading && fromApi.length === 0 && seriesLabels.length > 0)) {
      return seriesLabels;
    }
    return fromApi;
  }, [fetchedLabels, seriesLabels, fetchError, isLoading]);

  const availableLabels = useMemo<Array<ComboboxOption<string>>>(
    () => availableValues.map((label) => ({ label, value: label })),
    [availableValues]
  );

  const selectedLabels = useMemo<string[]>(() => {
    if (override === null) {
      return availableValues;
    }
    const availableSet = new Set(availableValues);
    return override.filter((l) => availableSet.has(l));
  }, [availableValues, override]);

  const setSelectedLabels = useCallback((labels: string[]) => {
    setOverride(labels);
  }, []);

  return { availableLabels, selectedLabels, setSelectedLabels, isLoading };
}
