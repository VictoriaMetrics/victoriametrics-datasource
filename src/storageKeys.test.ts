import { DATASOURCE_TYPE } from './consts';
import { lastUsedLabelsKey, pluginStorageKey, queryEditorExplainKey, queryEditorModeDefaultKey } from './storageKeys';

describe('pluginStorageKey', () => {
  it('prefixes the key with the plugin id', () => {
    expect(pluginStorageKey('foo')).toEqual({ key: `${DATASOURCE_TYPE}.foo`, legacyKey: undefined });
  });

  it('keeps the legacy key for migration', () => {
    expect(pluginStorageKey('foo', 'bar')).toEqual({ key: `${DATASOURCE_TYPE}.foo`, legacyKey: 'bar' });
  });

  it.each([queryEditorModeDefaultKey, queryEditorExplainKey, lastUsedLabelsKey])(
    'every shared key is prefixed %o',
    ({ key }) => {
      expect(key.startsWith(`${DATASOURCE_TYPE}.`)).toBe(true);
    }
  );

  it('migrates only the keys that belonged to this plugin', () => {
    expect(queryEditorExplainKey.legacyKey).toBe('VictoriaMetricsQueryEditorExplainDefault');
  });

  it.each([queryEditorModeDefaultKey, lastUsedLabelsKey])(
    'never reads the keys shared with the Prometheus datasource %o',
    ({ legacyKey }) => {
      expect(legacyKey).toBeUndefined();
    }
  );
});
