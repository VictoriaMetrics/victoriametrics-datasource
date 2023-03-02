import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";
export default (theme: GrafanaTheme2) => ({
  header: css({
    display: 'grid',
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    marginTop: theme.spacing(2),
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  }),
  json: css({
    maxHeight: '50vh',
    overflow: 'auto'
  }),
});
