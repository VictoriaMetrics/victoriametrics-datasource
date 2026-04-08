import { useCallback } from 'react';
import { lastValueFrom } from 'rxjs';

import { getBackendSrv } from '@grafana/runtime';

import { DATASOURCE_TYPE } from '../../../consts';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { DashboardResponse, DashboardVariable } from '../types';

const VARIABLE_REFERENCE = `$${WITH_TEMPLATE_VARIABLE_NAME}`;

interface DashboardPanel {
  datasource?: { type?: string };
  targets?: Array<{ withTemplate?: string; datasource?: { type?: string } }>;
  panels?: DashboardPanel[];
}

// Migrate all queries of our datasource type to reference the dashboard variable
function migrateWithTemplateQueries(panels: DashboardPanel[] | undefined): void {
  if (!panels) { return }
  for (const panel of panels) {
    // Handle row panels with nested panels
    if (panel.panels) {
      migrateWithTemplateQueries(panel.panels);
    }
    if (!panel.targets) { continue }
    for (const target of panel.targets) {
      const dsType = target.datasource?.type || panel.datasource?.type;
      if (dsType === DATASOURCE_TYPE && target.withTemplate !== VARIABLE_REFERENCE) {
        target.withTemplate = VARIABLE_REFERENCE;
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
  const updateDashboardVariable = useCallback(async (value: string) => {
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

      // Migrate all queries to reference the dashboard variable
      migrateWithTemplateQueries(dashboardWithoutId.panels as DashboardPanel[] | undefined);

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
