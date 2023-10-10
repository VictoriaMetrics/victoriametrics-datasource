// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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
import { cx } from '@emotion/css';
import React, { FormEvent, useMemo, useState } from 'react';

import { config } from '@grafana/runtime';
import { InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';

import { HttpSettingsBaseProps } from "../components/types";

import { KnownAzureClouds, AzureCredentials } from './AzureCredentials';
import { getCredentials, updateCredentials } from './AzureCredentialsConfig';
import { AzureCredentialsForm } from './AzureCredentialsForm';

export const AzureAuthSettings = (props: HttpSettingsBaseProps) => {
  const { dataSourceConfig, onChange } = props;

  const [overrideAudienceChecked, setOverrideAudienceChecked] = useState<boolean>(
    !!dataSourceConfig.jsonData.azureEndpointResourceId
  );

  const credentials = useMemo(() => getCredentials(dataSourceConfig), [dataSourceConfig]);

  const onCredentialsChange = (credentials: AzureCredentials): void => {
    onChange(updateCredentials(dataSourceConfig, credentials));
  };

  const onOverrideAudienceChange = (ev: FormEvent<HTMLInputElement>): void => {
    setOverrideAudienceChecked(ev.currentTarget.checked);
    if (!ev.currentTarget.checked) {
      onChange({
        ...dataSourceConfig,
        jsonData: { ...dataSourceConfig.jsonData, azureEndpointResourceId: undefined },
      });
    }
  };

  const onResourceIdChange = (ev: FormEvent<HTMLInputElement>): void => {
    if (overrideAudienceChecked) {
      onChange({
        ...dataSourceConfig,
        jsonData: { ...dataSourceConfig.jsonData, azureEndpointResourceId: ev.currentTarget.value },
      });
    }
  };

  const prometheusConfigOverhaulAuth = config.featureToggles.prometheusConfigOverhaulAuth;

  const labelWidth = prometheusConfigOverhaulAuth ? 24 : 26;

  return (
    <>
      <h6>Azure authentication</h6>
      <AzureCredentialsForm
        managedIdentityEnabled={config.azure.managedIdentityEnabled}
        credentials={credentials}
        azureCloudOptions={KnownAzureClouds}
        onCredentialsChange={onCredentialsChange}
        disabled={dataSourceConfig.readOnly}
      />
      <h6>Azure configuration</h6>
      <div className="gf-form-group">
        <InlineFieldRow>
          <InlineField labelWidth={labelWidth} label="Override AAD audience" disabled={dataSourceConfig.readOnly}>
            <InlineSwitch value={overrideAudienceChecked} onChange={onOverrideAudienceChange} />
          </InlineField>
        </InlineFieldRow>
        {overrideAudienceChecked && (
          <InlineFieldRow>
            <InlineField labelWidth={labelWidth} label="Resource ID" disabled={dataSourceConfig.readOnly}>
              <Input
                className={cx(prometheusConfigOverhaulAuth ? 'width-20' : 'width-30')}
                value={dataSourceConfig.jsonData.azureEndpointResourceId || ''}
                onChange={onResourceIdChange}
              />
            </InlineField>
          </InlineFieldRow>
        )}
      </div>
    </>
  );
};
