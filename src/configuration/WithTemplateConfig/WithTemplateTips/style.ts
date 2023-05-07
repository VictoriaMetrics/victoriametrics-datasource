import { css } from '@emotion/css';

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  wrapper: css`
    padding: ${theme.spacing(2)} 0;
    max-width: 800px;
  `,
  section: css`
    margin: ${theme.spacing(2)} 0;
  `,
  paragraph: css`
    margin: ${theme.spacing(1)} 0;
    font-size: ${theme.typography.fontSize};
    line-height: 150%;
    
    ol {
      padding-left: ${theme.spacing(2)};
    }
  `,
});
