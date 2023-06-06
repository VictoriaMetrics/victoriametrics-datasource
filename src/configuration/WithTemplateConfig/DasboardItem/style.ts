import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  collapse: (i: number) => css`
    margin: ${!i ? "0" : "-1px"} 0 0; 
    border-radius: 0;
  `,
  template: css`
    display: grid;
    gap: ${theme.spacing(1)};
  `,
});
