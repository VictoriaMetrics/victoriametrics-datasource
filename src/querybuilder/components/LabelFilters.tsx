// Copyright (c) 2024 Grafana Labs
// Modifications Copyright (c) 2024 VictoriaMetrics
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

import { css, cx } from '@emotion/css';
import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { EditorFieldGroup, EditorField } from '@grafana/plugin-ui';
import { InlineFieldRow, InlineLabel } from '@grafana/ui';

import { EditorList } from "../../components/QueryEditor";
import { QueryBuilderLabelFilter } from '../shared/types';

import { LabelFilterItem } from './LabelFilterItem';

export const MISSING_LABEL_FILTER_ERROR_MESSAGE = 'Select at least 1 label filter (label and value)';

export interface Props {
  labelsFilters: QueryBuilderLabelFilter[];
  onChange: (labelFilters: Array<Partial<QueryBuilderLabelFilter>>) => void;
  onGetLabelNames: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  onGetLabelValues: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  /** If set to true, component will show error message until at least 1 filter is selected */
  labelFilterRequired?: boolean;
  getLabelValuesAutofillSuggestions: (query: string, labelName?: string) => Promise<SelectableValue[]>;
  debounceDuration: number;
  variableEditor?: boolean;
}

export function LabelFilters({
  labelsFilters,
  onChange,
  onGetLabelNames,
  onGetLabelValues,
  labelFilterRequired,
  getLabelValuesAutofillSuggestions,
  debounceDuration,
  variableEditor,
}: Props) {
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
      onChange(newLabels);
    }
  };

  const hasLabelFilter = items.some((item) => item.label && item.value);

  const editorList = () => {
    return (
      <EditorList
        items={items}
        onChange={onLabelsChange}
        renderItem={(item: Partial<QueryBuilderLabelFilter>, onChangeItem, onDelete) => (
          <LabelFilterItem
            debounceDuration={debounceDuration}
            item={item}
            defaultOp={defaultOp}
            onChange={onChangeItem}
            onDelete={onDelete}
            onGetLabelNames={onGetLabelNames}
            onGetLabelValues={onGetLabelValues}
            invalidLabel={labelFilterRequired && !item.label}
            invalidValue={labelFilterRequired && !item.value}
            getLabelValuesAutofillSuggestions={getLabelValuesAutofillSuggestions}
          />
        )}
      />
    );
  };

  return (
    <>
      {variableEditor ? (
        <InlineFieldRow>
          <div
            className={cx(css`
              display: flex;
            `)}
          >
            <InlineLabel
              width={20}
              tooltip={<div>Optional: used to filter the metric select for this query type.</div>}
            >
              Label filters
            </InlineLabel>
            {editorList()}
          </div>
        </InlineFieldRow>
      ) : (
        <EditorFieldGroup>
          <EditorField
            label="Label filters"
            error={MISSING_LABEL_FILTER_ERROR_MESSAGE}
            invalid={labelFilterRequired && !hasLabelFilter}
          >
            {editorList()}
          </EditorField>
        </EditorFieldGroup>
      )}
    </>
  );
}
