import { css } from '@emotion/css';
import { AlertState } from 'app/plugins/datasource/alertmanager/types';

import { GrafanaTheme2 } from '@grafana/data';

export const getNotificationsTextColors = (theme: GrafanaTheme2) => ({
  [AlertState.Active]: css`
    color: ${theme.colors.error.text};
  `,
  [AlertState.Suppressed]: css`
    color: ${theme.colors.primary.text};
  `,
  [AlertState.Unprocessed]: css`
    color: ${theme.colors.secondary.text};
  `,
});
