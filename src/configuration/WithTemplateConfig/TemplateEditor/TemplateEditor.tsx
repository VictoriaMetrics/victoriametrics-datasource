import React, { FC, useState } from 'react';
import { lastValueFrom } from "rxjs";

import { DataSourceApi } from "@grafana/data";
import { getBackendSrv } from "@grafana/runtime";
import { Badge, useStyles2 } from "@grafana/ui";

import { MonacoQueryFieldWrapper } from "../../../components/monaco-query-field/MonacoQueryFieldWrapper";

import getStyles from "./style";

interface Props {
  value: string;
  datasource: DataSourceApi
  onChange: (value: string) => void;
}

interface ValidateResult {
  title: string,
  icon?: "exclamation-triangle" | "check" | "fa fa-spinner";
  error?: string;
  color?: 'blue' | 'red' | 'green'
}

const TemplateEditor: FC<Props> = ({ value, datasource, onChange }) => {
  const styles = useStyles2(getStyles);

  const [validateResult, setValidateResult] = useState<ValidateResult>({ title: "" });

  const validateExpr = async (val: string) => {
    if (!val) {
      setValidateResult({ title: "" })
      return
    }

    setValidateResult({
      title: "Validating WITH Expressions...",
      icon: "fa fa-spinner",
      color: "blue"
    })

    try {
      const withTemplate = encodeURIComponent(`WITH(${val})()`)
      const response = await lastValueFrom(await getBackendSrv().fetch({
        url: `api/datasources/proxy/${datasource.id}/expand-with-exprs?query=${withTemplate}&format=json`,
        method: 'GET',
      }));
      const { status, error = "" } = response?.data as { status: "success" | "error", error?: string }
      setValidateResult({
        title: status === "success" ? "Valid WITH Expression" : "Invalid WITH Expression",
        icon: status === "success" ? "check" : "exclamation-triangle",
        color: status === "success" ? "green" : "red",
        error
      })
    } catch (e) {
      console.error('Error validating WITH templates:', e);
      if (e instanceof Error) {
        setValidateResult({
          title: "Unable to Validate WITH Expressions",
          icon: "exclamation-triangle",
          error: e.message,
          color: "red"
        })
      }
    }
  }

  const handleChange = (val: string) => {
    onChange(val)
    validateExpr(val)
  }

  return (
    <>
      <MonacoQueryFieldWrapper
        runQueryOnBlur={false}
        languageProvider={datasource.languageProvider}
        history={[]}
        onChange={handleChange}
        onRunQuery={() => {}}
        initialValue={value}
        placeholder="Enter a WITH expressions..."
      />

      {validateResult.title && (
        <Badge
          className={styles.message}
          icon={validateResult.icon || "info"}
          color={validateResult.color || "blue"}
          text={validateResult.error || validateResult.title}
        />
      )}
    </>
  );
}

export default TemplateEditor;
