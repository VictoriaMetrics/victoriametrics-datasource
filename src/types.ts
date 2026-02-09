// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-04: remove PromLabelQueryResponse
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DataSourceJsonData, QueryResultMeta, ScopedVars } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

import { WithTemplate } from './components/WithTemplateConfig/types';
import { QueryEditorMode } from './querybuilder/shared/types';

export interface PromQuery extends DataQuery {
  expr: string;
  format?: string;
  instant?: boolean;
  range?: boolean;
  exemplar?: boolean;
  hinting?: boolean;
  interval?: string;
  intervalFactor?: number;
  // Timezone offset to align start & end time on backend
  utcOffsetSec?: number;
  legendFormat?: string;
  valueWithRefId?: boolean;
  requestId?: string;
  showingGraph?: boolean;
  showingTable?: boolean;
  /** Code, Builder or Explain */
  editorMode?: QueryEditorMode;
  trace?: number;
  fromExploreMetrics?: boolean;
}

export interface PromOptions extends DataSourceJsonData {
  timeInterval?: string;
  queryTimeout?: string;
  httpMethod?: string;
  directUrl?: string;
  vmuiUrl?: string;
  customQueryParameters?: string;
  disableMetricsLookup?: boolean;
  exemplarTraceIdDestinations?: ExemplarTraceIdDestination[];
  withTemplates?: WithTemplate[];
  limitMetrics?: LimitMetrics;
  autocompleteSettings?: AutocompleteSettings;
  enableSecureSocksProxy?: boolean;
}

export enum PromQueryType {
  timeSeriesQuery = 'timeSeriesQuery',
}

export type LimitMetrics = {
  maxTagKeys?: number;
  maxTagValues?: number;
  maxSeries?: number;
};

export type AutocompleteSettings = {
  useOptimizedLabelsApi?: boolean;
};

export type ExemplarTraceIdDestination = {
  name: string;
  url?: string;
  urlDisplayLabel?: string;
  datasourceUid?: string;
};

export interface PromQueryRequest extends PromQuery {
  step?: number;
  requestId?: string;
  start: number;
  end: number;
  headers?: any;
}

export interface PromMetricsMetadataItem {
  type: string;
  help: string;
  unit?: string;
}

export interface PromMetricsMetadata {
  [metric: string]: PromMetricsMetadataItem;
}

export interface PromDataSuccessResponse<T = PromData> {
  status: 'success';
  data: T;
  trace?: TracingData;
  isPartial?: boolean;
}

export interface PromDataErrorResponse<T = PromData> {
  status: 'error';
  errorType: string;
  error: string;
  data: T;
}

export type PromData = PromMatrixData | PromVectorData | PromScalarData | PromExemplarData[];

export interface Labels {
  [index: string]: any;
}

export interface Exemplar {
  labels: Labels;
  value: number;
  timestamp: number;
}

export interface PromExemplarData {
  seriesLabels: PromMetric;
  exemplars: Exemplar[];
}

export interface PromVectorData {
  resultType: 'vector';
  result: Array<{
    metric: PromMetric;
    value: PromValue;
  }>;
}

export interface PromMatrixData {
  resultType: 'matrix';
  result: Array<{
    metric: PromMetric;
    values: PromValue[];
  }>;
}

export interface PromScalarData {
  resultType: 'scalar';
  result: PromValue;
}

export type PromValue = [number, any];

export interface PromMetric {
  __name__?: string;
  [index: string]: any;
}

export function isMatrixData(result: MatrixOrVectorResult): result is PromMatrixData['result'][0] {
  return 'values' in result;
}

export function isExemplarData(result: PromData): result is PromExemplarData[] {
  if (result == null || !Array.isArray(result)) {
    return false;
  }
  return result.length ? 'exemplars' in result[0] : false;
}

export type MatrixOrVectorResult = PromMatrixData['result'][0] | PromVectorData['result'][0];

export interface TransformOptions {
  format?: string;
  step?: number;
  legendFormat?: string;
  start: number;
  end: number;
  query: string;
  responseListLength: number;
  scopedVars?: ScopedVars;
  refId: string;
  valueWithRefId?: boolean;
  meta: QueryResultMeta;
}

/**
 * Auto = query.legendFormat == '__auto'
 * Verbose = query.legendFormat == null/undefined/''
 * Custom query.legendFormat.length > 0 && query.legendFormat !== '__auto'
 */
export enum LegendFormatMode {
  Auto = '__auto',
  Verbose = '__verbose',
  Custom = '__custom',
}

export interface QueryBuilderLabelFilter {
  label: string;
  op: string;
  value: string;
}

export enum PromVariableQueryType {
  LabelNames,
  LabelValues,
  MetricNames,
  VarQueryResult,
  SeriesQuery,
  ClassicQuery,
}

export interface PromVariableQuery extends DataQuery {
  query?: string;
  expr?: string;
  qryType?: PromVariableQueryType;
  label?: string;
  metric?: string;
  varQuery?: string;
  seriesQuery?: string;
  labelFilters?: QueryBuilderLabelFilter[];
  match?: string;
  classicQuery?: string;
}

export type StandardPromVariableQuery = {
  query: string;
  refId: string;
};

export interface TracingData {
  message: string;
  duration_msec: number;
  children: TracingData[];
}
