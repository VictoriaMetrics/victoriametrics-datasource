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

const TMP_ID = 'tmp_victoriametrics_prettify_query';

const GRAFANA_VARIABLES = [
  "$__interval",
  "$__interval_ms",
  "$__range",
  "$__range_s",
  "$__range_ms",
  "$__rate_interval",
];

const GRAFANA_VARIABLES_TPM = new Map(
  GRAFANA_VARIABLES.map((variable) => {
    const value = variable.replace('$', TMP_ID);
    return [variable, value];
  })
);

const PrettifyQuery: FC<Props> = ({
  datasource,
  query,
  onChange
}) => {
  const [loading, setLoading] = useState(false);

  const handleClickPrettify = async () => {
    if (loading) {return;}

    let expr = query.expr || '';
    if (!expr.trim()) {
      console.warn('Query expression is empty');
      return;
    }

    setLoading(true);
    try {
      // Replace grafana variables with temporary values
      GRAFANA_VARIABLES.forEach((variable) => {
        const tmpValue = GRAFANA_VARIABLES_TPM.get(variable);
        if (tmpValue) {
          expr = expr.split(variable).join(tmpValue);
        }
      });

      const response = await datasource.prettifyRequest(expr);
      const { data } = response;

      if (data?.status === ResponseStatus.Success && data.query) {
        let prettifiedQuery = data.query;

        // Replace temporary values with grafana variables
        GRAFANA_VARIABLES.forEach((variable) => {
          const replaceValue = GRAFANA_VARIABLES_TPM.get(variable);
          if (replaceValue) {
            prettifiedQuery = prettifiedQuery.split(replaceValue).join(variable);
          }
        });

        onChange({ ...query, expr: prettifiedQuery });
      } else {
        console.error(`Error prettifying query: ${data?.status || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error prettifying query:', e);
    }

    setLoading(false);
  };

  return (
    <IconButton
      key="prettify"
      name={loading ? 'fa fa-spinner' : 'brackets-curly'}
      tooltip="Prettify query"
      disabled={loading}
      onClick={handleClickPrettify}
    />
  );
};

export default memo(PrettifyQuery);
