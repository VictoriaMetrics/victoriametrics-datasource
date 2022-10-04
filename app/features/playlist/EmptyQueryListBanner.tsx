import { css } from '@emotion/css';
import { useStyles2 } from 'packages/grafana-ui/src';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

export const EmptyQueryListBanner = () => {
  const styles = useStyles2(getStyles);
  return <div className={styles.noResult}>No playlist found!</div>;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    noResult: css`
      padding: ${theme.spacing(2)};
      background: ${theme.colors.secondary.main};
      font-style: italic;
      margin-top: ${theme.spacing(2)};
    `,
  };
};
