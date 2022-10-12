import { css } from '@emotion/css';
import { getMessageFromError } from 'app/core/utils/errors';
import { DashboardInitError, AppNotificationSeverity } from 'app/types';
import React from 'react';

import { GrafanaTheme } from '@grafana/data';
import { Alert, useStyles } from '@grafana/ui';

export interface Props {
  initError?: DashboardInitError;
}

export const DashboardFailed = ({ initError }: Props) => {
  const styles = useStyles(getStyles);
  if (!initError) {
    return null;
  }

  return (
    <div className={styles.dashboardLoading}>
      <Alert severity={AppNotificationSeverity.Error} title={initError.message}>
        {getMessageFromError(initError.error)}
      </Alert>
    </div>
  );
};

export const getStyles = (theme: GrafanaTheme) => {
  return {
    dashboardLoading: css`
      height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
  };
};
