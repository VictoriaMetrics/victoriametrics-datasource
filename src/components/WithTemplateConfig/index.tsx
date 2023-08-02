import React, { FC, useCallback, useEffect, useState } from 'react'

import { Badge, Button, Modal, useStyles2 } from "@grafana/ui";

import { PrometheusDatasource } from "../../datasource";

import TemplateEditor from "./TemplateEditor/TemplateEditor";
import getDashboardByUID from "./api/getDashboardList";
import useUpdateDatasource from "./hooks/useUpdateDatasource";
import useValidateExpr from "./hooks/useValidateExpr";
import getStyles from "./style";
import { DashboardResponse, WithTemplate } from "./types";

interface Props {
  template?: WithTemplate;
  setTemplate: React.Dispatch<React.SetStateAction<WithTemplate | undefined>>
  datasource: PrometheusDatasource;
  dashboardUID: string;
}

const WithTemplateConfig: FC<Props> = ({ template, setTemplate, dashboardUID, datasource }) => {
  const styles = useStyles2(getStyles);

  const { validateResult, isValidExpr } = useValidateExpr(datasource.id)
  const { updateDatasource } = useUpdateDatasource({
    datasourceUID: datasource.uid,
    dashboardUID
  })

  const [value, setValue] = useState(template?.expr || "")
  const [dashboardResponse, setDashboardResponse] = useState<DashboardResponse | null>()
  const [isLoading, setIsLoading] = useState(false)

  const dashboardTitle = `${dashboardResponse?.dashboard?.title || "current"}`
  const dashboardFolder = `${dashboardResponse?.meta?.folderTitle || "General"}`

  const [showTemplates, setShowTemplates] = useState(false);
  const handleClose = () => setShowTemplates(false);
  const handleOpen = () => setShowTemplates(true);

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
  }, [value, isValidExpr, updateDatasource, datasource, dashboardUID, setTemplate])

  useEffect(() => {
    setTemplate(datasource.withTemplates.find(t => t.uid === dashboardUID))
  }, [setTemplate, datasource, dashboardUID])

  useEffect(() => {
    value && isValidExpr(value)
  }, [value, isValidExpr])

  useEffect(() => {
    setValue(template?.expr || "")
  }, [template])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardResponse = await getDashboardByUID(dashboardUID)
        setDashboardResponse(dashboardResponse)
      } catch (e) {
        console.error(e)
      }
    }
    if (dashboardUID) {fetchDashboard()}
  }, [dashboardUID]);

  return (
    <>
      <Button
        variant={'secondary'}
        size="sm"
        onClick={handleOpen}
        icon={"cog"}
      >
        WITH templates
      </Button>
      <Modal
        title={`${dashboardFolder} / ${dashboardTitle} / WITH templates`}
        isOpen={showTemplates}
        closeOnEscape={true}
        closeOnBackdropClick={false}
        onDismiss={handleClose}
      >
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
              href={"https://github.com/VictoriaMetrics/grafana-datasource#how-to-use-with-templates"} rel="noreferrer"
            >
              <Button
                variant={'secondary'}
                fill={"text"}
                icon={"book"}
                size={"sm"}
              >
                How it works?
              </Button>
            </a>
            <Button
              variant={'success'}
              onClick={handleSave}
              disabled={isLoading}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WithTemplateConfig;
