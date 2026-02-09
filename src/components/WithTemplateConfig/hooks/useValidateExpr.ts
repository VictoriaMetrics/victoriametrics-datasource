import { useCallback, useState } from "react";
import { lastValueFrom } from "rxjs";

import { getBackendSrv } from "@grafana/runtime";

interface ValidateResult {
  title: string;
  icon: "exclamation-triangle" | "check" | "fa fa-spinner";
  color: "blue" | "red" | "green" | "orange";
  error?: string;
}

const validateStatus: {[key: string]: ValidateResult} = {
  noValidate: {
    title: "No validation",
    icon: "exclamation-triangle",
    color: "orange"
  },
  success: {
    title: "Valid WITH Expression",
    icon: "check",
    color: "green"
  },
  await: {
    title: "Validating WITH Expressions...",
    icon: "fa fa-spinner",
    color: "blue"
  },
  invalid: {
    title: "Invalid WITH Expression",
    icon:"exclamation-triangle",
    color: "red"
  },
  serverError: {
    title: "Unable to Validate WITH Expressions",
    icon: "exclamation-triangle",
    color: "red"
  }
}

export default (datasourceUID: string) => {
  const [validateResult, setValidateResult] = useState<ValidateResult>(validateStatus.noValidate)

  const isValidExpr = useCallback(async (expr: string) => {
    if (!expr) {
      setValidateResult(validateStatus.noValidate)
      return true
    }

    setValidateResult(validateStatus.await)

    try {
      // replace Grafana variables with '1s' for validation
      const val = expr.replace(/\$__interval|\$__range|\$__rate_interval/gm, "1s")
      const withTemplate = encodeURIComponent(`WITH(${val})()`)
      const response = await lastValueFrom(getBackendSrv().fetch({
        url: `api/datasources/uid/${datasourceUID}/resources/expand-with-exprs?query=${withTemplate}&format=json`,
        method: "GET",
      }));
      const { status, error = "" } = response?.data as { status: "success" | "error", error?: string }
      setValidateResult({
        ...(status === "success" ? validateStatus.success : validateStatus.invalid),
        error
      })
      return status === "success"
    } catch (e) {
      console.error("Error validating WITH templates:", e);
      if (e instanceof Error) {
        setValidateResult({
          ...validateStatus.serverError,
          error: e.message,
        })
      }
      return false
    }
  }, [datasourceUID])

  return {
    validateResult,
    isValidExpr
  }
}
