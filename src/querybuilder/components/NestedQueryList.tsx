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

import React from "react";

import { Stack } from "../../components/QueryEditor";
import { PrometheusDatasource } from "../../datasource";
import { PromVisualQuery, PromVisualQueryBinary } from "../types";

import { NestedQuery } from "./NestedQuery";

export interface Props {
  query: PromVisualQuery;
  datasource: PrometheusDatasource;
  onChange: (query: PromVisualQuery) => void;
  onRunQuery: () => void;
  showExplain: boolean;
}

export function NestedQueryList(props: Props) {
  const { query, datasource, onChange, onRunQuery, showExplain } = props;
  const nestedQueries = query.binaryQueries ?? [];

  const onNestedQueryUpdate = (index: number, update: PromVisualQueryBinary) => {
    const updatedList = [...nestedQueries];
    updatedList.splice(index, 1, update);
    onChange({ ...query, binaryQueries: updatedList });
  };

  const onRemove = (index: number) => {
    const updatedList = [...nestedQueries.slice(0, index), ...nestedQueries.slice(index + 1)];
    onChange({ ...query, binaryQueries: updatedList });
  };

  return (
    <Stack direction="column" gap={1}>
      {nestedQueries.map((nestedQuery, index) => (
        <NestedQuery
          key={index.toString()}
          nestedQuery={nestedQuery}
          index={index}
          onChange={onNestedQueryUpdate}
          datasource={datasource}
          onRemove={onRemove}
          onRunQuery={onRunQuery}
          showExplain={showExplain}
        />
      ))}
    </Stack>
  );
}
