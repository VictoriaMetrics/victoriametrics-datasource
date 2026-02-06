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
import HighlighterComponent, { HighlighterProps } from 'react-highlight-words';

import { GrafanaTheme2, SelectableValue, toOption } from '@grafana/data';
import { Button, FormatOptionLabelMeta, InlineField, InlineFieldRow, Select, useStyles2 } from '@grafana/ui';

import { EditorField, EditorFieldGroup } from '../../components/QueryEditor';
import { PrometheusDatasource } from '../../datasource';
import { escapeMetricNameSpecialCharacters } from '../../language_utils';
import { PromVisualQuery } from '../types';

import { MetricsExplorerModal } from './MetricsExplorerModal/MetricsExplorerModal';

// typecast to fix compatibility issues with the React types
const Highlighter = HighlighterComponent as React.ComponentType<HighlighterProps>;

// We are matching words split with space
const splitSeparator = ' ';

export interface Props {
  query: PromVisualQuery;
  onChange: (query: PromVisualQuery) => void;
  onGetMetrics: () => Promise<SelectableValue[]>;
  datasource: PrometheusDatasource;
  variableEditor?: boolean;
}

export function MetricSelect({ query, onChange, onGetMetrics, datasource, variableEditor }: Props) {
  const styles = useStyles2(getStyles);
  const [state, setState] = useState<{
    metrics?: Array<SelectableValue<any>>;
    isLoading?: boolean;
  }>({});
  const [showMetricsExplorer, setShowMetricsExplorer] = useState(false);

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
  };

  const handleChange = ({ value }: SelectableValue) => {
    if (value) {
      onChange({ ...query, metric: escapeMetricNameSpecialCharacters(value) });
    }
  };

  const handleMetricExplorerSelect = useCallback((metric: string) => {
    onChange({ ...query, metric: escapeMetricNameSpecialCharacters(metric) });
  },
  [onChange, query]
  );

  const metricSelect = () => (
    <div className={styles.selectWrapper}>
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
      <Button
        aria-label={"Open metrics explorer"}
        icon={"book-open"}
        variant={"secondary"}
        tooltip={"Open metrics explorer"}
        onClick={() => setShowMetricsExplorer(true)}
        className={styles.metricExplorerButton}
      />
    </div>
  );

  return (
    <>
      {variableEditor ? (
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
          <EditorField label="Metric">{metricSelect()}</EditorField>
        </EditorFieldGroup>
      )}
      <MetricsExplorerModal
        isOpen={showMetricsExplorer}
        onClose={() => setShowMetricsExplorer(false)}
        datasource={datasource}
        onSelectMetric={handleMetricExplorerSelect}
        selectedMetric={query.metric}
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  select: css`
    min-width: 125px;
  `,
  selectWrapper: css`
    display: flex;
    align-items: center;
  `,
  metricExplorerButton: css`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  `,
  highlight: css`
    label: select__match-highlight;
    background: inherit;
    padding: inherit;
    color: ${theme.colors.warning.contrastText};
    background-color: ${theme.colors.warning.main};
  `,
});
