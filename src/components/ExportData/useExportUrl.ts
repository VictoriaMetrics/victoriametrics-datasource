import { useMemo } from 'react';

import { PrometheusDatasource } from '../../datasource';

import { FILE_FORMATS } from './constants';
import { ExportOptions } from './types';
import { buildCsvFormatString, buildExportParams, generateExportFileName, toUnixSeconds } from './utils';

interface UseExportUrlArgs {
  datasource: PrometheusDatasource;
  selectors: string[];
  options: ExportOptions;
  selectedLabels: string[];
  startMs: number;
  endMs: number;
}

interface UseExportUrlResult {
  exportUrl: string;
  exportFileName: string;
  canExport: boolean;
}

export function useExportUrl({
  datasource,
  selectors,
  options,
  selectedLabels,
  startMs,
  endMs,
}: UseExportUrlArgs): UseExportUrlResult {
  return useMemo<UseExportUrlResult>(() => {
    const canExport = selectors.length > 0;
    if (!canExport) {
      return { exportUrl: '', exportFileName: '', canExport };
    }
    const formatConfig = FILE_FORMATS[options.format];
    const csvFormat =
      options.format === 'csv'
        ? buildCsvFormatString({
          timestampFormat: options.timestampFormat,
          customLayout: options.customLayout,
          selectedLabels,
        })
        : undefined;
    const params = buildExportParams(
      selectors,
      toUnixSeconds(startMs),
      toUnixSeconds(endMs),
      options.format,
      csvFormat
    );
    return {
      exportUrl: `api/datasources/uid/${datasource.uid}/resources/${formatConfig.apiPath}?${params.toString()}`,
      exportFileName: generateExportFileName(selectors, Date.now(), formatConfig.ext),
      canExport,
    };
  }, [datasource.uid, selectors, startMs, endMs, options, selectedLabels]);
}
