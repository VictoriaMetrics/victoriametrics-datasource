// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: optimization imports
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

import { extend } from 'lodash';

import { AnalyticsSettings, OrgRole, rangeUtil, WithAccessControlMetadata } from '@grafana/data';
import { config as config1 } from '@grafana/runtime';

import { AccessControlAction, UserPermission } from '../types/accessControl';
import { CurrentUserInternal } from '../types/config';

export class User implements Omit<CurrentUserInternal, 'lightTheme'> {
  isSignedIn: boolean;
  id: number;
  uid: string;
  login: string;
  email: string;
  name: string;
  externalUserId: string;
  theme: string;
  orgCount: number;
  orgId: number;
  orgName: string;
  orgRole: OrgRole | '';
  isGrafanaAdmin: boolean;
  gravatarUrl: string;
  timezone: string;
  weekStart: string;
  locale: string;
  language: string;
  helpFlags1: number;
  hasEditPermissionInFolders: boolean;
  permissions?: UserPermission;
  analytics: AnalyticsSettings;
  fiscalYearStartMonth: number;
  authenticatedBy: string;
  regionalFormat: string;

  constructor() {
    this.id = 0;
    this.uid = '';
    this.isGrafanaAdmin = false;
    this.isSignedIn = false;
    this.orgRole = '';
    this.orgId = 0;
    this.orgName = '';
    this.login = '';
    this.externalUserId = '';
    this.orgCount = 0;
    this.timezone = '';
    this.fiscalYearStartMonth = 0;
    this.helpFlags1 = 0;
    this.theme = 'dark';
    this.hasEditPermissionInFolders = false;
    this.email = '';
    this.name = '';
    this.locale = '';
    this.language = '';
    this.weekStart = '';
    this.gravatarUrl = '';
    this.analytics = {
      identifier: '',
    };
    this.authenticatedBy = '';
    this.regionalFormat = '';

    if (config1.bootData.user) {
      extend(this, config1.bootData.user);
    }
  }
}

export class ContextSrv {
  version: any;
  user: User;
  isSignedIn: any;
  isGrafanaAdmin: any;
  isEditor: any;
  hasEditPermissionInFolders: boolean;
  minRefreshInterval: string;

  constructor() {
    if (!config1.bootData) {
      config1.bootData = { user: {}, settings: {} } as any;
    }

    this.user = new User();
    this.isSignedIn = this.user.isSignedIn;
    this.isGrafanaAdmin = this.user.isGrafanaAdmin;
    this.isEditor = this.hasRole('Editor') || this.hasRole('Admin');
    this.hasEditPermissionInFolders = this.user.hasEditPermissionInFolders;
    this.minRefreshInterval = config1.minRefreshInterval;
  }

  hasRole(role: string) {
    if (role === 'ServerAdmin') {
      return this.isGrafanaAdmin;
    } else {
      return this.user.orgRole === role;
    }
  }

  accessControlEnabled(): boolean {
    return config1.rbacEnabled;
  }

  // Checks whether user has required permission
  hasPermissionInMetadata(action: AccessControlAction | string, object: WithAccessControlMetadata): boolean {
    // Fallback if access control disabled
    if (!this.accessControlEnabled()) {
      return true;
    }

    return !!object.accessControl?.[action];
  }

  // Checks whether user has required permission
  hasPermission(action: AccessControlAction | string): boolean {
    // Fallback if access control disabled
    if (!this.accessControlEnabled()) {
      return true;
    }

    return !!this.user.permissions?.[action];
  }

  isGrafanaVisible() {
    return document.visibilityState === undefined || document.visibilityState === 'visible';
  }

  // checks whether the passed interval is longer than the configured minimum refresh rate
  isAllowedInterval(interval: string) {
    if (!config1.minRefreshInterval) {
      return true;
    }
    return rangeUtil.intervalToMs(interval) >= rangeUtil.intervalToMs(config1.minRefreshInterval);
  }

  getValidInterval(interval: string) {
    if (!this.isAllowedInterval(interval)) {
      return config1.minRefreshInterval;
    }
    return interval;
  }
}

let contextSrv = new ContextSrv();
export { contextSrv };
