/**
 * UserPermission is a map storing permissions in a form of
 * {
 *   action: true;
 * }
 */
export type UserPermission = Record<string, boolean>;

// Permission actions
export enum AccessControlAction {
  DataSourcesExplore = 'datasources:explore',
}
