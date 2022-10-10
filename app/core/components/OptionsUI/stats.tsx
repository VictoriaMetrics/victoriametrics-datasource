import { StatsPicker } from 'packages/grafana-ui/src';
import React from 'react';

import { FieldConfigEditorProps, StatsPickerConfigSettings } from '@grafana/data';

export const StatsPickerEditor: React.FC<FieldConfigEditorProps<string[], StatsPickerConfigSettings>> = ({
  value,
  onChange,
  item,
  id,
}) => {
  return (
    <StatsPicker
      stats={value}
      onChange={onChange}
      allowMultiple={!!item.settings?.allowMultiple}
      defaultStat={item.settings?.defaultStat}
      inputId={id}
    />
  );
};
