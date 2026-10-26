import { useCallback } from 'react';
import { lastValueFrom } from 'rxjs';

import { getBackendSrv } from '@grafana/runtime';

import { DATASOURCE_TYPE } from '../../../consts';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { DashboardResponse, DashboardVariable } from '../types';
import { getInlineWithTemplate, WITH_TEMPLATE_VARIABLE_REFERENCE } from '../utils/resolveWithTemplate';

interface DashboardPanel {
  id?: number;
  datasource?: { type?: string };
  targets?: Array<{ refId?: string; withTemplate?: string; datasource?: { type?: string } }>;
  panels?: DashboardPanel[];
}

/** The query whose template is being saved: its target switches to the variable even if it held an inline template */
export interface EditedTarget {
  /** Id of the panel the query belongs to; may be unknown when the panel has not run its queries yet */
  panelId?: number;
  refId?: string;
  /** Current withTemplate value of the query, used to recognise its target when the panel id is unknown */
  withTemplate?: string;
}

// Without a panel id the target is recognised by its refId and the identical inline template text:
// a match is the edited query itself or a copy of it carrying the template that is being replaced.
function isEditedTarget(panel: DashboardPanel, target: { refId?: string; withTemplate?: string }, edited?: EditedTarget): boolean {
  if (!edited || target.refId !== edited.refId) {
    return false;
  }
  if (edited.panelId !== undefined) {
    return panel.id === edited.panelId;
  }
  return !!edited.withTemplate && target.withTemplate === edited.withTemplate;
}

// Point all queries of our datasource type at the dashboard variable, except the ones holding an inline template
// text (e.g. added from Explore), which keep it; the edited query always switches to the variable
export function migrateWithTemplateQueries(panels: DashboardPanel[] | undefined, edited?: EditedTarget): void {
  if (!panels) { return }
  for (const panel of panels) {
    // Handle row panels with nested panels
    if (panel.panels) {
      migrateWithTemplateQueries(panel.panels, edited);
    }
    if (!panel.targets) { continue }
    for (const target of panel.targets) {
      const dsType = target.datasource?.type || panel.datasource?.type;
      if (dsType !== DATASOURCE_TYPE) { continue }
      if (isEditedTarget(panel, target, edited) || !getInlineWithTemplate(target.withTemplate)) {
        target.withTemplate = WITH_TEMPLATE_VARIABLE_REFERENCE;
      }
    }
  }
}

export class DashboardVersionConflictError extends Error {
  constructor() {
    super('Dashboard has been modified. Please save the dashboard first and try again.');
    this.name = 'DashboardVersionConflictError';
  }
}

export default (dashboardUID: string) => {
  const updateDashboardVariable = useCallback(async (value: string, edited?: EditedTarget) => {
    const response = await lastValueFrom(getBackendSrv().fetch<DashboardResponse>({
      url: `/api/dashboards/uid/${dashboardUID}`,
      method: 'GET',
    }));

    const { dashboard } = response.data;
    const variables: DashboardVariable[] = dashboard.templating?.list || [];

    const existingIndex = variables.findIndex(
      v => v.type === 'constant' && v.name === WITH_TEMPLATE_VARIABLE_NAME
    );

    const newVariable: DashboardVariable = {
      name: WITH_TEMPLATE_VARIABLE_NAME,
      type: 'constant',
      query: value,
      current: { value, text: value, selected: false },
      hide: 2,
      label: 'WITH Template',
      skipUrlSync: true,
    };

    if (existingIndex >= 0) {
      variables[existingIndex] = newVariable;
    } else {
      variables.push(newVariable);
    }

    try {
      // Remove numeric id to avoid conflicts with imported dashboards that may share the same id.
      // Grafana resolves the dashboard by uid when id is omitted.
      const { id: _, ...dashboardWithoutId } = dashboard;

      // Migrate the queries to reference the dashboard variable
      migrateWithTemplateQueries(dashboardWithoutId.panels as DashboardPanel[] | undefined, edited);

      await lastValueFrom(getBackendSrv().fetch({
        url: '/api/dashboards/db',
        method: 'POST',
        data: {
          dashboard: {
            ...dashboardWithoutId,
            templating: { list: variables },
          },
          overwrite: false,
          message: 'Update WITH template variable',
        },
      }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 412) {
        throw new DashboardVersionConflictError();
      }
      throw error;
    }
  }, [dashboardUID]);

  return { updateDashboardVariable };
};
