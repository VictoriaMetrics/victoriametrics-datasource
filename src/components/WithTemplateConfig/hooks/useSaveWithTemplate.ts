import { useCallback, useState } from 'react';

import { CoreApp } from '@grafana/data';

import { PrometheusDatasource } from '../../../datasource';
import { PromQuery } from '../../../types';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { WITH_TEMPLATE_VARIABLE_REFERENCE } from '../utils/resolveWithTemplate';

import useUpdateDashboardVariable from './useUpdateDashboardVariable';
import useValidateExpr from './useValidateExpr';

interface UseSaveWithTemplateParams {
  datasource: PrometheusDatasource;
  dashboardUID: string;
  app?: CoreApp;
  query: PromQuery;
  onQueryChange: (query: PromQuery) => void;
  onTemplateSave?: (expr: string) => void;
  onDraftReset: () => void;
  handleClose: () => void;
}

interface UseSaveWithTemplateResult {
  validateResult: ReturnType<typeof useValidateExpr>['validateResult'];
  isLoading: boolean;
  saveError: string | null;
  showConfirm: boolean;
  handleSaveClick: (value: string) => Promise<void>;
  handleConfirmedSave: () => Promise<void>;
  dismissConfirm: () => void;
}

export default function useSaveWithTemplate({
  datasource,
  dashboardUID,
  app,
  query,
  onQueryChange,
  onTemplateSave,
  onDraftReset,
  handleClose,
}: UseSaveWithTemplateParams): UseSaveWithTemplateResult {
  const { validateResult, isValidExpr } = useValidateExpr(datasource)
  const { updateDashboardVariable } = useUpdateDashboardVariable(dashboardUID)

  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Template text waiting for the dashboard confirmation; the confirm modal is open while it is set
  const [templateAwaitingConfirm, setTemplateAwaitingConfirm] = useState<string | null>(null)

  // Explore has no dashboard to store a variable in: the template text lives in the query itself,
  // so there is nothing to confirm either
  const isExplore = app === CoreApp.Explore

  const saveTemplate = useCallback(async (value: string) => {
    setIsLoading(true)
    setSaveError(null)
    try {
      if (isExplore) {
        onQueryChange({ ...query, withTemplate: value })
      } else {
        await updateDashboardVariable(value)
        datasource.withTemplatesUpdate(
          [...datasource.withTemplates.filter(t => t.uid !== dashboardUID), { uid: dashboardUID, expr: value }]
        )
        if (query.withTemplate !== WITH_TEMPLATE_VARIABLE_REFERENCE) {
          onQueryChange({ ...query, withTemplate: WITH_TEMPLATE_VARIABLE_REFERENCE })
        }
      }
      onTemplateSave?.(value)
      onDraftReset()
      handleClose()
    } catch (e) {
      console.error('Error saving WITH template:', e)
      setSaveError(getErrorMessage(e))
    } finally {
      setIsLoading(false)
    }
  }, [updateDashboardVariable, datasource, dashboardUID, isExplore, query, onQueryChange, onTemplateSave, onDraftReset, handleClose])

  const handleSaveClick = useCallback(async (value: string) => {
    const isValid = await isValidExpr(value)
    if (!isValid) { return }
    if (isExplore) {
      await saveTemplate(value)
      return
    }
    setTemplateAwaitingConfirm(value)
  }, [isValidExpr, isExplore, saveTemplate])

  const handleConfirmedSave = useCallback(async () => {
    if (templateAwaitingConfirm === null) { return }
    setTemplateAwaitingConfirm(null)
    await saveTemplate(templateAwaitingConfirm)
  }, [templateAwaitingConfirm, saveTemplate])

  const dismissConfirm = useCallback(() => {
    setTemplateAwaitingConfirm(null)
  }, [])

  return {
    validateResult,
    isLoading,
    saveError,
    showConfirm: templateAwaitingConfirm !== null,
    handleSaveClick,
    handleConfirmedSave,
    dismissConfirm,
  }
}
