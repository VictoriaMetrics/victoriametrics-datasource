// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: change getTemplateSrv and TemplateSrv imports
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

import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  DataQueryRequest,
  DataQueryResponse,
  rangeUtil,
  CustomVariableSupport,
} from '@grafana/data';
import { getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { VariableQueryEditor } from './components/VariableQueryEditor';
import { PrometheusDatasource } from './datasource';
import PrometheusMetricFindQuery from './metric_find_query';
import { PromVariableQuery } from './types';

export class PrometheusVariableSupport extends CustomVariableSupport<PrometheusDatasource> {
  constructor(
    private readonly datasource: PrometheusDatasource,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super();
  }

  editor = VariableQueryEditor;

  query = (request: DataQueryRequest<PromVariableQuery>): Observable<DataQueryResponse> => {
    // Handling grafana as code from jsonnet variable queries which are strings and not objects
    // Previously, when using StandardVariableSupport
    // the variable query string was changed to be on the expr attribute
    // Now, using CustomVariableSupport,
    // the variable query is changed to the query attribute.
    // So, without standard variable support changing the query string to the expr attribute,
    // the variable query string is coming in as it is written in jsonnet,
    // where it is just a string. Here is where we handle that.
    let query: string | undefined;
    if (typeof request.targets[0] === 'string') {
      query = request.targets[0];
    } else {
      query = request.targets[0].query;
    }

    if (!query) {
      return of({ data: [] });
    }

    const scopedVars = {
      ...request.scopedVars,
      __interval: { text: this.datasource.interval, value: this.datasource.interval },
      __interval_ms: {
        text: rangeUtil.intervalToMs(this.datasource.interval),
        value: rangeUtil.intervalToMs(this.datasource.interval),
      },
      ...this.datasource.getRangeScopedVars(request.range),
    };

    const interpolated = this.templateSrv.replace(query, scopedVars, this.datasource.interpolateQueryExpr);
    const metricFindQuery = new PrometheusMetricFindQuery(this.datasource, interpolated);
    const metricFindStream = from(metricFindQuery.process(request.range));

    return metricFindStream.pipe(map((results) => ({ data: results })));
  }
}
