import { AlertQuery } from 'app/types/unified-alerting-dto';
import { useMemo } from 'react';

import { getDataSourceSrv } from '@grafana/runtime';

export function useAlertQueriesStatus(queries: AlertQuery[]) {
  const allDataSourcesAvailable = useMemo(
    () => queries.every((query) => Boolean(getDataSourceSrv().getInstanceSettings(query.datasourceUid))),
    [queries]
  );

  return { allDataSourcesAvailable };
}
