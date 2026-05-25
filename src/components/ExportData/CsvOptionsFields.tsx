import React, { useMemo } from 'react';

import { ComboboxOption, Field, Icon, Input, MultiCombobox, Select, Tooltip } from '@grafana/ui';

import { formatDescriptions } from '../../utils/convertLDMLLayoutToGoTimeLayout';

import { TIMESTAMP_OPTIONS } from './constants';
import { TimestampFormat } from './types';

interface CsvOptionsFieldsProps {
  timestampFormat: TimestampFormat;
  onTimestampFormatChange: (format: TimestampFormat) => void;
  customLayout: string;
  onCustomLayoutChange: (layout: string) => void;
  availableLabels: Array<ComboboxOption<string>>;
  selectedLabels: string[];
  onSelectedLabelsChange: (labels: string[]) => void;
  labelsLoading: boolean;
}

export const CsvOptionsFields: React.FC<CsvOptionsFieldsProps> = ({
  timestampFormat,
  onTimestampFormatChange,
  customLayout,
  onCustomLayoutChange,
  availableLabels,
  selectedLabels,
  onSelectedLabelsChange,
  labelsLoading,
}) => {
  const customLayoutDescription = useMemo(() => {
    const helpText = Object.entries(formatDescriptions).reduce((acc, [key, value]) => {
      acc += `${key}: ${value}\n`;
      return acc;
    }, '');
    return (
      <span>
        Custom layout format
        <Tooltip placement='top' content={<pre>{helpText}</pre>} theme='info'>
          <Icon title='Format' name='info-circle' size='sm' width={16} height={16} />
        </Tooltip>
      </span>
    );
  }, []);

  return (
    <>
      <Field
        label='Timestamp format'
        description='Timestamps are emitted in UTC; custom layouts cannot shift the timezone.'
      >
        <Select
          options={TIMESTAMP_OPTIONS}
          value={timestampFormat}
          onChange={(v) => v.value && onTimestampFormatChange(v.value)}
        />
      </Field>

      {timestampFormat === 'custom' && (
        <Field label='Custom layout' description={customLayoutDescription}>
          <Input
            value={customLayout}
            onChange={(e) => onCustomLayoutChange(e.currentTarget.value)}
            placeholder='YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ'
          />
        </Field>
      )}

      <Field label='Labels' description='Select labels to include as additional CSV columns'>
        <MultiCombobox
          options={availableLabels}
          value={selectedLabels}
          onChange={(selected) => onSelectedLabelsChange(selected.map((s) => s.value))}
          placeholder={labelsLoading ? 'Loading labels...' : 'Select labels...'}
          loading={labelsLoading}
          isClearable
          enableAllOption
        />
      </Field>
    </>
  );
};
