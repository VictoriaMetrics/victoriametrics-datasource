import { extend } from 'lodash';

import { OrgRole, rangeUtil, WithAccessControlMetadata } from '@grafana/data';
import { config as config1 } from '@grafana/runtime';

import { AccessControlAction, UserPermission } from '../types/accessControl';
import { CurrentUserInternal } from '../types/config';

export class User implements CurrentUserInternal {
  isSignedIn: boolean;
  id: number;
  login: string;
  email: string;
  name: string;
  externalUserId: string;
  lightTheme: boolean;
  orgCount: number;
  orgId: number;
  orgName: string;
  orgRole: OrgRole | '';
  isGrafanaAdmin: boolean;
  gravatarUrl: string;
  timezone: string;
  weekStart: string;
  locale: string;
  helpFlags1: number;
  hasEditPermissionInFolders: boolean;
  permissions?: UserPermission;
  fiscalYearStartMonth: number;

  constructor() {
    this.id = 0;
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
    this.lightTheme = false;
    this.hasEditPermissionInFolders = false;
    this.email = '';
    this.name = '';
    this.locale = '';
    this.weekStart = '';
    this.gravatarUrl = '';

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
