import { css } from '@emotion/css';
import { IconButton, useStyles } from 'packages/grafana-ui/src';
import React, { FC } from 'react';

import { GrafanaTheme } from '@grafana/data';

interface Props {
  labelKey: string;
  value: string;
  operator?: string;
  onRemoveLabel?: () => void;
}

export const AlertLabel: FC<Props> = ({ labelKey, value, operator = '=', onRemoveLabel }) => (
  <div className={useStyles(getStyles)}>
    {labelKey}
    {operator}
    {value}
    {!!onRemoveLabel && <IconButton name="times" size="xs" onClick={onRemoveLabel} />}
  </div>
);

export const getStyles = (theme: GrafanaTheme) => css`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.border.radius.sm};
  border: solid 1px ${theme.colors.border2};
  font-size: ${theme.typography.size.sm};
  background-color: ${theme.colors.bg2};
  font-weight: ${theme.typography.weight.bold};
  color: ${theme.colors.formLabel};
  display: inline-block;
  line-height: 1.2;
`;
