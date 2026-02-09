import React, { useMemo } from "react";

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

const isTracingData = (data: any): data is TracingData => {
  return data && typeof data === "object" && "message" in data && "duration_msec" in data;
}

export const TraceView = React.memo<Props>(({ query, data, datasource }) => {
  const traces = useMemo(() => {
    const traceSeries = data?.series.filter((item) =>
      item.refId === query.refId && item.meta?.custom?.resultType === "trace" && isTracingData(item.meta?.custom?.trace));
    return traceSeries
      ?.map((item) => item.meta?.custom?.trace)
      .filter(isTracingData)
      .map((item) => new Trace(item, query.expr));
  }, [data, query.expr, query.refId]);

  if (!traces || traces.length === 0) {
    return null;
  }

  return (
    <Stack gap={0} direction={"column"}>
      {traces.map((trace, idx) => <TraceItem key={idx} trace={trace} id={idx} queryExpr={query.expr} />)}
    </Stack>
  );
});

TraceView.displayName = "TraceView";
