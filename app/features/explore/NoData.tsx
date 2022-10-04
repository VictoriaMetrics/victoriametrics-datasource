import { css } from '@emotion/css';
import { useStyles2, PanelContainer } from 'packages/grafana-ui/src';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

export const NoData = () => {
  const css = useStyles2(getStyles);
  return (
    <>
      <PanelContainer data-testid="explore-no-data" className={css.wrapper}>
        <span className={css.message}>{'No data'}</span>
      </PanelContainer>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    label: no-data-card;
    padding: ${theme.spacing(3)};
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.borderRadius(2)};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  `,
  message: css`
    font-size: ${theme.typography.h2.fontSize};
    padding: ${theme.spacing(4)};
    color: ${theme.colors.text.disabled};
  `,
});
