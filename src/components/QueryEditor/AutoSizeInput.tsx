// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-11-03: extends interface Props
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

import React, { useEffect, HTMLProps, ReactNode } from 'react';

import { Input, measureText } from "@grafana/ui";

export interface Props extends Omit<HTMLProps<HTMLInputElement>, 'prefix' | 'size'> {
  /** Sets the width to a multiple of 8px. Should only be used with inline forms. Setting width of the container is preferred in other cases.*/
  width?: number;
  /** Show an invalid state around the input */
  invalid?: boolean;
  /** Show an icon as a prefix in the input */
  prefix?: ReactNode;
  /** Show an icon as a suffix in the input */
  suffix?: ReactNode;
  /** Show a loading indicator as a suffix in the input */
  loading?: boolean;
  /** Add a component as an addon before the input  */
  addonBefore?: ReactNode;
  /** Add a component as an addon after the input */
  addonAfter?: ReactNode;
  /** Sets the min-width to a multiple of 8px. Default value is 10*/
  minWidth?: number;
  /** Sets the max-width to a multiple of 8px.*/
  maxWidth?: number;
  /** onChange function that will be run on onBlur and onKeyPress with enter*/
  onCommitChange?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export const AutoSizeInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { defaultValue = '', minWidth = 10, maxWidth, onCommitChange, onKeyDown, onBlur, ...restProps } = props;
  const [value, setValue] = React.useState(defaultValue);
  const [inputWidth, setInputWidth] = React.useState(minWidth);

  useEffect(() => {
    setInputWidth(getWidthFor(value.toString(), minWidth, maxWidth));
  }, [value, maxWidth, minWidth]);

  return (
    <Input
      {...restProps}
      ref={ref}
      value={value.toString()}
      onChange={(event) => {
        setValue(event.currentTarget.value);
      }}
      width={inputWidth}
      onBlur={(event) => {
        if (onBlur) {
          onBlur(event);
        } else if (onCommitChange) {
          onCommitChange(event);
        }
      }}
      onKeyDown={(event) => {
        if (onKeyDown) {
          onKeyDown(event);
        } else if (event.key === 'Enter' && onCommitChange) {
          onCommitChange(event);
        }
      }}
      data-testid={'autosize-input'}
    />
  );
});

function getWidthFor(value: string, minWidth: number, maxWidth: number | undefined): number {
  if (!value) {
    return minWidth;
  }

  const extraSpace = 3;
  const realWidth = measureText(value.toString(), 14).width / 8 + extraSpace;

  if (minWidth && realWidth < minWidth) {
    return minWidth;
  }

  if (maxWidth && realWidth > maxWidth) {
    return realWidth;
  }

  return realWidth;
}

AutoSizeInput.displayName = 'AutoSizeInput';
