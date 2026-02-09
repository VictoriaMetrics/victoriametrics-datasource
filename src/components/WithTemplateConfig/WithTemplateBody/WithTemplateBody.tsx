import React, { FC, useCallback, useEffect, useState } from "react"

import { Badge, Button, useStyles2 } from "@grafana/ui";

import TemplateEditor from "../TemplateEditor/TemplateEditor";
import useUpdateDatasource from "../hooks/useUpdateDatasource";
import useValidateExpr from "../hooks/useValidateExpr";
import { WithTemplateConfigProps } from "../index";

import getStyles from "./style";

interface Props extends WithTemplateConfigProps {
  handleClose: () => void;
}

const WithTemplateBody: FC<Props> = ({ datasource, dashboardUID, template, setTemplate, handleClose }) => {
  const styles = useStyles2(getStyles);

  const { validateResult, isValidExpr } = useValidateExpr(datasource.uid)
  const { updateDatasource } = useUpdateDatasource({
    datasourceUID: datasource.uid,
    dashboardUID
  })

  const [value, setValue] = useState(template?.expr || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = useCallback(async () => {
    setIsLoading(true)
    const isValid = await isValidExpr(value)
    if (!isValid) {
      setIsLoading(false)
      return
    }
    try {
      const templates = await updateDatasource(value)
      datasource.withTemplatesUpdate(templates)
      setTemplate(templates.find(t => t?.uid === dashboardUID))
      handleClose()
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }, [value, isValidExpr, updateDatasource, datasource, dashboardUID, setTemplate, handleClose])

  useEffect(() => {
    setTemplate(datasource.withTemplates.find(t => t.uid === dashboardUID))
  }, [setTemplate, datasource, dashboardUID])

  useEffect(() => {
    value && isValidExpr(value)
  }, [value, isValidExpr])

  useEffect(() => {
    setValue(template?.expr || "")
  }, [template])

  return (
    <div className={styles.body}>
      <TemplateEditor
        initialValue={value}
        datasource={datasource}
        onChange={setValue}
      />
      <Badge
        icon={validateResult.icon || "info"}
        color={validateResult.color || "blue"}
        text={validateResult.error || validateResult.title}
      />
      <div className={styles.button}>
        <a
          className="text-link"
          target="_blank"
          href={"https://github.com/VictoriaMetrics/grafana-datasource#how-to-use-with-templates"}
          rel="noreferrer"
        >
          <Button
            variant={"secondary"}
            fill={"text"}
            icon={"book"}
            size={"sm"}
          >
            How it works?
          </Button>
        </a>
        <Button
          variant={"success"}
          onClick={handleSave}
          disabled={isLoading}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default WithTemplateBody;
