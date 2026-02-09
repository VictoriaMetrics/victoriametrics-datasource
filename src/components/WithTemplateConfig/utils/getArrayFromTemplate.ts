import { WithTemplate } from '../types';

import splitByCommaOutsideBrackets from './splitByCommaOutsideBrackets';

export const getArrayFromTemplate = (template?: WithTemplate) => {
  if (!template) {return []}
  const { expr } = template
  const arr = splitByCommaOutsideBrackets(expr)

  return arr.filter(a => a).map(a => {
    const commentMatch = a.match(/#.*\n/gm);
    const comment = commentMatch?.join('')?.trim() || ''

    const variableMatch = a.match(/(.*?)=/);
    const variableName = variableMatch?.[0]?.slice(0, -2) || '';

    return {
      label: `${variableName}`,
      comment: comment.replace(/#/gm, ''),
      value: a.replace(comment, '').trim(),
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
    // remove arguments for functions
    const name = l.replace(/(\w+)\(.*?\)/g, '$1')
    return query.includes(name)
  })
  if (!includesWithTemplate) {return query}
  return `WITH(
  ${formatTemplateString(templateExpr)}
)
${query}`
}
