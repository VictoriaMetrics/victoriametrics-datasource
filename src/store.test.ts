import { StorageKey } from './storageKeys';
import store from './store';

const storageKey: StorageKey = { key: 'plugin.value', legacyKey: 'legacyValue' };
const keyWithoutLegacy: StorageKey = { key: 'plugin.other' };

describe('store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('returns undefined when nothing is stored', () => {
      expect(store.get(storageKey)).toBeUndefined();
      expect(store.exists(storageKey)).toBe(false);
    });

    it('moves the legacy value under the prefixed key on the first read', () => {
      window.localStorage['legacyValue'] = 'old';
      expect(store.get(storageKey)).toBe('old');
      expect(window.localStorage['plugin.value']).toBe('old');
      expect(window.localStorage['legacyValue']).toBeUndefined();
    });

    it('prefers the prefixed key and leaves the legacy key alone when both exist', () => {
      window.localStorage['legacyValue'] = 'old';
      window.localStorage['plugin.value'] = 'new';
      expect(store.get(storageKey)).toBe('new');
      expect(window.localStorage['legacyValue']).toBe('old');
    });

    it('ignores other keys when the key has no legacy key', () => {
      window.localStorage['legacyValue'] = 'old';
      expect(store.get(keyWithoutLegacy)).toBeUndefined();
    });
  });

  describe('set', () => {
    it('writes only the prefixed key', () => {
      store.set(storageKey, 'new');
      expect(window.localStorage['plugin.value']).toBe('new');
      expect(window.localStorage['legacyValue']).toBeUndefined();
    });
  });

  describe('getObject/setObject', () => {
    it('migrates a legacy object and writes it back under the prefixed key', () => {
      window.localStorage['legacyValue'] = JSON.stringify(['a', 'b']);
      expect(store.getObject(storageKey, [])).toEqual(['a', 'b']);
      expect(window.localStorage['legacyValue']).toBeUndefined();

      store.setObject(storageKey, ['c']);
      expect(window.localStorage['plugin.value']).toBe('["c"]');
      expect(store.getObject(storageKey, [])).toEqual(['c']);
    });

    it('returns the default on invalid json', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      window.localStorage['plugin.value'] = '{';
      expect(store.getObject(storageKey, ['default'])).toEqual(['default']);
    });
  });

  describe('delete', () => {
    it('removes the prefixed key and does not bring the value back', () => {
      window.localStorage['legacyValue'] = 'old';
      expect(store.get(storageKey)).toBe('old');
      store.delete(storageKey);
      expect(store.get(storageKey)).toBeUndefined();
    });

    it('does not touch keys of other plugins', () => {
      window.localStorage['grafana.datasources.prometheus.browser.labels'] = '["job"]';
      store.delete({ key: 'plugin.browser.labels' });
      expect(window.localStorage['grafana.datasources.prometheus.browser.labels']).toBe('["job"]');
    });
  });
});
