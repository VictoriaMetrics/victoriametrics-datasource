import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  body: css`
    display: grid;
    gap: ${theme.spacing(1)};
  `,
  button: css`
    display: flex;
    gap: ${theme.spacing(1)};
    justify-content: space-between;
    align-items: center;
  `
});
