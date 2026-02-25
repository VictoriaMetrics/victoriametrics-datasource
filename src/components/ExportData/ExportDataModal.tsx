import { css } from '@emotion/css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getDefaultTimeRange, GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  Alert,
  Button,
  Field,
  Icon,
  Input,
  Modal,
  MultiSelect,
  RadioButtonGroup,
  Select,
  Tooltip,
  useStyles2,
} from '@grafana/ui';

import { convertLDMLLayoutToGoTimeLayout, formatDescriptions } from '../../utils/convertLDMLLayoutToGoTimeLayout';
import { downloadFile } from '../../utils/downloadFile';

import { ExportDataModalProps, ExportFormat, ExportOptions, TimestampFormat } from './types';
import { extractMetricSelectors } from './utils';

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
    selectedLabels: [],
  });
  const customLayoutDescription = useMemo(() => {
    const helpText = Object.entries(formatDescriptions).reduce((acc, [key, value]) => {
      acc += `${key}: ${value}\n`;
      return acc;
    }, '');
    const helpTooltipContent = <pre>{helpText}</pre>;
    return (
      <span>
        Custom layout format
        <Tooltip placement='top' content={helpTooltipContent} theme='info'>
          <Icon title={'Format'} name='info-circle' size='sm' width={16} height={16} />
        </Tooltip>
      </span>
    );
  }, []);

  const availableLabels = useMemo((): Array<SelectableValue<string>> => {
    const labelSet = new Set<string>();
    panelData?.series?.forEach((frame) => {
      frame.fields.forEach((field) => {
        if (field.labels) {
          Object.keys(field.labels).forEach((key) => {
            if (key !== '__name__') {
              labelSet.add(key);
            }
          });
        }
      });
    });
    return Array.from(labelSet)
      .sort()
      .map((label) => ({ label, value: label }));
  }, [panelData?.series]);

  const resolvedExpr = useMemo(() => {
    return datasource.getTemplateSrv().replace(query.expr, panelData?.request?.scopedVars);
  }, [datasource, query.expr, panelData?.request?.scopedVars]);

  const metricSelectors = useMemo(() => {
    return extractMetricSelectors(resolvedExpr);
  }, [resolvedExpr]);

  const validSelectors = useMemo(() => {
    return metricSelectors.filter((s) => s.metric !== '');
  }, [metricSelectors]);

  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSelectors(validSelectors.map((s) => s.selector));
  }, [validSelectors]);

  const canExport = selectedSelectors.length > 0;

  const handleToggleSelector = useCallback((selector: string) => {
    setSelectedSelectors((prev) =>
      prev.includes(selector) ? prev.filter((s) => s !== selector) : [...prev, selector]
    );
  }, []);

  const timeRange = panelData?.timeRange || getDefaultTimeRange();
  const start = timeRange.from.valueOf();
  const end = timeRange.to.valueOf();

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const buildCsvFormatString = useCallback((): string => {
    let tsFormat: string = options.timestampFormat;
    if (options.timestampFormat === 'custom') {
      const goLayout = convertLDMLLayoutToGoTimeLayout(options.customLayout);
      tsFormat = `custom:${goLayout}`;
    }
    let fmt = '__name__,';
    if (options.selectedLabels.length > 0) {
      fmt += options.selectedLabels.join(',') + ',';
    }
    fmt += `__value__,__timestamp__:${tsFormat}`;
    return fmt;
  }, [options]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fileExt = options.format === 'json' ? 'jsonl' : 'csv';
      const blobType = options.format === 'csv' ? 'text/csv' : 'application/x-ndjson';
      const timestamp = Date.now();
      // VM API expects Unix seconds; Grafana timeRange uses milliseconds
      const startSec = Math.floor(start / 1000);
      const endSec = Math.floor(end / 1000);

      const apiPath = options.format === 'csv' ? 'api/v1/export/csv' : 'api/v1/export';
      const params = new URLSearchParams();
      selectedSelectors.forEach((selector) => params.append('match[]', selector));
      params.append('start', startSec.toString());
      params.append('end', endSec.toString());
      const selectorStr = encodeURI('match[]=' + selectedSelectors.join('&match[]='));
      if (options.format === 'csv') {
        params.append('format', buildCsvFormatString());
      }

      const data = await datasource.getResource(apiPath + '?' + params.toString());

      const fileName =
        selectedSelectors.length === 1
          ? `export-${timestamp}.${fileExt}`
          : `export-${selectorStr}-${timestamp}.${fileExt}`;
      const blob = new Blob([data], { type: blobType });
      downloadFile(blob, fileName);
      onClose();
    } catch (err) {
      if (err instanceof Object && 'data' in err && err.data instanceof Object && 'message' in err.data) {
        const message = String(err.data.message) || 'Export failed';
        setError(message);
        return;
      }
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      console.error('Export failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [datasource, selectedSelectors, start, end, options, onClose, buildCsvFormatString]);

  return (
    <Modal title='Export Data' isOpen={isOpen} onDismiss={onClose}>
      <div className={styles.content}>
        {error && (
          <Alert title='Export failed' severity='error' onRemove={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!canExport && (
          <Alert title='No metric selectors found' severity='warning'>
            Export requires a query with a named metric selector.
          </Alert>
        )}

        <Field label='Format'>
          <RadioButtonGroup
            options={formatOptions}
            value={options.format}
            onChange={(value) => setOptions({ ...options, format: value })}
          />
        </Field>

        {options.format === 'csv' && (
          <>
            <Field label='Timestamp format'>
              <Select
                options={timestampOptions}
                value={options.timestampFormat}
                onChange={(v) => v.value && setOptions({ ...options, timestampFormat: v.value })}
              />
            </Field>

            {options.timestampFormat === 'custom' && (
              <Field label='Custom layout' description={customLayoutDescription}>
                <Input
                  value={options.customLayout}
                  onChange={(e) => setOptions({ ...options, customLayout: e.currentTarget.value })}
                  placeholder='YYYY-MM-DDThh:mm:ss.SSSSSSSSSZ'
                />
              </Field>
            )}

            {availableLabels.length > 0 && (
              <Field label='Labels' description='Select labels to include as additional CSV columns'>
                <MultiSelect
                  options={availableLabels}
                  value={options.selectedLabels}
                  onChange={(selected) => setOptions({ ...options, selectedLabels: selected.map((s) => s.value!) })}
                  placeholder='Select labels...'
                  isClearable
                />
              </Field>
            )}
          </>
        )}

        <Field label='Time range'>
          <div className={styles.timeRange}>
            {timeRange.from.format('YYYY-MM-DD HH:mm:ss')} — {timeRange.to.format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </Field>

        {validSelectors.length === 1 && (
          <Field label='Metric'>
            <div className={styles.metricSelector}>{validSelectors[0].selector}</div>
          </Field>
        )}

        {validSelectors.length > 1 && (
          <Field label='Select metrics to export'>
            <div className={styles.selectorList}>
              {validSelectors.map((s) => (
                <label key={s.selector} className={styles.selectorOption}>
                  <input
                    type='checkbox'
                    value={s.selector}
                    checked={selectedSelectors.includes(s.selector)}
                    onChange={() => handleToggleSelector(s.selector)}
                  />
                  <span className={styles.selectorLabel}>{s.selector}</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        <div className={styles.actions}>
          <Button variant='secondary' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleExport} disabled={isLoading || !canExport}>
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
    metricSelector: css(infoBox, {
      wordBreak: 'break-all',
    }),
    selectorList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    selectorOption: css({
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
      cursor: 'pointer',
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.shape.radius.default,
      '&:hover': {
        backgroundColor: theme.colors.action.hover,
      },
    }),
    selectorLabel: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      wordBreak: 'break-all',
    }),
    actions: css({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(1),
      marginTop: theme.spacing(2),
    }),
  };
};
