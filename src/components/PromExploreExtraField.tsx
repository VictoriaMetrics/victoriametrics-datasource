// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-14: cleanup Exemplars
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

import { css, cx } from '@emotion/css';
import React, { memo } from 'react';

import { InlineFormLabel, RadioButtonGroup } from '@grafana/ui';

import { PrometheusDatasource } from '../datasource';
import { PromQuery } from '../types';

export interface PromExploreExtraFieldProps {
  query: PromQuery;
  onChange: (value: PromQuery) => void;
  onRunQuery: () => void;
  datasource: PrometheusDatasource;
}

export const PromExploreExtraField: React.FC<PromExploreExtraFieldProps> = memo(
  ({ query, onChange, onRunQuery }) => {
    const rangeOptions = getQueryTypeOptions(true);

    function onChangeQueryStep(interval: string) {
      onChange({ ...query, interval });
    }

    function onStepChange(e: React.SyntheticEvent<HTMLInputElement>) {
      if (e.currentTarget.value !== query.interval) {
        onChangeQueryStep(e.currentTarget.value);
      }
    }

    function onReturnKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter' && e.shiftKey) {
        onRunQuery();
      }
    }

    const onQueryTypeChange = getQueryTypeChangeHandler(query, onChange);

    return (
      <div aria-label='Prometheus extra field' className='gf-form-inline' data-testid={testIds.extraFieldEditor}>
        {/*Query type field*/}
        <div
          data-testid={testIds.queryTypeField}
          className={cx(
            'gf-form explore-input-margin',
            css`
              flex-wrap: nowrap;
            `
          )}
          aria-label='Query type field'
        >
          <InlineFormLabel width='auto'>Query type</InlineFormLabel>

          <RadioButtonGroup
            options={rangeOptions}
            value={query.range && query.instant ? 'both' : query.instant ? 'instant' : 'range'}
            onChange={onQueryTypeChange}
          />
        </div>
        {/*Step field*/}
        <div
          data-testid={testIds.stepField}
          className={cx(
            'gf-form',
            css`
              flex-wrap: nowrap;
            `
          )}
          aria-label='Step field'
        >
          <InlineFormLabel
            width={6}
            tooltip={
              'Time units and built-in variables can be used here, for example: $__interval, $__rate_interval, 5s, 1m, 3h, 1d, 1y (Default if no unit is specified: s)'
            }
          >
            Min step
          </InlineFormLabel>
          <input
            type={'text'}
            className='gf-form-input width-4'
            placeholder={'auto'}
            onChange={onStepChange}
            onKeyDown={onReturnKeyDown}
            value={query.interval ?? ''}
          />
        </div>
      </div>
    );
  }
);

PromExploreExtraField.displayName = 'PromExploreExtraField';

export function getQueryTypeOptions(includeBoth: boolean) {
  const rangeOptions = [
    { value: 'range', label: 'Range', description: 'Run query over a range of time' },
    {
      value: 'instant',
      label: 'Instant',
      description: 'Run query against a single point in time. For this query, the "To" time is used',
    },
  ];

  if (includeBoth) {
    rangeOptions.push({ value: 'both', label: 'Both', description: 'Run an Instant query and a Range query' });
  }

  return rangeOptions;
}

export function getQueryTypeChangeHandler(query: PromQuery, onChange: (update: PromQuery) => void) {
  return (queryType: string) => {
    if (queryType === 'instant') {
      onChange({ ...query, instant: true, range: false, exemplar: false });
    } else if (queryType === 'range') {
      onChange({ ...query, instant: false, range: true });
    } else {
      onChange({ ...query, instant: true, range: true });
    }
  };
}

export const testIds = {
  extraFieldEditor: 'prom-editor-extra-field',
  stepField: 'prom-editor-extra-field-step',
  queryTypeField: 'prom-editor-extra-field-query-type',
};
