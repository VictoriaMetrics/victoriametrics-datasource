import {ComponentType} from 'react';

export {
  /** @deprecated Import from @grafana/data instead */
    VariableRefresh,
  /** @deprecated Import from @grafana/data instead */
    VariableSort,
  /** @deprecated Import from @grafana/data instead */
    VariableHide,
} from '../../../packages/grafana-data';


import {
  BusEventWithPayload,
  DataQuery,
  DataSourceJsonData,
  LoadingState,
  QueryEditorProps,
  BaseVariableModel,
  VariableHide,
} from '../../../packages/grafana-data';
import {TemplateSrv} from '../../../packages/grafana-runtime';

import {NEW_VARIABLE_ID} from './constants';

export enum TransactionStatus {
  NotStarted = 'Not started',
  Fetching = 'Fetching',
  Completed = 'Completed',
}

export const initialVariableModelState: BaseVariableModel = {
  id: NEW_VARIABLE_ID,
  rootStateKey: null,
  name: '',
  // TODO: in a later PR, remove type and type this object to Partial<BaseVariableModel>
  type: 'query',
  global: false,
  index: -1,
  hide: VariableHide.dontHide,
  skipUrlSync: false,
  state: LoadingState.NotStarted,
  error: null,
  description: null,
};

export interface VariableQueryEditorProps {
  query: any;
  onChange: (query: any, definition: string) => void;
  datasource: any;
  templateSrv: TemplateSrv;
}

export type VariableQueryEditorType<TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData> =
  ComponentType<VariableQueryEditorProps>
  | ComponentType<QueryEditorProps<any, TQuery, TOptions, any>>
  | null;

export interface VariablesChangedEvent {
  refreshAll: boolean;
  panelIds: number[];
}

export class VariablesChanged extends BusEventWithPayload<VariablesChangedEvent> {
  static type = 'variables-changed';
}

export interface VariablesTimeRangeProcessDoneEvent {
  variableIds: string[];
}

export class VariablesTimeRangeProcessDone extends BusEventWithPayload<VariablesTimeRangeProcessDoneEvent> {
  static type = 'variables-time-range-process-done';
}

export class VariablesChangedInUrl extends BusEventWithPayload<VariablesChangedEvent> {
  static type = 'variables-changed-in-url';
}
