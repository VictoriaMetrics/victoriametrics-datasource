import { DATASOURCE_TYPE } from './consts';

/**
 * A browser storage key owned by this plugin.
 * `key` is prefixed with the plugin ID so it cannot collide with other plugins.
 * `legacyKey` is an unprefixed key written by earlier plugin versions; it is only read, never written.
 */
export interface StorageKey {
  key: string;
  legacyKey?: string;
}

export function pluginStorageKey(name: string, legacyKey?: string): StorageKey {
  return { key: `${DATASOURCE_TYPE}.${name}`, legacyKey };
}

export const queryEditorModeDefaultKey = pluginStorageKey(
  'queryEditorModeDefault',
  'PrometheusQueryEditorModeDefault'
);
export const queryEditorExplainKey = pluginStorageKey(
  'queryEditorExplainDefault',
  'VictoriaMetricsQueryEditorExplainDefault'
);
export const queryEditorRawQueryKey = pluginStorageKey(
  'queryEditorRawQueryDefault',
  'VictoriaMetricsQueryEditorRawQueryDefault'
);
export const lastUsedLabelsKey = pluginStorageKey('browser.labels', 'grafana.datasources.prometheus.browser.labels');
