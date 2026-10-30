import { TemplateSrv } from '@grafana/runtime';

import { getInlineWithTemplate, isWithTemplateReference, resolveWithTemplate } from './resolveWithTemplate';

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

  it('lets the dashboard variable apply to a query whose own withTemplate is empty', () => {
    expect(resolveWithTemplate({ withTemplate: '' }, templateSrvWith('v = up'), [], 'd1')).toBe('v = up');
    expect(resolveWithTemplate({ withTemplate: ' \n ' }, templateSrvWith('v = up'), [], 'd1')).toBe('v = up');
  });

  it('treats an empty withTemplate as a cleared template (Explore) instead of falling back to the legacy storage', () => {
    const legacy = [{ uid: 'explore', expr: 'l = up' }];
    expect(resolveWithTemplate({ withTemplate: '' }, templateSrvWith(), legacy, 'explore')).toBeUndefined();
    expect(resolveWithTemplate({ withTemplate: ' \n ' }, templateSrvWith(), legacy, 'explore')).toBeUndefined();
    expect(resolveWithTemplate({ withTemplate: undefined }, templateSrvWith(), legacy, 'explore')).toBe('l = up');
  });

  it('treats an empty dashboard variable as a cleared template instead of falling back to the legacy storage', () => {
    const legacy = [{ uid: 'd1', expr: 'l = up' }];
    expect(resolveWithTemplate({ withTemplate: '$withTemplate' }, templateSrvWith(''), legacy, 'd1')).toBeUndefined();
    expect(resolveWithTemplate({ withTemplate: '$withTemplate' }, templateSrvWith(' '), legacy, 'd1')).toBeUndefined();
    expect(resolveWithTemplate(undefined, templateSrvWith(''), legacy, 'd1')).toBeUndefined();
  });
});

describe('getInlineWithTemplate', () => {
  it('returns the trimmed template text and nothing for empty values or references', () => {
    expect(getInlineWithTemplate(' f = {a="b"} \n')).toBe('f = {a="b"}');
    expect(getInlineWithTemplate('   ')).toBeUndefined();
    expect(getInlineWithTemplate('')).toBeUndefined();
    expect(getInlineWithTemplate(undefined)).toBeUndefined();
    expect(getInlineWithTemplate('$withTemplate')).toBeUndefined();
  });
});
