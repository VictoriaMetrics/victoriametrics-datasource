import { ValuePicker } from 'packages/grafana-ui/src';
import React from 'react';

import { SelectableValue } from '@grafana/data';

export type AddLayerButtonProps = {
  onChange: (sel: SelectableValue<string>) => void;
  options: Array<SelectableValue<string>>;
  label: string;
};

export const AddLayerButton = ({ onChange, options, label }: AddLayerButtonProps) => {
  return (
    <ValuePicker
      icon="plus"
      label={label}
      variant="secondary"
      options={options}
      onChange={onChange}
      isFullWidth={true}
    />
  );
};
