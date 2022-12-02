// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-11-03: switch imports to @grafana/ui
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/grafana-datasource
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
import React, { ComponentProps } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { stylesFactory, useTheme2, ReactUtils, Field, Icon, PopoverContent, Tooltip } from '@grafana/ui';

import { Space } from './Space';

interface EditorFieldProps extends ComponentProps<typeof Field> {
  label: string;
  children: React.ReactElement;
  width?: number | string;
  optional?: boolean;
  tooltip?: PopoverContent;
}

export const EditorField: React.FC<EditorFieldProps> = (props) => {
  const { label, optional, tooltip, children, width, ...fieldProps } = props;

  const theme = useTheme2();
  const styles = getStyles(theme, width);

  // Null check for backward compatibility
  const childInputId = fieldProps?.htmlFor || ReactUtils?.getChildId(children);

  const labelEl = (
    <>
      <label className={styles.label} htmlFor={childInputId}>
        {label}
        {optional && <span className={styles.optional}> - optional</span>}
        {tooltip && (
          <Tooltip placement="top" content={tooltip} theme="info">
            <Icon name="info-circle" size="sm" className={styles.icon} />
          </Tooltip>
        )}
      </label>
      <Space v={0.5} />
    </>
  );

  return (
    <div className={styles.root}>
      <Field className={styles.field} label={labelEl} {...fieldProps}>
        {children}
      </Field>
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme2, width?: number | string) => {
  return {
    root: css({
      minWidth: theme.spacing(width ?? 0),
    }),
    label: css({
      fontSize: 12,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    optional: css({
      fontStyle: 'italic',
      color: theme.colors.text.secondary,
    }),
    field: css({
      marginBottom: 0, // GrafanaUI/Field has a bottom margin which we must remove
    }),
    icon: css({
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing(1),
      ':hover': {
        color: theme.colors.text.primary,
      },
    }),
  };
});
