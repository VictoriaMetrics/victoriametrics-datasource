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

import { DataSourceJsonData, DataSourceSettings, QueryEditorProps } from "@grafana/data";

import { PrometheusDatasource } from "../datasource";
import { PromOptions, PromQuery } from "../types";

export type PromQueryEditorProps = QueryEditorProps<PrometheusDatasource, PromQuery, PromOptions>;

export interface HttpSettingsBaseProps<JSONData extends DataSourceJsonData = any, SecureJSONData = any> {
  /** The configuration object of the data source */
  dataSourceConfig: DataSourceSettings<JSONData, SecureJSONData>;
  /** Callback for handling changes to the configuration object */
  onChange: (config: DataSourceSettings<JSONData, SecureJSONData>) => void;
  /** Show the Forward OAuth identity option */
  showForwardOAuthIdentityOption?: boolean;
}
