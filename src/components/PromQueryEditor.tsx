// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-14: cleanup Exemplars
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

import { map } from 'lodash';
import React, { PureComponent } from 'react';

// Types
import { SelectableValue } from '@grafana/data';
import { InlineFormLabel, LegacyForms, Select } from '@grafana/ui';

import { PromQuery } from '../types';

import PromQueryField from './PromQueryField';
import VmuiLink from './VmuiLink';
import { PromQueryEditorProps } from './types';

const { Switch } = LegacyForms;

export const FORMAT_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Time series', value: 'time_series' },
  { label: 'Table', value: 'table' },
  { label: 'Heatmap', value: 'heatmap' },
];

export const INTERVAL_FACTOR_OPTIONS: Array<SelectableValue<number>> = map([1, 2, 3, 4, 5, 10], (value: number) => ({
  value,
  label: '1/' + value,
}));

interface State {
  legendFormat?: string;
  formatOption: SelectableValue<string>;
  interval?: string;
  intervalFactorOption: SelectableValue<number>;
  instant: boolean;
  exemplar: boolean;
}

export class PromQueryEditor extends PureComponent<PromQueryEditorProps, State> {
  // Query target to be modified and used for queries
  query: PromQuery;

  constructor(props: PromQueryEditorProps) {
    super(props);
    // Use default query to prevent undefined input values
    const defaultQuery: Partial<PromQuery> = {
      expr: '',
      legendFormat: '',
      interval: '',
      exemplar: false,
    };
    const query = Object.assign({}, defaultQuery, props.query);
    this.query = query;
    // Query target properties that are fully controlled inputs
    this.state = {
      // Fully controlled text inputs
      interval: query.interval,
      legendFormat: query.legendFormat,
      // Select options
      formatOption: FORMAT_OPTIONS.find((option) => option.value === query.format) || FORMAT_OPTIONS[0],
      intervalFactorOption:
        INTERVAL_FACTOR_OPTIONS.find((option) => option.value === query.intervalFactor) || INTERVAL_FACTOR_OPTIONS[0],
      // Switch options
      instant: Boolean(query.instant),
      exemplar: Boolean(query.exemplar),
    };
  }

  onFieldChange = (query: PromQuery) => {
    this.query.expr = query.expr;
  };

  onFormatChange = (option: SelectableValue<string>) => {
    this.query.format = option.value;
    this.setState({ formatOption: option }, this.onRunQuery);
  };

  onInstantChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const instant = (e.target as HTMLInputElement).checked;
    this.query.instant = instant;
    this.setState({ instant }, this.onRunQuery);
  };

  onIntervalChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const interval = e.currentTarget.value;
    this.query.interval = interval;
    this.setState({ interval });
  };

  onIntervalFactorChange = (option: SelectableValue<number>) => {
    this.query.intervalFactor = option.value;
    this.setState({ intervalFactorOption: option }, this.onRunQuery);
  };

  onLegendChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const legendFormat = e.currentTarget.value;
    this.query.legendFormat = legendFormat;
    this.setState({ legendFormat });
  };

  onRunQuery = () => {
    const { query } = this;
    // Change of query.hide happens outside of this component and is just passed as prop. We have to update it when running queries.
    const { hide } = this.props.query;
    this.props.onChange({ ...query, hide });
    this.props.onRunQuery();
  };

  render() {
    const { datasource, query, range, data } = this.props;
    const { formatOption, instant, interval, intervalFactorOption, legendFormat } = this.state;

    return (
      <PromQueryField
        datasource={datasource}
        query={query}
        range={range}
        onRunQuery={this.onRunQuery}
        onChange={this.onFieldChange}
        history={[]}
        data={data}
        data-testid={testIds.editor}
        ExtraFieldElement={
          <div className="gf-form-inline">
            <div className="gf-form">
              <InlineFormLabel
                width={7}
                tooltip="Controls the name of the time series, using name or pattern. For example
        {{hostname}} will be replaced with label value for the label hostname."
              >
                Legend
              </InlineFormLabel>
              <input
                type="text"
                className="gf-form-input"
                placeholder="legend format"
                value={legendFormat}
                onChange={this.onLegendChange}
                onBlur={this.onRunQuery}
              />
            </div>

            <div className="gf-form">
              <InlineFormLabel
                width={7}
                tooltip={
                  <>
                    An additional lower limit for the step parameter of the Prometheus query and for the{' '}
                    <code>$__interval</code> and <code>$__rate_interval</code> variables. The limit is absolute and not
                    modified by the &quot;Resolution&quot; setting.
                  </>
                }
              >
                Min step
              </InlineFormLabel>
              <input
                type="text"
                className="gf-form-input width-8"
                aria-label="Set lower limit for the step parameter"
                placeholder={interval}
                onChange={this.onIntervalChange}
                onBlur={this.onRunQuery}
                value={interval}
              />
            </div>

            <div className="gf-form">
              <div className="gf-form-label">Resolution</div>
              <Select
                aria-label="Select resolution"
                isSearchable={false}
                options={INTERVAL_FACTOR_OPTIONS}
                onChange={this.onIntervalFactorChange}
                value={intervalFactorOption}
              />
            </div>

            <div className="gf-form">
              <div className="gf-form-label width-7">Format</div>
              <Select
                className="select-container"
                width={16}
                isSearchable={false}
                options={FORMAT_OPTIONS}
                onChange={this.onFormatChange}
                value={formatOption}
                aria-label="Select format"
              />
              <Switch label="Instant" checked={instant} onChange={this.onInstantChange} />

              <InlineFormLabel width={10} tooltip="Link to Graph in Prometheus">
                <VmuiLink
                  datasource={datasource}
                  query={this.query} // Use modified query
                  panelData={data}
                />
              </InlineFormLabel>
            </div>
          </div>
        }
      />
    );
  }
}

export const testIds = {
  editor: 'prom-editor',
  exemplar: 'exemplar-editor',
};
