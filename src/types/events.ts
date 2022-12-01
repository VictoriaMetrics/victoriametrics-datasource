import { BusEventBase, BusEventWithPayload } from '@grafana/data';
import { IconName } from '@grafana/ui';


/**
 * Event Payloads
 */
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
