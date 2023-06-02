import React, { FC, useCallback, useMemo, useState } from "react"

import { DataSourceApi } from "@grafana/data";
import { Collapse, HorizontalGroup, Icon, useStyles2 } from "@grafana/ui";

import TemplateEditor from "../TemplateEditor/TemplateEditor";
import { DashboardType, WithTemplate } from "../types";

import getStyles from "./style";

interface Props {
  index: number
  dashboard: DashboardType
  templates: WithTemplate[]
  datasource?: DataSourceApi
  onChange: (template: WithTemplate) => void
}

const DashboardItem: FC<Props> = ({ dashboard, index, templates, datasource, onChange }) => {
  const styles = useStyles2(getStyles);

  const template = useMemo(() => {
    return templates.find(t => t.uid === dashboard.uid) || { uid: dashboard.uid, expr: "" }
  }, [templates, dashboard])

  const [isOpen, setIsOpen] = useState(!index)
  const handleToggleOpen = () => setIsOpen(prev => !prev)

  const handleChange = useCallback((expr: string) => {
    onChange({ uid: dashboard.uid, expr })
  }, [onChange, dashboard.uid])

  const handleChangeExpression = (value: string) => {
    handleChange(value)
  }

  return (
    <Collapse
      isOpen={isOpen}
      onToggle={handleToggleOpen}
      className={styles.collapse(index)}
      label={(
        <HorizontalGroup spacing={"sm"} justify="space-between">
          <HorizontalGroup spacing={"sm"}>
            <Icon name={"apps"}/>
            <div>{dashboard.title}</div>
          </HorizontalGroup>
          <Icon name={isOpen ? "angle-up" : "angle-down"}/>
        </HorizontalGroup>
      )}
    >
    <div className={styles.template}>
      <div>
        {datasource && (
          <TemplateEditor value={template.expr} datasource={datasource} onChange={handleChangeExpression}/>
        )}
      </div>
    </div>
    </Collapse>
  )
}

export default DashboardItem
