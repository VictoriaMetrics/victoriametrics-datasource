// Copyright (c) 2022 Grafana Labs
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

import { map } from 'lodash';
import React, { FC, useEffect, useState, memo } from 'react';

import { DataQueryRequest, PanelData, ScopedVars, textUtil, rangeUtil } from '@grafana/data';

import { PrometheusDatasource } from '../datasource';
import { PromQuery } from '../types';

interface Props {
  datasource: PrometheusDatasource;
  query: PromQuery;
  panelData?: PanelData;
}

const PromLink: FC<Props> = ({ panelData, query, datasource }) => {
  const [href, setHref] = useState('');

  useEffect(() => {
    if (panelData) {
      const getExternalLink = () => {
        if (!panelData.request) {
          return '';
        }

        const {
          request: { range, interval, scopedVars },
        } = panelData;

        const start = datasource.getPrometheusTime(range.from, false);
        const end = datasource.getPrometheusTime(range.to, true);
        const rangeDiff = Math.ceil(end - start);
        const endTime = range.to.utc().format('YYYY-MM-DD HH:mm');

        const enrichedScopedVars: ScopedVars = {
          ...scopedVars,
          // As we support $__rate_interval variable in min step, we need add it to scopedVars
          ...datasource.getRateIntervalScopedVariable(
            rangeUtil.intervalToSeconds(interval),
            rangeUtil.intervalToSeconds(datasource.interval)
          ),
        };

        const options = {
          interval,
          scopedVars: enrichedScopedVars,
        } as DataQueryRequest<PromQuery>;

        const customQueryParameters: { [key: string]: string } = {};
        if (datasource.customQueryParameters) {
          for (const [k, v] of datasource.customQueryParameters) {
            customQueryParameters[k] = v;
          }
        }

        const queryOptions = datasource.createQuery(query, options, start, end);

        const expr = {
          ...customQueryParameters,
          'g0.expr': queryOptions.expr,
          'g0.range_input': rangeDiff + 's',
          'g0.end_input': endTime,
          'g0.step_input': queryOptions.step,
          'g0.tab': 0,
        };

        const args = map(expr, (v: string, k: string) => {
          return k + '=' + encodeURIComponent(v);
        }).join('&');
        return `${datasource.directUrl}/graph?${args}`;
      };

      setHref(getExternalLink());
    }
  }, [datasource, panelData, query]);

  return (
    <a href={textUtil.sanitizeUrl(href)} target="_blank" rel="noopener noreferrer">
      Prometheus
    </a>
  );
};

export default memo(PromLink);
