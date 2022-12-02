// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: switch imports to @grafana/ui
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

import { Switch } from '@grafana/ui';

// Wrapper component around <Switch /> that properly aligns it in <EditorField />
export const EditorSwitch: React.FC<ComponentProps<typeof Switch>> = (props) => {
  const styles = getStyles();

  return (
    <div className={styles.switch}>
      <Switch {...props} />
    </div>
  );
};

const getStyles = () => {
  return {
    switch: css({
      display: 'flex',
      alignItems: 'center',
      minHeight: 30,
    }),
  };
};
