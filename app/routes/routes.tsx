
import React from 'react';
import { Redirect } from 'react-router-dom';

import { NavLandingPage } from '../core/components/AppChrome/NavLandingPage';
import { SafeDynamicImport } from '../core/components/DynamicImports/SafeDynamicImport';
import ErrorPage from '../core/components/ErrorPage/ErrorPage';
import { LoginPage } from '../core/components/Login/LoginPage';
import config from '../core/config';
import { RouteDescriptor } from '../core/navigation/types';
import { contextSrv } from '../core/services/context_srv';
import UserAdminPage from '../features/admin/UserAdminPage';
import LdapPage from '../features/admin/ldap/LdapPage';
import { getAlertingRoutes } from '../features/alerting/routes';
import { getPublicDashboardRoutes } from '../features/dashboard/routes';
import { getRoutes as getDataConnectionsRoutes } from '../features/data-connections/routes';
import { DATASOURCES_ROUTES } from '../features/datasources/constants';
import { getLiveRoutes } from '../features/live/pages/routes';
import { getRoutes as getPluginCatalogRoutes } from '../features/plugins/admin/routes';
import { getProfileRoutes } from '../features/profile/routes';
import { ServiceAccountPage } from '../features/serviceaccounts/ServiceAccountPage';
import { AccessControlAction, DashboardRoutes } from '../types';

import { pluginHasRootPage } from './utils';

export const extraRoutes: RouteDescriptor[] = [];

export function getAppRoutes(): RouteDescriptor[] {
  const topnavRoutes: RouteDescriptor[] = config.featureToggles.topnav
    ? [
        {
          path: '/apps',
          component: () => <NavLandingPage navId="apps" />,
        },
        {
          path: '/a/:pluginId',
          exact: true,
          component: (props) => {
            const hasRoot = pluginHasRootPage(props.match.params.pluginId, config.bootData.navTree);
            const hasQueryParams = Object.keys(props.queryParams).length > 0;
            if (hasRoot || hasQueryParams) {
              const AppRootPage = SafeDynamicImport(
                () => import(/* webpackChunkName: "AppRootPage" */ '../features/plugins/components/AppRootPage')
              );
              return <AppRootPage {...props} />;
            } else {
              return <NavLandingPage navId={`plugin-page-${props.match.params.pluginId}`} />;
            }
          },
        },
      ]
    : [];

  return [
    {
      path: '/',
      pageClass: 'page-dashboard',
      routeName: DashboardRoutes.Home,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardPage" */ '../features/dashboard/containers/DashboardPage')
      ),
    },
    {
      path: '/d/:uid/:slug?',
      pageClass: 'page-dashboard',
      routeName: DashboardRoutes.Normal,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardPage" */ '../features/dashboard/containers/DashboardPage')
      ),
    },
    {
      path: '/dashboard/:type/:slug',
      pageClass: 'page-dashboard',
      routeName: DashboardRoutes.Normal,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardPage" */ '../features/dashboard/containers/DashboardPage')
      ),
    },
    {
      path: '/dashboard/new',
      pageClass: 'page-dashboard',
      routeName: DashboardRoutes.New,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardPage" */ '../features/dashboard/containers/DashboardPage')
      ),
    },
    {
      path: '/d-solo/:uid/:slug',
      pageClass: 'dashboard-solo',
      routeName: DashboardRoutes.Normal,
      chromeless: true,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "SoloPanelPage" */ '../features/dashboard/containers/SoloPanelPage')
      ),
    },
    // This route handles embedding of snapshot/scripted dashboard panels
    {
      path: '/dashboard-solo/:type/:slug',
      pageClass: 'dashboard-solo',
      routeName: DashboardRoutes.Normal,
      chromeless: true,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "SoloPanelPage" */ '../features/dashboard/containers/SoloPanelPage')
      ),
    },
    {
      path: '/d-solo/:uid',
      pageClass: 'dashboard-solo',
      routeName: DashboardRoutes.Normal,
      chromeless: true,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "SoloPanelPage" */ '../features/dashboard/containers/SoloPanelPage')
      ),
    },
    {
      path: '/dashboard/import',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardImport"*/ '../features/manage-dashboards/DashboardImportPage')
      ),
    },
    {
      path: DATASOURCES_ROUTES.List,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DataSourcesListPage"*/ '../features/datasources/pages/DataSourcesListPage')
      ),
    },
    {
      path: DATASOURCES_ROUTES.Edit,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "EditDataSourcePage"*/ '../features/datasources/pages/EditDataSourcePage')
      ),
    },
    {
      path: DATASOURCES_ROUTES.Dashboards,
      component: SafeDynamicImport(
        () =>
          import(
            /* webpackChunkName: "DataSourceDashboards"*/ '../features/datasources/pages/DataSourceDashboardsPage'
          )
      ),
    },
    {
      path: DATASOURCES_ROUTES.New,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "NewDataSourcePage"*/ '../features/datasources/pages/NewDataSourcePage')
      ),
    },
    {
      path: '/datasources/correlations',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "CorrelationsPage" */ '../features/correlations/CorrelationsPage')
      ),
    },
    {
      path: '/dashboards',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardListPage"*/ '../features/search/components/DashboardListPage')
      ),
    },
    {
      path: '/dashboards/folder/new',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "NewDashboardsFolder"*/ '../features/folders/components/NewDashboardsFolder')
      ),
    },
    {
      path: '/dashboards/f/:uid/:slug/permissions',
      component:
        config.rbacEnabled && contextSrv.hasPermission(AccessControlAction.FoldersPermissionsRead)
          ? SafeDynamicImport(
              () =>
                import(/* webpackChunkName: "FolderPermissions"*/ '../features/folders/AccessControlFolderPermissions')
            )
          : SafeDynamicImport(
              () => import(/* webpackChunkName: "FolderPermissions"*/ '../features/folders/FolderPermissions')
            ),
    },
    {
      path: '/dashboards/f/:uid/:slug/settings',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "FolderSettingsPage"*/ '../features/folders/FolderSettingsPage')
      ),
    },
    {
      path: '/dashboards/f/:uid/:slug',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardListPage"*/ '../features/search/components/DashboardListPage')
      ),
    },
    {
      path: '/dashboards/f/:uid',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardListPage"*/ '../features/search/components/DashboardListPage')
      ),
    },
    {
      path: '/explore',
      pageClass: 'page-explore',
      roles: () =>
        contextSrv.evaluatePermission(
          () => (config.viewersCanEdit ? [] : ['Editor', 'Admin']),
          [AccessControlAction.DataSourcesExplore]
        ),
      component: SafeDynamicImport(() =>
        config.exploreEnabled
          ? import(/* webpackChunkName: "explore" */ '../features/explore/Wrapper')
          : import(/* webpackChunkName: "explore-feature-toggle-page" */ '../features/explore/FeatureTogglePage')
      ),
    },
    ...topnavRoutes,
    {
      path: '/a/:pluginId',
      exact: false,
      // Someday * and will get a ReactRouter under that path!
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "AppRootPage" */ '../features/plugins/components/AppRootPage')
      ),
    },
    {
      path: '/org',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "OrgDetailsPage" */ '../features/org/OrgDetailsPage')
      ),
    },
    {
      path: '/org/new',
      component: SafeDynamicImport(() => import(/* webpackChunkName: "NewOrgPage" */ '../features/org/NewOrgPage')),
    },
    {
      path: '/org/users',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "UsersListPage" */ '../features/users/UsersListPage')
      ),
    },
    {
      path: '/org/users/invite',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "UserInvitePage" */ '../features/org/UserInvitePage')
      ),
    },
    {
      path: '/org/apikeys',
      roles: () => contextSrv.evaluatePermission(() => ['Admin'], [AccessControlAction.ActionAPIKeysRead]),
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "ApiKeysPage" */ '../features/api-keys/ApiKeysPage')
      ),
    },
    {
      path: '/org/serviceaccounts',
      roles: () =>
        contextSrv.evaluatePermission(
          () => ['Admin'],
          [AccessControlAction.ServiceAccountsRead, AccessControlAction.ServiceAccountsCreate]
        ),
      component: SafeDynamicImport(
        () =>
          import(/* webpackChunkName: "ServiceAccountsPage" */ '../features/serviceaccounts/ServiceAccountsListPage')
      ),
    },
    {
      path: '/org/serviceaccounts/create',
      component: SafeDynamicImport(
        () =>
          import(
            /* webpackChunkName: "ServiceAccountCreatePage" */ '../features/serviceaccounts/ServiceAccountCreatePage'
          )
      ),
    },
    {
      path: '/org/serviceaccounts/:id',
      component: ServiceAccountPage,
    },
    {
      path: '/org/teams',
      roles: () =>
        contextSrv.evaluatePermission(
          () => (config.editorsCanAdmin ? ['Editor', 'Admin'] : ['Admin']),
          [AccessControlAction.ActionTeamsRead, AccessControlAction.ActionTeamsCreate]
        ),
      component: SafeDynamicImport(() => import(/* webpackChunkName: "TeamList" */ '../features/teams/TeamList')),
    },
    {
      path: '/org/teams/new',
      roles: () =>
        contextSrv.evaluatePermission(
          () => (config.editorsCanAdmin ? ['Editor', 'Admin'] : ['Admin']),
          [AccessControlAction.ActionTeamsCreate]
        ),
      component: SafeDynamicImport(() => import(/* webpackChunkName: "CreateTeam" */ '../features/teams/CreateTeam')),
    },
    {
      path: '/org/teams/edit/:id/:page?',
      roles: () =>
        contextSrv.evaluatePermission(
          () => (config.editorsCanAdmin ? ['Editor', 'Admin'] : ['Admin']),
          [AccessControlAction.ActionTeamsRead, AccessControlAction.ActionTeamsCreate]
        ),
      component: SafeDynamicImport(() => import(/* webpackChunkName: "TeamPages" */ '../features/teams/TeamPages')),
    },
    // ADMIN

    {
      path: '/admin',
      component: () => (config.featureToggles.topnav ? <NavLandingPage navId="cfg" /> : <Redirect to="/admin/users" />),
    },
    {
      path: '/admin/settings',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "AdminSettings" */ '../features/admin/AdminSettings')
      ),
    },
    {
      path: '/admin/upgrading',
      component: SafeDynamicImport(() => import('../features/admin/UpgradePage')),
    },
    {
      path: '/admin/users',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "UserListAdminPage" */ '../features/admin/UserListAdminPage')
      ),
    },
    {
      path: '/admin/users/create',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "UserCreatePage" */ '../features/admin/UserCreatePage')
      ),
    },
    {
      path: '/admin/users/edit/:id',
      component: UserAdminPage,
    },
    {
      path: '/admin/orgs',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "AdminListOrgsPage" */ '../features/admin/AdminListOrgsPage')
      ),
    },
    {
      path: '/admin/orgs/edit/:id',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "AdminEditOrgPage" */ '../features/admin/AdminEditOrgPage')
      ),
    },
    {
      path: '/admin/storage/:path*',
      roles: () => ['Admin'],
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "StoragePage" */ '../features/storage/StoragePage')
      ),
    },
    {
      path: '/admin/stats',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "ServerStats" */ '../features/admin/ServerStats')
      ),
    },
    {
      path: '/admin/ldap',
      component: LdapPage,
    },
    // LOGIN / SIGNUP
    {
      path: '/login',
      component: LoginPage,
      pageClass: 'login-page sidemenu-hidden',
      chromeless: true,
    },
    {
      path: '/invite/:code',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "SignupInvited" */ '../features/invites/SignupInvited')
      ),
      pageClass: 'sidemenu-hidden',
      chromeless: true,
    },
    {
      path: '/verify',
      component: !config.verifyEmailEnabled
        ? () => <Redirect to="/signup" />
        : SafeDynamicImport(
            () => import(/* webpackChunkName "VerifyEmailPage"*/ '../core/components/Signup/VerifyEmailPage')
          ),
      pageClass: 'login-page sidemenu-hidden',
      chromeless: true,
    },
    {
      path: '/signup',
      component: config.disableUserSignUp
        ? () => <Redirect to="/login" />
        : SafeDynamicImport(() => import(/* webpackChunkName "SignupPage"*/ '../core/components/Signup/SignupPage')),
      pageClass: 'sidemenu-hidden login-page',
      chromeless: true,
    },
    {
      path: '/user/password/send-reset-email',
      pageClass: 'sidemenu-hidden',
      chromeless: true,
      component: SafeDynamicImport(
        () =>
          import(/* webpackChunkName: "SendResetMailPage" */ '../core/components/ForgottenPassword/SendResetMailPage')
      ),
    },
    {
      path: '/user/password/reset',
      component: SafeDynamicImport(
        () =>
          import(
            /* webpackChunkName: "ChangePasswordPage" */ '../core/components/ForgottenPassword/ChangePasswordPage'
          )
      ),
      pageClass: 'sidemenu-hidden login-page',
      chromeless: true,
    },
    {
      path: '/dashboard/snapshots',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "SnapshotListPage" */ '../features/manage-dashboards/SnapshotListPage')
      ),
    },
    {
      path: '/playlists',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "PlaylistPage"*/ '../features/playlist/PlaylistPage')
      ),
    },
    {
      path: '/playlists/play/:uid',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "PlaylistStartPage"*/ '../features/playlist/PlaylistStartPage')
      ),
    },
    {
      path: '/playlists/new',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "PlaylistNewPage"*/ '../features/playlist/PlaylistNewPage')
      ),
    },
    {
      path: '/playlists/edit/:uid',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "PlaylistEditPage"*/ '../features/playlist/PlaylistEditPage')
      ),
    },
    {
      path: '/sandbox/benchmarks',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "BenchmarksPage"*/ '../features/sandbox/BenchmarksPage')
      ),
    },
    {
      path: '/sandbox/test',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "TestStuffPage"*/ '../features/sandbox/TestStuffPage')
      ),
    },
    {
      path: '/dashboards/f/:uid/:slug/library-panels',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "FolderLibraryPanelsPage"*/ '../features/folders/FolderLibraryPanelsPage')
      ),
    },
    {
      path: '/dashboards/f/:uid/:slug/alerting',
      roles: () =>
        contextSrv.evaluatePermission(() => ['Viewer', 'Editor', 'Admin'], [AccessControlAction.AlertingRuleRead]),
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "FolderAlerting"*/ '../features/folders/FolderAlerting')
      ),
    },
    {
      path: '/library-panels',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "LibraryPanelsPage"*/ '../features/library-panels/LibraryPanelsPage')
      ),
    },
    {
      path: '/notifications',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "NotificationsPage"*/ '../features/notifications/NotificationsPage')
      ),
    },
    ...getBrowseStorageRoutes(),
    ...getDynamicDashboardRoutes(),
    ...getPluginCatalogRoutes(),
    ...getLiveRoutes(),
    ...getAlertingRoutes(),
    ...getProfileRoutes(),
    ...extraRoutes,
    ...getPublicDashboardRoutes(),
    ...getDataConnectionsRoutes(),
    {
      path: '/*',
      component: ErrorPage,
    },
    // TODO[Router]
    // ...playlistRoutes,
  ];
}

export function getBrowseStorageRoutes(cfg = config): RouteDescriptor[] {
  if (!cfg.featureToggles.dashboardsFromStorage) {
    return [];
  }
  return [
    {
      path: '/g/:slug*.json', // suffix will eventually include dashboard
      pageClass: 'page-dashboard',
      routeName: DashboardRoutes.Path,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "DashboardPage" */ '../features/dashboard/containers/DashboardPage')
      ),
    },
    {
      path: '/g/:slug*',
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "StorageFolderPage" */ '../features/storage/StorageFolderPage')
      ),
    },
  ];
}

export function getDynamicDashboardRoutes(cfg = config): RouteDescriptor[] {
  if (!cfg.featureToggles.scenes) {
    return [];
  }
  return [
    {
      path: '/scenes',
      component: SafeDynamicImport(() => import(/* webpackChunkName: "scenes"*/ '../features/scenes/SceneListPage')),
    },
    {
      path: '/scenes/:name',
      component: SafeDynamicImport(() => import(/* webpackChunkName: "scenes"*/ '../features/scenes/ScenePage')),
    },
  ];
}
