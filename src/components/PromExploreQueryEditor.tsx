// Copyright (c) 2022 Grafana Labs
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

import React, { memo, useEffect } from 'react';

import { QueryEditorProps, CoreApp } from '@grafana/data';

import { PrometheusDatasource } from '../datasource';
import { PromQuery, PromOptions } from '../types';

import { PromExploreExtraField } from './PromExploreExtraField';
import PromQueryField from './PromQueryField';

export type Props = QueryEditorProps<PrometheusDatasource, PromQuery, PromOptions>;

export const PromExploreQueryEditor = memo((props: Props) => {
  const { range, query, data, datasource, history, onChange, onRunQuery } = props;

  // Setting default values
  useEffect(() => {
    if (query.expr === undefined) {
      onChange({ ...query, expr: '' });
    }
    if (query.exemplar === undefined) {
      onChange({ ...query, exemplar: true });
    }

    // Override query type to "Both" only for new queries (no query.expr).
    if (!query.instant && !query.range && !query.expr) {
      onChange({ ...query, instant: true, range: true });
    }
  }, [onChange, query]);

  return (
    <PromQueryField
      app={CoreApp.Explore}
      datasource={datasource}
      query={query}
      range={range}
      onRunQuery={onRunQuery}
      onChange={onChange}
      onBlur={() => {}}
      history={history}
      data={data}
      data-testid={testIds.editor}
      ExtraFieldElement={
        <PromExploreExtraField query={query} onChange={onChange} datasource={datasource} onRunQuery={onRunQuery} />
      }
    />
  );
});

PromExploreQueryEditor.displayName = 'PromExploreQueryEditor';

export const testIds = {
  editor: 'prom-editor-explore',
};
