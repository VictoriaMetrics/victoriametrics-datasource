import { IconName } from "@grafana/ui";

export const generalFolderTitle = "General"

export const withTemplateTip = `The WITH templates settings section allows you to create global templates 
and variables (with template expressions) that can be used in specific dashboards to create flexible 
and adaptive queries for metrics.`

export const withTemplatePlaceholder = `commonFilters = {instance=~"$node:$port",job=~"$job"},
cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu))`

export const infoTab = {
  id: "info",
  label: "How it works",
  icon: "info-circle" as IconName,
}
