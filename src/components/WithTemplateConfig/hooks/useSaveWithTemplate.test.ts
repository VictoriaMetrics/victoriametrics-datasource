import { act, renderHook } from '@testing-library/react';

import { CoreApp } from '@grafana/data';

import { PromQuery } from '../../../types';

import useSaveWithTemplate from './useSaveWithTemplate';

const updateDashboardVariable = jest.fn();

jest.mock('./useValidateExpr', () => ({
  __esModule: true,
  default: () => ({
    validateResult: { title: 'Valid', icon: 'check', color: 'green' },
    isValidExpr: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('./useUpdateDashboardVariable', () => ({
  ...jest.requireActual('./useUpdateDashboardVariable'),
  __esModule: true,
  default: () => ({ updateDashboardVariable }),
}));

const datasource = { withTemplates: [], withTemplatesUpdate: jest.fn() } as any;
const query: PromQuery = { refId: 'A', expr: 'rate(up{f})' };

const setup = (overrides: Record<string, unknown> = {}) => {
  const onQueryChange = jest.fn();
  const handleClose = jest.fn();
  const onDraftReset = jest.fn();
  const hook = renderHook(() =>
    useSaveWithTemplate({
      datasource,
      dashboardUID: 'explore',
      app: CoreApp.Explore,
      query,
      onQueryChange,
      onDraftReset,
      handleClose,
      ...overrides,
    })
  );
  return { ...hook, onQueryChange, handleClose };
};

describe('useSaveWithTemplate', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    updateDashboardVariable.mockResolvedValue(undefined);
  });

  it('stores the template in the query without confirmation and skips the dashboard in Explore', async () => {
    const { result, onQueryChange, handleClose } = setup();
    await act(() => result.current.handleSaveClick('f = {container="vmagent"}'));
    expect(result.current.showConfirm).toBe(false);
    expect(updateDashboardVariable).not.toHaveBeenCalled();
    expect(datasource.withTemplatesUpdate).not.toHaveBeenCalled();
    expect(onQueryChange).toHaveBeenCalledWith({
      refId: 'A',
      expr: 'rate(up{f})',
      withTemplate: 'f = {container="vmagent"}',
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it('keeps the dashboard variable flow outside Explore', async () => {
    const { result, onQueryChange } = setup({ app: CoreApp.Dashboard, dashboardUID: 'd1', panelId: 7 });
    await act(() => result.current.handleSaveClick('f = {a="b"}'));
    expect(result.current.showConfirm).toBe(true);
    expect(updateDashboardVariable).not.toHaveBeenCalled();
    await act(() => result.current.handleConfirmedSave());
    expect(updateDashboardVariable).toHaveBeenCalledWith('f = {a="b"}', { panelId: 7, refId: 'A' });
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, withTemplate: '$withTemplate' });
  });

  it('shows the backend error message of a failed dashboard save', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    updateDashboardVariable.mockRejectedValue({
      status: 403,
      statusText: 'Forbidden',
      data: { message: 'Access denied to this dashboard' },
      config: {},
    });
    const { result } = setup({ app: CoreApp.Dashboard, dashboardUID: 'd1' });
    await act(() => result.current.handleSaveClick('f = {a="b"}'));
    await act(() => result.current.handleConfirmedSave());
    expect(result.current.saveError).toBe('Access denied to this dashboard');
  });

  it('falls back to the status text when the backend error has no message', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    updateDashboardVariable.mockRejectedValue({ status: 502, statusText: 'Bad Gateway', data: '', config: {} });
    const { result } = setup({ app: CoreApp.Dashboard, dashboardUID: 'd1' });
    await act(() => result.current.handleSaveClick('f = {a="b"}'));
    await act(() => result.current.handleConfirmedSave());
    expect(result.current.saveError).toBe('Bad Gateway');
  });

  it('shows a non-conflict save error in the dialog', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    updateDashboardVariable.mockRejectedValue(new Error('boom'));
    const { result, handleClose } = setup({ app: CoreApp.Dashboard, dashboardUID: 'd1' });
    await act(() => result.current.handleSaveClick('f = {a="b"}'));
    await act(() => result.current.handleConfirmedSave());
    expect(result.current.saveError).toBe('boom');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.showConfirm).toBe(false);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
