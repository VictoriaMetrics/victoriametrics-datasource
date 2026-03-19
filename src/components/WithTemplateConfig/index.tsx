import React, { FC, useEffect, useMemo, useState } from 'react'

import { CoreApp } from '@grafana/data';
import { IconButton, Modal } from '@grafana/ui';

import { PrometheusDatasource } from '../../datasource';

import WarningNewDashboard from './WarningSavedDashboard/WarningSavedDashboard';
import WithTemplateBody from './WithTemplateBody/WithTemplateBody';
import getDashboardByUID from './api/getDashboardList';
import { DashboardResponse, WithTemplate } from './types';

export interface WithTemplateConfigProps {
  template?: WithTemplate;
  setTemplate: React.Dispatch<React.SetStateAction<WithTemplate | undefined>>
  datasource: PrometheusDatasource;
  dashboardUID: string;
  app?: CoreApp;
}

const WithTemplateConfig: FC<WithTemplateConfigProps> = ({ template, setTemplate, dashboardUID, datasource, app }) => {
  const [isValidDashboard, setIsValidDashboard] = useState(() => {
    if (app === CoreApp.Explore) { return true; }
    return !!dashboardUID;
  })

  const [dashboardResponse, setDashboardResponse] = useState<DashboardResponse | null>()

  const modalTitle = useMemo(() => {
    const explore = app === CoreApp.Explore ? 'Explore' : ''
    const folderTitle = dashboardResponse?.meta?.folderTitle
    const dashboardTitle = dashboardResponse?.dashboard?.title
    const templatesTitle = 'WITH templates'
    const fullTitle = [explore, folderTitle, dashboardTitle, templatesTitle].filter(Boolean).join(' / ')
    return isValidDashboard ? fullTitle : templatesTitle
  }, [isValidDashboard, dashboardResponse, app])

  const [showTemplates, setShowTemplates] = useState(false);
  const handleClose = () => setShowTemplates(false);
  const handleOpen = () => setShowTemplates(true);
  const handleAcceptWarning = () => setIsValidDashboard(true)

  useEffect(() => {
    setTemplate(datasource.withTemplates.find(t => t.uid === dashboardUID))
  }, [datasource, dashboardUID, setTemplate])

  const [prevDashboardUID, setPrevDashboardUID] = useState(dashboardUID)
  if (dashboardUID !== prevDashboardUID) {
    setPrevDashboardUID(dashboardUID)
    if (!dashboardUID && app !== CoreApp.Explore) {
      setIsValidDashboard(false)
    }
  }

  useEffect(() => {
    if (!dashboardUID) { return; }
    const fetchDashboard = async () => {
      try {
        const resp = await getDashboardByUID(dashboardUID)
        setDashboardResponse(resp)
        setIsValidDashboard(true)
      } catch (e) {
        console.error(e)
      }
    }
    fetchDashboard()
  }, [dashboardUID]);

  return (
    <>
      <IconButton
        key='with_templates'
        name='cog'
        tooltip='WITH templates'
        onClick={handleOpen}
      />
      <Modal
        title={modalTitle}
        isOpen={showTemplates}
        closeOnEscape={true}
        closeOnBackdropClick={false}
        onDismiss={handleClose}
      >
        {isValidDashboard ? (
          <WithTemplateBody
            datasource={datasource}
            dashboardUID={dashboardUID || app || ''}
            handleClose={handleClose}
            template={template}
            setTemplate={setTemplate}
          />
        ) : (
          <WarningNewDashboard
            onAccept={handleAcceptWarning}
            onClose={handleClose}
          />
        )}
      </Modal>
    </>
  )
}

export default WithTemplateConfig;
