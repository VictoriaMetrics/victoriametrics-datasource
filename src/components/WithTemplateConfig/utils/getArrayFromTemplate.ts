import { WithTemplate } from '../types';

import splitByCommaOutsideBrackets from './splitByCommaOutsideBrackets';

export const getArrayFromTemplate = (template?: WithTemplate) => {
  if (!template) {return []}
  const { expr } = template
  const arr = splitByCommaOutsideBrackets(expr)

  return arr.filter(a => a.trim()).map(a => {
    const commentMatch = a.match(/#.*$/gm);
    const comment = commentMatch?.join('\n')?.trim() || ''

    const withoutComments = a.replace(/#.*$/gm, '')
    const variableMatch = withoutComments.match(/^\s*([A-Za-z_]\w*(?:\([^)]*\))?)\s*=/m);
    const variableName = variableMatch?.[1] || '';

    return {
      label: variableName,
      comment: comment.replace(/#\s?/gm, ''),
      value: a.replace(/#.*$/gm, '').trim(),
    }
  })
}

export const formatTemplateString = (expr: string) => {
  const arr = getArrayFromTemplate({ expr, uid: '' })
  const values = arr.map(a => a.value)
  return values.join(',\n')
}

export const mergeTemplateWithQuery = (query = '', template?: WithTemplate) => {
  const templateExpr = template?.expr
  if (!templateExpr) {return query}
  const labels = getArrayFromTemplate(template).map(a => a.label)
  const includesWithTemplate = labels.some(l => {
    if (!l) {return false}
    const name = l.replace(/(\w+)\(.*?\)/g, '$1')
    return query.includes(name)
  })
  if (!includesWithTemplate) {return query}
  return `WITH(
  ${formatTemplateString(templateExpr)}
)
${query}`
}
