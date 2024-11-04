import React, { FC, useState, memo } from 'react';

import { IconButton } from "@grafana/ui";

import { PrometheusDatasource } from '../datasource';
import { PromQuery } from "../types";

interface Props {
  datasource: PrometheusDatasource;
  query: PromQuery;
  onChange: (update: PromQuery) => void;
}

enum ResponseStatus {
  Success = 'success',
  Error = 'error'
}

const GRAFANA_VARIABLES = [
  "$__interval",
  "$__interval_ms",
  "$__range",
  "$__range_s",
  "$__range_ms",
  "$__rate_interval",
];

interface GrafanaVariableReplacer {
  variable: string;
  defaultWindow: string;
}

const PrettifyQuery: FC<Props> = ({
  datasource,
  query,
  onChange
}) => {
  const [loading, setLoading] = useState(false);


  const handleClickPrettify = async () => {
    setLoading(true)
    try {
      let { expr } = query;
      let grafanaVariables = [] as GrafanaVariableReplacer[];
      GRAFANA_VARIABLES.forEach((variable, idx) => {
        const regex = new RegExp(`\\[(\\${variable})\\]\\)`, 'g');
        if (regex.test(expr)) {
          expr = expr.replace(regex, `[${idx+1}i])`);
          grafanaVariables.push({
            variable,
            defaultWindow: `${idx+1}i`,
          })
        }
      });
      const refId = query.refId;
      const response = await datasource.prettifyRequest(expr);
      const { data, status } = response
      if (data?.status === ResponseStatus.Success) {
        let { query } = data;
        if (grafanaVariables.length > 0) {
            grafanaVariables.forEach(grafanaVariable => {
              const regex = new RegExp(`\\[(${grafanaVariable.defaultWindow})\\]\\)`, 'g');
              query = query.replace(regex, `[${grafanaVariable.variable}])`);
            });
        }
        onChange({ ...query, expr: query, refId: refId });
      } else {
        console.error(`Error requesting /prettify-query, status: ${status}`)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <IconButton
      key="run"
      name={loading ? 'fa fa-spinner' : 'brackets-curly'}
      tooltip={'Prettify query'}
      disabled={loading}
      onClick={handleClickPrettify}
    />
  );
};

export default memo(PrettifyQuery);
