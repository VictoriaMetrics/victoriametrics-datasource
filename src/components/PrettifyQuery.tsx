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

const PrettifyQuery: FC<Props> = ({
  datasource,
  query,
  onChange
}) => {
  const [loading, setLoading] = useState(false)

  const handleClickPrettify = async () => {
    setLoading(true)
    try {
      const response = await datasource.prettifyRequest(query.expr)
      const { data, status } = response
      if (data?.status === ResponseStatus.Success) {
        onChange({ ...query, expr: data.query });
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
