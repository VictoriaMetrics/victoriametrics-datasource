// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-09: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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

import React, { useRef } from 'react';

import { SIGV4ConnectionConfig } from '@grafana/aws-sdk';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { config } from '@grafana/runtime';
import { AlertingSettings, DataSourceHttpSettings } from '@grafana/ui';

import { PromOptions } from '../types';

import { AzureAuthSettings } from './AzureAuthSettings';
import { hasCredentials, setDefaultCredentials, resetCredentials } from './AzureCredentialsConfig';
import { HelpfulLinks } from "./HelpfulLinks";
import { LimitsSettings } from "./LimitsSettings";
import { PromSettings } from './PromSettings';

export enum DataSourceType {
  Alertmanager = 'alertmanager',
}

export type Props = DataSourcePluginOptionsEditorProps<PromOptions>;
export const ConfigEditor = (props: Props) => {
  const { options, onOptionsChange } = props;
  const alertmanagers = Object.values(config.datasources).filter((ds) => ds.type === DataSourceType.Alertmanager);
  // use ref so this is evaluated only first time it renders and the select does not disappear suddenly.
  const showAccessOptions = useRef(props.options.access === 'direct');

  const azureAuthSettings = {
    azureAuthSupported: config.azureAuthEnabled,
    getAzureAuthEnabled: (config: DataSourceSettings<any, any>): boolean => hasCredentials(config),
    setAzureAuthEnabled: (config: DataSourceSettings<any, any>, enabled: boolean) =>
      enabled ? setDefaultCredentials(config) : resetCredentials(config),
    azureSettingsUI: AzureAuthSettings,
  };

  return (
    <>
      <HelpfulLinks/>

      <DataSourceHttpSettings
        defaultUrl="http://localhost:8428"
        dataSourceConfig={options}
        showAccessOptions={showAccessOptions.current}
        onChange={onOptionsChange}
        sigV4AuthToggleEnabled={config.sigV4AuthEnabled}
        azureAuthSettings={azureAuthSettings}
        renderSigV4Editor={<SIGV4ConnectionConfig {...props}></SIGV4ConnectionConfig>}
      />

      <AlertingSettings<PromOptions> alertmanagerDataSources={alertmanagers}{...props}/>

      <PromSettings {...props}/>

      <LimitsSettings {...props}/>
    </>
  );
};
