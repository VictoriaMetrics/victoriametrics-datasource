// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to 'components/QueryEditor'
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

import { css } from '@emotion/css';
import { uniqueId } from 'lodash';
import React, { HTMLProps, useRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Switch, useStyles2 } from '@grafana/ui';

import { Stack } from '../../components/QueryEditor';

export interface Props extends Omit<HTMLProps<HTMLInputElement>, 'value' | 'ref'> {
  value?: boolean;
  label: string;
}

export function QueryHeaderSwitch({ label, ...inputProps }: Props) {
  const dashedLabel = label.replace(' ', '-');
  const switchIdRef = useRef(uniqueId(`switch-${dashedLabel}`));
  const styles = useStyles2(getStyles);

  return (
    <Stack gap={1}>
      <label htmlFor={switchIdRef.current} className={styles.switchLabel}>
        {label}
      </label>
      <Switch {...inputProps} id={switchIdRef.current} />
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    switchLabel: css({
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      '&:hover': {
        color: theme.colors.text.primary,
      },
    }),
  };
};
