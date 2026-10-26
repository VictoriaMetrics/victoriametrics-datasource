import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('prefers the backend message of a fetch error', () => {
    expect(getErrorMessage({ status: 403, statusText: 'Forbidden', data: { message: 'Access denied' }, config: {} })).toBe(
      'Access denied'
    );
  });

  it('falls back to the status text and then to the status code', () => {
    expect(getErrorMessage({ status: 502, statusText: 'Bad Gateway', data: '', config: {} })).toBe('Bad Gateway');
    expect(getErrorMessage({ status: 500, data: '', config: {} })).toBe('Request failed with status 500');
  });

  it('handles Error instances and plain values', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('oops')).toBe('oops');
  });
});
