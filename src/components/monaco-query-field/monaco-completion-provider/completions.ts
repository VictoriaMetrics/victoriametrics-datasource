// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-14: replace promql FUNCTIONS to metricsql
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

import { escapeLabelValueInExactSelector } from '../../../language_utils';
import { FUNCTIONS } from '../../../metricsql';

import type { Situation, Label } from './situation';
import { NeverCaseError } from './util';
// FIXME: we should not load this from the "outside", but we cannot do that while we have the "old" query-field too

export enum CompletionType {
  history = 'HISTORY',
  function = 'FUNCTION',
  metricName = 'METRIC_NAME',
  withTemplate = 'WITH_TEMPLATE',
  duration = 'DURATION',
  labelName = 'LABEL_NAME',
  labelValue = 'LABEL_VALUE',
}

type Completion = {
  type: CompletionType;
  label: string;
  insertText: string;
  detail?: string;
  documentation?: string;
  triggerOnInsert?: boolean;
};

type Metric = {
  name: string;
  help: string;
  type: string;
};

type WithTemplate = {
  name: string;
  help: string;
  value: string;
};

export type DataProvider = {
  getHistory: () => Promise<string[]>;
  getAllMetricNames: () => Promise<Metric[]>;
  getAllWithTemplates: () => Promise<WithTemplate[]>;
  getAllLabelNames: () => Promise<string[]>;
  getLabelValues: (labelName: string) => Promise<string[]>;
  getSeries: (selector: string) => Promise<Record<string, string[]>>;
};

// we order items like: history, functions, metrics

async function getAllMetricNamesCompletions(dataProvider: DataProvider): Promise<Completion[]> {
  const metrics = await dataProvider.getAllMetricNames();
  return metrics.map((metric) => ({
    type: CompletionType.metricName,
    label: metric.name,
    insertText: metric.name,
    detail: `${metric.name} : ${metric.type}`,
    documentation: metric.help,
  }));
}

async function getAllWithTemplatesCompletions(dataProvider: DataProvider): Promise<Completion[]> {
  const metrics = await dataProvider.getAllWithTemplates();
  return metrics.map((metric) => ({
    type: CompletionType.withTemplate,
    label: metric.name,
    insertText: metric.name,
    detail: metric.value,
    documentation: metric.help,
  }));
}

const FUNCTION_COMPLETIONS: Completion[] = FUNCTIONS.map((f) => ({
  type: CompletionType.function,
  label: f.label,
  insertText: f.insertText ?? '', // i don't know what to do when this is nullish. it should not be.
  detail: f.detail,
  documentation: f.documentation,
}));

async function getAllFunctionsAndMetricNamesCompletions(dataProvider: DataProvider): Promise<Completion[]> {
  const metricNames = await getAllMetricNamesCompletions(dataProvider);
  const withTemplates = await getAllWithTemplatesCompletions(dataProvider);
  return [...FUNCTION_COMPLETIONS, ...metricNames, ...withTemplates];
}

const DURATION_COMPLETIONS: Completion[] = [
  '$__interval',
  '$__range',
  '$__rate_interval',
  '1m',
  '5m',
  '10m',
  '30m',
  '1h',
  '1d',
].map((text) => ({
  type: CompletionType.duration,
  label: text,
  insertText: text,
}));

async function getAllHistoryCompletions(dataProvider: DataProvider): Promise<Completion[]> {
  // function getAllHistoryCompletions(queryHistory: PromHistoryItem[]): Completion[] {
  // NOTE: the typescript types are wrong. historyItem.query.expr can be undefined
  const allHistory = await dataProvider.getHistory();
  // FIXME: find a better history-limit
  return allHistory.slice(0, 10).map((expr) => ({
    type: CompletionType.history,
    label: expr,
    insertText: expr,
  }));
}

function makeSelector(metricName: string | undefined, labels: Label[]): string {
  const allLabels = [...labels];

  // we transform the metricName to a label, if it exists
  if (metricName !== undefined) {
    allLabels.push({ name: '__name__', value: metricName, op: '=' });
  }

  const allLabelTexts = allLabels.map(
    (label) => `${label.name}${label.op}"${escapeLabelValueInExactSelector(label.value)}"`
  );

  return `{${allLabelTexts.join(',')}}`;
}

async function getLabelNames(
  metric: string | undefined,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<string[]> {
  if (metric === undefined && otherLabels.length === 0) {
    // if there is no filtering, we have to use a special endpoint
    return dataProvider.getAllLabelNames();
  } else {
    const selector = makeSelector(metric, otherLabels);
    const data = await dataProvider.getSeries(selector);
    const possibleLabelNames = Object.keys(data); // all names from prometheus
    const usedLabelNames = new Set(otherLabels.map((l) => l.name)); // names used in the query
    return possibleLabelNames.filter((l) => !usedLabelNames.has(l));
  }
}

async function getLabelNamesForCompletions(
  metric: string | undefined,
  suffix: string,
  triggerOnInsert: boolean,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<Completion[]> {
  const labelNames = await getLabelNames(metric, otherLabels, dataProvider);
  const labelNamesCompletion: Completion[] = labelNames.map((text) => ({
    type: CompletionType.labelName,
    label: text,
    insertText: `${text}${suffix}`,
    triggerOnInsert,
  }))
  const withTemplatesCompletions = await getAllWithTemplatesCompletions(dataProvider);
  const withTemplatesCompletionsLabels = withTemplatesCompletions.filter((c) => {
    const regexp = new RegExp(`${c.label}\\s?=\\s?`, 'gm')
    return c.detail?.replace(regexp, '').charAt(0) === '{'
  })
  return labelNamesCompletion.concat(withTemplatesCompletionsLabels)
}

async function getLabelNamesForSelectorCompletions(
  metric: string | undefined,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<Completion[]> {
  return getLabelNamesForCompletions(metric, '=', true, otherLabels, dataProvider);
}
async function getLabelNamesForByCompletions(
  metric: string | undefined,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<Completion[]> {
  return getLabelNamesForCompletions(metric, '', false, otherLabels, dataProvider);
}

async function getLabelValues(
  metric: string | undefined,
  labelName: string,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<string[]> {
  if (metric === undefined && otherLabels.length === 0) {
    // if there is no filtering, we have to use a special endpoint
    return dataProvider.getLabelValues(labelName);
  } else {
    const selector = makeSelector(metric, otherLabels);
    const data = await dataProvider.getSeries(selector);
    return data[labelName] ?? [];
  }
}

async function getLabelValuesForMetricCompletions(
  metric: string | undefined,
  labelName: string,
  betweenQuotes: boolean,
  otherLabels: Label[],
  dataProvider: DataProvider
): Promise<Completion[]> {
  const values = await getLabelValues(metric, labelName, otherLabels, dataProvider);
  return values.map((text) => ({
    type: CompletionType.labelValue,
    label: text,
    insertText: betweenQuotes ? text : `"${text}"`, // FIXME: escaping strange characters?
  }));
}

export async function getCompletions(situation: Situation, dataProvider: DataProvider): Promise<Completion[]> {
  switch (situation.type) {
    case 'IN_DURATION':
      return DURATION_COMPLETIONS;
    case 'IN_FUNCTION':
      return getAllFunctionsAndMetricNamesCompletions(dataProvider);
    case 'AT_ROOT': {
      return getAllFunctionsAndMetricNamesCompletions(dataProvider);
    }
    case 'EMPTY': {
      const metricNames = await getAllMetricNamesCompletions(dataProvider);
      const historyCompletions = await getAllHistoryCompletions(dataProvider);
      return [...historyCompletions, ...FUNCTION_COMPLETIONS, ...metricNames];
    }
    case 'IN_LABEL_SELECTOR_NO_LABEL_NAME':
      return getLabelNamesForSelectorCompletions(situation.metricName, situation.otherLabels, dataProvider);
    case 'IN_GROUPING':
      return getLabelNamesForByCompletions(situation.metricName, situation.otherLabels, dataProvider);
    case 'IN_LABEL_SELECTOR_WITH_LABEL_NAME':
      return getLabelValuesForMetricCompletions(
        situation.metricName,
        situation.labelName,
        situation.betweenQuotes,
        situation.otherLabels,
        dataProvider
      );
    default:
      throw new NeverCaseError();
  }
}
