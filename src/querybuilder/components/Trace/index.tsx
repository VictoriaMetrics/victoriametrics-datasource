import React, { useEffect, useState } from 'react';

import { DataQueryRequest, DataQueryResponse, PanelData } from "@grafana/data";

import { Stack } from "../../../components/QueryEditor";
import { PrometheusDatasource } from "../../../datasource";
import { PromQuery, TracingData } from "../../../types";

import NestedNav from "./NestedNav/NestedNav";
import Trace from "./Trace";

interface Props {
  query: PromQuery;
  datasource: PrometheusDatasource;
  data?: PanelData;
}

export const TraceView = React.memo<Props>(({ query, data, datasource }) => {
  const [trace, setTrace] = useState<Trace | null>(null)

  useEffect(() => {
    const fetch = async () => {
      if (!data?.request) {
        setTrace(null)
        return
      }

      const observable = datasource.query(data.request as DataQueryRequest<PromQuery>)
      observable.subscribe((val: DataQueryResponse) => {
        const index = val?.data?.findIndex((item) => item.refId === query.refId)
        // @ts-ignore
        const traceArray = val?.trace || []
        const traceData = traceArray[index] as TracingData
        if (traceData && index !== -1) {
          setTrace(new Trace(traceData, query.expr))
        } else {
          setTrace(null)
        }
      })
    }
    fetch()
  }, [data, datasource, query])

  if (!trace) {return null}

  return (
    <Stack gap={0.5} direction="column">
      <nav>
        <NestedNav
          trace={trace}
          totalMsec={trace.duration}
        />
      </nav>
    </Stack>
  );
});

TraceView.displayName = 'TraceView';
