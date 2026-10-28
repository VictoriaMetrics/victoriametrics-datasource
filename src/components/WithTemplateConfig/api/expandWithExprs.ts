import { PrometheusDatasource } from '../../../datasource';
import { getErrorMessage } from '../../../utils/getErrorMessage';

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

/** A successful expansion of `query` */
interface ExpandedQuery {
  query: string;
  expandedExpr: string;
}

/** A failed expansion of `query` */
interface FailedExpansion {
  query: string;
  error: string;
}

/** Outcome of one expansion attempt, keyed by the query text it was requested for */
export type ExpandWithExprsResult = ExpandedQuery | FailedExpansion;

/**
 * Expands the query and normalises the outcome. The promise never rejects: a rejected request
 * and an error status both become a `FailedExpansion`, so callers never inspect the raw response.
 */
export const expandQuery = (datasource: PrometheusDatasource, query: string): Promise<ExpandWithExprsResult> =>
  expandWithExprs(datasource, query)
    .then((response): ExpandWithExprsResult =>
      response.status === 'success' && response.expr
        ? { query, expandedExpr: response.expr }
        : { query, error: response.error || 'Unable to expand WITH templates' }
    )
    .catch((e: unknown): ExpandWithExprsResult => ({ query, error: getErrorMessage(e) }));
