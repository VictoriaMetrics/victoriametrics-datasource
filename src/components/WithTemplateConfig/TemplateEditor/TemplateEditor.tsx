import React, { FC, useEffect, useState } from 'react';

import { PrometheusDatasource } from '../../../datasource';
import PrometheusLanguageProvider from '../../../language_provider';
import { MonacoQueryFieldWrapper } from '../../monaco-query-field/MonacoQueryFieldWrapper';

interface Props {
  initialValue: string;
  datasource: PrometheusDatasource
  onChange: (value: string) => void;
}

const TemplateEditor: FC<Props> = ({ initialValue, datasource, onChange }) => {
  // Create a fresh language provider without previous WITH templates
  const [languageProvider] = useState(
    () => new PrometheusLanguageProvider(datasource as PrometheusDatasource)
  );

  useEffect(() => {
    languageProvider.start?.();
  }, [languageProvider]);

  return (
    <MonacoQueryFieldWrapper
      runQueryOnBlur={false}
      languageProvider={languageProvider}
      history={[]}
      onChange={onChange}
      onRunQuery={() => {}}
      initialValue={initialValue}
      placeholder='Enter a WITH expressions...'
    />
  );
}

export default TemplateEditor;
