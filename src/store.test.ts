import { StorageKey } from './storageKeys';
import store from './store';

const storageKey: StorageKey = { key: 'plugin.value', legacyKey: 'legacyValue' };
const keyWithoutLegacy: StorageKey = { key: 'plugin.other' };

describe('store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('get', () => {
    it('returns undefined when nothing is stored', () => {
      expect(store.get(storageKey)).toBeUndefined();
      expect(store.exists(storageKey)).toBe(false);
    });

    it('falls back to the legacy key', () => {
      window.localStorage['legacyValue'] = 'old';
      expect(store.get(storageKey)).toBe('old');
      expect(store.exists(storageKey)).toBe(true);
    });

    it('prefers the prefixed key over the legacy key', () => {
      window.localStorage['legacyValue'] = 'old';
      window.localStorage['plugin.value'] = 'new';
      expect(store.get(storageKey)).toBe('new');
    });

    it('ignores the legacy key when the key has none', () => {
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
    it('reads a legacy object and writes it back under the prefixed key', () => {
      window.localStorage['legacyValue'] = JSON.stringify(['a', 'b']);
      expect(store.getObject(storageKey, [])).toEqual(['a', 'b']);

      store.setObject(storageKey, ['c']);
      expect(window.localStorage['plugin.value']).toBe('["c"]');
      expect(window.localStorage['legacyValue']).toBe('["a","b"]');
      expect(store.getObject(storageKey, [])).toEqual(['c']);
    });

    it('returns the default on invalid json', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      window.localStorage['plugin.value'] = '{';
      expect(store.getObject(storageKey, ['default'])).toEqual(['default']);
    });
  });

  describe('delete', () => {
    it('removes both the prefixed and the legacy key', () => {
      window.localStorage['legacyValue'] = 'old';
      window.localStorage['plugin.value'] = 'new';
      store.delete(storageKey);
      expect(store.get(storageKey)).toBeUndefined();
      expect(window.localStorage['legacyValue']).toBeUndefined();
    });
  });
});
