import { renderHook } from '@testing-library/react';
import { Observable, of, throwError } from 'rxjs';

import { BackendSrvRequest, FetchResponse, getBackendSrv, setBackendSrv } from '@grafana/runtime';

import { DATASOURCE_TYPE } from '../../../consts';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { DashboardResponse } from '../types';

import useUpdateDashboardVariable, { DashboardVersionConflictError, migrateWithTemplateQueries } from './useUpdateDashboardVariable';

function makeDashboardResponse(): DashboardResponse {
  return {
    dashboard: {
      id: 42,
      uid: 'dashboard-uid',
      title: 'Test dashboard',
      uri: 'db/test-dashboard',
      url: '/d/dashboard-uid/test-dashboard',
      slug: 'test-dashboard',
      type: 'dash-db',
      tags: [],
      isStarred: false,
      sortMeta: 0,
      templating: { list: [] },
      panels: [],
    },
    meta: {
      folderTitle: 'Test folder',
      folderUid: 'folder-123',
      canEdit: true,
    },
  };
}

const respondWithDashboard = () => of({ data: makeDashboardResponse() } as unknown as FetchResponse);

const fetchMock = jest.fn<Observable<FetchResponse>, [BackendSrvRequest]>();

setBackendSrv({
  ...getBackendSrv(),
  fetch: fetchMock,
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(respondWithDashboard);
});

// Fails the POST that saves the dashboard; the GET that loads it keeps succeeding
function failSaveWith(status: number) {
  const error = { status, data: { message: `HTTP ${status}` } };
  fetchMock.mockImplementation((options) => (options.method === 'POST' ? throwError(() => error) : respondWithDashboard()));
  return error;
}

describe('useUpdateDashboardVariable', () => {
  it('keeps the dashboard in its folder and drops the numeric id when saving the WITH template', async () => {
    const { result } = renderHook(() => useUpdateDashboardVariable('dashboard-uid'));

    await result.current.updateDashboardVariable('up{job="foo"}');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const postRequest = fetchMock.mock.calls.map(([options]) => options).find((options) => options.method === 'POST')!;
    expect(postRequest.url).toBe('/api/dashboards/db');
    expect(postRequest.data.folderUid).toBe('folder-123');
    expect(postRequest.data.dashboard).not.toHaveProperty('id');
    expect(postRequest.data.dashboard.templating.list).toEqual([
      expect.objectContaining({
        name: WITH_TEMPLATE_VARIABLE_NAME,
        type: 'constant',
        query: 'up{job="foo"}',
        hide: 2,
        skipUrlSync: true,
      }),
    ]);
  });

  it.each([409, 412])('reports HTTP %i when saving as a dashboard version conflict', async (status) => {
    failSaveWith(status);

    const { result } = renderHook(() => useUpdateDashboardVariable('dashboard-uid'));

    await expect(result.current.updateDashboardVariable('up{job="foo"}')).rejects.toBeInstanceOf(
      DashboardVersionConflictError
    );
  });

  it('rethrows other save errors unchanged', async () => {
    const error = failSaveWith(403);

    const { result } = renderHook(() => useUpdateDashboardVariable('dashboard-uid'));

    await expect(result.current.updateDashboardVariable('up{job="foo"}')).rejects.toBe(error);
  });
});

describe('migrateWithTemplateQueries', () => {
  it('migrates empty references to the variable but keeps inline templates', () => {
    const panels = [
      { datasource: { type: DATASOURCE_TYPE }, targets: [{ withTemplate: undefined }, { withTemplate: '$withTemplate' }, { withTemplate: 'f = {a="b"}' }] },
      { panels: [{ targets: [{ datasource: { type: DATASOURCE_TYPE }, withTemplate: '' }, { datasource: { type: 'other' }, withTemplate: '' }] }] },
    ];
    migrateWithTemplateQueries(panels as any);
    expect(panels[0].targets!.map((t) => t.withTemplate)).toEqual(['$withTemplate', '$withTemplate', 'f = {a="b"}']);
    expect(panels[1].panels![0].targets.map((t) => t.withTemplate)).toEqual(['$withTemplate', '']);
  });

  it('treats a whitespace-only template as missing', () => {
    const panels = [{ datasource: { type: DATASOURCE_TYPE }, targets: [{ withTemplate: ' \n ' }] }];
    migrateWithTemplateQueries(panels as any);
    expect(panels[0].targets[0].withTemplate).toBe('$withTemplate');
  });

  it('switches the edited query to the variable even when it holds an inline template', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }, { refId: 'B', withTemplate: 'g = up' }] },
      { panels: [{ id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'h = up' }] }] },
    ];
    migrateWithTemplateQueries(panels as any, { panelId: 2, refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets!.map((t) => t.withTemplate)).toEqual(['f = {a="b"}', 'g = up']);
    expect(panels[1].panels![0].targets[0].withTemplate).toBe('$withTemplate');
  });

  it('recognises the edited query by refId and template text when the panel id is unknown', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }, { refId: 'B', withTemplate: 'f = {a="b"}' }] },
      { id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'g = up' }] },
    ];
    migrateWithTemplateQueries(panels as any, { refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets.map((t) => t.withTemplate)).toEqual(['$withTemplate', 'f = {a="b"}']);
    expect(panels[1].targets[0].withTemplate).toBe('g = up');
  });

  it('leaves every candidate untouched when the panel id is unknown and several queries match', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }] },
      { panels: [{ id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }] }] },
      { id: 3, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: '' }] },
    ];
    migrateWithTemplateQueries(panels as any, { refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets![0].withTemplate).toBe('f = {a="b"}');
    expect(panels[1].panels![0].targets[0].withTemplate).toBe('f = {a="b"}');
    expect(panels[2].targets![0].withTemplate).toBe('$withTemplate');
  });
});
