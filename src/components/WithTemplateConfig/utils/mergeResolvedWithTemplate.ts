import { TemplateSrv } from '@grafana/runtime';

import { PromQuery } from '../../../types';
import { WithTemplate } from '../types';

import { mergeTemplateWithQuery } from './getArrayFromTemplate';
import { resolveWithTemplate } from './resolveWithTemplate';

/**
 * The query text with its WITH template prepended, or the query unchanged when no template applies
 * to it. Combines the template lookup (query, dashboard variable, legacy storage) with the merge.
 */
export const mergeResolvedWithTemplate = (
  query: Pick<PromQuery, 'expr' | 'withTemplate'>,
  templateSrv: TemplateSrv,
  withTemplates: WithTemplate[],
  scopeUID: string
): string => {
  const templateExpr = resolveWithTemplate(query, templateSrv, withTemplates, scopeUID);
  const template = templateExpr ? { uid: scopeUID, expr: templateExpr } : undefined;
  return mergeTemplateWithQuery(query.expr, template);
};
