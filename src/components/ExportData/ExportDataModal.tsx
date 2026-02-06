import { css } from '@emotion/css';
import React, { useState, useCallback } from 'react';

import { getDefaultTimeRange, GrafanaTheme2 } from '@grafana/data';
import { Modal, RadioButtonGroup, Select, Input, Button, Field, useStyles2, Alert } from '@grafana/ui';

import { downloadFile } from "../../utils/downloadFile";

import { ExportDataModalProps, ExportFormat, TimestampFormat, ExportOptions } from './types';

const formatOptions = [
  { label: 'JSON Line', value: 'json' as ExportFormat },
  { label: 'CSV', value: 'csv' as ExportFormat },
];

const timestampOptions = [
  { label: 'Unix Seconds', value: 'unix_s' as TimestampFormat, description: 'Unix timestamp in seconds' },
  { label: 'Unix Milliseconds', value: 'unix_ms' as TimestampFormat, description: 'Unix timestamp in milliseconds' },
  { label: 'Unix Nanoseconds', value: 'unix_ns' as TimestampFormat, description: 'Unix timestamp in nanoseconds' },
  { label: 'RFC3339', value: 'rfc3339' as TimestampFormat, description: 'RFC3339 format (e.g., 2006-01-02T15:04:05Z)' },
  { label: 'Custom', value: 'custom' as TimestampFormat, description: 'Custom Go time layout' },
];

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose, datasource, query, panelData }) => {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    timestampFormat: 'unix_s',
    customLayout: '2006-01-02T15:04:05Z07:00',
  });

  const timeRange = panelData?.timeRange || getDefaultTimeRange();
  const start = timeRange.from.valueOf();
  const end = timeRange.to.valueOf();

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const templateSrv = datasource.getTemplateSrv();
      const expr = templateSrv.replace(query.expr, panelData?.request?.scopedVars);

      const blob = await datasource.getResource(
        'export-data',
        {
          query: expr,
          start: start,
          end: end,
          format: options.format,
          timestampFormat: options.timestampFormat,
          customLayout: options.timestampFormat === 'custom' ? options.customLayout : '',
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(blob);
      const fileName = `export-${Date.now()}.${options.format === 'json' ? 'jsonl' : 'csv'}`;
      downloadFile(url, fileName);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      console.error('Export failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [datasource, query.expr, panelData, start, end, options, onClose]);

  return (
    <Modal title="Export Data" isOpen={isOpen} onDismiss={onClose}>
      <div className={styles.content}>
        {error && (
          <Alert title="Export failed" severity="error" onRemove={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Field label="Format">
          <RadioButtonGroup
            options={formatOptions}
            value={options.format}
            onChange={(value) => setOptions({ ...options, format: value })}
          />
        </Field>

        {options.format === 'csv' && (
          <>
            <Field label="Timestamp format">
              <Select
                options={timestampOptions}
                value={options.timestampFormat}
                onChange={(v) => v.value && setOptions({ ...options, timestampFormat: v.value })}
              />
            </Field>

            {options.timestampFormat === 'custom' && (
              <Field label="Custom layout" description="Go time format layout">
                <Input
                  value={options.customLayout}
                  onChange={(e) => setOptions({ ...options, customLayout: e.currentTarget.value })}
                  placeholder="2006-01-02T15:04:05Z07:00"
                />
              </Field>
            )}
          </>
        )}

        <Field label="Time range">
          <div className={styles.timeRange}>
            {timeRange.from.format('YYYY-MM-DD HH:mm:ss')} — {timeRange.to.format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </Field>

        <Field label="Query">
          <div className={styles.query}>{query.expr}</div>
        </Field>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isLoading}>
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const infoBox = css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  });

  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    timeRange: infoBox,
    query: css(infoBox, {
      wordBreak: 'break-all',
      maxHeight: '100px',
      overflow: 'auto',
    }),
    actions: css({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
    }),
  };
};
