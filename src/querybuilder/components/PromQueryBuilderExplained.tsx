// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-10: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
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
import metricsqlGrammar from "../../metricsql";
import { promQueryModeller } from "../PromQueryModeller";
import { buildVisualQueryFromString } from "../parsing";
import { OperationExplainedBox } from "../shared/OperationExplainedBox";
import { OperationListExplained } from "../shared/OperationListExplained";
import { RawQuery } from "../shared/RawQuery";
import { PromVisualQuery } from "../types";

export const EXPLAIN_LABEL_FILTER_CONTENT = "Fetch all series matching metric name and label filters.";

export interface Props {
  query: string;
}

export const PromQueryBuilderExplained = React.memo<Props>(({ query }) => {
  const visQuery = buildVisualQueryFromString(query || "").query;
  const lang = { grammar: metricsqlGrammar, name: "promql" };

  return (
    <Stack gap={0.5} direction="column">
      <OperationExplainedBox
        stepNumber={1}
        title={<RawQuery query={`${visQuery.metric} ${promQueryModeller.renderLabels(visQuery.labels)}`} lang={lang} />}
      >
        {EXPLAIN_LABEL_FILTER_CONTENT}
      </OperationExplainedBox>
      <OperationListExplained<PromVisualQuery>
        stepNumber={2}
        queryModeller={promQueryModeller}
        query={visQuery}
        lang={lang}
      />
    </Stack>
  );
});

PromQueryBuilderExplained.displayName = "PromQueryBuilderExplained";
