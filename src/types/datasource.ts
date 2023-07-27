import { DataQuery, DataQueryRequest } from '@grafana/data';

export interface ExtendedDataQueryRequest<TQuery extends DataQuery = DataQuery> extends DataQueryRequest<TQuery> {
  dashboardUID?: string;
}
