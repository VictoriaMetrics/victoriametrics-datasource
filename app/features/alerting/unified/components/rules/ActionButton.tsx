import { css, cx } from '@emotion/css';
import { useStyles } from 'packages/grafana-ui/src';
import React, { FC } from 'react';

import { GrafanaTheme } from '@grafana/data';
import { Button, ButtonProps } from '@grafana/ui/components/Button';

type Props = Omit<ButtonProps, 'variant' | 'size'>;

export const ActionButton: FC<Props> = ({ className, ...restProps }) => (
  <Button variant="secondary" size="xs" className={cx(useStyles(getStyle), className)} {...restProps} />
);

export const getStyle = (theme: GrafanaTheme) => css`
  height: 24px;
  font-size: ${theme.typography.size.sm};
`;
