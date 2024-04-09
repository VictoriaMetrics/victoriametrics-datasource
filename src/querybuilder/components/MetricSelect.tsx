// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-10: switch imports 'packages/grafana-ui/src' to '@grafana/ui'
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

import { css } from '@emotion/css';
import React, { useCallback, useState } from 'react';
import Highlighter from 'react-highlight-words';

import { SelectableValue, toOption, GrafanaTheme2 } from '@grafana/data';
import { Select, FormatOptionLabelMeta, useStyles2, InlineField, InlineFieldRow } from '@grafana/ui';

import { EditorField, EditorFieldGroup } from '../../components/QueryEditor';
import { escapeMetricNameSpecialCharacters } from "../../language_utils";
import { PromVisualQuery } from '../types';

// We are matching words split with space
const splitSeparator = ' ';

export interface Props {
  query: PromVisualQuery;
  onChange: (query: PromVisualQuery) => void;
  onGetMetrics: () => Promise<SelectableValue[]>;
  variableEditor?: boolean;
}

export function MetricSelect({ query, onChange, onGetMetrics, variableEditor }: Props) {
  const styles = useStyles2(getStyles);
  const [state, setState] = useState<{
    metrics?: Array<SelectableValue<any>>;
    isLoading?: boolean;
  }>({});

  const customFilterOption = useCallback((option: SelectableValue<any>, searchQuery: string) => {
    const label = option.label ?? option.value;
    if (!label) {
      return false;
    }

    // custom value is not a string label but a react node
    if (!label.toLowerCase) {
      return true;
    }

    const searchWords = searchQuery.split(splitSeparator);
    return searchWords.reduce((acc, cur) => acc && label.toLowerCase().includes(cur.toLowerCase()), true);
  }, []);

  const formatOptionLabel = useCallback(
    (option: SelectableValue<any>, meta: FormatOptionLabelMeta<any>) => {
      // For newly created custom value we don't want to add highlight
      if (option['__isNew__']) {
        return option.label;
      }

      return (
        <Highlighter
          searchWords={meta.inputValue.split(splitSeparator)}
          textToHighlight={option.label ?? ''}
          highlightClassName={styles.highlight}
        />
      );
    },
    [styles.highlight]
  );

  const handleOpenMenu = async () => {
    setState({ isLoading: true });
    const metrics = await onGetMetrics();
    setState({ metrics, isLoading: undefined });
  }

  const handleChange = ({ value }: SelectableValue) => {
    if (value) {
      onChange({ ...query, metric: escapeMetricNameSpecialCharacters(value) });
    }
  }

  const metricSelect = () => (
    <Select
      inputId="vm-metric-select"
      className={styles.select}
      value={query.metric ? toOption(query.metric) : undefined}
      placeholder="Select metric"
      allowCustomValue
      formatOptionLabel={formatOptionLabel}
      filterOption={customFilterOption}
      onOpenMenu={handleOpenMenu}
      isLoading={state.isLoading}
      options={state.metrics}
      onChange={handleChange}
    />
  )

  return (
    variableEditor ? (
      <InlineFieldRow>
        <InlineField
          label="Metric"
          labelWidth={20}
          tooltip={<div>Optional: returns a list of label values for the label name in the specified metric.</div>}
        >
          {metricSelect()}
        </InlineField>
      </InlineFieldRow>
    ) : (
      <EditorFieldGroup>
        <EditorField label="Metric">
          {metricSelect()}
        </EditorField>
      </EditorFieldGroup>
    )
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  select: css`
    min-width: 125px;
  `,
  highlight: css`
    label: select__match-highlight;
    background: inherit;
    padding: inherit;
    color: ${theme.colors.warning.contrastText};
    background-color: ${theme.colors.warning.main};
  `,
});
