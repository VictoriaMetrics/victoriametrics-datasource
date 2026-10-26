import { useCallback } from 'react';
import { lastValueFrom } from 'rxjs';

import { getBackendSrv, isFetchError } from '@grafana/runtime';

import { DATASOURCE_TYPE } from '../../../consts';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { DashboardResponse, DashboardVariable } from '../types';
import { isWithTemplateReference, WITH_TEMPLATE_VARIABLE_REFERENCE } from '../utils/resolveWithTemplate';

interface DashboardPanel {
  datasource?: { type?: string };
  targets?: Array<{ withTemplate?: string; datasource?: { type?: string } }>;
  panels?: DashboardPanel[];
}

// Point all queries of our datasource type that have no template or a variable reference at the dashboard variable;
// inline template texts (e.g. added from Explore) are kept as is
export function migrateWithTemplateQueries(panels: DashboardPanel[] | undefined): void {
  if (!panels) { return }
  for (const panel of panels) {
    // Handle row panels with nested panels
    if (panel.panels) {
      migrateWithTemplateQueries(panel.panels);
    }
    if (!panel.targets) { continue }
    for (const target of panel.targets) {
      const dsType = target.datasource?.type || panel.datasource?.type;
      if (dsType === DATASOURCE_TYPE && (!target.withTemplate || isWithTemplateReference(target.withTemplate))) {
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
          // Grafana moves a dashboard posted without folderUid to the root folder,
          // so send back the folder the dashboard was loaded from. See
          // https://archive.grafana.com/docs/grafana/v12.3/developers/http_api/dashboard/#create--update-dashboard
          folderUid: response.data.meta.folderUid,
          overwrite: false,
          message: 'Update WITH template variable',
        },
      }));
    } catch (error: unknown) {
      // Grafana 11-12 report a stale dashboard version with the documented 412 (status=version-mismatch):
      // https://archive.grafana.com/docs/grafana/v12.3/developers/http_api/dashboard/#create--update-dashboard
      // Grafana 13 serves this endpoint through the new dashboard API and responds with 409 instead:
      // https://github.com/grafana/grafana/blob/v13.2.2/pkg/api/dashboard.go#L544-L548
      if (isFetchError(error) && (error.status === 412 || error.status === 409)) {
        throw new DashboardVersionConflictError();
      }
      throw error;
    }
  }, [dashboardUID]);

  return { updateDashboardVariable };
};
