// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-10: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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

import React, { SyntheticEvent } from 'react';

import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOptionChecked,
  SelectableValue,
} from '@grafana/data';
import {
  InlineField,
  InlineSwitch,
  EventsWithValidation,
  InlineFormLabel,
  LegacyForms,
  regexValidation,
} from '@grafana/ui';

import { PromOptions } from '../types';

const { Select, Input, FormField } = LegacyForms;

const httpOptions = [
  { value: 'POST', label: 'POST' },
  { value: 'GET', label: 'GET' },
];

type Props = Pick<DataSourcePluginOptionsEditorProps<PromOptions>, 'options' | 'onOptionsChange'>;

export const PromSettings = (props: Props) => {
  const { options, onOptionsChange } = props;

  // We are explicitly adding httpMethod so it is correctly displayed in dropdown. This way, it is more predictable for users.

  if (!options.jsonData.httpMethod) {
    options.jsonData.httpMethod = 'POST';
  }

  return (
    <>
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="Scrape interval"
              labelWidth={13}
              inputEl={
                <Input
                  className="width-7"
                  value={options.jsonData.timeInterval}
                  spellCheck={false}
                  placeholder="15s"
                  onChange={onChangeHandler('timeInterval', options, onOptionsChange)}
                  validationEvents={promSettingsValidationEvents}
                />
              }
              tooltip="Set this to the typical scrape and evaluation interval configured in Prometheus. Defaults to 15s."
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="Query timeout"
              labelWidth={13}
              inputEl={
                <Input
                  className="width-7"
                  value={options.jsonData.queryTimeout}
                  onChange={onChangeHandler('queryTimeout', options, onOptionsChange)}
                  spellCheck={false}
                  placeholder="60s"
                  validationEvents={promSettingsValidationEvents}
                />
              }
              tooltip="Set the Prometheus query timeout."
            />
          </div>
        </div>
        <div className="gf-form">
          <InlineFormLabel
            width={13}
            tooltip="You can use either POST or GET HTTP method to query your Prometheus data source. POST is the recommended method as it allows bigger queries. Change this to GET if you have a Prometheus version older than 2.1 or if POST requests are restricted in your network."
          >
            HTTP Method
          </InlineFormLabel>
          <Select
            aria-label="Select HTTP method"
            options={httpOptions}
            value={httpOptions.find((o) => o.value === options.jsonData.httpMethod)}
            onChange={onChangeHandler('httpMethod', options, onOptionsChange)}
            width={7}
          />
        </div>
      </div>
      <h3 className="page-heading">Misc</h3>
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineField
            labelWidth={28}
            label="Disable metrics lookup"
            tooltip="Checking this option will disable the metrics chooser and metric/label support in the query field's autocomplete. This helps if you have performance issues with bigger Prometheus instances."
          >
            <InlineSwitch
              value={options.jsonData.disableMetricsLookup ?? false}
              onChange={onUpdateDatasourceJsonDataOptionChecked(props, 'disableMetricsLookup')}
            />
          </InlineField>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form max-width-30">
            <FormField
              label="Custom query parameters"
              labelWidth={14}
              tooltip="Add Custom parameters to all queries."
              inputEl={
                <Input
                  className="width-25"
                  value={options.jsonData.customQueryParameters}
                  onChange={onChangeHandler('customQueryParameters', options, onOptionsChange)}
                  spellCheck={false}
                  placeholder="Example: max_source_resolution=5m&timeout=10"
                />
              }
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form max-width-30">
            <FormField
              label="Link on vmui"
              labelWidth={14}
              tooltip={<>The link you want to use when clicking the <code>Run in vmui</code> button</>}
              inputEl={
                <Input
                  className="width-25"
                  value={options.jsonData.vmuiUrl}
                  onChange={onChangeHandler('vmuiUrl', options, onOptionsChange)}
                  spellCheck={false}
                  placeholder={`${options.url}/graph?`}
                />
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export const promSettingsValidationEvents = {
  [EventsWithValidation.onBlur]: [
    regexValidation(
      /^$|^\d+(ms|[Mwdhmsy])$/,
      'Value is not valid, you can use number with time unit specifier: y, M, w, d, h, m, s'
    ),
  ],
};

export const getValueFromEventItem = (eventItem: SyntheticEvent<HTMLInputElement> | SelectableValue<string>) => {
  if (!eventItem) {
    return '';
  }

  if (eventItem.hasOwnProperty('currentTarget')) {
    return eventItem.currentTarget.value;
  }

  return (eventItem as SelectableValue<string>).value;
};

const onChangeHandler =
  (key: keyof PromOptions, options: Props['options'], onOptionsChange: Props['onOptionsChange']) =>
  (eventItem: SyntheticEvent<HTMLInputElement> | SelectableValue<string>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: getValueFromEventItem(eventItem),
      },
    });
  };
