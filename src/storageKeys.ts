import { DATASOURCE_TYPE } from './consts';

/**
 * A browser storage key owned by this plugin.
 * `key` is prefixed with the plugin ID so it cannot collide with other plugins.
 * `legacyKey` is an unprefixed key written by earlier plugin versions: its value is moved
 * to `key` on the first read and the legacy key is removed. Keys that were shared with the
 * built-in Prometheus datasource have no `legacyKey`, their values belong to that plugin.
 */
export interface StorageKey {
  key: string;
  legacyKey?: string;
}

export function pluginStorageKey(name: string, legacyKey?: string): StorageKey {
  return { key: `${DATASOURCE_TYPE}.${name}`, legacyKey };
}

export const queryEditorModeDefaultKey = pluginStorageKey('queryEditorModeDefault');
export const queryEditorExplainKey = pluginStorageKey(
  'queryEditorExplainDefault',
  'VictoriaMetricsQueryEditorExplainDefault'
);
export const lastUsedLabelsKey = pluginStorageKey('browser.labels');
