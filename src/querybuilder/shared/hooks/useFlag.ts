// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-13: optimization imports
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

import { useCallback, useState } from 'react';

import store from '../../../store';

export const promQueryEditorExplainKey = 'PrometheusQueryEditorExplainDefault';
export const promQueryEditorRawQueryKey = 'PrometheusQueryEditorRawQueryDefault';
export const lokiQueryEditorExplainKey = 'LokiQueryEditorExplainDefault';
export const lokiQueryEditorRawQueryKey = 'LokiQueryEditorRawQueryDefault';

export type QueryEditorFlags =
  | typeof promQueryEditorExplainKey
  | typeof promQueryEditorRawQueryKey
  | typeof lokiQueryEditorExplainKey
  | typeof lokiQueryEditorRawQueryKey;

function getFlagValue(key: QueryEditorFlags, defaultValue = false): boolean {
  const val = store.get(key);
  return val === undefined ? defaultValue : Boolean(parseInt(val, 10));
}

function setFlagValue(key: QueryEditorFlags, value: boolean) {
  store.set(key, value ? '1' : '0');
}

type UseFlagHookReturnType = { flag: boolean; setFlag: (val: boolean) => void };

/**
 *
 * Use and store value of explain/rawquery switch in local storage.
 * Needs to be a hook with local state to trigger re-renders.
 */
export function useFlag(key: QueryEditorFlags, defaultValue = false): UseFlagHookReturnType {
  const [flag, updateFlag] = useState(getFlagValue(key, defaultValue));
  const setter = useCallback(
    (value: boolean) => {
      setFlagValue(key, value);
      updateFlag(value);
    },
    [key]
  );

  return { flag, setFlag: setter };
}
