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
});
