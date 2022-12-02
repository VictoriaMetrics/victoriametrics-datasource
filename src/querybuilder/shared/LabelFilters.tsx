// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to 'components/QueryEditor'
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/grafana-datasource
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

import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';

import { EditorFieldGroup, EditorField, EditorList } from '../../components/QueryEditor';

import { LabelFilterItem } from './LabelFilterItem';
import { QueryBuilderLabelFilter } from './types';


export interface Props {
  labelsFilters: QueryBuilderLabelFilter[];
  onChange: (labelFilters: QueryBuilderLabelFilter[]) => void;
  onGetLabelNames: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  onGetLabelValues: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  error?: string;
}

export function LabelFilters({ labelsFilters, onChange, onGetLabelNames, onGetLabelValues, error }: Props) {
  const defaultOp = '=';
  const [items, setItems] = useState<Array<Partial<QueryBuilderLabelFilter>>>([{ op: defaultOp }]);

  useEffect(() => {
    if (labelsFilters.length > 0) {
      setItems(labelsFilters);
    } else {
      setItems([{ op: defaultOp }]);
    }
  }, [labelsFilters]);

  const onLabelsChange = (newItems: Array<Partial<QueryBuilderLabelFilter>>) => {
    setItems(newItems);

    // Extract full label filters with both label & value
    const newLabels = newItems.filter((x) => x.label != null && x.value != null);
    if (!isEqual(newLabels, labelsFilters)) {
      onChange(newLabels as QueryBuilderLabelFilter[]);
    }
  };

  return (
    <EditorFieldGroup>
      <EditorField label="Label filters" error={error} invalid={!!error}>
        <EditorList
          items={items}
          onChange={onLabelsChange}
          renderItem={(item, onChangeItem, onDelete) => (
            <LabelFilterItem
              item={item}
              defaultOp={defaultOp}
              onChange={onChangeItem}
              onDelete={onDelete}
              onGetLabelNames={onGetLabelNames}
              onGetLabelValues={onGetLabelValues}
            />
          )}
        />
      </EditorField>
    </EditorFieldGroup>
  );
}
