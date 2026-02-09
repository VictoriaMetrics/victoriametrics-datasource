import { useCallback, useState } from "react";

import { PrometheusDatasource } from "../../../datasource";

export interface MetricMetadata {
  name: string;
  type: string;
  help: string;
}

interface MetadataApiResponse {
  [metric: string]: Array<{
    type: string;
    help: string;
    unit?: string;
  }>;
}

export const useFetchMetricsWithMetadata = (datasource: PrometheusDatasource) => {
  const [metrics, setMetrics] = useState<MetricMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metadataResponse, metricNamesResponse] = await Promise.all([
        datasource.getRequest('api/v1/metadata'),
        datasource.getRequest('api/v1/label/__name__/values'),
      ]);

      const metadata: MetadataApiResponse = metadataResponse.data || metadataResponse;
      const metricNames: string[] = metricNamesResponse.data || metricNamesResponse || [];

      const transformedData = mergeMetricsWithMetadata(metricNames, metadata);
      setMetrics(transformedData);
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [datasource]);

  return { metrics, isLoading, error, fetchMetadata };
};

const mergeMetricsWithMetadata = (metricNames: string[], metadata: MetadataApiResponse): MetricMetadata[] => {
  const result: MetricMetadata[] = [];
  const processedMetrics = new Set<string>();

  for (const [name, entries] of Object.entries(metadata)) {
    processedMetrics.add(name);
    for (const entry of entries) {
      result.push({
        name,
        type: entry.type || '',
        help: entry.help || '',
      });
    }
  }

  for (const name of metricNames) {
    if (!processedMetrics.has(name)) {
      result.push({
        name,
        type: '',
        help: '',
      });
    }
  }

  return result;
};