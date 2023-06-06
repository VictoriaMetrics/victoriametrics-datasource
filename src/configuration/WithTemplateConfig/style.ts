import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: grid;
    gap: ${theme.spacing(1)};
  `,
  header: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
    
    h3 {margin: 0;}
  `,
});
