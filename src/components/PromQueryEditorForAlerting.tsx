// Copyright (c) 2022 Grafana Labs
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

import PromQueryField from "./PromQueryField";
import { PromQueryEditorProps } from "./types";

export function PromQueryEditorForAlerting(props: PromQueryEditorProps) {
  const { datasource, query, range, data, onChange, onRunQuery } = props;

  return (
    <PromQueryField
      datasource={datasource}
      query={query}
      onRunQuery={onRunQuery}
      onChange={onChange}
      history={[]}
      range={range}
      data={data}
      data-testid={testIds.editor}
    />
  );
}

export const testIds = {
  editor: "prom-editor-cloud-alerting",
};
