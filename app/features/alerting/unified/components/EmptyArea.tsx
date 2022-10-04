import { css } from '@emotion/css';
import { useStyles } from 'packages/grafana-ui/src';
import React, { FC } from 'react';

import { GrafanaTheme } from '@grafana/data';

export const EmptyArea: FC = ({ children }) => {
  const styles = useStyles(getStyles);

  return <div className={styles.container}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    container: css`
      background-color: ${theme.colors.bg2};
      color: ${theme.colors.textSemiWeak};
      padding: ${theme.spacing.xl};
      text-align: center;
    `,
  };
};
