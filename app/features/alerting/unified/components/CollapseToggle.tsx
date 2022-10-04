import { css, cx } from '@emotion/css';
import { IconSize, useStyles2, Button } from 'packages/grafana-ui/src';
import React, { FC, HTMLAttributes } from 'react';

import { GrafanaTheme2 } from '@grafana/data';

interface Props extends HTMLAttributes<HTMLButtonElement> {
  isCollapsed: boolean;
  onToggle: (isCollapsed: boolean) => void;
  // Todo: this should be made compulsory for a11y purposes
  idControlled?: string;
  size?: IconSize;
  className?: string;
  text?: string;
}

export const CollapseToggle: FC<Props> = ({
  isCollapsed,
  onToggle,
  idControlled,
  className,
  text,
  size = 'xl',
  ...restOfProps
}) => {
  const styles = useStyles2(getStyles);

  return (
    <Button
      type="button"
      fill="text"
      aria-expanded={!isCollapsed}
      aria-controls={idControlled}
      className={cx(styles.expandButton, className)}
      icon={isCollapsed ? 'angle-right' : 'angle-down'}
      onClick={() => onToggle(!isCollapsed)}
      {...restOfProps}
    >
      {text}
    </Button>
  );
};

export const getStyles = (theme: GrafanaTheme2) => ({
  expandButton: css`
    color: ${theme.colors.text.secondary};
    margin-right: ${theme.spacing(1)};
  `,
});
