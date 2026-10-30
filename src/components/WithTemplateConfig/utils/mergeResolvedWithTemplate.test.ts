import { TemplateSrv } from '@grafana/runtime';

import { mergeResolvedWithTemplate } from './mergeResolvedWithTemplate';

const templateSrv = { getVariables: () => [] } as unknown as TemplateSrv;

describe('mergeResolvedWithTemplate', () => {
  it('prepends the resolved template when the query references it', () => {
    expect(
      mergeResolvedWithTemplate({ expr: 'rate(up{f}[5m])', withTemplate: 'f = {a="b"}' }, templateSrv, [], 'd1')
    ).toBe('WITH(\n  f = {a="b"}\n)\nrate(up{f}[5m])');
  });

  it('returns the query unchanged when no template applies', () => {
    expect(mergeResolvedWithTemplate({ expr: 'up{f}' }, templateSrv, [], 'd1')).toBe('up{f}');
  });
});
