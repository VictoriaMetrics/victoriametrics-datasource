// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: switch imports to @grafana/ui
// A detailed history of changes can be seen this - https://github.com/VictoriaMetrics/grafana-datasource
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

import { css, cx } from '@emotion/css';
import React, { useState } from 'react';
import { GroupBase } from 'react-select';

import { GrafanaTheme2 } from '@grafana/data';
import {
  stylesFactory,
  useTheme2,
  Select,
  SelectContainerProps,
  SelectContainer as BaseSelectContainer,
  SelectCommonProps
} from '@grafana/ui';

interface InlineSelectProps<T> extends SelectCommonProps<T> {
  label?: string;
}

export function InlineSelect<T>({ label: labelProp, ...props }: InlineSelectProps<T>) {
  const theme = useTheme2();
  const [id] = useState(() => Math.random().toString(16).slice(2));
  const styles = getSelectStyles(theme);
  const components = {
    SelectContainer,
    ValueContainer,
    SingleValue: ValueContainer,
  };

  return (
    <div className={styles.root}>
      {labelProp && (
        <label className={styles.label} htmlFor={id}>
          {labelProp}
          {':'}&nbsp;
        </label>
      )}
      {/* @ts-ignore */}
      <Select openMenuOnFocus inputId={id} {...props} components={components} />
    </div>
  );
}

const SelectContainer = <Option, isMulti extends boolean, Group extends GroupBase<Option>>(
  props: SelectContainerProps<Option, isMulti, Group>
) => {
  const { children } = props;

  const theme = useTheme2();
  const styles = getSelectStyles(theme);

  return (
    <BaseSelectContainer {...props} className={cx(props.className, styles.container)}>
      {children}
    </BaseSelectContainer>
  );
};

const ValueContainer = <Option, isMulti extends boolean, Group extends GroupBase<Option>>(
  props: SelectContainerProps<Option, isMulti, Group>
) => {
  const { className, children } = props;
  const theme = useTheme2();
  const styles = getSelectStyles(theme);

  return <div className={cx(className, styles.valueContainer)}>{children}</div>;
};

const getSelectStyles = stylesFactory((theme: GrafanaTheme2) => ({
  root: css({
    display: 'flex',
    fontSize: 12,
    alignItems: 'center',
  }),

  label: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),

  container: css({
    background: 'none',
    borderColor: 'transparent',
  }),

  valueContainer: css({
    display: 'flex',
    alignItems: 'center',
    flex: 'initial',
    color: theme.colors.text.secondary,
    fontSize: 12,
  }),
}));
