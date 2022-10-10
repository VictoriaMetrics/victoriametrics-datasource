import { DataLinksInlineEditor } from 'packages/grafana-ui/src';
import React from 'react';

import {
  DataLink,
  DataLinksFieldConfigSettings,
  FieldConfigEditorProps,
  VariableSuggestionsScope,
} from '@grafana/data';

export const DataLinksValueEditor: React.FC<FieldConfigEditorProps<DataLink[], DataLinksFieldConfigSettings>> = ({
  value,
  onChange,
  context,
}) => {
  return (
    <DataLinksInlineEditor
      links={value}
      onChange={onChange}
      data={context.data}
      getSuggestions={() => (context.getSuggestions ? context.getSuggestions(VariableSuggestionsScope.Values) : [])}
    />
  );
};
