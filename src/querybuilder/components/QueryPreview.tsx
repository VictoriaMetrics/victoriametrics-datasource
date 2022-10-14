import React from 'react';

import { EditorRow, EditorFieldGroup, EditorField } from '../../components/QueryEditor';
import metricsqlGrammar from '../../metricsql';
import { RawQuery } from '../shared/RawQuery';

export interface Props {
  query: string;
}

export function QueryPreview({ query }: Props) {
  return (
    <EditorRow>
      <EditorFieldGroup>
        <EditorField label="Raw query">
          <RawQuery query={query} lang={{ grammar: metricsqlGrammar, name: 'promql' }} />
        </EditorField>
      </EditorFieldGroup>
    </EditorRow>
  );
}
