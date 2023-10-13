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

import { GrafanaTheme2, toOption } from '@grafana/data';
import { IconButton, Select, useStyles2 } from '@grafana/ui';

import { EditorRows, FlexItem } from '../../components/QueryEditor';
import { AutoSizeInput } from "../../components/QueryEditor/AutoSizeInput";
import { PrometheusDatasource } from '../../datasource';
import { binaryScalarDefs } from '../binaryScalarOperations';
import { PromVisualQueryBinary } from '../types';

import { PromQueryBuilder } from './PromQueryBuilder';

export interface Props {
  nestedQuery: PromVisualQueryBinary;
  datasource: PrometheusDatasource;
  index: number;
  onChange: (index: number, update: PromVisualQueryBinary) => void;
  onRemove: (index: number) => void;
  onRunQuery: () => void;
  showExplain: boolean;
}

export const NestedQuery = React.memo<Props>((props) => {
  const { nestedQuery, index, datasource, onChange, onRemove, onRunQuery, showExplain } = props;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.name}>Operator</div>
        <Select
          width="auto"
          options={operators}
          value={toOption(nestedQuery.operator)}
          onChange={(value) => {
            onChange(index, {
              ...nestedQuery,
              operator: value.value!,
            });
          }}
        />
        <div className={styles.name}>Vector matches</div>
        <div className={styles.vectorMatchWrapper}>
          <Select<PromVisualQueryBinary['vectorMatchesType']>
            width="auto"
            value={nestedQuery.vectorMatchesType || 'on'}
            allowCustomValue
            options={[
              { value: 'on', label: 'on' },
              { value: 'ignoring', label: 'ignoring' },
            ]}
            onChange={(val) => {
              onChange(index, {
                ...nestedQuery,
                vectorMatchesType: val.value,
              });
            }}
          />
          <AutoSizeInput
            className={styles.vectorMatchInput}
            minWidth={20}
            defaultValue={nestedQuery.vectorMatches}
            onCommitChange={(evt) => {
              onChange(index, {
                ...nestedQuery,
                vectorMatches: evt.currentTarget.value,
                vectorMatchesType: nestedQuery.vectorMatchesType || 'on',
              });
            }}
          />
        </div>
        <FlexItem grow={1} />
        <IconButton aria-label="" name="times" size="sm" onClick={() => onRemove(index)} />
      </div>
      <div className={styles.body}>
        <EditorRows>
          <PromQueryBuilder
            showExplain={showExplain}
            query={nestedQuery.query}
            datasource={datasource}
            onRunQuery={onRunQuery}
            onChange={(update) => {
              onChange(index, { ...nestedQuery, query: update });
            }}
          />
        </EditorRows>
      </div>
    </div>
  );
});

const operators = binaryScalarDefs.map((def) => ({ label: def.sign, value: def.sign }));

NestedQuery.displayName = 'NestedQuery';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    card: css({
      label: 'card',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    header: css({
      label: 'header',
      padding: theme.spacing(0.5, 0.5, 0.5, 1),
      gap: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
    }),
    name: css({
      label: 'name',
      whiteSpace: 'nowrap',
    }),
    body: css({
      label: 'body',
      paddingLeft: theme.spacing(2),
    }),
    vectorMatchInput: css({
      label: 'vectorMatchInput',
      marginLeft: -1,
    }),
    vectorMatchWrapper: css({
      label: 'vectorMatchWrapper',
      display: 'flex',
    }),
  };
};
