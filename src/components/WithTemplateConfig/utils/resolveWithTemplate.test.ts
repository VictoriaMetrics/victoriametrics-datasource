import { TemplateSrv } from '@grafana/runtime';

import { isWithTemplateReference, resolveWithTemplate } from './resolveWithTemplate';

const templateSrvWith = (value?: string) => ({
  getVariables: () => (value === undefined ? [] : [{ type: 'constant', name: 'withTemplate', current: { value } }]),
}) as unknown as TemplateSrv;

describe('resolveWithTemplate', () => {
  it('returns the template stored in the query (Explore) before anything else', () => {
    expect(
      resolveWithTemplate({ withTemplate: 'f = {a="b"}' }, templateSrvWith('v = up'), [{ uid: 'd1', expr: 'l = up' }], 'd1')
    ).toBe('f = {a="b"}');
  });

  it('treats a value starting with $ as a variable reference', () => {
    expect(isWithTemplateReference('$withTemplate')).toBe(true);
    expect(isWithTemplateReference('f = {a="b"}')).toBe(false);
    expect(isWithTemplateReference(undefined)).toBe(false);
    expect(resolveWithTemplate({ withTemplate: '$withTemplate' }, templateSrvWith('v = up'), [], 'd1')).toBe('v = up');
  });

  it('falls back to the legacy datasource storage keyed by dashboard uid', () => {
    expect(
      resolveWithTemplate({ withTemplate: '$withTemplate' }, templateSrvWith(), [{ uid: 'explore', expr: 'l = up' }], 'explore')
    ).toBe('l = up');
    expect(resolveWithTemplate(undefined, templateSrvWith(), [{ uid: 'd1', expr: 'l = up' }], 'd2')).toBeUndefined();
  });

  it('ignores an empty withTemplate value', () => {
    expect(resolveWithTemplate({ withTemplate: '' }, templateSrvWith('v = up'), [], 'd1')).toBe('v = up');
  });
});
