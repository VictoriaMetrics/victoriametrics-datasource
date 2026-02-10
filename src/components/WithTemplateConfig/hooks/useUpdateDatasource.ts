import { useCallback } from 'react';
import { lastValueFrom } from 'rxjs';

import { DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { PromOptions } from '../../../types';

interface UpdateDatasourceArgs {
  datasourceUID: string;
  dashboardUID: string;
}

interface UpdateDatasourceResult {
  data: {
    datasource: DataSourceInstanceSettings<PromOptions>
  }
}

export default ({ datasourceUID, dashboardUID }: UpdateDatasourceArgs) => {
  const fetchDatasource = useCallback(async (method: 'GET' | 'PUT', data?: DataSourceInstanceSettings<PromOptions>) => {
    return await lastValueFrom(getBackendSrv().fetch({
      url: `/api/datasources/uid/${datasourceUID}`,
      method,
      data
    }))
  }, [datasourceUID])

  const getDatasourceBody = useCallback(async (value: string) => {
    const response = await fetchDatasource('GET')
    const data = response.data as DataSourceInstanceSettings<PromOptions>
    const withTemplates = data?.jsonData?.withTemplates || []
    const targetTemplate = withTemplates.find(t => t?.uid === dashboardUID)
    if (!targetTemplate) {
      withTemplates.push({ uid: dashboardUID, expr: value })
    } else {
      targetTemplate.expr = value
    }

    return {
      ...data,
      jsonData: {
        ...data.jsonData,
        withTemplates
      },
    }
  }, [dashboardUID, fetchDatasource])

  const updateDatasource = useCallback(async (value: string) => {
    const data = await getDatasourceBody(value)
    const response = await fetchDatasource('PUT', data) as UpdateDatasourceResult
    return response?.data?.datasource?.jsonData?.withTemplates || []
  }, [getDatasourceBody, fetchDatasource])

  return {
    updateDatasource
  }
}
