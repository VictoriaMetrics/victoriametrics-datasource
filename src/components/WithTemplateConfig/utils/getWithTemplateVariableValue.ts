import { TemplateSrv } from '@grafana/runtime';

import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';

/**
 * Read WITH template value from Grafana constant dashboard variable.
 */
export function getWithTemplateVariableValue(templateSrv: TemplateSrv): string | undefined {
  try {
    const variable = templateSrv.getVariables().find(
      v => v.type === 'constant' && v.name === WITH_TEMPLATE_VARIABLE_NAME
    );
    if (variable && 'current' in variable && typeof variable.current.value === 'string') {
      return variable.current.value;
    }
  } catch {
    // templateSrv.getVariables() may not be available in all contexts
  }
  return undefined;
}
