// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-11-23: change props for MonacoQueryFieldWrapper, optimizations imports
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

import { LanguageMap, languages as prismLanguages } from "prismjs";
import React, { ReactNode } from "react";
import { Plugin } from "slate";
import { Editor } from "slate-react";

import { isDataFrame, QueryEditorProps, QueryHint, TimeRange, toLegacyResponseData } from "@grafana/data";
import {
  BracesPlugin,
  Icon,
  SlatePrism,
} from "@grafana/ui";

import { PrometheusDatasource } from "../datasource";
import PromQlLanguageProvider from "../language_provider";
import { roundMsToMin } from "../language_utils";
import { PromOptions, PromQuery } from "../types";
import {
  CancelablePromise,
  isCancelablePromiseRejection,
  makePromiseCancelable,
} from "../utils/CancelablePromise";

import { LocalStorageValueProvider } from "./LocalStorageValueProvider";
import { PrometheusMetricsBrowser } from "./PrometheusMetricsBrowser";
import { MonacoQueryFieldWrapper } from "./monaco-query-field/MonacoQueryFieldWrapper";

const LAST_USED_LABELS_KEY = "grafana.datasources.prometheus.browser.labels";

function getChooserText(metricsLookupDisabled: boolean, hasSyntax: boolean, hasMetrics: boolean) {
  if (metricsLookupDisabled) {
    return "(Disabled)";
  }

  if (!hasSyntax) {
    return "Loading metrics...";
  }

  if (!hasMetrics) {
    return "(No metrics found)";
  }

  return "Metrics browser";
}

interface PromQueryFieldProps extends QueryEditorProps<PrometheusDatasource, PromQuery, PromOptions> {
  ExtraFieldElement?: ReactNode;
  "data-testid"?: string;
}

interface PromQueryFieldState {
  labelBrowserVisible: boolean;
  syntaxLoaded: boolean;
  hint: QueryHint | null;
  hasMetrics: boolean;
}

class PromQueryField extends React.PureComponent<PromQueryFieldProps, PromQueryFieldState> {
  // @ts-ignore
  plugins: Array<Plugin<Editor>>;
  declare languageProviderInitializationPromise: CancelablePromise<any>;

  constructor(props: PromQueryFieldProps, context: React.Context<any>) {
    super(props, context);

    this.plugins = [
      // @ts-ignore
      BracesPlugin(),
      // @ts-ignore
      SlatePrism(
        {
          onlyIn: (node: any) => node.type === "code_block",
          getSyntax: () => "promql",
        },
        { ...(prismLanguages as LanguageMap), promql: this.props.datasource.languageProvider.syntax }
      ),
    ];

    this.state = {
      labelBrowserVisible: false,
      syntaxLoaded: false,
      hint: null,
      hasMetrics: false,
    };
  }

  componentDidMount() {
    if (this.props.datasource.languageProvider) {
      this.refreshMetrics();
    }
    this.refreshHint();
  }

  componentWillUnmount() {
    if (this.languageProviderInitializationPromise) {
      this.languageProviderInitializationPromise.cancel();
    }
  }

  componentDidUpdate(prevProps: PromQueryFieldProps) {
    const {
      data,
      datasource: { languageProvider },
      range,
    } = this.props;

    if (languageProvider !== prevProps.datasource.languageProvider) {
      // We reset this only on DS change so we do not flesh loading state on every rangeChange which happens on every
      // query run if using relative range.
      this.setState({ syntaxLoaded: false });
    }

    const changedRangeToRefresh = this.rangeChangedToRefresh(range, prevProps.range);
    // We want to refresh metrics when language provider changes and/or when range changes (we round up intervals to a minute)
    if (languageProvider !== prevProps.datasource.languageProvider || changedRangeToRefresh) {
      this.refreshMetrics();
    }

    if (data && prevProps.data && prevProps.data.series !== data.series) {
      this.refreshHint();
    }
  }

  refreshHint = () => {
    const { datasource, query, data } = this.props;
    const initHints = datasource.getInitHints();
    const initHint = initHints.length > 0 ? initHints[0] : null;

    if (!data || data.series.length === 0) {
      this.setState({ hint: initHint });
      return;
    }

    const result = isDataFrame(data.series[0]) ? data.series.map(toLegacyResponseData) : data.series;
    const queryHints = datasource.getQueryHints(query, result);
    let queryHint = queryHints.length > 0 ? queryHints[0] : null;

    this.setState({ hint: queryHint ?? initHint });
  };

  refreshMetrics = async () => {
    const {
      datasource: { languageProvider },
    } = this.props;

    this.languageProviderInitializationPromise = makePromiseCancelable(languageProvider.start());

    try {
      const remainingTasks = await this.languageProviderInitializationPromise.promise;
      await Promise.all(remainingTasks);
      this.onUpdateLanguage(languageProvider);
    } catch (err) {
      if (isCancelablePromiseRejection(err) && err.isCanceled) {
        // do nothing, promise was canceled
      } else {
        throw err;
      }
    }
  };

  rangeChangedToRefresh(range?: TimeRange, prevRange?: TimeRange): boolean {
    if (range && prevRange) {
      const sameMinuteFrom = roundMsToMin(range.from.valueOf()) === roundMsToMin(prevRange.from.valueOf());
      const sameMinuteTo = roundMsToMin(range.to.valueOf()) === roundMsToMin(prevRange.to.valueOf());
      // If both are same, don't need to refresh.
      return !(sameMinuteFrom && sameMinuteTo);
    }
    return false;
  }

  /**
   * TODO #33976: Remove this, add histogram group (query = `histogram_quantile(0.95, sum(rate(${metric}[5m])) by (le))`;)
   */
  onChangeLabelBrowser = (selector: string) => {
    this.onChangeQuery(selector, true);
    this.setState({ labelBrowserVisible: false });
  };

  onChangeQuery = (value: string, override?: boolean) => {
    // Send text change to parent
    const { query, onChange, onRunQuery } = this.props;
    if (onChange) {
      const nextQuery: PromQuery = { ...query, expr: value };
      onChange(nextQuery);

      if (override && onRunQuery) {
        onRunQuery();
      }
    }
  };

  onClickChooserButton = () => {
    this.setState((state) => ({ labelBrowserVisible: !state.labelBrowserVisible }));
  };

  onClickHintFix = () => {
    const { datasource, query, onChange, onRunQuery } = this.props;
    const { hint } = this.state;
    if (hint?.fix?.action) {
      onChange(datasource.modifyQuery(query, hint.fix.action));
    }
    onRunQuery();
  };

  onUpdateLanguage = (languageProvider: PromQlLanguageProvider) => {
    const { metrics } = languageProvider;

    if (!metrics) {
      return;
    }
    this.setState({
      syntaxLoaded: true,
      hasMetrics: metrics.length > 0
    })
  };

  render() {
    const {
      datasource,
      query,
      ExtraFieldElement,
      history = [],
    } = this.props;
    const { labelBrowserVisible, syntaxLoaded, hint, hasMetrics } = this.state;
    const chooserText = getChooserText(datasource.lookupsDisabled, syntaxLoaded, hasMetrics);
    const buttonDisabled = !(syntaxLoaded && hasMetrics);

    return (
      <LocalStorageValueProvider<string[]> storageKey={LAST_USED_LABELS_KEY} defaultValue={[]}>
        {(lastUsedLabels, onLastUsedLabelsSave, onLastUsedLabelsDelete) => {
          return (
            <>
              <div
                className="gf-form-inline gf-form-inline--xs-view-flex-column flex-grow-1"
                data-testid={this.props["data-testid"]}
              >
                <button
                  className="gf-form-label query-keyword pointer"
                  onClick={this.onClickChooserButton}
                  disabled={buttonDisabled}
                  type="button"
                >
                  {chooserText}
                  <Icon name={labelBrowserVisible ? "angle-down" : "angle-right"} />
                </button>

                <div className="gf-form gf-form--grow flex-shrink-1 min-width-15">
                  <MonacoQueryFieldWrapper
                    runQueryOnBlur={false}
                    languageProvider={datasource.languageProvider}
                    history={history}
                    onChange={this.onChangeQuery}
                    onRunQuery={this.props.onRunQuery}
                    initialValue={query.expr ?? ""}
                    placeholder="Enter a MetricsQL query…"
                  />
                </div>
              </div>
              {labelBrowserVisible && (
                <div className="gf-form">
                  <PrometheusMetricsBrowser
                    languageProvider={datasource.languageProvider}
                    onChange={this.onChangeLabelBrowser}
                    lastUsedLabels={lastUsedLabels || []}
                    storeLastUsedLabels={onLastUsedLabelsSave}
                    deleteLastUsedLabels={onLastUsedLabelsDelete}
                  />
                </div>
              )}

              {ExtraFieldElement}
              {hint ? (
                <div className="query-row-break">
                  <div className="prom-query-field-info text-warning">
                    {hint.label}{" "}
                    {hint.fix ? (
                      <a className="text-link muted" onClick={this.onClickHintFix}>
                        {hint.fix.label}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          );
        }}
      </LocalStorageValueProvider>
    );
  }
}

export default PromQueryField;
