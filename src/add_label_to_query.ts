// Copyright (c) 2022 Grafana Labs
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

import { SyntaxNode } from '@lezer/common';
import { LabelMatcher, LabelMatchers, parser, VectorSelector } from 'lezer-metricsql';

import { splitWithHeader } from './components/WithTemplateConfig/utils/splitWithHeader';
import { getLabel } from './querybuilder/shared/parsingUtils';
import { QueryBuilderLabelFilter } from './querybuilder/shared/types';

/**
 * Adds label filter to existing query. Useful for query modification for example for ad hoc filters.
 *
 * It uses the MetricsQL parser to find the vector selectors and inserts the filter into the text of each of them.
 * Nothing is re-rendered, so the original formatting is preserved and constructs the grammar does not know
 * (WITH templates, bare template references like `{f}`) stay untouched.
 * @param query
 * @param key
 * @param value
 * @param operator
 */
export function addLabelToQuery(query: string, key: string, value: string | number, operator = '='): string {
  if (!key || !value) {
    throw new Error('Need label to add to query.');
  }

  // The grammar does not know WITH expressions: the header is kept as is and the filter is applied to the body.
  const { header, body } = splitWithHeader(query);
  const selectors = getVectorSelectors(body);
  if (!selectors.length) {
    return query;
  }

  const filter = toLabelFilter(key, value, operator);
  return header + addFilter(body, selectors, filter);
}

type VectorSelectorPosition = {
  from: number;
  to: number;
  /** Position of the `{...}` part of the selector, if it has one */
  labelMatchers?: { from: number; to: number };
  /** Existing label filters, used to avoid duplicates */
  labels: QueryBuilderLabelFilter[];
};

/**
 * Parse the string and get all VectorSelector positions in the query together with their existing label filters.
 * @param query
 */
function getVectorSelectors(query: string): VectorSelectorPosition[] {
  const tree = parser.parse(query);
  const positions: VectorSelectorPosition[] = [];
  tree.iterate({
    enter: ({ to, from, type, node }): false | void => {
      if (type.id === VectorSelector) {
        const labelMatchers = node.getChild(LabelMatchers);
        positions.push({
          from,
          to,
          labelMatchers: labelMatchers ? { from: labelMatchers.from, to: labelMatchers.to } : undefined,
          labels: labelMatchers ? getLabelFilters(query, labelMatchers) : [],
        });
        return false;
      }
    },
  });
  return positions;
}

/**
 * Label filters of a `{...}` node. A bare template reference like `{f}` has no operator and value.
 */
function getLabelFilters(query: string, labelMatchers: SyntaxNode): QueryBuilderLabelFilter[] {
  const filters: QueryBuilderLabelFilter[] = [];
  const cursor = labelMatchers.cursor();
  while (cursor.next() && cursor.from < labelMatchers.to) {
    if (cursor.type.id === LabelMatcher) {
      filters.push(getLabel(query, cursor.node));
    }
  }
  return filters;
}

function toLabelFilter(key: string, value: string | number, operator: string): QueryBuilderLabelFilter {
  // We need to make sure that we convert the value back to string because it may be a number
  const transformedValue = value === Infinity ? '+Inf' : value.toString();
  return { label: key, op: operator, value: transformedValue };
}

function addFilter(query: string, selectors: VectorSelectorPosition[], filter: QueryBuilderLabelFilter): string {
  // This is basically just doing splice on a string for each matched vector selector.
  let newQuery = '';
  let prev = 0;
  for (const selector of selectors) {
    newQuery += query.substring(prev, selector.from) + addFilterToSelector(query, selector, filter);
    prev = selector.to;
  }
  return newQuery + query.substring(prev);
}

function addFilterToSelector(query: string, selector: VectorSelectorPosition, filter: QueryBuilderLabelFilter): string {
  const text = query.substring(selector.from, selector.to);
  if (labelExists(selector.labels, filter)) {
    // We don't want to add duplicate labels.
    return text;
  }
  const rendered = renderLabelFilter(filter);
  if (!selector.labelMatchers) {
    return text + `{${rendered}}`;
  }

  const open = selector.labelMatchers.from - selector.from;
  const close = selector.labelMatchers.to - selector.from - 1;
  if (text[close] !== '}') {
    // Unparseable matchers, leave the selector alone rather than corrupt it.
    return text;
  }

  // Insert before the closing brace, keeping the existing text of the matchers and its trailing whitespace.
  const [, existing, trailingSpace] = /^(.*?),?(\s*)$/s.exec(text.substring(open + 1, close))!;
  if (!existing.trim()) {
    return text.substring(0, open + 1) + rendered + trailingSpace + text.substring(close);
  }
  if (endsWithComment(existing)) {
    // Appended after a comment the filter would become part of it, so it goes first instead.
    return text.substring(0, open + 1) + rendered + ', ' + text.substring(open + 1);
  }
  return text.substring(0, open + 1) + existing + ', ' + rendered + trailingSpace + text.substring(close);
}

/** Whether the last line of the matchers text contains a `#` comment. A `#` inside quotes is a harmless false positive. */
function endsWithComment(matchers: string): boolean {
  return matchers.substring(matchers.lastIndexOf('\n') + 1).includes('#');
}

function renderLabelFilter({ label, op, value }: QueryBuilderLabelFilter): string {
  return `${label}${op}"${value}"`;
}

/**
 * Check if label exists in the list of labels but ignore the operator.
 * @param labels
 * @param filter
 */
function labelExists(labels: QueryBuilderLabelFilter[], filter: QueryBuilderLabelFilter) {
  return labels.find((label) => label.label === filter.label && label.value === filter.value);
}
