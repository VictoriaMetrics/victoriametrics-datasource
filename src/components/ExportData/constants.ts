import { ExportFormat, TimestampFormat } from './types';

export const FILE_FORMATS = {
  json: { ext: 'jsonl', apiPath: 'api/v1/export' },
  csv: { ext: 'csv', apiPath: 'api/v1/export/csv' },
} as const;

export const FORMAT_OPTIONS: Array<{ label: string; value: ExportFormat }> = [
  { label: 'JSON Line', value: 'json' },
  { label: 'CSV', value: 'csv' },
];

export const TIMESTAMP_OPTIONS: Array<{ label: string; value: TimestampFormat; description: string }> = [
  { label: 'Unix Seconds', value: 'unix_s', description: 'Unix timestamp in seconds' },
  { label: 'Unix Milliseconds', value: 'unix_ms', description: 'Unix timestamp in milliseconds' },
  { label: 'Unix Nanoseconds', value: 'unix_ns', description: 'Unix timestamp in nanoseconds' },
  { label: 'RFC3339', value: 'rfc3339', description: 'RFC3339 format (e.g., 2006-01-02T15:04:05Z)' },
  { label: 'Custom', value: 'custom', description: 'Custom Go time layout' },
];

export const DEFAULT_CUSTOM_LAYOUT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
