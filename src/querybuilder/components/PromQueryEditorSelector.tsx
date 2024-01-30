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

import React, { SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { CoreApp, LoadingState } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';
import { ConfirmModal, IconButton } from '@grafana/ui';

import PrettifyQuery from "../../components/PrettifyQuery";
import { EditorHeader, EditorRows, FlexItem, InlineSelect, Space } from '../../components/QueryEditor';
import VmuiLink from "../../components/VmuiLink";
import WithTemplateConfig from "../../components/WithTemplateConfig";
import { WithTemplate } from "../../components/WithTemplateConfig/types";
import { getArrayFromTemplate } from "../../components/WithTemplateConfig/utils/getArrayFromTemplate";
import { PromQueryEditorProps } from '../../components/types';
import PrometheusLanguageProvider from "../../language_provider";
import { PromQuery } from '../../types';
import { ExtendedDataQueryRequest } from "../../types/datasource";
import { promQueryModeller } from '../PromQueryModeller';
import { buildVisualQueryFromString } from '../parsing';
import { QueryEditorModeToggle } from '../shared/QueryEditorModeToggle';
import { QueryHeaderSwitch } from '../shared/QueryHeaderSwitch';
import { promQueryEditorExplainKey, useFlag } from '../shared/hooks/useFlag';
import { QueryEditorMode } from '../shared/types';
import { changeEditorMode, getQueryWithDefaults } from '../state';

import { PromQueryBuilderContainer } from './PromQueryBuilderContainer';
import { PromQueryBuilderOptions } from './PromQueryBuilderOptions';
import { PromQueryCodeEditor } from './PromQueryCodeEditor';
import { QueryPreview } from "./QueryPreview";
import { TraceView } from "./Trace";

type Props = PromQueryEditorProps;

export const PromQueryEditorSelector = React.memo<Props>((props) => {

  const { onChange, onRunQuery, data, app, datasource } = props;

  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [trace, setTrace] = useState(false);
  const [rawQuery, setRawQuery] = useState(false)
  const { flag: explain, setFlag: setExplain } = useFlag(promQueryEditorExplainKey);

  const dashboardUID: string = (data?.request as ExtendedDataQueryRequest<PromQuery>)?.dashboardUID || ""
  const [templateByDashboard, setTemplateByDashboard] = useState<WithTemplate>()

  const query = getQueryWithDefaults(props.query, app);
  // This should be filled in from the defaults by now.
  const editorMode = query.editorMode!;

  const onEditorModeChange = useCallback(
    (newMetricEditorMode: QueryEditorMode) => {
      reportInteraction('user_grafana_prometheus_editor_mode_clicked', {
        newEditor: newMetricEditorMode,
        previousEditor: query.editorMode ?? '',
        newQuery: !query.expr,
        app: app ?? '',
      });

      if (newMetricEditorMode === QueryEditorMode.Builder) {
        const result = buildVisualQueryFromString(query.expr || '');
        // If there are errors, give user a chance to decide if they want to go to builder as that can lose some data.
        if (result.errors.length) {
          setParseModalOpen(true);
          return;
        }
      }
      changeEditorMode(query, newMetricEditorMode, onChange);
    },
    [onChange, query, app]
  );

  const onChangeInternal = (query: PromQuery) => {
    onChange(query);
  };

  const onShowExplainChange = (e: SyntheticEvent<HTMLInputElement>) => {
    setExplain(e.currentTarget.checked);
  };

  const onShowTracingChange = (e: SyntheticEvent<HTMLInputElement>) => {
    setTrace(e.currentTarget.checked);
    onChange({ ...query, trace: e.currentTarget.checked ? 1 : undefined });
    onRunQuery();
  };

  const onShowRawChange = (e: SyntheticEvent<HTMLInputElement>) => {
    setRawQuery(e.currentTarget.checked)
  }

  useEffect(() => {
    const withTemplates = getArrayFromTemplate(templateByDashboard)
    datasource.languageProvider = new PrometheusLanguageProvider(datasource, { withTemplates })
    datasource.languageProvider.start()
    if (app !== CoreApp.UnifiedAlerting){
      onRunQuery();
    }
  }, [onRunQuery, datasource, templateByDashboard, app])

  return (
    <>
      <ConfirmModal
        isOpen={parseModalOpen}
        title="Query parsing"
        body="There were errors while trying to parse the query. Continuing to visual builder may lose some parts of the query."
        confirmText="Continue"
        onConfirm={() => {
          changeEditorMode(query, QueryEditorMode.Builder, onChange);
          setParseModalOpen(false);
        }}
        onDismiss={() => setParseModalOpen(false)}
      />
      <EditorHeader>
        <InlineSelect
          value={null}
          placeholder="Query patterns"
          allowCustomValue
          onChange={({ value }) => {
            // TODO: Bit convoluted as we don't have access to visualQuery model here. Maybe would make sense to
            //  move it inside the editor?
            const result = buildVisualQueryFromString(query.expr || '');
            result.query.operations = value?.operations!;
            onChange({
              ...query,
              expr: promQueryModeller.renderQuery(result.query),
            });
          }}
          options={promQueryModeller.getQueryPatterns().map((x) => ({ label: x.name, value: x }))}
        />
        <QueryHeaderSwitch label="Explain" value={explain} onChange={onShowExplainChange}/>
        <QueryHeaderSwitch label="Trace" value={trace} onChange={onShowTracingChange}/>
        <QueryHeaderSwitch label="Raw" value={rawQuery} onChange={onShowRawChange}/>
        <FlexItem grow={1}/>
        <WithTemplateConfig
          app={app}
          template={templateByDashboard}
          setTemplate={setTemplateByDashboard}
          dashboardUID={dashboardUID}
          datasource={datasource}
        />
        <PrettifyQuery query={query} datasource={datasource} onChange={onChange}/>
        <VmuiLink query={query} datasource={datasource} panelData={data} dashboardUID={dashboardUID}/>
        {app !== CoreApp.Explore && (
          <IconButton
            key="run"
            name={data?.state === LoadingState.Loading ? 'fa fa-spinner' : "play"}
            tooltip="Run queries"
            onClick={onRunQuery}
          />
        )}
        <QueryEditorModeToggle mode={editorMode} onChange={onEditorModeChange}/>
      </EditorHeader>
      <Space v={0.5}/>
      <EditorRows>
        {editorMode === QueryEditorMode.Code && (
          <>
            <PromQueryCodeEditor
              {...props}
              key={templateByDashboard?.expr}
              query={query}
              showExplain={explain}
            />
            {rawQuery && <QueryPreview query={query.expr} withTemplate={templateByDashboard}/>}
          </>
        )}
        {editorMode === QueryEditorMode.Builder && (
          <PromQueryBuilderContainer
            query={query}
            datasource={props.datasource}
            onChange={onChangeInternal}
            onRunQuery={props.onRunQuery}
            data={data}
            showExplain={explain}
          />
        )}
        {trace && <TraceView query={query} datasource={datasource} data={data}/>}
        <PromQueryBuilderOptions query={query} app={props.app} onChange={onChange} onRunQuery={onRunQuery}/>
      </EditorRows>
    </>
  );
});

PromQueryEditorSelector.displayName = 'PromQueryEditorSelector';
