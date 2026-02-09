// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-12-01: remove unused code
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
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

import { BusEventBase, BusEventWithPayload } from "@grafana/data";
import { IconName } from "@grafana/ui";


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
  static type = "zoom-out";
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
  static type = "shift-time";
}

export class AbsoluteTimeEvent extends BusEventBase {
  static type = "absolute-time";
}
