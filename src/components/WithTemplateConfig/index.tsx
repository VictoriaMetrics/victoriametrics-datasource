import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { CoreApp } from '@grafana/data';
import { IconButton, Modal } from '@grafana/ui';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';

import WarningNewDashboard from './WarningSavedDashboard/WarningSavedDashboard';
import WithTemplateBody from './WithTemplateBody/WithTemplateBody';
import getDashboardByUID from './api/getDashboardList';
import { DashboardResponse } from './types';

export interface WithTemplateConfigProps {
  datasource: PrometheusDatasource;
  dashboardUID: string;
  query: PromQuery;
  onQueryChange: (query: PromQuery) => void;
  resolvedWithTemplate?: string;
  onTemplateSave?: (expr: string) => void;
  app?: CoreApp;
}

const WithTemplateConfig: FC<WithTemplateConfigProps> = ({ dashboardUID, datasource, query, onQueryChange, resolvedWithTemplate, onTemplateSave, app }) => {
  const [isValidDashboard, setIsValidDashboard] = useState(app === CoreApp.Explore)
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
  const [draftValue, setDraftValue] = useState<string | null>(null);

  const handleClose = useCallback(() => setShowTemplates(false), []);
  const handleOpen = useCallback(() => setShowTemplates(true), []);
  const handleAcceptWarning = useCallback(() => setIsValidDashboard(true), []);
  const handleDraftReset = useCallback(() => setDraftValue(null), []);

  const editorValue = draftValue ?? resolvedWithTemplate ?? '';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardResponse = await getDashboardByUID(dashboardUID)
        setDashboardResponse(dashboardResponse)
        setIsValidDashboard(true)
      } catch (e) {
        console.error(e)
      }
    }
    if (dashboardUID) {
      fetchDashboard()
    } else if (app !== CoreApp.Explore) {
      setIsValidDashboard(false)
    }
  }, [dashboardUID, app]);

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
            value={editorValue}
            onValueChange={setDraftValue}
            datasource={datasource}
            dashboardUID={dashboardUID || app || ''}
            query={query}
            onQueryChange={onQueryChange}
            onTemplateSave={onTemplateSave}
            onDraftReset={handleDraftReset}
            handleClose={handleClose}
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
