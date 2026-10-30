import { TemplateSrv } from '@grafana/runtime';

import { PromQuery } from '../../../types';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';
import { WithTemplate } from '../types';

import { getWithTemplateVariableValue } from './getWithTemplateVariableValue';

export const WITH_TEMPLATE_VARIABLE_REFERENCE = `$${WITH_TEMPLATE_VARIABLE_NAME}`;

/**
 * Whether the query's withTemplate field references a dashboard variable rather than holding the template text.
 * Only `$withTemplate` is supported; any other `$...` value resolves to the same variable.
 */
export const isWithTemplateReference = (value: string | undefined): boolean => !!value && value.startsWith('$');

/**
 * The template text stored in the query itself (Explore), or undefined when the field is empty,
 * whitespace only or a variable reference.
 */
export const getInlineWithTemplate = (value: string | undefined): string | undefined => {
  const text = value?.trim();
  return text && !isWithTemplateReference(text) ? text : undefined;
};

/**
 * Whether the value is a template that was explicitly cleared: an empty or whitespace-only string,
 * as opposed to a missing value (undefined).
 */
export const isClearedWithTemplate = (value: string | undefined): boolean => value !== undefined && value.trim() === '';

/**
 * Resolves the WITH template text for a query: the template stored in the query itself (Explore) wins,
 * then the dashboard variable, then the legacy datasource storage keyed by dashboard uid (or app name).
 * A template cleared in the query or in the variable stays disabled: the legacy storage is consulted
 * only when neither of them holds a value.
 */
export const resolveWithTemplate = (
  query: Pick<PromQuery, 'withTemplate'> | undefined,
  templateSrv: TemplateSrv,
  withTemplates: WithTemplate[],
  dashboardUID: string
): string | undefined => {
  const variableValue = getWithTemplateVariableValue(templateSrv);
  const template = getInlineWithTemplate(query?.withTemplate) || variableValue?.trim();
  if (template) {
    return template;
  }
  if (isClearedWithTemplate(query?.withTemplate) || isClearedWithTemplate(variableValue)) {
    return undefined;
  }
  return withTemplates.find(t => t.uid === dashboardUID)?.expr;
};
