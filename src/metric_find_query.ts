// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: change import for getTimeSrv
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/grafana-datasource
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

import { chain, map as _map } from 'lodash';

import { getDefaultTimeRange, MetricFindValue, TimeRange } from '@grafana/data';

import { PrometheusDatasource } from './datasource';
import { getVictoriaMetricsTime } from './language_utils';
import {
  PrometheusLabelNamesRegex,
  PrometheusLabelNamesRegexWithMatch,
  PrometheusMetricNamesRegex,
  PrometheusQueryResultRegex,
} from './migrations/variableMigration';

export default class PrometheusMetricFindQuery {
  range: TimeRange;

  constructor(
    private datasource: PrometheusDatasource,
    private query: string
  ) {
    this.datasource = datasource;
    this.query = query;
    this.range = getDefaultTimeRange();
  }

  process(timeRange: TimeRange): Promise<MetricFindValue[]> {
    this.range = timeRange;
    const labelNamesRegex = PrometheusLabelNamesRegex;
    const labelNamesRegexWithMatch = PrometheusLabelNamesRegexWithMatch;
    const labelValuesRegex = /^label_values\((?:(.+),\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\)\s*$/;
    const metricNamesRegex = PrometheusMetricNamesRegex;
    const queryResultRegex = PrometheusQueryResultRegex;
    const labelNamesQuery = this.query.match(labelNamesRegex);
    const labelNamesMatchQuery = this.query.match(labelNamesRegexWithMatch);

    if (labelNamesMatchQuery) {
      const selector = `{__name__=~".*${labelNamesMatchQuery[1]}.*"}`;
      return this.datasource.languageProvider.getSeriesLabels(selector, []).then((results) =>
        results.map((result) => ({
          text: result,
        }))
      );
    }

    if (labelNamesQuery) {
      return this.datasource.getTagKeys({ filters: [], timeRange });
    }

    const labelValuesQuery = this.query.match(labelValuesRegex);
    if (labelValuesQuery) {
      const filter = labelValuesQuery[1];
      const label = labelValuesQuery[2];
      if (isFilterDefined(filter)) {
        return this.labelValuesQuery(label, filter);
      } else {
        // Exclude the filter part of the expression because it is blank or empty
        return this.labelValuesQuery(label);
      }
    }

    const metricNamesQuery = this.query.match(metricNamesRegex);
    if (metricNamesQuery) {
      return this.metricNameQuery(metricNamesQuery[1]);
    }

    const queryResultQuery = this.query.match(queryResultRegex);
    if (queryResultQuery) {
      return this.queryResultQuery(queryResultQuery[1]);
    }

    // if query contains full metric name, return metric name and label list
    const expressions = ['label_values()', 'metrics()', 'query_result()'];
    if (!expressions.includes(this.query)) {
      return this.metricNameAndLabelsQuery(this.query);
    }

    return Promise.resolve([]);
  }

  labelValuesQuery(label: string, metric?: string) {
    const start = getVictoriaMetricsTime(this.range.from, false);
    const end = getVictoriaMetricsTime(this.range.to, true);
    const params = { ...(metric && { 'match[]': metric }), start: start.toString(), end: end.toString() };

    const url = `/api/v1/label/${label}/values`;

    return this.datasource.metadataRequest(url, params).then((result: any) => {
      return _map(result.data.data, (value) => ({ text: value }));
    });
  }

  metricNameQuery(metricFilterPattern: string) {
    const start = getVictoriaMetricsTime(this.range.from, false);
    const end = getVictoriaMetricsTime(this.range.to, true);
    const params = {
      start: start.toString(),
      end: end.toString(),
    };
    const url = `/api/v1/label/__name__/values`;

    return this.datasource.metadataRequest(url, params).then((result: any) => {
      return chain(result.data.data)
        .filter((metricName) => {
          const r = new RegExp(metricFilterPattern);
          return r.test(metricName);
        })
        .map((matchedMetricName) => {
          return {
            text: matchedMetricName,
            expandable: true,
          };
        })
        .value();
    });
  }

  queryResultQuery(query: string) {
    const url = '/api/v1/query';
    const params = {
      query,
      time: getVictoriaMetricsTime(this.range.to, true).toString(),
    };
    return this.datasource.metadataRequest(url, params).then((result: any) => {
      switch (result.data.data.resultType) {
        case 'scalar': // [ <unix_time>, "<scalar_value>" ]
        case 'string': // [ <unix_time>, "<string_value>" ]
          return [
            {
              text: result.data.data.result[1] || '',
              expandable: false,
            },
          ];
        case 'vector':
          return _map(result.data.data.result, (metricData) => {
            let text = metricData.metric.__name__ || '';
            delete metricData.metric.__name__;
            text +=
              '{' +
              _map(metricData.metric, (v, k) => {
                return k + '="' + v + '"';
              }).join(',') +
              '}';
            text += ' ' + metricData.value[1] + ' ' + metricData.value[0] * 1000;

            return {
              text: text,
              expandable: true,
            };
          });
        default:
          throw Error(`Unknown/Unhandled result type: [${result.data.data.resultType}]`);
      }
    });
  }

  metricNameAndLabelsQuery(query: string): Promise<MetricFindValue[]> {
    const start = getVictoriaMetricsTime(this.range.from, false);
    const end = getVictoriaMetricsTime(this.range.to, true);
    const params = {
      'match[]': query,
      start: start.toString(),
      end: end.toString(),
    };

    const url = `/api/v1/series`;
    const self = this;

    return this.datasource.metadataRequest(url, params).then((result: any) => {
      return _map(result.data.data, (metric: { [key: string]: string }) => {
        return {
          text: self.datasource.getOriginalMetricName(metric),
          expandable: true,
        };
      });
    });
  }
}

function isFilterDefined(filter: string) {
  // We consider blank strings or the empty filter {} as an undefined filter
  return filter && filter.split(' ').join('') !== '{}';
}
