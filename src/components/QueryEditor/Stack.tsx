// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: switch imports to @grafana/ui
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { css } from '@emotion/css';
import React, { CSSProperties, useCallback } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

interface StackProps {
  direction?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  wrap?: boolean;
  gap?: number;
  flexGrow?: CSSProperties['flexGrow'];
  children?: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({ children, ...props }) => {
  const styles = useStyles2(useCallback((theme) => getStyles(theme, props), [props]));

  return <div className={styles.root}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme2, props: StackProps) => ({
  root: css({
    display: 'flex',
    flexDirection: props.direction ?? 'row',
    flexWrap: props.wrap ?? true ? 'wrap' : undefined,
    alignItems: props.alignItems,
    gap: theme.spacing(props.gap ?? 2),
    flexGrow: props.flexGrow,
  }),
});
