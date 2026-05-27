import { act, renderHook, waitFor } from '@testing-library/react';

import { PanelData, FieldType, toDataFrame } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';

import { useExportLabels } from './useExportLabels';

interface MockDatasource {
  uid: string;
  getTagKeys: jest.Mock;
}

type TagKeysResponse = Array<{ text: string }> | Error;

function makeDatasource(responses: TagKeysResponse[]): MockDatasource {
  let call = 0;
  const getTagKeys = jest.fn(async () => {
    const r = responses[call++ % responses.length];
    if (r instanceof Error) {
      throw r;
    }
    return r;
  });
  return { uid: 'ds-uid', getTagKeys };
}

function tags(...names: string[]): Array<{ text: string }> {
  return names.map((text) => ({ text }));
}

function makePanelData(labelKeys: string[]): PanelData {
  return {
    series: [
      toDataFrame({
        fields: [
          {
            name: 'Value',
            type: FieldType.number,
            values: [1],
            labels: Object.fromEntries(labelKeys.map((k) => [k, 'v'])),
          },
        ],
      }),
    ],
  } as unknown as PanelData;
}

const baseArgs = {
  selectors: ['foo'],
};

describe('useExportLabels', () => {
  it('does not fetch when modal is closed', () => {
    const ds = makeDatasource([tags('job')]);
    renderHook(() =>
      useExportLabels({
        datasource: ds as unknown as PrometheusDatasource,
        isOpen: false,
        isCsv: true,
        ...baseArgs,
      })
    );
    expect(ds.getTagKeys).not.toHaveBeenCalled();
  });

  it('does not fetch when CSV tab is not active', () => {
    const ds = makeDatasource([tags('job')]);
    renderHook(() =>
      useExportLabels({
        datasource: ds as unknown as PrometheusDatasource,
        isOpen: true,
        isCsv: false,
        ...baseArgs,
      })
    );
    expect(ds.getTagKeys).not.toHaveBeenCalled();
  });

  it('fetches labels via getTagKeys per selector and default-selects all of them', async () => {
    const ds = makeDatasource([tags('job', 'instance', '__name__')]);
    const { result } = renderHook(() =>
      useExportLabels({
        datasource: ds as unknown as PrometheusDatasource,
        isOpen: true,
        isCsv: true,
        ...baseArgs,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(ds.getTagKeys).toHaveBeenCalledWith({ series: ['foo'] });
    // __name__ is filtered out; results are sorted.
    expect(result.current.availableLabels.map((l) => l.value)).toEqual(['instance', 'job']);
    expect(result.current.selectedLabels).toEqual(['instance', 'job']);
  });

  it('passes all selectors to getTagKeys in a single call so requests fan out in parallel', async () => {
    const ds = makeDatasource([tags('a', 'b')]);
    const { result } = renderHook(() =>
      useExportLabels({
        datasource: ds as unknown as PrometheusDatasource,
        isOpen: true,
        isCsv: true,
        selectors: ['foo', 'bar'],
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(ds.getTagKeys).toHaveBeenCalledTimes(1);
    expect(ds.getTagKeys).toHaveBeenCalledWith({ series: ['foo', 'bar'] });
    expect(result.current.availableLabels.map((l) => l.value)).toEqual(['a', 'b']);
  });

  it('preserves the user selection once setSelectedLabels is called and drops vanished labels on reload', async () => {
    const ds = makeDatasource([
      tags('job', 'instance', 'region'),
      tags('job', 'region'),
    ]);
    const { result, rerender } = renderHook(
      (props: { selectors: string[] }) =>
        useExportLabels({
          datasource: ds as unknown as PrometheusDatasource,
          isOpen: true,
          isCsv: true,
          selectors: props.selectors,
        }),
      { initialProps: { selectors: ['foo'] } }
    );

    await waitFor(() => expect(result.current.selectedLabels).toEqual(['instance', 'job', 'region']));

    act(() => result.current.setSelectedLabels(['instance', 'region']));
    expect(result.current.selectedLabels).toEqual(['instance', 'region']);

    rerender({ selectors: ['bar'] });
    await waitFor(() => expect(result.current.availableLabels.map((l) => l.value)).toEqual(['job', 'region']));

    // User selection is preserved, but 'instance' is dropped since it disappeared.
    expect(result.current.selectedLabels).toEqual(['region']);
  });

  it('falls back to panel-series labels when getTagKeys fails', async () => {
    const ds = makeDatasource([new Error('boom')]);
    const panelData = makePanelData(['env', 'service']);

    const { result } = renderHook(() =>
      useExportLabels({
        datasource: ds as unknown as PrometheusDatasource,
        isOpen: true,
        isCsv: true,
        ...baseArgs,
        panelData,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.availableLabels.map((l) => l.value)).toEqual(['env', 'service']);
    expect(result.current.selectedLabels).toEqual(['env', 'service']);
  });

  it('preserves the user selection across modal close/reopen', async () => {
    const ds = makeDatasource([tags('job'), tags('job', 'instance')]);

    const { result, rerender } = renderHook(
      (props: { isOpen: boolean }) =>
        useExportLabels({
          datasource: ds as unknown as PrometheusDatasource,
          isOpen: props.isOpen,
          isCsv: true,
          ...baseArgs,
        }),
      { initialProps: { isOpen: true } }
    );

    await waitFor(() => expect(result.current.selectedLabels).toEqual(['job']));
    act(() => result.current.setSelectedLabels([]));
    expect(result.current.selectedLabels).toEqual([]);

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    // Even when a newly-available label ('instance') appears after reopen, the
    // empty user selection is preserved — defaults do not re-apply.
    await waitFor(() => expect(result.current.availableLabels.map((l) => l.value)).toEqual(['instance', 'job']));
    expect(result.current.selectedLabels).toEqual([]);
  });
});
