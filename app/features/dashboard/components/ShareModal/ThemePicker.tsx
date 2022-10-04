import { t } from '@lingui/macro';
import { RadioButtonGroup, Field } from 'packages/grafana-ui/src';
import React from 'react';

import { SelectableValue } from '@grafana/data';

interface Props {
  selectedTheme: string;
  onChange: (value: string) => void;
}

export const ThemePicker = ({ selectedTheme = 'current', onChange }: Props) => {
  const themeOptions: Array<SelectableValue<string>> = [
    {
      label: t({
        id: 'share-modal.theme-picker.current',
        message: `Current`,
      }),
      value: 'current',
    },
    {
      label: t({
        id: 'share-modal.theme-picker.dark',
        message: `Dark`,
      }),
      value: 'dark',
    },
    {
      label: t({
        id: 'share-modal.theme-picker.light',
        message: `Light`,
      }),
      value: 'light',
    },
  ];

  return (
    <Field
      label={t({
        id: 'share-modal.theme-picker.field-name',
        message: `Theme`,
      })}
    >
      <RadioButtonGroup options={themeOptions} value={selectedTheme} onChange={onChange} />
    </Field>
  );
};
