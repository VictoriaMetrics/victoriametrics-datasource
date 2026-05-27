import { css } from '@emotion/css';
import React, { useState } from 'react';

import { getDefaultTimeRange, GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, LinkButton, Modal, RadioButtonGroup, useStyles2 } from '@grafana/ui';

import { CsvOptionsFields } from './CsvOptionsFields';
import { SelectorsField } from './SelectorsField';
import { TimeRangeField } from './TimeRangeField';
import { DEFAULT_CUSTOM_LAYOUT, FORMAT_OPTIONS } from './constants';
import { ExportDataModalProps, ExportOptions } from './types';
import { useExportLabels } from './useExportLabels';
import { useExportSelectors } from './useExportSelectors';
import { useExportUrl } from './useExportUrl';

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose, datasource, query, panelData }) => {
  const styles = useStyles2(getStyles);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    timestampFormat: 'unix_s',
    customLayout: DEFAULT_CUSTOM_LAYOUT,
  });

  const { validSelectors, selectedSelectors, toggleSelector } = useExportSelectors(datasource, query, panelData);

  const {
    availableLabels,
    selectedLabels,
    setSelectedLabels,
    isLoading: labelsLoading,
  } = useExportLabels({
    datasource,
    isOpen,
    isCsv: options.format === 'csv',
    selectors: selectedSelectors,
    panelData,
  });

  const timeRange = panelData?.timeRange || getDefaultTimeRange();

  const { exportUrl, exportFileName, canExport } = useExportUrl({
    datasource,
    selectors: selectedSelectors,
    options,
    selectedLabels,
    startMs: timeRange.from.valueOf(),
    endMs: timeRange.to.valueOf(),
  });

  return (
    <Modal title='Export Data' isOpen={isOpen} onDismiss={onClose}>
      <div className={styles.content}>
        {!canExport && (
          <Alert title='No selectors found' severity='warning'>
            Export requires a query with at least one vector selector (named metric or label-only).
          </Alert>
        )}

        <Field label='Format'>
          <RadioButtonGroup
            options={FORMAT_OPTIONS}
            value={options.format}
            onChange={(value) => setOptions({ ...options, format: value })}
          />
        </Field>

        {options.format === 'csv' && (
          <CsvOptionsFields
            timestampFormat={options.timestampFormat}
            onTimestampFormatChange={(format) => setOptions({ ...options, timestampFormat: format })}
            customLayout={options.customLayout}
            onCustomLayoutChange={(layout) => setOptions({ ...options, customLayout: layout })}
            availableLabels={availableLabels}
            selectedLabels={selectedLabels}
            onSelectedLabelsChange={setSelectedLabels}
            labelsLoading={labelsLoading}
          />
        )}

        <TimeRangeField timeRange={timeRange} />

        <SelectorsField
          selectors={validSelectors}
          selectedSelectors={selectedSelectors}
          onToggle={toggleSelector}
        />

        <div className={styles.actions}>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <LinkButton
            variant='primary'
            href={exportUrl}
            target='_blank'
            download={exportFileName}
            disabled={!canExport}
            onClick={onClose}
          >
            Export
          </LinkButton>
        </div>
      </div>
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  actions: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  }),
});
