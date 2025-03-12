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

import { PanelData, ScopedVars, textUtil, rangeUtil, getDefaultTimeRange } from '@grafana/data';
import { getBackendSrv } from "@grafana/runtime";
import { IconButton } from "@grafana/ui";

import { PrometheusDatasource } from '../datasource';
import { PromQuery } from '../types';
import { ExtendedDataQueryRequest } from "../types/datasource";
import { getDurationFromMilliseconds } from "../utils/time";

interface Props {
  datasource: PrometheusDatasource;
  query: PromQuery;
  panelData?: PanelData;
  dashboardUID: string;
}

export const getDefaultVmuiUrl = (serverUrl = "#") => `${serverUrl.replace(/\/$/, "")}/vmui/`

export const relativeTimeOptionsVMUI = [
  { title: "Last 5 minutes", duration: "5m" },
  { title: "Last 15 minutes", duration: "15m" },
  { title: "Last 30 minutes", duration: "30m" },
  { title: "Last 1 hour", duration: "1h" },
  { title: "Last 3 hours", duration: "3h" },
  { title: "Last 6 hours", duration: "6h" },
  { title: "Last 12 hours", duration: "12h" },
  { title: "Last 24 hours", duration: "24h" },
  { title: "Last 2 days", duration: "2d" },
  { title: "Last 7 days", duration: "7d" },
  { title: "Last 30 days", duration: "30d" },
  { title: "Last 90 days", duration: "90d" },
  { title: "Last 180 days", duration: "180d" },
  { title: "Last 1 year", duration: "1y" },
  { title: "Yesterday", duration: "1d" },
  { title: "Today", duration: "1d" },
].map(o => ({
  id: o.title.replace(/\s/g, "_").toLocaleLowerCase(),
  ...o
}))

const VmuiLink: FC<Props> = ({
  panelData,
  query,
  datasource,
  dashboardUID,
}) => {
  const [href, setHref] = useState('');

  useEffect(() => {
    const getExternalLink = async () => {
      const dataSourceSrv = getBackendSrv();
      const dsSettings = await dataSourceSrv.get(`/api/datasources/${datasource.id}`);
      let relativeTimeId = 'none'

      const timeRange = panelData?.timeRange || getDefaultTimeRange();
      const rangeRaw = timeRange.raw
      const interval = panelData?.request?.interval || datasource.interval
      const scopedVars = panelData?.request?.scopedVars || {}

      if (typeof rangeRaw?.from === 'string') {
        const duration = rangeRaw.from.replace('now-', '')
        relativeTimeId = relativeTimeOptionsVMUI.find(ops => ops.duration === duration)?.id || 'none'
      }

      const start = datasource.getPrometheusTime(timeRange.from, false);
      const end = datasource.getPrometheusTime(timeRange.to, true);
      const rangeDiff = Math.ceil(end - start);
      const endTime = timeRange.to.utc().format('YYYY-MM-DD HH:mm');

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
        dashboardUID,
        scopedVars: enrichedScopedVars,
      } as ExtendedDataQueryRequest<PromQuery>;

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
        'g0.range_input': getDurationFromMilliseconds(rangeDiff * 1000),
        'g0.end_input': endTime,
        'g0.step_input': queryOptions.step ? getDurationFromMilliseconds(queryOptions.step * 1000) : '',
        'g0.relative_time': relativeTimeId,
        'g0.tab': 0,
      };

      const args = map(expr, (v: string, k: string) => {
        return k + '=' + encodeURIComponent(v);
      }).join('&');

      const vmuiUrl = dsSettings.jsonData.vmuiUrl || getDefaultVmuiUrl(dsSettings.url)
      setHref(`${vmuiUrl}?${args}`);
    };

    getExternalLink()
  }, [dashboardUID, datasource, panelData, query]);

  return (
    <a href={textUtil.sanitizeUrl(href)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconButton
        key="vmui"
        name="external-link-alt"
        tooltip="Run in vmui"
      />
    </a>
  );
};

export default memo(VmuiLink);
