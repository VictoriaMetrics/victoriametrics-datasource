import { WithTemplate } from "../types";

import splitByCommaOutsideBrackets from "./splitByCommaOutsideBrackets";

export const getArrayFromTemplate = (template?: WithTemplate) => {
  if (!template) {return []}
  const { expr } = template
  const arr = splitByCommaOutsideBrackets(expr)
  return arr.filter(a => a).map(a => ({
    label: a.split("=")[0].trim().replace(/\(.+\)/, ""),
    value: a.trim()
  }))
}

export const formatTemplateString = (expr: string) => {
  const arr = getArrayFromTemplate({ expr, uid: '' })
  const values = arr.map(a => a.value)
  return values.join(',\n')
}

export const mergeTemplateWithQuery = (query = "", template?: WithTemplate) => {
  const templateExpr = template?.expr
  if (!templateExpr) {return query}
  const labels = getArrayFromTemplate(template).map(a => a.label)
  const includesWithTemplate = labels.some(l => query.includes(l))
  if (!includesWithTemplate) {return query}
  return `WITH(
  ${formatTemplateString(templateExpr)}
)
${query}`
}
