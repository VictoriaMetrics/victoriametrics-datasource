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
]

const DEFAULT_LOOKBEHIND_WINDOW = "1i"

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
      let grafanaVariable = '';
      GRAFANA_VARIABLES.forEach(variable => {
        const regex = new RegExp(`\\[(\\${variable})\\]`, 'g');
        if (regex.test(expr)) {
          expr = expr.replace(regex, `[${DEFAULT_LOOKBEHIND_WINDOW}]`);
          grafanaVariable = variable
          return;
        }
      });
      const response = await datasource.prettifyRequest(expr);
      const { data, status } = response
      if (data?.status === ResponseStatus.Success) {
        let { query } = data;
        if (grafanaVariable) {
            const regex = new RegExp(`\\[(${DEFAULT_LOOKBEHIND_WINDOW})\\]`, 'g');
            query = query.replace(regex, `[${grafanaVariable}]`);
        }
        onChange({ ...query, expr: query });
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
