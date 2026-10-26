import { useCallback } from 'react';
import { lastValueFrom } from 'rxjs';

import { getBackendSrv, isFetchError } from '@grafana/runtime';

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
  panelId?: number;
  refId?: string;
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
      const isEdited = edited?.panelId !== undefined && panel.id === edited.panelId && target.refId === edited.refId;
      if (isEdited || !getInlineWithTemplate(target.withTemplate)) {
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
