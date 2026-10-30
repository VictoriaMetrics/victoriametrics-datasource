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
  /** Id of the panel the query belongs to; may be unknown when the panel has not run its queries yet */
  panelId?: number;
  refId?: string;
  /** Current withTemplate value of the query, used to recognise its target when the panel id is unknown */
  withTemplate?: string;
}

type DashboardTarget = NonNullable<DashboardPanel['targets']>[number];

interface PanelTarget {
  panel: DashboardPanel;
  target: DashboardTarget;
}

// Every query of our datasource type across the panels, including the ones nested in rows
function collectTargets(panels: DashboardPanel[] | undefined, into: PanelTarget[] = []): PanelTarget[] {
  for (const panel of panels ?? []) {
    collectTargets(panel.panels, into);
    for (const target of panel.targets ?? []) {
      const dsType = target.datasource?.type || panel.datasource?.type;
      if (dsType === DATASOURCE_TYPE) {
        into.push({ panel, target });
      }
    }
  }
  return into;
}

// The targets of the edited query. Without a panel id the query is recognised by its refId and the identical
// inline template text, but only when exactly one target matches: refIds repeat across panels, so a wider
// match would also switch an unrelated panel carrying the same template
function findEditedTargets(entries: PanelTarget[], edited?: EditedTarget): DashboardTarget[] {
  if (!edited) {
    return [];
  }
  if (edited.panelId !== undefined) {
    return entries.filter(e => e.panel.id === edited.panelId && e.target.refId === edited.refId).map(e => e.target);
  }
  if (!edited.withTemplate) {
    return [];
  }
  const matches = entries.filter(e => e.target.refId === edited.refId && e.target.withTemplate === edited.withTemplate);
  return matches.length === 1 ? [matches[0].target] : [];
}

// Point all queries of our datasource type at the dashboard variable, except the ones holding an inline template
// text (e.g. added from Explore), which keep it; the edited query always switches to the variable
export function migrateWithTemplateQueries(panels: DashboardPanel[] | undefined, edited?: EditedTarget): void {
  const entries = collectTargets(panels);
  const editedTargets = new Set(findEditedTargets(entries, edited));
  for (const { target } of entries) {
    if (editedTargets.has(target) || !getInlineWithTemplate(target.withTemplate)) {
      target.withTemplate = WITH_TEMPLATE_VARIABLE_REFERENCE;
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
