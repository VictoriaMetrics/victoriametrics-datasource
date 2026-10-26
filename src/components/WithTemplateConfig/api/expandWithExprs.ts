import { PrometheusDatasource } from '../../../datasource';

export interface ExpandWithExprsResponse {
  status: 'success' | 'error';
  /** The query with WITH templates expanded, present on success */
  expr?: string;
  error?: string;
}

/**
 * Asks VictoriaMetrics to expand the WITH templates of a query.
 * The request goes through datasource.getRequest so that it honours the configured HTTP method.
 */
export const expandWithExprs = (datasource: PrometheusDatasource, query: string): Promise<ExpandWithExprsResponse> =>
  datasource.getRequest('expand-with-exprs', { query, format: 'json' });
