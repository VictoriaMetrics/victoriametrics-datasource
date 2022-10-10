import { IconName } from 'packages/grafana-ui/src';

import { AnnotationQuery, BusEventBase, BusEventWithPayload, eventFactory } from '@grafana/data';

/**
 * Event Payloads
 */

export interface ShowDashSearchPayload {
  query?: string;
}

export interface LocationChangePayload {
  href: string;
}

export interface ShowModalPayload {
  model?: any;
  modalClass?: string;
  src?: string;
  templateHtml?: string;
  backdrop?: any;
  scope?: any;
}

export interface ShowModalReactPayload {
  component: React.ComponentType<any>;
  props?: any;
}

export interface ShowConfirmModalPayload {
  title?: string;
  text?: string;
  text2?: string;
  text2htmlBind?: boolean;
  confirmText?: string;
  altActionText?: string;
  yesText?: string;
  noText?: string;
  icon?: IconName;

  onConfirm?: () => void;
  onAltAction?: () => void;
}

export interface DataSourceResponse<T> {
  data: T;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly url: string;
  readonly config: any;
}

type DataSourceResponsePayload = DataSourceResponse<any>;

export interface ToggleKioskModePayload {
  exit?: boolean;
}

export interface GraphClickedPayload {
  pos: any;
  panel: any;
  item: any;
}

export interface ThresholdChangedPayload {
  threshold: any;
  handleIndex: any;
}

export interface DashScrollPayload {
  restore?: boolean;
  animate?: boolean;
  pos?: number;
}

export interface PanelChangeViewPayload {}

interface ZoomOutEventPayload {
  scale: number;
  updateUrl?: boolean;
}

export class ZoomOutEvent extends BusEventWithPayload<ZoomOutEventPayload> {
  static type = 'zoom-out';
}

export enum ShiftTimeEventDirection {
  Left = -1,
  Right = 1,
}

interface ShiftTimeEventPayload {
  direction: ShiftTimeEventDirection;
  updateUrl?: boolean;
}

export class ShiftTimeEvent extends BusEventWithPayload<ShiftTimeEventPayload> {
  static type = 'shift-time';
}

export class AbsoluteTimeEvent extends BusEventBase {
  static type = 'absolute-time';
}

export class RemovePanelEvent extends BusEventWithPayload<number> {
  static type = 'remove-panel';
}

/**
 * @deprecated use ShowModalReactEvent instead that has this capability built in
 */
export class ShowModalEvent extends BusEventWithPayload<ShowModalPayload> {
  static type = 'show-modal';
}

export class ShowConfirmModalEvent extends BusEventWithPayload<ShowConfirmModalPayload> {
  static type = 'show-confirm-modal';
}

export class ShowModalReactEvent extends BusEventWithPayload<ShowModalReactPayload> {
  static type = 'show-react-modal';
}

/**
 * @deprecated use ShowModalReactEvent instead that has this capability built in
 */
export class HideModalEvent extends BusEventBase {
  static type = 'hide-modal';
}

export class DashboardSavedEvent extends BusEventBase {
  static type = 'dashboard-saved';
}

export class AnnotationQueryStarted extends BusEventWithPayload<AnnotationQuery> {
  static type = 'annotation-query-started';
}

export class AnnotationQueryFinished extends BusEventWithPayload<AnnotationQuery> {
  static type = 'annotation-query-finished';
}

export class PanelEditEnteredEvent extends BusEventWithPayload<number> {
  static type = 'panel-edit-started';
}

export class PanelEditExitedEvent extends BusEventWithPayload<number> {
  static type = 'panel-edit-finished';
}
