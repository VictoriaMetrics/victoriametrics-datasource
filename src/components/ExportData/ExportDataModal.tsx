import { css } from '@emotion/css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getDefaultTimeRange, GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Icon, Input, Modal, RadioButtonGroup, Select, Tooltip, useStyles2 } from '@grafana/ui';

import { convertLDMLLayoutToGoTimeLayout, formatDescriptions } from "../../utils/convertLDMLLayoutToGoTimeLayout";
import { downloadFile } from "../../utils/downloadFile";

import { ExportDataModalProps, ExportFormat, ExportOptions, TimestampFormat } from './types';

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
    customLayout: 'YYYY-MM-DDThh:mm:ss.SSSZ',
  });
  const customLayoutDescription = useMemo(() => {
    const helpText = Object.entries(formatDescriptions).reduce((acc, [key, value]) => {
      acc += `${key}: ${value}\n`;
      return acc;
    }, '');
    const helpTooltipContent = <pre>{helpText}</pre>
    return (
      <span>
        Custom layout format
        <Tooltip placement="top" content={helpTooltipContent} theme="info">
          <Icon title={"Format"} name="info-circle" size="sm" width={16} height={16} />
        </Tooltip>
      </span>
    );
  }, [])

  const timeRange = panelData?.timeRange || getDefaultTimeRange();
  const start = timeRange.from.valueOf();
  const end = timeRange.to.valueOf();

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const templateSrv = datasource.getTemplateSrv();
      const expr = templateSrv.replace(query.expr, panelData?.request?.scopedVars);

      let customLayout = '';
      if (options.timestampFormat === 'custom') {
        customLayout = convertLDMLLayoutToGoTimeLayout(options.customLayout);
      }

      const blob = await datasource.getResource(
        'export-data',
        {
          query: expr,
          start: start,
          end: end,
          format: options.format,
          timestampFormat: options.timestampFormat,
          customLayout: customLayout,
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
              <Field label="Custom layout" description={customLayoutDescription}>
                <Input
                  value={options.customLayout}
                  onChange={(e) => setOptions({ ...options, customLayout: e.currentTarget.value })}
                  placeholder="YYYY-MM-DDThh:mm:ss.SSSSSSSSSZ"
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
