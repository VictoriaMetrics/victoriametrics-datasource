// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: change getTemplateSrv and TemplateSrv imports
// A detailed history of changes can be seen this - https://github.com/VictoriaMetrics/grafana-datasource
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

import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  DataQueryRequest,
  DataQueryResponse,
  rangeUtil,
  StandardVariableQuery,
  StandardVariableSupport,
} from '@grafana/data';
import { getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { PrometheusDatasource } from './datasource';
import PrometheusMetricFindQuery from './metric_find_query';
import { getTimeSrv, TimeSrv } from './services/TimeSrv';
import { PromQuery } from './types';

export class PrometheusVariableSupport extends StandardVariableSupport<PrometheusDatasource> {
  constructor(
    private readonly datasource: PrometheusDatasource,
    private readonly templateSrv: TemplateSrv = getTemplateSrv(),
    private readonly timeSrv: TimeSrv = getTimeSrv()
  ) {
    super();
    this.query = this.query.bind(this);
  }

  query(request: DataQueryRequest<PromQuery>): Observable<DataQueryResponse> {
    const query = request.targets[0].expr;
    if (!query) {
      return of({ data: [] });
    }

    const scopedVars = {
      __interval: { text: this.datasource.interval, value: this.datasource.interval },
      __interval_ms: {
        text: rangeUtil.intervalToMs(this.datasource.interval),
        value: rangeUtil.intervalToMs(this.datasource.interval),
      },
      ...this.datasource.getRangeScopedVars(this.timeSrv.timeRange()),
    };

    const interpolated = this.templateSrv.replace(query, scopedVars, this.datasource.interpolateQueryExpr);
    const metricFindQuery = new PrometheusMetricFindQuery(this.datasource, interpolated);
    const metricFindStream = from(metricFindQuery.process());

    return metricFindStream.pipe(map((results) => ({ data: results })));
  }

  toDataQuery(query: StandardVariableQuery): PromQuery {
    return {
      refId: 'PrometheusDatasource-VariableQuery',
      expr: query.query,
    };
  }
}
