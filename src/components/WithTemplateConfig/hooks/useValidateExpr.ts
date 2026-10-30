import { useCallback, useState } from 'react';

import { PrometheusDatasource } from '../../../datasource';
import { expandWithExprs } from '../api/expandWithExprs';

interface ValidateResult {
  title: string;
  icon: 'exclamation-triangle' | 'check' | 'fa fa-spinner';
  color: 'blue' | 'red' | 'green' | 'orange';
  error?: string;
}

const validateStatus: {[key: string]: ValidateResult} = {
  noValidate: {
    title: 'No validation',
    icon: 'exclamation-triangle',
    color: 'orange'
  },
  success: {
    title: 'Valid WITH Expression',
    icon: 'check',
    color: 'green'
  },
  await: {
    title: 'Validating WITH Expressions...',
    icon: 'fa fa-spinner',
    color: 'blue'
  },
  invalid: {
    title: 'Invalid WITH Expression',
    icon:'exclamation-triangle',
    color: 'red'
  },
  serverError: {
    title: 'Unable to Validate WITH Expressions',
    icon: 'exclamation-triangle',
    color: 'red'
  }
}

export default (datasource: PrometheusDatasource) => {
  const [validateResult, setValidateResult] = useState<ValidateResult>(validateStatus.noValidate)

  const isValidExpr = useCallback(async (expr: string) => {
    if (!expr) {
      setValidateResult(validateStatus.noValidate)
      return true
    }

    setValidateResult(validateStatus.await)

    try {
      // replace Grafana variables with '1s' for validation
      const val = expr.replace(/\$__interval|\$__range|\$__rate_interval/gm, '1s')
      const response = await expandWithExprs(datasource, `WITH(${val})()`)
      const { status, error = '' } = response
      setValidateResult({
        ...(status === 'success' ? validateStatus.success : validateStatus.invalid),
        error
      })
      return status === 'success'
    } catch (e) {
      console.error('Error validating WITH templates:', e);
      if (e instanceof Error) {
        setValidateResult({
          ...validateStatus.serverError,
          error: e.message,
        })
      }
      return false
    }
  }, [datasource])

  return {
    validateResult,
    isValidExpr
  }
}
