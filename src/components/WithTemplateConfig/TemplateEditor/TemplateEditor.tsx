import React, { FC, useEffect } from "react";

import { PrometheusDatasource } from "../../../datasource";
import PrometheusLanguageProvider from "../../../language_provider";
import { MonacoQueryFieldWrapper } from "../../monaco-query-field/MonacoQueryFieldWrapper";

interface Props {
  initialValue: string;
  datasource: PrometheusDatasource
  onChange: (value: string) => void;
}

const TemplateEditor: FC<Props> = ({ initialValue, datasource, onChange }) => {

  useEffect(() => {
    // updating the languageProvider without using previous templates WITH
    datasource.languageProvider = new PrometheusLanguageProvider(datasource as PrometheusDatasource)
    datasource.languageProvider?.start?.()
  }, [datasource])

  return (
    <MonacoQueryFieldWrapper
      runQueryOnBlur={false}
      languageProvider={datasource.languageProvider}
      history={[]}
      onChange={onChange}
      onRunQuery={() => {}}
      initialValue={initialValue}
      placeholder="Enter a WITH expressions..."
    />
  );
}

export default TemplateEditor;
