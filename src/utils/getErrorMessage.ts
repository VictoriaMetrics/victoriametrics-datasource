import { isFetchError } from '@grafana/runtime';

/**
 * Human-readable message of a thrown value. getBackendSrv().fetch rejects with a plain FetchError object,
 * so `instanceof Error` alone would render it as "[object Object]".
 */
export function getErrorMessage(e: unknown): string {
  if (isFetchError(e)) {
    return e.data?.message || e.statusText || `Request failed with status ${e.status}`;
  }
  return e instanceof Error ? e.message : String(e);
}
