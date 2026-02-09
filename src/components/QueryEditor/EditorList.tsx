// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: switch imports to @grafana/ui
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

import React from "react";

import { Button } from "@grafana/ui";

import { Stack } from "./Stack";

interface EditorListProps<T> {
  items: Array<Partial<T>>;
  renderItem: (
    item: Partial<T>,
    onChangeItem: (item: Partial<T>) => void,
    onDeleteItem: () => void
  ) => React.ReactElement;
  onChange: (items: Array<Partial<T>>) => void;
}

export function EditorList<T>({ items, renderItem, onChange }: EditorListProps<T>) {
  const onAddItem = () => {
    const newItems = [...items, {}];

    onChange(newItems);
  };

  const onChangeItem = (itemIndex: number, newItem: Partial<T>) => {
    const newItems = [...items];
    newItems[itemIndex] = newItem;
    onChange(newItems);
  };

  const onDeleteItem = (itemIndex: number) => {
    const newItems = [...items];
    newItems.splice(itemIndex, 1);
    onChange(newItems);
  };
  return (
    <Stack>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(
            item,
            (newItem) => onChangeItem(index, newItem),
            () => onDeleteItem(index)
          )}
        </div>
      ))}
      <Button onClick={onAddItem} variant="secondary" size="md" icon="plus" aria-label="Add" type="button" />
    </Stack>
  );
}
