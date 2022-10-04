import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';

export const getPaginationStyles = (theme: GrafanaTheme2) => {
  return css`
    float: none;
    display: flex;
    justify-content: flex-start;
    margin: ${theme.spacing(2, 0)};
  `;
};
