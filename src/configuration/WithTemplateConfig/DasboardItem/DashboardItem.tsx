import React, { FC, useCallback, useMemo, useState } from "react"

import { Collapse, HorizontalGroup, Icon, useStyles2 } from "@grafana/ui";

import TemplateEditor from "../TemplateEditor/TemplateEditor";
import { DashboardType, WithTemplate } from "../types";

import getStyles from "./style";

interface Props {
  index: number
  dashboard: DashboardType
  templates: WithTemplate[]
  onChange: (template: WithTemplate) => void
}

const DashboardItem: FC<Props> = ({ dashboard, index, templates, onChange }) => {
  const styles = useStyles2(getStyles);

  const template = useMemo(() => {
    return templates.find(t => t.uid === dashboard.uid) || { uid: dashboard.uid, expr: "" }
  }, [templates, dashboard])

  const [isOpen, setIsOpen] = useState(!index)
  const handleToggleOpen = () => setIsOpen(prev => !prev)

  const handleChange = useCallback((expr: string) => {
    onChange({ uid: dashboard.uid, expr })
  }, [onChange, dashboard.uid])

  const handleChangeExpression = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
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
        <TemplateEditor value={template.expr} onChange={handleChangeExpression}/>
      </div>
    </div>
    </Collapse>
  )
}

export default DashboardItem
