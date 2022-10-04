import { css } from '@emotion/css';
import { useStyles2, Stack } from 'packages/grafana-ui/src';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

interface Props {
  children: React.ReactNode;
}

export function OperationsEditorRow({ children }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      <Stack gap={1}>{children}</Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    root: css({
      padding: theme.spacing(1, 1, 0, 1),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.borderRadius(1),
    }),
  };
};
