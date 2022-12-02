// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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
import React, { useState, useEffect } from 'react';

import { GrafanaTheme2, PanelData, QueryHint } from '@grafana/data';
import { Button, Tooltip, useStyles2 } from '@grafana/ui';

import { PrometheusDatasource } from '../../datasource';

import { LokiAndPromQueryModellerBase, PromLokiVisualQuery } from './LokiAndPromQueryModellerBase';

export interface Props<T extends PromLokiVisualQuery> {
  query: T;
  datasource: PrometheusDatasource;
  queryModeller: LokiAndPromQueryModellerBase;
  buildVisualQueryFromString: (expr: string) => { query: T };
  onChange: (update: T) => void;
  data?: PanelData;
}

export const QueryBuilderHints = <T extends PromLokiVisualQuery>({
  datasource,
  query: visualQuery,
  onChange,
  data,
  queryModeller,
  buildVisualQueryFromString,
}: Props<T>) => {
  const [hints, setHints] = useState<QueryHint[]>([]);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    const query = { expr: queryModeller.renderQuery(visualQuery), refId: '' };
    // For now show only actionable hints
    const hints = datasource.getQueryHints(query, data?.series || []).filter((hint) => hint.fix?.action);
    setHints(hints);
  }, [datasource, visualQuery, data, queryModeller]);

  return (
    <>
      {hints.length > 0 && (
        <div className={styles.container}>
          {hints.map((hint) => {
            return (
              <Tooltip content={`${hint.label} ${hint.fix?.label}`} key={hint.type}>
                <Button
                  onClick={() => {
                    if (hint?.fix?.action) {
                      const query = { expr: queryModeller.renderQuery(visualQuery), refId: '' };
                      const newQuery = datasource.modifyQuery(query, hint.fix.action);
                      const newVisualQuery = buildVisualQueryFromString(newQuery.expr);
                      return onChange(newVisualQuery.query);
                    }
                  }}
                  fill="outline"
                  size="sm"
                  className={styles.hint}
                >
                  {'hint: ' + hint.fix?.action?.type.toLowerCase().replace('_', ' ') + '()'}
                </Button>
              </Tooltip>
            );
          })}
        </div>
      )}
    </>
  );
};

QueryBuilderHints.displayName = 'QueryBuilderHints';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      align-items: start;
    `,
    hint: css`
      margin-right: ${theme.spacing(1)};
    `,
  };
};
