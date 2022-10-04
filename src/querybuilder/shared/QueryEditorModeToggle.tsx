import { css } from '@emotion/css';
import { RadioButtonGroup, Tag } from 'packages/grafana-ui/src';
import React from 'react';


import { QueryEditorMode } from './types';

export interface Props {
  mode: QueryEditorMode;
  onChange: (mode: QueryEditorMode) => void;
}

const editorModes = [
  {
    label: 'Builder',
    value: QueryEditorMode.Builder,
    component: () => (
      <Tag
        className={css({
          fontSize: 10,
          padding: '1px 5px',
          verticalAlign: 'text-bottom',
        })}
        name={'Beta'}
        colorIndex={1}
      />
    ),
  },
  { label: 'Code', value: QueryEditorMode.Code },
];

export function QueryEditorModeToggle({ mode, onChange }: Props) {
  return (
    <div data-testid={'QueryEditorModeToggle'}>
      <RadioButtonGroup options={editorModes} size="sm" value={mode} onChange={onChange} />
    </div>
  );
}
