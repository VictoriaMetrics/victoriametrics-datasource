import { renderHook } from '@testing-library/react';
import { of } from 'rxjs';

import { BackendSrvRequest, FetchResponse, getBackendSrv, setBackendSrv } from '@grafana/runtime';

import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { DashboardResponse } from '../types';

import useUpdateDashboardVariable from './useUpdateDashboardVariable';

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

const fetchMock = jest.fn((_options: BackendSrvRequest) => {
  return of({ data: makeDashboardResponse() } as unknown as FetchResponse);
});

setBackendSrv({
  ...getBackendSrv(),
  fetch: fetchMock,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useUpdateDashboardVariable', () => {
  it('keeps the dashboard in its folder and drops the numeric id when saving the WITH template', async () => {
    const { result } = renderHook(() => useUpdateDashboardVariable('dashboard-uid'));

    await result.current.updateDashboardVariable('up{job="foo"}');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const postRequest = fetchMock.mock.calls[1][0];
    expect(postRequest.url).toBe('/api/dashboards/db');
    expect(postRequest.method).toBe('POST');
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
});
