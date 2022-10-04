import { NotifierDTO } from 'app/types';

import { getBackendSrv } from '@grafana/runtime';

export function fetchNotifiers(): Promise<NotifierDTO[]> {
  return getBackendSrv().get(`/api/alert-notifiers`);
}
