// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-10: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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
import React from 'react';

import { useStyles2 } from '@grafana/ui';

import { testIds } from '../../components/PromQueryEditor';
import PromQueryField from '../../components/PromQueryField';
import { PromQueryEditorProps } from '../../components/types';

import { PromQueryBuilderExplained } from './PromQueryBuilderExplained';

type Props = PromQueryEditorProps & {
  showExplain: boolean;
};

export function PromQueryCodeEditor(props: Props) {
  const { query, datasource, range, onRunQuery, onChange, data, app, showExplain } = props;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      <PromQueryField
        datasource={datasource}
        query={query}
        range={range}
        onRunQuery={onRunQuery}
        onChange={onChange}
        history={[]}
        data={data}
        data-testid={testIds.editor}
        app={app}
      />

      {showExplain && <PromQueryBuilderExplained query={query.expr} />}
    </div>
  );
}

const getStyles = () => {
  return {
    // This wrapper styling can be removed after the old PromQueryEditor is removed.
    // This is removing margin bottom on the old legacy inline form styles
    wrapper: css`
      .gf-form {
        margin-bottom: 0;
      }
    `,
  };
};
