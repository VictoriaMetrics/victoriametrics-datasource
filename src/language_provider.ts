// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-14: remove PromCheatSheet
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

import { once } from 'lodash';
import { LRUCache as LRU } from 'lru-cache'
import Prism from 'prismjs';

import {
  AbstractLabelMatcher,
  AbstractQuery,
  LanguageProvider,
} from '@grafana/data';
import { BackendSrvRequest } from '@grafana/runtime';

import { Label } from './components/monaco-query-field/monaco-completion-provider/situation';
import { PrometheusDatasource } from './datasource';
import {
  AbstractLabelOperator,
  extractLabelMatchers,
  fixSummariesMetadata,
  processHistogramMetrics,
  processLabels,
  roundSecToMin,
  toPromLikeQuery,
} from './language_utils';
import PromqlSyntax from './metricsql';
import { PromMetricsMetadata, PromQuery } from './types';

const DEFAULT_KEYS = ['job', 'instance'];
const EMPTY_SELECTOR = '{}';
// Max number of items (metrics, labels, values) that we display as suggestions. Prevents from running out of memory.
export const SUGGESTIONS_LIMIT = 10000;

export function getMetadataString(metric: string, metadata: PromMetricsMetadata): string | undefined {
  if (!metadata[metric]) {
    return undefined;
  }
  const { type, help } = metadata[metric];
  return `${type.toUpperCase()}: ${help}`;
}

export default class PromQlLanguageProvider extends LanguageProvider {
  histogramMetrics: string[];
  metrics: string[];
  metricsMetadata?: PromMetricsMetadata;
  declare startTask: Promise<any>;
  datasource: PrometheusDatasource;
  labelKeys: string[] = [];
  declare labelFetchTs: number;
  withTemplates: Array<{label: string, comment: string, value: string}>

  /**
   *  Cache for labels of series. This is bit simplistic in the sense that it just counts responses each as a 1 and does
   *  not account for different size of a response. If that is needed a `length` function can be added in the options.
   *  10 as a max size is totally arbitrary right now.
   */
  private labelsCache = new LRU<string, Record<string, string[]>>({ max: 10 });

  constructor(datasource: PrometheusDatasource, initialValues?: Partial<PromQlLanguageProvider>) {
    super();

    this.datasource = datasource;
    this.histogramMetrics = [];
    this.metrics = [];
    this.withTemplates = []

    Object.assign(this, initialValues);
  }

  request = async (url: string, defaultValue: any, params = {}, options?: Partial<BackendSrvRequest>): Promise<any> => {
    try {
      const res = await this.datasource.getRequest(url, params, options);
      return res.data;
    } catch (error) {
      console.error(error);
    }

    return defaultValue;
  };

  start = async (): Promise<any[]> => {
    if (this.datasource.lookupsDisabled) {
      return [];
    }

    this.metrics = (await this.fetchLabelValues('__name__')) || [];
    this.histogramMetrics = processHistogramMetrics(this.metrics).sort();
    return Promise.all([this.loadMetricsMetadata(), this.fetchLabels()]);
  };

  async loadMetricsMetadata() {
    this.metricsMetadata = fixSummariesMetadata(
      await this.request('api/v1/metadata', {}, {}, { showErrorAlert: false })
    );
  }

  getLabelKeys(): string[] {
    return this.labelKeys;
  }

  importFromAbstractQuery(labelBasedQuery: AbstractQuery): PromQuery {
    return toPromLikeQuery(labelBasedQuery);
  }

  exportToAbstractQuery(query: PromQuery): AbstractQuery {
    const promQuery = query.expr;
    if (!promQuery || promQuery.length === 0) {
      return { refId: query.refId, labelMatchers: [] };
    }
    const tokens = Prism.tokenize(promQuery, PromqlSyntax);
    const labelMatchers: AbstractLabelMatcher[] = extractLabelMatchers(tokens);
    const nameLabelValue = getNameLabelValue(promQuery, tokens);
    if (nameLabelValue && nameLabelValue.length > 0) {
      labelMatchers.push({
        name: '__name__',
        operator: AbstractLabelOperator.Equal,
        value: nameLabelValue,
      });
    }

    return {
      refId: query.refId,
      labelMatchers,
    };
  }

  async getSeries(selector: string, withName?: boolean): Promise<Record<string, string[]>> {
    if (this.datasource.lookupsDisabled) {
      return {};
    }
    try {
      if (selector === EMPTY_SELECTOR) {
        return await this.fetchDefaultSeries();
      } else {
        return await this.fetchSeriesLabels(selector, withName);
      }
    } catch (error) {
      // TODO: better error handling
      console.error(error);
      return {};
    }
  }

  getSeriesLabels = async (selector: string, otherLabels: Label[]): Promise<string[]> => {
    // Exclude __name__ from output
    otherLabels.push({ name: '__name__', value: '', op: '!=' });
    const possibleLabelNames = await this.fetchSeriesLabelsMatch(selector);
    const usedLabelNames = new Set(otherLabels.map((l) => l.name)); // names used in the query
    return possibleLabelNames.filter((l) => !usedLabelNames.has(l));
  };

  fetchSeriesLabelsMatch = async (name: string): Promise<string[]> => {
    const interpolatedName = this.datasource.interpolateString(name);
    const range = this.datasource.getTimeRangeParams();
    const urlParams = {
      ...range,
      'match[]': interpolatedName,
    };
    const url = '/api/v1/labels';

    return await this.request(url, [], urlParams)
  };

  fetchSeriesValuesWithMatch = async (name: string, match?: string): Promise<string[]> => {
    const interpolatedName = name ? this.datasource.interpolateString(name) : null;
    const interpolatedMatch = match ? this.datasource.interpolateString(match) : null;
    const range = this.datasource.getTimeRangeParams();
    const urlParams = {
      ...range,
      ...(interpolatedMatch && { 'match[]': interpolatedMatch }),
    };

    const value = await this.request(`/api/v1/label/${interpolatedName}/values`, [], urlParams);
    return value ?? [];
  };

  fetchLabelValues = async (key: string): Promise<string[]> => {
    const params = this.datasource.getTimeRangeParams();
    const limit = this.datasource.getLimitMetrics('maxTagValues');
    const url = `/api/v1/label/${this.datasource.interpolateString(key)}/values`;
    return await this.request(url, [], { ...params, limit });
  };

  async getLabelValues(key: string): Promise<string[]> {
    return await this.fetchLabelValues(key);
  }

  /**
   * Fetches all label keys
   */
  async fetchLabels(): Promise<string[]> {
    const url = '/api/v1/labels';
    const params = this.datasource.getTimeRangeParams();
    const limit = this.datasource.getLimitMetrics('maxTagKeys');
    this.labelFetchTs = Date.now().valueOf();

    const res = await this.request(url, [], { ...params, limit });
    if (Array.isArray(res)) {
      this.labelKeys = res.slice().sort();
    }

    return [];
  }

  /**
   * Fetch labels for a series. This is cached by its args but also by the global timeRange currently selected as
   * they can change over requested time.
   * @param name
   * @param withName
   */
  fetchSeriesLabels = async (name: string, withName?: boolean): Promise<Record<string, string[]>> => {
    if (this.datasource.useOptimizedLabelsApi()) {
      try {
        return await this.fetchSeriesLabelsOptimized(name, withName);
      } catch (error) {
        // Fallback to legacy /api/v1/series if optimized API fails
        return await this.fetchSeriesLabelsLegacy(name, withName);
      }
    }
    return await this.fetchSeriesLabelsLegacy(name, withName);
  };

  /**
   * Optimized version using /api/v1/labels and /api/v1/label/{key}/values endpoints
   * This is more efficient for high-cardinality metrics
   */
  fetchSeriesLabelsOptimized = async (name: string, withName?: boolean): Promise<Record<string, string[]>> => {
    const unescapedName = name.replace(/\\(.)/g, '$1');
    const interpolatedName = this.datasource.interpolateString(unescapedName);
    const range = this.datasource.getTimeRangeParams();

    // Cache key for optimized API
    const cacheParams = new URLSearchParams({
      'match[]': interpolatedName,
      start: roundSecToMin(parseInt(range.start, 10)).toString(),
      end: roundSecToMin(parseInt(range.end, 10)).toString(),
      withName: withName ? 'true' : 'false',
      optimized: 'true',
    });
    const cacheKey = `/api/v1/labels?${cacheParams.toString()}`;

    let value = this.labelsCache.get(cacheKey);
    if (value) {
      return value;
    }

    // Step 1: Get label names using /api/v1/labels with match[]
    const labelNames = await this.fetchSeriesLabelsMatch(interpolatedName);

    // Step 2: Get values for each label using /api/v1/label/{key}/values with match[]
    const result: Record<string, string[]> = {};
    const labelsToFetch = withName ? labelNames : labelNames.filter((l) => l !== '__name__');

    await Promise.all(
      labelsToFetch.map(async (labelName) => {
        const values = await this.fetchSeriesValuesWithMatch(labelName, interpolatedName);
        if (values.length > 0) {
          result[labelName] = values;
        }
      })
    );

    this.labelsCache.set(cacheKey, result);
    return result;
  };

  /**
   * Legacy version using /api/v1/series endpoint
   */
  fetchSeriesLabelsLegacy = async (name: string, withName?: boolean): Promise<Record<string, string[]>> => {
    const unescapedName = name.replace(/\\(.)/g, '$1')
    const interpolatedName = this.datasource.interpolateString(unescapedName);
    const range = this.datasource.getTimeRangeParams();
    const limit = this.datasource.getLimitMetrics('maxSeries');
    const urlParams = {
      ...range,
      limit,
      'match[]': interpolatedName,
    };
    const url = '/api/v1/series';
    // Cache key is a bit different here. We add the `withName` param and also round up to a minute the intervals.
    // The rounding may seem strange but makes relative intervals like now-1h less prone to need separate request every
    // millisecond while still actually getting all the keys for the correct interval. This still can create problems
    // when user does not the newest values for a minute if already cached.
    const cacheParams = new URLSearchParams({
      'match[]': interpolatedName,
      start: roundSecToMin(parseInt(range.start, 10)).toString(),
      end: roundSecToMin(parseInt(range.end, 10)).toString(),
      withName: withName ? 'true' : 'false',
    });

    const cacheKey = `/api/v1/series?${cacheParams.toString()}`;
    let value = this.labelsCache.get(cacheKey);
    if (!value) {
      const data = await this.request(url, [], urlParams);
      const { values } = processLabels(data, withName);
      value = values;
      this.labelsCache.set(cacheKey, value);
    }
    return value;
  };

  /**
   * Fetch series for a selector. Use this for raw results. Use fetchSeriesLabels() to get labels.
   * @param match
   */
  fetchSeries = async (match: string): Promise<Array<Record<string, string>>> => {
    const url = '/api/v1/series';
    const range = this.datasource.getTimeRangeParams();
    const limit = this.datasource.getLimitMetrics('maxSeries');
    const params = { ...range, 'match[]': match, limit };
    return await this.request(url, {}, params);
  };

  /**
   * Fetch this only one as we assume this won't change over time. This is cached differently from fetchSeriesLabels
   * because we can cache more aggressively here and also we do not want to invalidate this cache the same way as in
   * fetchSeriesLabels.
   */
  fetchDefaultSeries = once(async () => {
    const values = await Promise.all(DEFAULT_KEYS.map((key) => this.fetchLabelValues(key)));
    return DEFAULT_KEYS.reduce((acc, key, i) => ({ ...acc, [key]: values[i] }), {});
  });
}

function getNameLabelValue(promQuery: string, tokens: any): string {
  let nameLabelValue = '';
  for (let prop in tokens) {
    if (typeof tokens[prop] === 'string') {
      nameLabelValue = tokens[prop] as string;
      break;
    }
  }
  return nameLabelValue;
}
