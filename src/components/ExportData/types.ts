import { PanelData } from '@grafana/data';

import { PrometheusDatasource } from '../../datasource';
import { PromQuery } from '../../types';

export type ExportFormat = 'json' | 'csv';

export type TimestampFormat = 'unix_s' | 'unix_ms' | 'unix_ns' | 'rfc3339' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  timestampFormat: TimestampFormat;
  customLayout: string;
  selectedLabels: string[];
}

export interface ExportDataButtonProps {
  datasource: PrometheusDatasource;
  query: PromQuery;
  panelData?: PanelData;
}

export interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasource: PrometheusDatasource;
  query: PromQuery;
  panelData?: PanelData;
}
