import React, { useRef } from 'react';

import { SIGV4ConnectionConfig } from '@grafana/aws-sdk';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { config } from '@grafana/runtime';
import {AlertingSettings, DataSourceHttpSettings, Alert, Icon} from '@grafana/ui';

import { getAllAlertmanagerDataSources } from '../../app/features/alerting/unified/utils/alertmanager';
import { PromOptions } from '../types';

import { AzureAuthSettings } from './AzureAuthSettings';
import { hasCredentials, setDefaultCredentials, resetCredentials } from './AzureCredentialsConfig';
import { PromSettings } from './PromSettings';

export type Props = DataSourcePluginOptionsEditorProps<PromOptions>;
export const ConfigEditor = (props: Props) => {
  const { options, onOptionsChange } = props;
  const alertmanagers = getAllAlertmanagerDataSources();
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
      {options.access === 'direct' && (
        <Alert title="Error" severity="error">
          Browser access mode in the Prometheus datasource is no longer available. Switch to server access mode.
        </Alert>
      )}

      <div className="gf-form-group">
        <h3 className="page-heading">Tips on how to setup</h3>

       <div className="submenu-controls">
         <div className="gf-form">
           <a
             className="gf-form-label gf-form-label--dashlink"
             href="https://docs.victoriametrics.com/Cluster-VictoriaMetrics.html#url-format"
             target="_blank"
             rel="noreferrer">
             <Icon name="file-alt"/>
             <span style={{marginLeft: "4px"}}>Cluster VM</span>
           </a>
         </div>
         <div className="gf-form">
           <a
             className="gf-form-label gf-form-label--dashlink"
             href="https://docs.victoriametrics.com/Single-server-VictoriaMetrics.html#grafana-setup"
             target="_blank"
             rel="noreferrer">
             <Icon name="file-alt"/>
             <span style={{marginLeft: "4px"}}>Grafana setup</span>
           </a>
         </div>
       </div>
      </div>

        <DataSourceHttpSettings
          defaultUrl="http://localhost:8428"
          dataSourceConfig={options}
          showAccessOptions={showAccessOptions.current}
          onChange={onOptionsChange}
          sigV4AuthToggleEnabled={config.sigV4AuthEnabled}
          azureAuthSettings={azureAuthSettings}
          renderSigV4Editor={<SIGV4ConnectionConfig {...props}></SIGV4ConnectionConfig>}
        />

      <AlertingSettings<PromOptions>
        alertmanagerDataSources={alertmanagers}
        options={options}
        onOptionsChange={onOptionsChange}
      />

      <PromSettings options={options} onOptionsChange={onOptionsChange} />
    </>
  );
};
