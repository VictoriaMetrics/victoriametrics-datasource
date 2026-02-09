import { lastValueFrom } from 'rxjs';

import { getBackendSrv } from '@grafana/runtime';

import { DashboardResponse } from '../types';


const getDashboardByUID = async (uid: string) => {
  const response: {data: DashboardResponse} = await lastValueFrom(getBackendSrv().fetch({
    url: `/api/dashboards/uid/${uid}`,
    method: 'GET',
  }));

  return response?.data;
}

export default getDashboardByUID
