import { StorageKey } from './storageKeys';

type StoreValue = string | number | boolean | null;

export class Store {
  get(key: StorageKey) {
    this.migrateLegacyValue(key);
    return window.localStorage[key.key];
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
    return this.get(key) !== undefined;
  }

  delete({ key }: StorageKey) {
    window.localStorage.removeItem(key);
  }

  /* Moves the value written by earlier plugin versions under the prefixed key, once */
  private migrateLegacyValue({ key, legacyKey }: StorageKey) {
    if (legacyKey === undefined || window.localStorage[key] !== undefined) {
      return;
    }
    const legacyValue = window.localStorage[legacyKey];
    if (legacyValue !== undefined) {
      window.localStorage[key] = legacyValue;
      window.localStorage.removeItem(legacyKey);
    }
  }
}

const store = new Store();
export default store;
