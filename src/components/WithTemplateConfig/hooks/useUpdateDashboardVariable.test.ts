import { DATASOURCE_TYPE } from '../../../consts';

import { migrateWithTemplateQueries } from './useUpdateDashboardVariable';

describe('migrateWithTemplateQueries', () => {
  it('migrates empty references to the variable but keeps inline templates', () => {
    const panels = [
      { datasource: { type: DATASOURCE_TYPE }, targets: [{ withTemplate: undefined }, { withTemplate: '$withTemplate' }, { withTemplate: 'f = {a="b"}' }] },
      { panels: [{ targets: [{ datasource: { type: DATASOURCE_TYPE }, withTemplate: '' }, { datasource: { type: 'other' }, withTemplate: '' }] }] },
    ];
    migrateWithTemplateQueries(panels as any);
    expect(panels[0].targets!.map((t) => t.withTemplate)).toEqual(['$withTemplate', '$withTemplate', 'f = {a="b"}']);
    expect(panels[1].panels![0].targets.map((t) => t.withTemplate)).toEqual(['$withTemplate', '']);
  });

  it('treats a whitespace-only template as missing', () => {
    const panels = [{ datasource: { type: DATASOURCE_TYPE }, targets: [{ withTemplate: ' \n ' }] }];
    migrateWithTemplateQueries(panels as any);
    expect(panels[0].targets[0].withTemplate).toBe('$withTemplate');
  });

  it('switches the edited query to the variable even when it holds an inline template', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }, { refId: 'B', withTemplate: 'g = up' }] },
      { panels: [{ id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'h = up' }] }] },
    ];
    migrateWithTemplateQueries(panels as any, { panelId: 2, refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets!.map((t) => t.withTemplate)).toEqual(['f = {a="b"}', 'g = up']);
    expect(panels[1].panels![0].targets[0].withTemplate).toBe('$withTemplate');
  });

  it('recognises the edited query by refId and template text when the panel id is unknown', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }, { refId: 'B', withTemplate: 'f = {a="b"}' }] },
      { id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'g = up' }] },
    ];
    migrateWithTemplateQueries(panels as any, { refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets.map((t) => t.withTemplate)).toEqual(['$withTemplate', 'f = {a="b"}']);
    expect(panels[1].targets[0].withTemplate).toBe('g = up');
  });

  it('leaves every candidate untouched when the panel id is unknown and several queries match', () => {
    const panels = [
      { id: 1, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }] },
      { panels: [{ id: 2, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: 'f = {a="b"}' }] }] },
      { id: 3, datasource: { type: DATASOURCE_TYPE }, targets: [{ refId: 'A', withTemplate: '' }] },
    ];
    migrateWithTemplateQueries(panels as any, { refId: 'A', withTemplate: 'f = {a="b"}' });
    expect(panels[0].targets![0].withTemplate).toBe('f = {a="b"}');
    expect(panels[1].panels![0].targets[0].withTemplate).toBe('f = {a="b"}');
    expect(panels[2].targets![0].withTemplate).toBe('$withTemplate');
  });
});
