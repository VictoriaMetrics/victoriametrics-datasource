import { renderHook } from '@testing-library/react';

import { PrometheusDatasource } from '../../datasource';

import { ExportOptions } from './types';
import { useExportUrl } from './useExportUrl';

const datasource = { uid: 'ds-uid' } as PrometheusDatasource;

const baseOptions: ExportOptions = {
  format: 'json',
  timestampFormat: 'unix_s',
  customLayout: 'YYYY-MM-DDThh:mm:ss.SSSZ',
};

const START_MS = 1_700_000_000_000;
const END_MS = 1_700_003_600_000;

describe('useExportUrl', () => {
  it('returns canExport=false and empty url when there are no selectors', () => {
    const { result } = renderHook(() =>
      useExportUrl({
        datasource,
        selectors: [],
        options: baseOptions,
        selectedLabels: [],
        startMs: START_MS,
        endMs: END_MS,
      })
    );

    expect(result.current.canExport).toBe(false);
    expect(result.current.exportUrl).toBe('');
    expect(result.current.exportFileName).toBe('');
  });

  it('builds a JSON export URL with match[] params and unix seconds for the range', () => {
    const { result } = renderHook(() =>
      useExportUrl({
        datasource,
        selectors: ['foo{bar="baz"}'],
        options: baseOptions,
        selectedLabels: [],
        startMs: START_MS,
        endMs: END_MS,
      })
    );

    expect(result.current.canExport).toBe(true);
    expect(result.current.exportUrl).toContain('api/datasources/uid/ds-uid/resources/api/v1/export?');
    const query = result.current.exportUrl.split('?')[1];
    const params = new URLSearchParams(query);
    expect(params.getAll('match[]')).toEqual(['foo{bar="baz"}']);
    expect(params.get('start')).toBe(String(START_MS / 1000));
    expect(params.get('end')).toBe(String(END_MS / 1000));
    expect(params.get('format')).toBeNull();
    expect(result.current.exportFileName).toMatch(/^export-\d+\.jsonl$/);
  });

  it('builds a CSV export URL with format= encoding the timestamp format and selected labels', () => {
    const { result } = renderHook(() =>
      useExportUrl({
        datasource,
        selectors: ['metric'],
        options: { ...baseOptions, format: 'csv', timestampFormat: 'rfc3339' },
        selectedLabels: ['job', 'instance'],
        startMs: START_MS,
        endMs: END_MS,
      })
    );

    expect(result.current.exportUrl).toContain('/api/v1/export/csv?');
    const params = new URLSearchParams(result.current.exportUrl.split('?')[1]);
    expect(params.get('format')).toBe('__timestamp__:rfc3339,__name__,job,instance,__value__');
    expect(result.current.exportFileName).toMatch(/^export-\d+\.csv$/);
  });

  it('appends one match[] per selector and encodes the selector list in the multi-selector file name', () => {
    const { result } = renderHook(() =>
      useExportUrl({
        datasource,
        selectors: ['metric_a', 'metric_b{job="api"}'],
        options: baseOptions,
        selectedLabels: [],
        startMs: START_MS,
        endMs: END_MS,
      })
    );

    const params = new URLSearchParams(result.current.exportUrl.split('?')[1]);
    expect(params.getAll('match[]')).toEqual(['metric_a', 'metric_b{job="api"}']);
    // File name encodes each selector and joins with `_`.
    expect(result.current.exportFileName).toMatch(/^export-metric_a_metric_b%7Bjob%3D%22api%22%7D-\d+\.jsonl$/);
  });
});
