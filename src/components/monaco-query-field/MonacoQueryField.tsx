// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-04: remove onChangeRef
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

import { css } from '@emotion/css';
import { promLanguageDefinition } from 'monaco-promql';
import React, { useRef, useEffect } from 'react';
import { useLatest } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { useTheme2, ReactMonacoEditor, Monaco, monacoTypes } from '@grafana/ui';

import { Props } from './MonacoQueryFieldProps';
import { getOverrideServices } from './getOverrideServices';
import { getCompletionProvider, getSuggestOptions } from './monaco-completion-provider';
import { language, languageConfiguration } from "./promql";

const options: monacoTypes.editor.IStandaloneEditorConstructionOptions = {
  codeLens: false,
  contextmenu: false,
  // we need `fixedOverflowWidgets` because otherwise in grafana-dashboards
  // the popup is clipped by the panel-visualizations.
  fixedOverflowWidgets: true,
  folding: false,
  fontSize: 14,
  lineDecorationsWidth: 8, // used as "padding-left"
  lineNumbers: 'off',
  minimap: { enabled: false },
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  padding: {
    // these numbers were picked so that visually this matches the previous version
    // of the query-editor the best
    top: 4,
    bottom: 5,
  },
  renderLineHighlight: 'none',
  scrollbar: {
    vertical: 'hidden',
    verticalScrollbarSize: 8, // used as "padding-right"
    horizontal: 'hidden',
    horizontalScrollbarSize: 0,
  },
  scrollBeyondLastLine: false,
  suggest: getSuggestOptions(),
  suggestFontSize: 12,
  wordWrap: 'on',
};

// this number was chosen by testing various values. it might be necessary
// because of the width of the border, not sure.
//it needs to do 2 things:
// 1. when the editor is single-line, it should make the editor height be visually correct
// 2. when the editor is multi-line, the editor should not be "scrollable" (meaning,
//    you do a scroll-movement in the editor, and it will scroll the content by a couple pixels
//    up & down. this we want to avoid)
const EDITOR_HEIGHT_OFFSET = 2;

const PROMQL_LANG_ID = promLanguageDefinition.id;

// we must only run the promql-setup code once
let PROMQL_SETUP_STARTED = false;

function ensurePromQL(monaco: Monaco) {
  if (!PROMQL_SETUP_STARTED) {
    PROMQL_SETUP_STARTED = true;
    const { aliases, extensions, mimetypes } = promLanguageDefinition;
    monaco.languages.register({ id: PROMQL_LANG_ID, aliases, extensions, mimetypes });

    // @ts-ignore
    monaco.languages.setMonarchTokensProvider(PROMQL_LANG_ID, language);
    // @ts-ignore
    monaco.languages.setLanguageConfiguration(PROMQL_LANG_ID, languageConfiguration);
  }
}

const getStyles = (theme: GrafanaTheme2, placeholder: string) => {
  return {
    container: css`
      border-radius: ${theme.shape.borderRadius()};
      border: 1px solid ${theme.components.input.borderColor};
    `,
    placeholder: css`
      ::after {
        content: '${placeholder}';
        font-family: ${theme.typography.fontFamilyMonospace};
        opacity: 0.3;
      }
    `,
  };
};

const MonacoQueryField = (props: Props) => {
  // we need only one instance of `overrideServices` during the lifetime of the react component
  const overrideServicesRef = useRef(getOverrideServices());
  const containerRef = useRef<HTMLDivElement>(null);
  const { languageProvider, history, onBlur, onRunQuery, initialValue, placeholder, readOnly } = props;

  const lpRef = useLatest(languageProvider);
  const historyRef = useLatest(history);
  const onRunQueryRef = useLatest(onRunQuery);
  const onBlurRef = useLatest(onBlur);

  const autocompleteDisposeFun = useRef<(() => void) | null>(null);

  const theme = useTheme2();
  const styles = getStyles(theme, placeholder);

  useEffect(() => {
    // when we unmount, we unregister the autocomplete-function, if it was registered
    return () => {
      autocompleteDisposeFun.current?.();
    };
  }, []);

  return (
    <div
      aria-label={selectors.components.QueryField.container}
      className={styles.container}
      // NOTE: we will be setting inline-style-width/height on this element
      ref={containerRef}
    >
      <ReactMonacoEditor
        overrideServices={overrideServicesRef.current}
        options={{
          ...options,
          readOnly
        }}
        language="promql"
        value={initialValue}
        beforeMount={(monaco) => {
          ensurePromQL(monaco);
        }}
        onMount={(editor, monaco) => {
          // we setup on-blur
          editor.onDidBlurEditorWidget(() => {
            onBlurRef.current(editor.getValue());
          });

          // we construct a DataProvider object
          const getSeries = (selector: string) => lpRef.current.getSeries(selector);

          const getHistory = () =>
            Promise.resolve(historyRef.current.map((h) => h.query.expr).filter((expr) => expr !== undefined));

          const getAllMetricNames = () => {
            const { metrics, metricsMetadata } = lpRef.current;
            const result = metrics.map((m) => {
              const metaItem = metricsMetadata?.[m];
              return {
                name: m,
                help: metaItem?.help ?? '',
                type: metaItem?.type ?? '',
              };
            });

            return Promise.resolve(result);
          };

          const getAllWithTemplates = () => {
            const { withTemplates } = lpRef.current;
            const result = withTemplates.map(t => ({
              name: t.label,
              help: t.comment || "",
              value: t.value
            }))

            return Promise.resolve(result);
          };

          const getAllLabelNames = () => Promise.resolve(lpRef.current.getLabelKeys());

          const getLabelValues = (labelName: string) => lpRef.current.getLabelValues(labelName);

          const dataProvider = {
            getSeries,
            getHistory,
            getAllMetricNames,
            getAllWithTemplates,
            getAllLabelNames,
            getLabelValues
          };
          const completionProvider = getCompletionProvider(monaco, dataProvider);

          // completion-providers in monaco are not registered directly to editor-instances,
          // they are registered to languages. this makes it hard for us to have
          // separate completion-providers for every query-field-instance
          // (but we need that, because they might connect to different datasources).
          // the trick we do is, we wrap the callback in a "proxy",
          // and in the proxy, the first thing is, we check if we are called from
          // "our editor instance", and if not, we just return nothing. if yes,
          // we call the completion-provider.
          const filteringCompletionProvider: monacoTypes.languages.CompletionItemProvider = {
            ...completionProvider,
            provideCompletionItems: (model, position, context, token) => {
              // if the model-id does not match, then this call is from a different editor-instance,
              // not "our instance", so return nothing
              if (editor.getModel()?.id !== model.id) {
                return { suggestions: [] };
              }
              return completionProvider.provideCompletionItems(model, position, context, token);
            },
          };

          const { dispose } = monaco.languages.registerCompletionItemProvider(
            PROMQL_LANG_ID,
            filteringCompletionProvider
          );

          autocompleteDisposeFun.current = dispose;
          // this code makes the editor resize itself so that the content fits
          // (it will grow taller when necessary)
          // FIXME: maybe move this functionality into CodeEditor, like:
          // <CodeEditor resizingMode="single-line"/>
          const updateElementHeight = () => {
            const containerDiv = containerRef.current;
            if (containerDiv !== null) {
              const pixelHeight = editor.getContentHeight();
              containerDiv.style.height = `${pixelHeight + EDITOR_HEIGHT_OFFSET}px`;
              containerDiv.style.width = '100%';
              const pixelWidth = containerDiv.clientWidth;
              editor.layout({ width: pixelWidth, height: pixelHeight });
            }
          };

          editor.onDidContentSizeChange(updateElementHeight);
          updateElementHeight();

          // handle: shift + enter
          editor.addAction({
            id: "execute-shift-enter",
            label: "Execute",
            keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
            run: () => onRunQueryRef.current(editor.getValue() || "")
          });

          /* Something in this configuration of monaco doesn't bubble up [mod]+K, which the
          command palette uses. Pass the event out of monaco manually
          */
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, function () {
            global.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          });

          if (placeholder) {
            const placeholderDecorators = [
              {
                range: new monaco.Range(1, 1, 1, 1),
                contents: [
                  { value: "**bold** _italics_ regular `code`" }
                ],
                options: {
                  className: styles.placeholder,
                  isWholeLine: true,
                },
              },
            ];

            let decorators: string[] = [];

            const checkDecorators: () => void = () => {
              const model = editor.getModel();

              if (!model) {
                return;
              }

              const newDecorators = model.getValueLength() === 0 ? placeholderDecorators : [];
              decorators = model.deltaDecorations(decorators, newDecorators);
            };

            checkDecorators();
            editor.onDidChangeModelContent(checkDecorators);
          }
        }}
      />
    </div>
  );
};

// we will lazy-load this module using React.lazy,
// and that only supports default-exports,
// so we have to default-export this, even if
// it is against the style-guidelines.

export default MonacoQueryField;
