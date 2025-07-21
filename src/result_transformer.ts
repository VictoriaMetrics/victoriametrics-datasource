// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-04: change transform() return if isExemplarData
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

import { flatten, forOwn, groupBy, partition } from 'lodash';

import {
  CoreApp,
  DataFrame,
  DataFrameType,
  DataLink,
  DataQueryRequest,
  DataQueryResponse,
  DataTopic,
  Field,
  FieldType,
  formatLabels,
  getDisplayProcessor,
  Labels,
  MutableField,
  PreferredVisualisationType,
  QueryResultMetaNotice,
  ScopedVars,
  TIME_SERIES_TIME_FIELD_NAME,
  TIME_SERIES_VALUE_FIELD_NAME,
} from '@grafana/data';
import { FetchResponse, getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';

import { renderLegendFormat } from './legend';
import {
  ExemplarTraceIdDestination,
  isExemplarData,
  isMatrixData,
  LegendFormatMode,
  MatrixOrVectorResult,
  PromDataSuccessResponse,
  PromMetric,
  PromQuery,
  PromQueryRequest,
  PromValue,
  TransformOptions,
} from './types';

// handles case-insensitive Inf, +Inf, -Inf (with optional "inity" suffix)
const INFINITY_SAMPLE_REGEX = /^[+-]?inf(?:inity)?$/i;

const isTableResult = (dataFrame: DataFrame, options: DataQueryRequest<PromQuery>): boolean => {
  // We want to process vector and scalar results in Explore as table
  if (
    options.app === CoreApp.Explore &&
    (dataFrame.meta?.custom?.resultType === 'vector' || dataFrame.meta?.custom?.resultType === 'scalar')
  ) {
    return true;
  }

  // We want to process all dataFrames with target.format === 'table' as table
  const target = options.targets.find((target) => target.refId === dataFrame.refId);
  return target?.format === 'table';
};

const isHeatmapResult = (dataFrame: DataFrame, options: DataQueryRequest<PromQuery>): boolean => {
  const target = options.targets.find((target) => target.refId === dataFrame.refId);
  return target?.format === 'heatmap';
};

// V2 result trasnformer used to transform query results from queries that were run trough prometheus backend
export function transformV2(
  response: DataQueryResponse,
  request: DataQueryRequest<PromQuery>,
  options: { exemplarTraceIdDestinations?: ExemplarTraceIdDestination[] }
) {
  const [tableFrames, framesWithoutTable] = partition<DataFrame>(response.data, (df) => isTableResult(df, request));
  const processedTableFrames = transformDFToTable(tableFrames);

  const [exemplarFrames, framesWithoutTableAndExemplars] = partition<DataFrame>(
    framesWithoutTable,
    (df) => df.meta?.custom?.resultType === 'exemplar'
  );

  // EXEMPLAR FRAMES: We enrich exemplar frames with data links and add dataTopic meta info
  const { exemplarTraceIdDestinations: destinations } = options;
  const processedExemplarFrames = exemplarFrames.map((dataFrame) => {
    if (destinations?.length) {
      for (const exemplarTraceIdDestination of destinations) {
        const traceIDField = dataFrame.fields.find((field) => field.name === exemplarTraceIdDestination.name);
        if (traceIDField) {
          const links = getDataLinks(exemplarTraceIdDestination);
          traceIDField.config.links = traceIDField.config.links?.length
            ? [...traceIDField.config.links, ...links]
            : links;
        }
      }
    }

    return { ...dataFrame, meta: { ...dataFrame.meta, dataTopic: DataTopic.Annotations } };
  });

  const [heatmapResults, framesWithoutTableHeatmapsAndExemplars] = partition<DataFrame>(
    framesWithoutTableAndExemplars,
    (df) => isHeatmapResult(df, request)
  );

  // Group heatmaps by query
  const heatmapResultsGroupedByQuery = groupBy<DataFrame>(heatmapResults, (h) => h.refId);

  // Initialize empty array to push grouped histogram frames to
  let processedHeatmapResultsGroupedByQuery: DataFrame[][] = [];

  // Iterate through every query in this heatmap
  for (const query in heatmapResultsGroupedByQuery) {
    // Get reference to dataFrames for heatmap
    const heatmapResultsGroup = heatmapResultsGroupedByQuery[query];

    // Create a new grouping by iterating through the data frames...
    const heatmapResultsGroupedByValues = groupBy<DataFrame>(heatmapResultsGroup, (dataFrame) => {
      // Each data frame has `Time` and `Value` properties, we want to get the values
      const values = dataFrame.fields.find((field) => field.name === TIME_SERIES_VALUE_FIELD_NAME);
      // Specific functionality for special "le" quantile heatmap value, we know if this value exists, that we do not want to calculate the heatmap density across data frames from the same quartile
      if (values?.labels && HISTOGRAM_QUANTILE_LABEL_NAME in values.labels) {
        const { le, ...notLE } = values?.labels;
        return Object.values(notLE).join();
      }

      // Return a string made from the concatenation of this frame's values to represent a grouping in the query
      return Object.values(values?.labels ?? []).join();
    });

    // Then iterate through the resultant object
    forOwn(heatmapResultsGroupedByValues, (dataFrames) => {
      // Sort frames within each grouping
      const sortedHeatmap = dataFrames.sort(sortSeriesByLabel);
      // And push the sorted grouping with the rest
      processedHeatmapResultsGroupedByQuery.push(mergeHeatmapFrames(transformToHistogramOverTime(sortedHeatmap)));
    });
  }

  // Everything else is processed as time_series result and graph preferredVisualisationType
  const otherFrames = framesWithoutTableHeatmapsAndExemplars.map((dataFrame) => {
    return {
      ...dataFrame,
      meta: {
        ...dataFrame.meta,
        preferredVisualisationType: 'graph',
      },
    } as DataFrame;
  });

  const flattenedProcessedHeatmapFrames = flatten(processedHeatmapResultsGroupedByQuery);

  return {
    ...response,
    data: [...otherFrames, ...processedTableFrames, ...flattenedProcessedHeatmapFrames, ...processedExemplarFrames],
  };
}

const HISTOGRAM_QUANTILE_LABEL_NAME = 'le';

export function transformDFToTable(dfs: DataFrame[]): DataFrame[] {
  // If no dataFrames or if 1 dataFrames with no values, return original dataFrame
  if (dfs.length === 0 || (dfs.length === 1 && dfs[0].length === 0)) {
    return dfs;
  }

  // Group results by refId and process dataFrames with the same refId as 1 dataFrame
  const dataFramesByRefId = groupBy(dfs, 'refId');
  const refIds = Object.keys(dataFramesByRefId);

  return refIds.map((refId) => {
    // Create timeField, valueField and labelFields
    const valueText = getValueText(refIds.length, refId);
    const valueField = getValueField({ data: [], valueName: valueText });
    const timeField = getTimeField([]);
    const labelFields: MutableField[] = [];

    // Fill labelsFields with labels from dataFrames
    dataFramesByRefId[refId].forEach((df) => {
      const frameValueField = df.fields[1];
      const promLabels = frameValueField.labels ?? {};

      Object.keys(promLabels)
        .sort()
        .forEach((label) => {
          // If we don't have label in labelFields, add it
          if (!labelFields.some((l) => l.name === label)) {
            const numberField = label === HISTOGRAM_QUANTILE_LABEL_NAME;
            labelFields.push({
              name: label,
              config: { filterable: true },
              type: numberField ? FieldType.number : FieldType.string,
              values: [] as (string | number)[],
            });
          }
        });
    });

    // Fill valueField, timeField and labelFields with values
    dataFramesByRefId[refId].forEach((df) => {
      df.fields[0].values.toArray().forEach((value) => timeField.values.add(value));
      df.fields[1].values.toArray().forEach((value) => {
        valueField.values.add(parseSampleValue(value));
        const labelsForField = df.fields[1].labels ?? {};
        labelFields.forEach((field) => field.values.add(getLabelValue(labelsForField, field.name)));
      });
    });

    const fields = [timeField, ...labelFields, valueField];
    return {
      refId,
      fields,
      meta: { ...dfs[0].meta, preferredVisualisationType: 'table' as PreferredVisualisationType },
      length: timeField.values.length,
    };
  });
}

function getValueText(responseLength: number, refId = '') {
  return responseLength > 1 ? `Value #${refId}` : 'Value';
}

export function transform(
  response: FetchResponse<PromDataSuccessResponse>,
  transformOptions: {
    query: PromQueryRequest;
    exemplarTraceIdDestinations?: ExemplarTraceIdDestination[];
    target: PromQuery;
    responseListLength: number;
    scopedVars?: ScopedVars;
  }
) {
  // Create options object from transformOptions
  const options: TransformOptions = {
    format: transformOptions.target.format,
    step: transformOptions.query.step,
    legendFormat: transformOptions.target.legendFormat,
    start: transformOptions.query.start,
    end: transformOptions.query.end,
    query: transformOptions.query.expr,
    responseListLength: transformOptions.responseListLength,
    scopedVars: transformOptions.scopedVars,
    refId: transformOptions.target.refId,
    valueWithRefId: transformOptions.target.valueWithRefId,
    meta: {
      // Fix for showing of Prometheus results in Explore table
      preferredVisualisationType: transformOptions.query.instant ? 'table' : 'graph',
      executedQueryString: `Expr: ${transformOptions.query.expr}\nStep: ${transformOptions.query.step}`

    },
  };
  const prometheusResult = response.data;
  const traceResult = response?.trace

  if (response.data.isPartial) {
    const partialWarning = {
      severity: "warning",
      text: `The shown results are marked as PARTIAL. The result is marked as partial if one or more vmstorage nodes failed to respond to the query.`
    } as QueryResultMetaNotice

    Array.isArray(options.meta.notices)
      ? options.meta.notices.push(partialWarning)
      : options.meta.notices = [partialWarning]
  }

  if (isExemplarData(prometheusResult)) {
    return {
      dataFrame: [],
      traceResult
    };
  }

  if (!prometheusResult?.result) {
    return {
      dataFrame: [],
      traceResult
    };
  }

  // Return early if result type is scalar
  if (prometheusResult.resultType === 'scalar') {
    return {
      dataFrame: [
        {
          meta: options.meta,
          refId: options.refId,
          length: 1,
          fields: [getTimeField([prometheusResult.result]), getValueField({ data: [prometheusResult.result] })],
        },
      ],
      traceResult
    }
  }

  // Return early again if the format is table, this needs special transformation.
  if (options.format === 'table') {
    const tableData = transformMetricDataToTable(prometheusResult.result, options);
    return {
      dataFrame: [tableData],
      traceResult
    };
  }

  // Process matrix and vector results to DataFrame
  const dataFrame: DataFrame[] = [];
  prometheusResult.result.forEach((data: MatrixOrVectorResult) => dataFrame.push(transformToDataFrame(data, options)));

  // When format is heatmap use the already created data frames and transform it more
  if (options.format === 'heatmap') {
    return {
      dataFrame: mergeHeatmapFrames(transformToHistogramOverTime(dataFrame.sort(sortSeriesByLabel))),
      traceResult
    };
  }

  // Return matrix or vector result as DataFrame[]
  return { dataFrame, traceResult };
}

function getDataLinks(options: ExemplarTraceIdDestination): DataLink[] {
  const dataLinks: DataLink[] = [];

  if (options.datasourceUid) {
    const dataSourceSrv = getDataSourceSrv();
    const dsSettings = dataSourceSrv.getInstanceSettings(options.datasourceUid);

    // dsSettings is undefined because of the reasons below:
    // - permissions issues (probably most likely)
    // - deleted datasource
    // - misconfiguration
    if (dsSettings) {
      dataLinks.push({
        title: options.urlDisplayLabel || `Query with ${dsSettings?.name}`,
        url: '',
        internal: {
          query: { query: '${__value.raw}', queryType: 'traceId' },
          datasourceUid: options.datasourceUid,
          datasourceName: dsSettings?.name ?? 'Data source not found',
        },
      });
    }
  }

  if (options.url) {
    dataLinks.push({
      title: options.urlDisplayLabel || `Go to ${options.url}`,
      url: options.url,
      targetBlank: true,
    });
  }
  return dataLinks;
}

/**
 * Transforms matrix and vector result from Prometheus result to DataFrame
 */
function transformToDataFrame(data: MatrixOrVectorResult, options: TransformOptions): DataFrame {
  const { name, labels } = createLabelInfo(data.metric, options);

  const fields: Field[] = [];

  if (isMatrixData(data)) {
    const stepMs = options.step ? options.step * 1000 : NaN;
    let baseTimestamp = options.start * 1000;
    const dps: PromValue[] = [];

    for (const value of data.values) {
      let dpValue: number | null = parseSampleValue(value[1]);

      if (isNaN(dpValue)) {
        dpValue = null;
      }

      const timestamp = value[0] * 1000;
      for (let t = baseTimestamp; t < timestamp; t += stepMs) {
        dps.push([t, null]);
      }
      baseTimestamp = timestamp + stepMs;
      dps.push([timestamp, dpValue]);
    }

    const endTimestamp = options.end * 1000;
    for (let t = baseTimestamp; t <= endTimestamp; t += stepMs) {
      dps.push([t, null]);
    }
    fields.push(getTimeField(dps, true));
    fields.push(getValueField({ data: dps, parseValue: false, labels, displayNameFromDS: name }));
  } else {
    fields.push(getTimeField([data.value]));
    fields.push(getValueField({ data: [data.value], labels, displayNameFromDS: name }));
  }

  return {
    meta: options.meta,
    refId: options.refId,
    length: fields[0].values.length,
    fields,
    name,
  };
}

function transformMetricDataToTable(md: MatrixOrVectorResult[], options: TransformOptions): DataFrame {
  if (!md || md.length === 0) {
    return {
      meta: options.meta,
      refId: options.refId,
      length: 0,
      fields: [],
    };
  }

  const valueText = options.responseListLength > 1 || options.valueWithRefId ? `Value #${options.refId}` : 'Value';

  const timeField = getTimeField([]);
  const metricFields = Object.keys(md.reduce((acc, series) => ({ ...acc, ...series.metric }), {}))
    .sort()
    .map((label) => {
      // Labels have string field type, otherwise table tries to figure out the type which can result in unexpected results
      // Only "le" label has a number field type
      const numberField = label === HISTOGRAM_QUANTILE_LABEL_NAME;
      return {
        name: label,
        config: { filterable: true },
        type: numberField ? FieldType.number : FieldType.string,
        values: [] as (string | number)[],
      };
    });
  const valueField = getValueField({ data: [], valueName: valueText });

  md.forEach((d) => {
    if (isMatrixData(d)) {
      d.values.forEach((val) => {
        timeField.values.add(val[0] * 1000);
        metricFields.forEach((metricField) => metricField.values.add(getLabelValue(d.metric, metricField.name)));
        valueField.values.add(parseSampleValue(val[1]));
      });
    } else {
      timeField.values.add(d.value[0] * 1000);
      metricFields.forEach((metricField) => metricField.values.add(getLabelValue(d.metric, metricField.name)));
      valueField.values.add(parseSampleValue(d.value[1]));
    }
  });

  return {
    meta: options.meta,
    refId: options.refId,
    length: timeField.values.length,
    fields: [timeField, ...metricFields, valueField],
  };
}

function getLabelValue(metric: PromMetric, label: string): string | number {
  if (metric.hasOwnProperty(label)) {
    if (label === HISTOGRAM_QUANTILE_LABEL_NAME) {
      return parseSampleValue(metric[label]);
    }
    return metric[label];
  }
  return '';
}

function getTimeField(data: PromValue[], isMs = false): MutableField {
  return {
    name: TIME_SERIES_TIME_FIELD_NAME,
    type: FieldType.time,
    config: {},
    values: data.map<string | number>((val) => (isMs ? val[0] : val[0] * 1000)),
  };
}

type ValueFieldOptions = {
  data: PromValue[];
  valueName?: string;
  parseValue?: boolean;
  labels?: Labels;
  displayNameFromDS?: string;
};

function getValueField({
                         data,
                         valueName = TIME_SERIES_VALUE_FIELD_NAME,
                         parseValue = true,
                         labels,
                         displayNameFromDS,
                       }: ValueFieldOptions): MutableField {
  return {
    name: valueName,
    type: FieldType.number,
    display: getDisplayProcessor(),
    config: {
      displayNameFromDS,
    },
    labels,
    values: data.map<string | number>((val) => (parseValue ? parseSampleValue(val[1]) : val[1])),
  };
}

function createLabelInfo(labels: { [key: string]: string }, options: TransformOptions) {
  const legendFormat = options?.legendFormat
  if (legendFormat && legendFormat !== LegendFormatMode.Auto) {
    const title = renderLegendFormat(getTemplateSrv().replace(legendFormat, options?.scopedVars), labels);
    return { name: title, labels };
  }

  if (legendFormat === LegendFormatMode.Auto && Object.keys(labels).length === 1) {
    return { name: Object.values(labels)[0], labels }
  }

  const { __name__, ...labelsWithoutName } = labels;
  const labelPart = formatLabels(labelsWithoutName);
  let title = `${__name__ ?? ''}${labelPart}`;

  return { name: title || options.query, labels: labelsWithoutName };
}

export function getOriginalMetricName(labelData: { [key: string]: string }) {
  const metricName = labelData.__name__ || '';
  delete labelData.__name__;
  const labelPart = Object.entries(labelData)
    .map((label) => `${label[0]}="${label[1]}"`)
    .join(',');
  return `${metricName}{${labelPart}}`;
}

function mergeHeatmapFrames(frames: DataFrame[]): DataFrame[] {
  if (frames.length === 0) {
    return [];
  }

  const timeField = frames[0].fields.find((field) => field.type === FieldType.time)!;
  const countFields = frames.map((frame) => {
    let field = frame.fields.find((field) => field.type === FieldType.number)!;

    return {
      ...field,
      name: field.config.displayNameFromDS!,
    };
  });

  return [
    {
      ...frames[0],
      meta: {
        ...frames[0].meta,
        type: DataFrameType.HeatmapRows,
      },
      fields: [timeField!, ...countFields],
    },
  ];
}

function transformToHistogramOverTime(seriesList: DataFrame[]) {
  /*      t1 = timestamp1, t2 = timestamp2 etc.
            t1  t2  t3          t1  t2  t3
    le10    10  10  0     =>    10  10  0
    le20    20  10  30    =>    10  0   30
    le30    30  10  35    =>    10  0   5
    */
  for (let i = seriesList.length - 1; i > 0; i--) {
    const topSeries = seriesList[i].fields.find((s) => s.name === TIME_SERIES_VALUE_FIELD_NAME);
    const bottomSeries = seriesList[i - 1].fields.find((s) => s.name === TIME_SERIES_VALUE_FIELD_NAME);
    if (!topSeries || !bottomSeries) {
      throw new Error('Prometheus heatmap transform error: data should be a time series');
    }

    for (let j = 0; j < topSeries.values.length; j++) {
      const bottomPoint = bottomSeries.values.get(j) || [0];
      topSeries.values.toArray()[j] -= bottomPoint;
    }
  }

  return seriesList;
}

function sortSeriesByLabel(s1: DataFrame, s2: DataFrame): number {
  let le1, le2;

  try {
    // fail if not integer. might happen with bad queries
    le1 = parseSampleValue(s1.name ?? '');
    le2 = parseSampleValue(s2.name ?? '');
  } catch (err) {
    console.error(err);
    return 0;
  }

  if (le1 > le2) {
    return 1;
  }

  if (le1 < le2) {
    return -1;
  }

  return 0;
}

/** @internal */
export function parseSampleValue(value: string): number {
  if (INFINITY_SAMPLE_REGEX.test(value)) {
    return value[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  return parseFloat(value);
}
