import { Alert } from 'packages/grafana-ui/src';
import React from 'react';

import { selectors as e2eSelectors } from '@grafana/e2e-selectors';

export const readOnlyMessage =
  'This data source was added by config and cannot be modified using the UI. Please contact your server admin to update this data source.';

export function DataSourceReadOnlyMessage() {
  return (
    <Alert aria-label={e2eSelectors.pages.DataSource.readOnly} severity="info" title="Provisioned data source">
      {readOnlyMessage}
    </Alert>
  );
}
