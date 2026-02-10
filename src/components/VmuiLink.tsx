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

import React, { FC, memo, useEffect, useState } from 'react';

import { getDefaultTimeRange, PanelData, rangeUtil, textUtil } from '@grafana/data';
import { IconButton } from '@grafana/ui';

import { mergeTemplateWithQuery } from '../components/WithTemplateConfig/utils/getArrayFromTemplate';
import { PrometheusDatasource } from '../datasource';
import { PromQuery } from '../types';
import { getDurationFromMilliseconds } from '../utils/time';

interface Props {
  datasource: PrometheusDatasource;
  query: PromQuery;
  panelData?: PanelData;
  dashboardUID: string;
}

export const relativeTimeOptionsVMUI = [
  { title: 'Last 5 minutes', duration: '5m' },
  { title: 'Last 15 minutes', duration: '15m' },
  { title: 'Last 30 minutes', duration: '30m' },
  { title: 'Last 1 hour', duration: '1h' },
  { title: 'Last 3 hours', duration: '3h' },
  { title: 'Last 6 hours', duration: '6h' },
  { title: 'Last 12 hours', duration: '12h' },
  { title: 'Last 24 hours', duration: '24h' },
  { title: 'Last 2 days', duration: '2d' },
  { title: 'Last 7 days', duration: '7d' },
  { title: 'Last 30 days', duration: '30d' },
  { title: 'Last 90 days', duration: '90d' },
  { title: 'Last 180 days', duration: '180d' },
  { title: 'Last 1 year', duration: '1y' },
  { title: 'Yesterday', duration: '1d' },
  { title: 'Today', duration: '1d' },
].map(o => ({
  id: o.title.replace(/\s/g, '_').toLocaleLowerCase(),
  ...o
}))

const getRateIntervalScopedVariable = (interval: number, scrapeInterval: number) => {
  // Fall back to the default scrape interval of 15s if scrapeInterval is 0 for some reason.
  if (scrapeInterval === 0) {
    scrapeInterval = 15;
  }
  const rateInterval = Math.max(interval + scrapeInterval, 4 * scrapeInterval);
  return { __rate_interval: { text: rateInterval + 's', value: rateInterval + 's' } };
}

const VmuiLink: FC<Props> = ({
  panelData,
  query,
  datasource,
  dashboardUID,
}) => {
  const [href, setHref] = useState('');

  useEffect(() => {
    const getExternalLink = async () => {
      const timeRange = panelData?.timeRange || getDefaultTimeRange();
      const rangeRaw = timeRange.raw;
      const interval = panelData?.request?.interval || datasource.interval;
      let scopedVars = panelData?.request?.scopedVars || {};
      let relativeTimeId = 'none';
      if (typeof rangeRaw?.from === 'string') {
        const duration = rangeRaw.from.replace('now-', '')
        relativeTimeId = relativeTimeOptionsVMUI.find(ops => ops.duration === duration)?.id || 'none'
      }
      const start = datasource.getPrometheusTime(timeRange.from, false);
      const end = datasource.getPrometheusTime(timeRange.to, true);
      const rangeDiff = Math.ceil(end - start);
      const endTime = timeRange.to.utc().format('YYYY-MM-DD HH:mm');
      scopedVars = Object.assign({}, scopedVars, getRateIntervalScopedVariable(
        rangeUtil.intervalToSeconds(interval),
        rangeUtil.intervalToSeconds(datasource.interval)
      ));
      let step: number = rangeUtil.intervalToSeconds(interval);
      const templateSrv = datasource.getTemplateSrv();
      const minStep = rangeUtil.intervalToSeconds(
        templateSrv.replace(query.interval || interval, scopedVars)
      );
      const scrapeInterval = rangeUtil.intervalToSeconds(query.interval
        ? templateSrv.replace(query.interval, scopedVars)
        : datasource.interval);
      const adjustedStep = datasource.adjustInterval(step, minStep, rangeDiff, 1);
      scopedVars = Object.assign({}, scopedVars, getRateIntervalScopedVariable(
        adjustedStep, scrapeInterval,
      ));
      if (step !== adjustedStep) {
        step = adjustedStep;
        scopedVars = Object.assign({}, scopedVars, {
          __interval: { text: step + 's', value: step + 's' },
          __interval_ms: { text: step * 1000, value: step * 1000 },
          ...getRateIntervalScopedVariable(step, scrapeInterval),
        });
      }
      let expr = mergeTemplateWithQuery(query.expr, datasource.withTemplates.find(t => t.uid === dashboardUID))
      expr = templateSrv.replace(expr, scopedVars, datasource.interpolateQueryExpr);
      const resp = await datasource.postResource<{ vmuiURL: string }>('vmui', {
        vmui: {
          expr: expr,
          range_input: getDurationFromMilliseconds(rangeDiff * 1000),
          end_input: endTime,
          step_input: step ? getDurationFromMilliseconds(step * 1000) : '',
          relative_time: relativeTimeId,
          tab: '0',
        },
      });

      setHref(resp.vmuiURL);
    };

    getExternalLink()
  }, [dashboardUID, datasource, panelData, query]);

  return (
    <a
      href={textUtil.sanitizeUrl(href)}
      target='_blank'
      rel='noopener noreferrer'
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <IconButton
        key='vmui'
        name='external-link-alt'
        tooltip='Run in vmui'
      />
    </a>
  );
};

export default memo(VmuiLink);
