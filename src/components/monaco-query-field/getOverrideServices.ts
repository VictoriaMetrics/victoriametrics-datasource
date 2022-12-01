// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-12-01: remove unused functions and methods
// A detailed history of changes can be seen this - https://github.com/VictoriaMetrics/grafana-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { monacoTypes } from '@grafana/ui';

// this thing here is a workaround in a way.
// what we want to achieve, is that when the autocomplete-window
// opens, the "second, extra popup" with the extra help,
// also opens automatically.
// but there is no API to achieve it.
// the way to do it is to implement the `storageService`
// interface, and provide our custom implementation,
// which will default to `true` for the correct string-key.
// unfortunately, while the typescript-interface exists,
// it is not exported from monaco-editor,
// so we cannot rely on typescript to make sure
// we do it right. all we can do is to manually
// lookup the interface, and make sure we code our code right.
// our code is a "best effort" approach,
// i am not 100% how the `scope` and `target` things work,
// but so far it seems to work ok.
// i would use an another approach, if there was one available.

function makeStorageService() {
  // we need to return an object that fulfills this interface:
  // https://github.com/microsoft/vscode/blob/ff1e16eebb93af79fd6d7af1356c4003a120c563/src/vs/platform/storage/common/storage.ts#L37
  // unfortunately it is not export from monaco-editor

  const strings = new Map<string, string>();

  // we want this to be true by default
  strings.set('expandSuggestionDocs', true.toString());

  return {

    get: (key: string, scope: unknown, fallbackValue?: string): string | undefined => {
      return strings.get(key) ?? fallbackValue;
    },

    store: (
      key: string,
      value: string | boolean | number | undefined | null,
    ): void => {
      // the interface-docs say if the value is nullish, it should act as delete
      if (value === null || value === undefined) {
        strings.delete(key);
      } else {
        strings.set(key, value.toString());
      }
    },

    remove: (key: string): void => {
      strings.delete(key);
    },

    keys: (): string[] => {
      return Array.from(strings.keys());
    },

    flush: (): Promise<void> => {
      // we do not implement this
      return Promise.resolve(undefined);
    },
  };
}

let overrideServices: monacoTypes.editor.IEditorOverrideServices | null = null;

export function getOverrideServices(): monacoTypes.editor.IEditorOverrideServices {
  // only have one instance of this for every query editor
  if (overrideServices === null) {
    overrideServices = {
      storageService: makeStorageService(),
    };
  }

  return overrideServices;
}
