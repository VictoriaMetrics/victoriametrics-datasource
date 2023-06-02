import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  message: css`
    display: flex;
    margin-top: ${theme.spacing(1)};
  `,
});
