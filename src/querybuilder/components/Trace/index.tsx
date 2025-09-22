import React, { useMemo } from 'react';

import { PanelData } from "@grafana/data";

import { Stack } from "../../../components/QueryEditor";
import { PrometheusDatasource } from "../../../datasource";
import { PromQuery, TracingData } from "../../../types";

import Trace from "./Trace";
import { TraceItem } from "./TraceItem";

interface Props {
  query: PromQuery;
  datasource: PrometheusDatasource;
  data?: PanelData;
}

export const TraceView = React.memo<Props>(({ query, data, datasource }) => {
  const traces = useMemo(() => {
    const traceSeries = data?.series.filter((item) => item.refId === query.refId && item.meta?.custom?.resultType === 'trace');
    return traceSeries?.map((item) => {
      const tracingData = item.meta?.custom as TracingData;
      return new Trace(tracingData, query.expr);
    }) || null;
  }, [data, query.expr, query.refId]);

  if (!traces || traces.length === 0) {
    return null
  }

  return (
    <Stack gap={0} direction={"column"}>
      {traces.map((trace, idx) => <TraceItem key={idx} trace={trace} id={idx} queryExpr={query.expr}/>)}
    </Stack>
  );
});

TraceView.displayName = 'TraceView';
