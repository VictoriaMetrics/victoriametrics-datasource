import { renderHook, waitFor } from '@testing-library/react';

import { PanelData } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';

import { useExportSelectors } from './useExportSelectors';

const getRequest = jest.fn();

const datasource = {
  withTemplates: [],
  getTemplateSrv: () => ({ replace: (s: string) => s, getVariables: () => [] }),
  getRequest,
} as unknown as PrometheusDatasource;

const panelData = { request: { app: 'explore', dashboardUID: '' } } as unknown as PanelData;

const render = (query: PromQuery, isOpen = true) =>
  renderHook(({ open }: { open: boolean }) => useExportSelectors(datasource, query, panelData, open), {
    initialProps: { open: isOpen },
  });

describe('useExportSelectors', () => {
  beforeEach(() => {
    getRequest.mockReset();
  });

  it('parses a query without WITH templates locally', () => {
    const { result } = render({ refId: 'A', expr: 'rate(up{job="a"}[5m])' });
    expect(result.current.validSelectors.map((s) => s.selector)).toEqual(['up{job="a"}']);
    expect(result.current.selectedSelectors).toEqual(['up{job="a"}']);
    expect(result.current.isLoading).toBe(false);
    expect(getRequest).not.toHaveBeenCalled();
  });

  it('expands the WITH template through VictoriaMetrics and parses the expanded query', async () => {
    getRequest.mockResolvedValue({ status: 'success', expr: 'rate(up{container="vmagent"}[5m])' });
    const { result } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container="vmagent"}' });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getRequest).toHaveBeenCalledWith('expand-with-exprs', {
      query: 'WITH(\n  f = {container="vmagent"}\n)\nrate(up{f}[5m])',
      format: 'json',
    });
    expect(result.current.validSelectors.map((s) => s.selector)).toEqual(['up{container="vmagent"}']);
    expect(result.current.expandError).toBeNull();
  });

  it('reports the VictoriaMetrics error when the template cannot be expanded', async () => {
    getRequest.mockResolvedValue({ status: 'error', error: 'cannot parse query' });
    const { result } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container=' });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.expandError).toBe('cannot parse query');
    expect(result.current.validSelectors).toEqual([]);
  });

  it('reports a failed request', async () => {
    getRequest.mockRejectedValue({ status: 502, statusText: 'Bad Gateway', data: '', config: {} });
    const { result } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container="vmagent"}' });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.expandError).toBe('Bad Gateway');
  });

  it('retries with the loading state when the modal is reopened after a failure', async () => {
    getRequest.mockResolvedValueOnce({ status: 'error', error: 'cannot parse query' });
    const { result, rerender } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container="vmagent"}' });
    await waitFor(() => expect(result.current.expandError).toBe('cannot parse query'));

    getRequest.mockResolvedValueOnce({ status: 'success', expr: 'rate(up{container="vmagent"}[5m])' });
    rerender({ open: false });
    rerender({ open: true });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.expandError).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.validSelectors.map((s) => s.selector)).toEqual(['up{container="vmagent"}']);
    expect(getRequest).toHaveBeenCalledTimes(2);
  });

  it('reuses a successful expansion when the modal is reopened', async () => {
    getRequest.mockResolvedValue({ status: 'success', expr: 'rate(up{container="vmagent"}[5m])' });
    const { result, rerender } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container="vmagent"}' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ open: false });
    rerender({ open: true });
    expect(result.current.isLoading).toBe(false);
    expect(getRequest).toHaveBeenCalledTimes(1);
  });

  it('does not expand while the modal is closed', () => {
    const { result } = render({ refId: 'A', expr: 'rate(up{f}[5m])', withTemplate: 'f = {container="vmagent"}' }, false);
    expect(result.current.isLoading).toBe(false);
    expect(getRequest).not.toHaveBeenCalled();
  });

  it('skips the expansion when the query does not reference the template', () => {
    const { result } = render({ refId: 'A', expr: 'rate(up[5m])', withTemplate: 'f = {container="vmagent"}' });
    expect(result.current.validSelectors.map((s) => s.selector)).toEqual(['up']);
    expect(getRequest).not.toHaveBeenCalled();
  });
});
