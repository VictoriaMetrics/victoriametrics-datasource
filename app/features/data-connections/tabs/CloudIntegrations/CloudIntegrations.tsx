import { css } from '@emotion/css';
import { AppPluginLoader } from 'app/features/plugins/components/AppPluginLoader';
import { useStyles2 } from 'packages/grafana-ui/src';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

import { CLOUD_ONBOARDING_APP_ID, ROUTES } from '../../constants';

export function CloudIntegrations() {
  const s = useStyles2(getStyles);

  return (
    <div className={s.container}>
      <AppPluginLoader id={CLOUD_ONBOARDING_APP_ID} basePath={ROUTES.CloudIntegrations} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  // We would like to force the app to stay inside the provided tab
  container: css`
    position: relative;
  `,
});
