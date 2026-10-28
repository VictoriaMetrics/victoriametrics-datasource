import { PrometheusDatasource } from '../../../datasource';

import { expandQuery } from './expandWithExprs';

const getRequest = jest.fn();
const datasource = { getRequest } as unknown as PrometheusDatasource;

describe('expandQuery', () => {
  beforeEach(() => {
    getRequest.mockReset();
  });

  it('returns the expanded expression keyed by the requested query', async () => {
    getRequest.mockResolvedValue({ status: 'success', expr: 'up' });
    await expect(expandQuery(datasource, 'WITH(f = up) f')).resolves.toEqual({ query: 'WITH(f = up) f', expandedExpr: 'up' });
  });

  it('returns the VictoriaMetrics error on an error status', async () => {
    getRequest.mockResolvedValue({ status: 'error', error: 'cannot parse query' });
    await expect(expandQuery(datasource, 'f')).resolves.toEqual({ query: 'f', error: 'cannot parse query' });
  });

  it('falls back to a generic message when the error status carries no text', async () => {
    getRequest.mockResolvedValue({ status: 'success' });
    await expect(expandQuery(datasource, 'f')).resolves.toEqual({ query: 'f', error: 'Unable to expand WITH templates' });
  });

  it('turns a rejected request into an error instead of rejecting', async () => {
    getRequest.mockRejectedValue({ status: 502, statusText: 'Bad Gateway', data: '', config: {} });
    await expect(expandQuery(datasource, 'f')).resolves.toEqual({ query: 'f', error: 'Bad Gateway' });
  });
});
