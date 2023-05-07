import React, { FC } from 'react';

import { TextArea } from "@grafana/ui";

import { withTemplatePlaceholder } from "../constants";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TemplateEditor: FC<Props> = ({ value, onChange }) => {
  // TODO add validate template

  return (
    <TextArea
      rows={10}
      value={value}
      onChange={onChange}
      spellCheck={false}
      placeholder={withTemplatePlaceholder}
    />
  );
}

export default TemplateEditor;
