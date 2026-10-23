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

import { SyntaxNode, Tree } from '@lezer/common';
import {
  LabelMatcher,
  LabelMatchers,
  LabelMatchList,
  LabelName,
  MetricIdentifier,
  parser,
  VectorSelector,
  WithArgName,
  WithArgParam,
} from 'lezer-metricsql';

import { getLabel } from './querybuilder/shared/parsingUtils';
import { QueryBuilderLabelFilter } from './querybuilder/shared/types';

type Edit = { at: number; text: string };

/**
 * Adds label filter to existing query. Useful for query modification for example for ad hoc filters.
 *
 * The parser gives an honest tree (including WITH templates and `or`-separated matchers), so the query text is
 * edited in place: every filter is inserted at a position taken from the tree and nothing is re-rendered. This keeps
 * the structure and whitespace of the query and works even for invalid queries.
 *
 * The value is inserted verbatim, callers are responsible for escaping it for a string literal.
 * @param query
 * @param key
 * @param value
 * @param operator
 */
export function addLabelToQuery(query: string, key: string, value: string | number, operator = '='): string {
  if (!key || !value) {
    throw new Error('Need label to add to query.');
  }

  const filter = toLabelFilter(key, value, operator);
  const rendered = renderLabelFilter(filter);
  const tree = parser.parse(query);
  const templateNames = collectTemplateNames(tree, query);

  const edits: Edit[] = [];
  tree.iterate({
    enter: ({ type, node }): false | void => {
      if (type.id !== VectorSelector) {
        return;
      }
      const metric = node.getChild(MetricIdentifier);
      // A template name or a template parameter looks like a metric but is not one.
      if (!metric || !templateNames.has(query.substring(metric.from, metric.to))) {
        edits.push(...getSelectorEdits(query, node, rendered, filter));
      }
      return false;
    },
  });

  return applyEdits(query, edits);
}

function toLabelFilter(key: string, value: string | number, operator: string): QueryBuilderLabelFilter {
  // We need to make sure that we convert the value back to string because it may be a number
  const transformedValue = value === Infinity ? '+Inf' : value.toString();
  return { label: key, op: operator, value: transformedValue };
}

function renderLabelFilter({ label, op, value }: QueryBuilderLabelFilter): string {
  return `${label}${op}"${value}"`;
}

/**
 * Names of WITH templates and their parameters anywhere in the query. Scoping is not tracked on purpose: a real
 * metric named like a template of another scope will not get the filter.
 */
function collectTemplateNames(tree: Tree, query: string): Set<string> {
  const names = new Set<string>();
  tree.iterate({
    enter: ({ type, from, to }) => {
      if (type.id === WithArgName || type.id === WithArgParam) {
        names.add(query.substring(from, to));
      }
    },
  });
  return names;
}

/**
 * Get the edits that add the filter to a single vector selector: one per `or` alternative that does not have the
 * filter yet.
 */
function getSelectorEdits(query: string, selector: SyntaxNode, rendered: string, filter: QueryBuilderLabelFilter): Edit[] {
  const matchers = selector.getChild(LabelMatchers);
  if (!matchers) {
    return [{ at: selector.to, text: `{${rendered}}` }];
  }

  const groups = matchers.getChildren(LabelMatchList);
  if (!groups.length) {
    // Empty braces: `{}`
    return [{ at: matchers.from + 1, text: rendered }];
  }

  // The group ends with its last matcher, so the filter lands before a trailing comma, `or`, comment or whitespace.
  return groups
    .filter((group) => !labelExists(query, group, filter))
    .map((group) => ({ at: getGroupInsertPosition(group), text: `, ${rendered}` }));
}

/**
 * LabelMatchList is left-recursive: LabelMatchList > [LabelMatchList, ",", LabelMatcher].
 */
function getGroupInsertPosition(group: SyntaxNode): number {
  // A trailing comma can be recovered inside the group, so anchor on the last matcher instead of the group end.
  const matchers = getGroupMatchers(group);
  return matchers.length ? matchers[matchers.length - 1].to : group.to;
}

function getGroupMatchers(group: SyntaxNode): SyntaxNode[] {
  const matchers: SyntaxNode[] = [];
  for (let child = group.firstChild; child; child = child.nextSibling) {
    if (child.type.id === LabelMatcher) {
      matchers.push(child);
    } else if (child.type.id === LabelMatchList) {
      matchers.push(...getGroupMatchers(child));
    }
  }
  return matchers;
}

/**
 * Check if label exists in the group of matchers but ignore the operator.
 * @param query
 * @param group
 * @param filter
 */
function labelExists(query: string, group: SyntaxNode, filter: QueryBuilderLabelFilter): boolean {
  return getGroupMatchers(group).some((matcher) => {
    const existing = getLabel(query, matcher, LabelName);
    return existing.label === filter.label && existing.value === filter.value;
  });
}

// Edits are applied from the end to the start so earlier positions stay valid.
function applyEdits(query: string, edits: Edit[]): string {
  return [...edits]
    .sort((a, b) => b.at - a.at)
    .reduce((result, { at, text }) => result.slice(0, at) + text + result.slice(at), query);
}
