import { StorageKey } from './storageKeys';

type StoreValue = string | number | boolean | null;

export class Store {
  /* Reads the prefixed key and falls back to the legacy key written by earlier plugin versions */
  get({ key, legacyKey }: StorageKey) {
    const value = window.localStorage[key];
    if (value !== void 0 || legacyKey === void 0) {
      return value;
    }
    return window.localStorage[legacyKey];
  }

  set({ key }: StorageKey, value: StoreValue) {
    window.localStorage[key] = value;
  }

  getObject<T = unknown>(key: StorageKey, def: T): T;
  getObject<T = unknown>(key: StorageKey, def?: T) {
    let ret = def;
    if (this.exists(key)) {
      const json = this.get(key);
      try {
        ret = JSON.parse(json);
      } catch (error) {
        console.error(`Error parsing store object: ${key.key}. Returning default: ${def}. [${error}]`);
      }
    }
    return ret;
  }

  /* Returns true when successfully stored, throws error if not successfully stored */
  setObject(key: StorageKey, value: any) {
    let json;
    try {
      json = JSON.stringify(value);
    } catch (error) {
      throw new Error(`Could not stringify object: ${key.key}. [${error}]`);
    }
    try {
      this.set(key, json);
    } catch (error) {
      // Likely hitting storage quota
      const errorToThrow = new Error(`Could not save item in localStorage: ${key.key}. [${error}]`);
      if (error instanceof Error) {
        errorToThrow.name = error.name;
      }
      throw errorToThrow;
    }
    return true;
  }

  exists(key: StorageKey) {
    return this.get(key) !== void 0;
  }

  /* Removes the legacy key as well, otherwise its value would show up again on the next read */
  delete({ key, legacyKey }: StorageKey) {
    window.localStorage.removeItem(key);
    if (legacyKey !== void 0) {
      window.localStorage.removeItem(legacyKey);
    }
  }
}

const store = new Store();
export default store;
