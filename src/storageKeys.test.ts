import { DATASOURCE_TYPE } from './consts';
import { lastUsedLabelsKey, pluginStorageKey, queryEditorExplainKey, queryEditorModeDefaultKey } from './storageKeys';

describe('pluginStorageKey', () => {
  it('prefixes the key with the plugin id', () => {
    expect(pluginStorageKey('foo')).toEqual({ key: `${DATASOURCE_TYPE}.foo`, legacyKey: undefined });
  });

  it('keeps the legacy key for reading', () => {
    expect(pluginStorageKey('foo', 'bar')).toEqual({ key: `${DATASOURCE_TYPE}.foo`, legacyKey: 'bar' });
  });

  it.each([queryEditorModeDefaultKey, queryEditorExplainKey, lastUsedLabelsKey])(
    'every shared key is prefixed and keeps its legacy key %o',
    ({ key, legacyKey }) => {
      expect(key.startsWith(`${DATASOURCE_TYPE}.`)).toBe(true);
      expect(legacyKey).toBeDefined();
      expect(legacyKey!.startsWith(`${DATASOURCE_TYPE}.`)).toBe(false);
    }
  );
});
