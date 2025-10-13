// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-04: replace type to 'victoriametrics-datasource'
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

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AbstractQuery,
  AdHocVariableFilter,
  AnnotationEvent,
  AnnotationQuery,
  CustomVariableModel,
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceWithQueryExportSupport,
  DataSourceWithQueryImportSupport,
  dateMath,
  DateTime,
  getDefaultTimeRange,
  LegacyMetricFindQueryOptions,
  QueryFixAction,
  QueryVariableModel,
  rangeUtil,
  ScopedVars,
  TimeRange,
} from '@grafana/data';
import { BackendSrvRequest, DataSourceWithBackend, getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { addLabelToQuery } from './add_label_to_query';
import { AnnotationQueryEditor } from "./components/Annotations/AnnotationQueryEditor";
import { WithTemplate } from "./components/WithTemplateConfig/types";
import { mergeTemplateWithQuery } from "./components/WithTemplateConfig/utils/getArrayFromTemplate";
import { ANNOTATION_QUERY_STEP_DEFAULT, DATASOURCE_TYPE } from "./consts";
import PrometheusLanguageProvider from './language_provider';
import { expandRecordingRules, getVictoriaMetricsTime } from './language_utils';
import { renderLegendFormat } from './legend';
import PrometheusMetricFindQuery from './metric_find_query';
import { getInitHints, getQueryHints } from './query_hints';
import { getOriginalMetricName, transformV2 } from './result_transformer';
import { getTimeSrv, TimeSrv } from './services/TimeSrv';
import { ExemplarTraceIdDestination, LimitMetrics, PromOptions, PromQuery, PromQueryType } from './types';
import { utf8Support, wrapUtf8Filters } from './utf8_support';
import { PrometheusVariableSupport } from './variables';

enum PromApplication {
  VictoriaMetrics = 'VictoriaMetrics',
}

export class PrometheusDatasource
  extends DataSourceWithBackend<PromQuery, PromOptions>
  implements DataSourceWithQueryImportSupport<PromQuery>, DataSourceWithQueryExportSupport<PromQuery> {
  type: string;
  ruleMappings: { [index: string]: string };
  url: string;
  id: number;
  directUrl: string;
  access: 'direct' | 'proxy';
  basicAuth: any;
  withCredentials: any;
  // metricsNameCache = new LRU<string, string[]>({max: 10});
  interval: string;
  queryTimeout: string | undefined;
  httpMethod: string;
  languageProvider: PrometheusLanguageProvider;
  exemplarTraceIdDestinations: ExemplarTraceIdDestination[] | undefined;
  lookupsDisabled: boolean;
  exemplarsAvailable: boolean;
  subType: PromApplication;
  rulerEnabled: boolean;
  withTemplates: WithTemplate[];
  limitMetrics: LimitMetrics;

  constructor(
    instanceSettings: DataSourceInstanceSettings<PromOptions>,
    private readonly templateSrv: TemplateSrv = getTemplateSrv(),
    private readonly timeSrv: TimeSrv = getTimeSrv(),
    languageProvider?: PrometheusLanguageProvider
  ) {
    super(instanceSettings);

    this.type = DATASOURCE_TYPE;
    this.subType = PromApplication.VictoriaMetrics;
    this.rulerEnabled = false;
    this.id = instanceSettings.id;
    this.url = instanceSettings.url!;
    this.access = instanceSettings.access;
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.interval = instanceSettings.jsonData.timeInterval || '15s';
    this.queryTimeout = instanceSettings.jsonData.queryTimeout;
    this.httpMethod = instanceSettings.jsonData.httpMethod || 'GET';
    this.directUrl = instanceSettings.jsonData.directUrl ?? this.url;
    this.exemplarTraceIdDestinations = instanceSettings.jsonData.exemplarTraceIdDestinations;
    this.ruleMappings = {};
    this.languageProvider = languageProvider ?? new PrometheusLanguageProvider(this);
    this.lookupsDisabled = instanceSettings.jsonData.disableMetricsLookup ?? false;
    this.variables = new PrometheusVariableSupport(this, this.templateSrv);
    this.exemplarsAvailable = false;
    this.withTemplates = instanceSettings.jsonData.withTemplates ?? [];
    this.limitMetrics = instanceSettings.jsonData.limitMetrics ?? {};
    this.annotations = {
      QueryEditor: AnnotationQueryEditor,
      processEvents: this.processEvents,
      prepareQuery: this.prepareQuery
    }
  }

  init = async () => {
    await this.loadRules();
  };

  getQueryDisplayText(query: PromQuery) {
    return query.expr;
  }

  async importFromAbstractQueries(abstractQueries: AbstractQuery[]): Promise<PromQuery[]> {
    return abstractQueries.map((abstractQuery) => this.languageProvider.importFromAbstractQuery(abstractQuery));
  }

  async exportToAbstractQueries(queries: PromQuery[]): Promise<AbstractQuery[]> {
    return queries.map((query) => this.languageProvider.exportToAbstractQuery(query));
  }

  // Use this for tab completion features, won't publish response to other components
  async getRequest(url: string, params = {}, options?: Partial<BackendSrvRequest>) {
    return await this.getResource(url, params, {
      hideFromInspector: true,
      showErrorAlert: false,
      ...options,
    });
  }

  interpolateQueryExpr(value: string | string[] = [], variable: any) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return prometheusRegularEscape(value);
    }

    if (typeof value === 'string') {
      return prometheusSpecialRegexEscape(value);
    }

    const escapedValues = value.map((val) => prometheusSpecialRegexEscape(val));

    if (escapedValues.length === 1) {
      return escapedValues[0];
    }

    return '(' + escapedValues.join('|') + ')';
  }

  targetContainsTemplate(target: PromQuery) {
    return this.templateSrv.containsTemplate(target.expr);
  }

  processTargetV2(target: PromQuery, request: DataQueryRequest<PromQuery>) {
    // Apply WITH templates
    const dashboardUID = request.dashboardUID || request.app || "";
    const template = this.withTemplates.find(t => t.uid === dashboardUID);
    const expr = mergeTemplateWithQuery(target.expr, template)

    const baseTarget = {
      ...target,
      expr: expr,
      queryType: PromQueryType.timeSeriesQuery,
      requestId: request.panelId + target.refId,
      // We need to pass utcOffsetSec to backend to calculate aligned range
      utcOffsetSec: this.timeSrv.timeRange().to.utcOffset() * 60,
    }

    if (target.range && target.instant) {
      return [
        {
          ...baseTarget,
          range: true,
          instant: false,
        }, {
          ...baseTarget,
          refId: baseTarget.refId + '_instant',
          requestId: baseTarget.requestId,
          // for 'Both' type of query send the second query as instant
          range: false,
          instant: true,
          format: undefined,
        }
      ];
    }

    return baseTarget;
  }

  query(request: DataQueryRequest<PromQuery>): Observable<DataQueryResponse> {
    if (this.access === 'direct') {
      return this.directAccessError();
    }
    const targets = request.targets.map((target) => this.processTargetV2(target, request));
    const newRequest = { ...request, targets: targets.flat() };
    return super.query(newRequest).pipe(
      map((response) =>
        transformV2(response, newRequest, {})
      )
    );
  }

  directAccessError() {
    return of({
      data: [],
      error: {
        message: 'Direct access is not supported for this datasource. Please use proxy access.',
      },
    });
  }

  adjustInterval(interval: number, minInterval: number, range: number, intervalFactor: number) {
    // Prometheus will drop queries that might return more than 11000 data points.
    // Calculate a safe interval as an additional minimum to take into account.
    // Fractional safeIntervals are allowed, however serve little purpose if the interval is greater than 1
    // If this is the case take the ceil of the value.
    let safeInterval = range / 11000;
    if (safeInterval > 1) {
      safeInterval = Math.ceil(safeInterval);
    }
    return Math.max(interval * intervalFactor, minInterval, safeInterval);
  }

  metricFindQuery(query: string, options?: LegacyMetricFindQueryOptions) {
    if (!query) {
      return Promise.resolve([]);
    }

    const range = options?.range ?? getDefaultTimeRange()
    const scopedVars = {
      __interval: { text: this.interval, value: this.interval },
      __interval_ms: { text: rangeUtil.intervalToMs(this.interval), value: rangeUtil.intervalToMs(this.interval) },
      ...this.getRangeScopedVars(range),
    };
    const interpolated = this.templateSrv.replace(query, scopedVars, this.interpolateQueryExpr);
    const metricFindQuery = new PrometheusMetricFindQuery(this, interpolated);
    return metricFindQuery.process(range);
  }


  getRangeScopedVars(range: TimeRange = this.timeSrv.timeRange()) {
    const msRange = range.to.diff(range.from);
    const sRange = Math.round(msRange / 1000);
    return {
      __range_ms: { text: msRange, value: msRange },
      __range_s: { text: sRange, value: sRange },
      __range: { text: sRange + 's', value: sRange + 's' },
    };
  }

  prepareQuery = (annotation: AnnotationQuery<PromQuery>): PromQuery | undefined => {
    const { expr = '', datasource, step, legendFormat } = annotation;

    if (!expr) {
      return undefined
    }

    return {
      expr,
      range: true,
      instant: false,
      exemplar: false,
      interval: step || ANNOTATION_QUERY_STEP_DEFAULT,
      refId: 'X',
      datasource,
      legendFormat: legendFormat ?? ""
    };
  };

  processEvents = (annotation: AnnotationQuery<PromQuery>, frames: DataFrame[]) => {
    if (!frames || !frames.length) {
      return of([])
    }

    const { tagKeys = '', titleFormat = '', textFormat = '', useValueForTime } = annotation;

    const step = rangeUtil.intervalToSeconds(annotation.step || ANNOTATION_QUERY_STEP_DEFAULT) * 1000;
    const tagKeysArray = tagKeys.split(',');

    const eventList: AnnotationEvent[] = [];

    for (const frame of frames) {
      if (frame.fields.length === 0) {
        continue;
      }
      const timeField = frame.fields[0];
      const valueField = frame.fields[1];
      const labels = valueField?.labels || {};

      const tags = Object.keys(labels)
        .filter((label) => tagKeysArray.includes(label))
        .map((label) => labels[label]);

      const timeValueTuple: Array<[number, number]> = [];

      let idx = 0;
      valueField.values.toArray().forEach((value: string) => {
        let timeStampValue: number;
        let valueValue: number;
        const time = timeField.values.get(idx);

        // If we want to use value as a time, we use value as timeStampValue and valueValue will be 1
        if (useValueForTime) {
          timeStampValue = Math.floor(parseFloat(value));
          valueValue = 1;
        } else {
          timeStampValue = Math.floor(parseFloat(time));
          valueValue = parseFloat(value);
        }

        idx++;
        timeValueTuple.push([timeStampValue, valueValue]);
      });

      const activeValues = timeValueTuple.filter((value) => value[1] >= 1);
      const activeValuesTimestamps = activeValues.map((value) => value[0]);

      // Instead of creating singular annotation for each active event we group events into region if they are less
      // or equal to `step` apart.
      let latestEvent: AnnotationEvent | null = null;

      for (const timestamp of activeValuesTimestamps) {
        // We already have event `open` and we have new event that is inside the `step` so we just update the end.
        if (latestEvent && (latestEvent.timeEnd ?? 0) + step >= timestamp) {
          latestEvent.timeEnd = timestamp;
          continue;
        }

        // Event exists but new one is outside the `step` so we add it to eventList.
        if (latestEvent) {
          eventList.push(latestEvent);
        }

        // We start a new region.
        latestEvent = {
          time: timestamp,
          timeEnd: timestamp,
          annotation,
          title: renderLegendFormat(titleFormat, labels),
          tags,
          text: renderLegendFormat(textFormat, labels),
        };
      }

      if (latestEvent) {
        // Finish up last point if we have one
        latestEvent.timeEnd = activeValuesTimestamps[activeValuesTimestamps.length - 1];
        eventList.push(latestEvent);
      }
    }

    return of(eventList);
  };

  async getTagKeys(options?: any) {
    if (options?.series) {
      // Get tags for the provided series only
      const seriesLabels: Array<Record<string, string[]>> = await Promise.all(
        options.series.map((series: string) => this.languageProvider.fetchSeriesLabels(series))
      );
      // Combines tags from all options.series provided
      let tags: string[] = [];
      seriesLabels.map((value) => (tags = tags.concat(Object.keys(value))));
      const uniqueLabels = [...new Set(tags)];
      return uniqueLabels.map((value: any) => ({ text: value }));
    } else {
      // Get all tags
      const limit = this.getLimitMetrics('maxTagKeys');
      const result = await this.getRequest('api/v1/labels', { limit });
      return result?.data?.map((value: any) => ({ text: value })) ?? [];
    }
  }

  async getTagValues(options: { key?: string } = {}) {
    const limit = this.getLimitMetrics('maxTagValues');
    const result = await this.getRequest(`api/v1/label/${options.key}/values`, { limit });
    return result?.data?.map((value: any) => ({ text: value })) ?? [];
  }

  interpolateVariablesInQueries(queries: PromQuery[], scopedVars: ScopedVars): PromQuery[] {
    let expandedQueries = queries;
    if (queries && queries.length) {
      expandedQueries = queries.map((query) => ({
        ...query,
        datasource: this.getRef(),
        expr: this.templateSrv.replace(query.expr, scopedVars, this.interpolateQueryExpr),
        interval: this.templateSrv.replace(query.interval, scopedVars),
      }));
    }
    return expandedQueries;
  }

  getQueryHints(query: PromQuery, result: any[]) {
    return getQueryHints(query.expr ?? '', result, this);
  }

  getInitHints() {
    return getInitHints(this);
  }

  async loadRules() {
    try {
      const res = await this.getRequest('api/v1/rules', {}, { showErrorAlert: false });
      const groups = res.data?.groups;

      if (groups) {
        this.ruleMappings = extractRuleMappingFromGroups(groups);
      }
    } catch (e) {
      console.log('Rules API is experimental. Ignore next error.');
      console.error(e);
    }
  }

  modifyQuery(query: PromQuery, action: QueryFixAction): PromQuery {
    let expression = query.expr ?? '';
    switch (action.type) {
      case 'ADD_FILTER': {
        const { key, value } = action.options ?? {};
        if (key && value) {
          expression = addLabelToQuery(expression, key, value);
        }

        break;
      }
      case 'ADD_FILTER_OUT': {
        const { key, value } = action.options ?? {};
        if (key && value) {
          expression = addLabelToQuery(expression, key, value, '!=');
        }
        break;
      }
      case 'ADD_HISTOGRAM_QUANTILE': {
        expression = `histogram_quantile(0.95, sum(rate(${expression}[$__rate_interval])) by (le))`;
        break;
      }
      case 'ADD_RATE': {
        expression = `rate(${expression}[$__rate_interval])`;
        break;
      }
      case 'ADD_SUM': {
        expression = `sum(${expression.trim()}) by ($1)`;
        break;
      }
      case 'EXPAND_RULES': {
        if (action.options) {
          expression = expandRecordingRules(expression, action.options);
        }
        break;
      }
      default:
        break;
    }
    return { ...query, expr: expression };
  }

  getPrometheusTime(date: string | DateTime, roundUp: boolean) {
    if (typeof date === 'string') {
      date = dateMath.parse(date, roundUp)!;
    }

    return Math.ceil(date.valueOf() / 1000);
  }

  getTimeRangeParams(): { start: string; end: string } {
    const range = this.timeSrv.timeRange();
    return {
      start: this.getPrometheusTime(range.from, false).toString(),
      end: this.getPrometheusTime(range.to, true).toString(),
    };
  }

  getLimitMetrics(key: keyof LimitMetrics): number {
    return this.limitMetrics[key] || 0;
  }

  getOriginalMetricName(labelData: { [key: string]: string }) {
    return getOriginalMetricName(labelData);
  }

  enhanceExprWithAdHocFilters(filters: AdHocVariableFilter[] | undefined, expr: string) {
    // @ts-ignore
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    const resultFilters = filters || adhocFilters;

    if (!resultFilters || resultFilters.length === 0) {
      return expr;
    }

    return resultFilters.reduce((acc: string, filter: { key: string, operator: string, value: string }) => {
      const { key, operator } = filter;
      let { value } = filter;
      if (operator === '=~' || operator === '!~') {
        value = prometheusRegularEscape(value);
      }
      return addLabelToQuery(acc, key, value, operator);
    }, expr);
  }

  // Used when running queries trough backend
  filterQuery(query: PromQuery): boolean {
    return !(query.hide || !query.expr);
  }

  // Used when running queries trough backend
  applyTemplateVariables(target: PromQuery, scopedVars: ScopedVars, filters?: AdHocVariableFilter[]) {
    const variables = { ...scopedVars };

    // We want to interpolate these variables on backend.
    // The pre-calculated values are replaced withe the variable strings.
    variables.__interval = {
      value: '$__interval',
    };
    variables.__interval_ms = {
      value: '$__interval_ms',
    };

    //Add ad hoc filters
    const expr = this.templateSrv.replace(target.expr, variables, this.interpolateExploreMetrics(target.fromExploreMetrics));

    // Apply ad-hoc filters
    // When ad-hoc filters are applied, we replace again the variables in case the ad-hoc filters also reference a variable
    const exprWithAdHocFilters = this.templateSrv.replace(
      this.enhanceExprWithAdHocFilters(filters, expr),
      variables,
      this.interpolateQueryExpr
    );

    return {
      ...target,
      legendFormat: this.templateSrv.replace(target.legendFormat, variables),
      expr: exprWithAdHocFilters,
      interval: this.templateSrv.replace(target.interval, variables),
    };
  }

  getVariables(): string[] {
    return this.templateSrv.getVariables().map((v) => `$${v.name}`);
  }

  interpolateString(string: string, scopedVars?: ScopedVars) {
    return this.templateSrv.replace(string, scopedVars, this.interpolateQueryExpr);
  }

  interpolateExploreMetrics(fromExploreMetrics?: boolean) {
    return (value: string | string[] = [], variable: QueryVariableModel | CustomVariableModel) => {
      if (typeof value === 'string' && fromExploreMetrics) {
        if (variable.name === 'filters') {
          return wrapUtf8Filters(value);
        }
        if (variable.name === 'groupby') {
          return utf8Support(value);
        }
      }
      return this.interpolateQueryExpr(value, variable);
    };
  }

  withTemplatesUpdate(withTemplates: WithTemplate[]) {
    this.withTemplates = withTemplates ?? [];
  }

  getAdjustedInterval(timeRange: TimeRange): { start: string; end: string } {
    return {
      start: getVictoriaMetricsTime(timeRange.from, false).toString(),
      end: getVictoriaMetricsTime(timeRange.to, true).toString(),
    };
  }
}

export function extractRuleMappingFromGroups(groups: any[]) {
  return groups.reduce(
    (mapping, group) =>
      group.rules
        .filter((rule: any) => rule.type === 'recording')
        .reduce(
          (acc: { [key: string]: string }, rule: any) => ({
            ...acc,
            [rule.name]: rule.query,
          }),
          mapping
        ),
    {}
  );
}

// NOTE: these two functions are very similar to the escapeLabelValueIn* functions
// in language_utils.ts, but they are not exactly the same algorithm, and we found
// no way to reuse one in the another or vice versa.
export function prometheusRegularEscape(value: any) {
  return typeof value === 'string' ? value.replace(/\\/g, '\\\\').replace(/'/g, "\\\\'") : value;
}

export function prometheusSpecialRegexEscape(value: any) {
  return typeof value === 'string' ? value.replace(/\\/g, '\\\\\\\\').replace(/[$^*{}\[\]'+?.()|]/g, '\\\\$&') : value;
}
