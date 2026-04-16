import { useCallback, useRef, useState } from 'react';

import { PrometheusDatasource } from '../../../datasource';
import { PromQuery } from '../../../types';
import { WITH_TEMPLATE_VARIABLE_NAME } from '../constants';

import useUpdateDashboardVariable, { DashboardVersionConflictError } from './useUpdateDashboardVariable';
import useValidateExpr from './useValidateExpr';

interface UseSaveWithTemplateParams {
  datasource: PrometheusDatasource;
  dashboardUID: string;
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
  query,
  onQueryChange,
  onTemplateSave,
  onDraftReset,
  handleClose,
}: UseSaveWithTemplateParams): UseSaveWithTemplateResult {
  const { validateResult, isValidExpr } = useValidateExpr(datasource.uid)
  const { updateDashboardVariable } = useUpdateDashboardVariable(dashboardUID)

  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Store the value being saved so handleConfirmedSave has access to it
  const pendingValueRef = useRef<string>('')

  const handleSaveClick = useCallback(async (value: string) => {
    const isValid = await isValidExpr(value)
    if (!isValid) { return }
    pendingValueRef.current = value
    setShowConfirm(true)
  }, [isValidExpr])

  const handleConfirmedSave = useCallback(async () => {
    const value = pendingValueRef.current
    setShowConfirm(false)
    setIsLoading(true)
    try {
      setSaveError(null)
      await updateDashboardVariable(value)
      datasource.withTemplatesUpdate(
        [...datasource.withTemplates.filter(t => t.uid !== dashboardUID), { uid: dashboardUID, expr: value }]
      )
      if (query.withTemplate !== `$${WITH_TEMPLATE_VARIABLE_NAME}`) {
        onQueryChange({ ...query, withTemplate: `$${WITH_TEMPLATE_VARIABLE_NAME}` })
      }
      onTemplateSave?.(value)
      onDraftReset()
      setIsLoading(false)
      handleClose()
    } catch (e) {
      if (e instanceof DashboardVersionConflictError) {
        setSaveError(e.message)
      } else {
        console.error(e)
      }
      setIsLoading(false)
    }
  }, [updateDashboardVariable, datasource, dashboardUID, query, onQueryChange, onTemplateSave, onDraftReset, handleClose])

  const dismissConfirm = useCallback(() => {
    setShowConfirm(false)
  }, [])

  return {
    validateResult,
    isLoading,
    saveError,
    showConfirm,
    handleSaveClick,
    handleConfirmedSave,
    dismissConfirm,
  }
}
