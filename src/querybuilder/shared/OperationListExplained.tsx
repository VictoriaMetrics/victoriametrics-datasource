// Copyright (c) 2022 Grafana Labs
// A detailed history of changes can be seen this - https://github.com/VictoriaMetrics/grafana-datasource
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

import { Grammar } from 'prismjs';
import React from 'react';

import { OperationExplainedBox } from './OperationExplainedBox';
import { RawQuery } from './RawQuery';
import { QueryBuilderOperation, QueryWithOperations, VisualQueryModeller } from './types';

export interface Props<T extends QueryWithOperations> {
  query: T;
  queryModeller: VisualQueryModeller;
  explainMode?: boolean;
  stepNumber: number;
  lang: {
    grammar: Grammar;
    name: string;
  };
  onMouseEnter?: (op: QueryBuilderOperation, index: number) => void;
  onMouseLeave?: (op: QueryBuilderOperation, index: number) => void;
}

export function OperationListExplained<T extends QueryWithOperations>({
  query,
  queryModeller,
  stepNumber,
  lang,
  onMouseEnter,
  onMouseLeave,
}: Props<T>) {
  return (
    <>
      {query.operations.map((op, index) => {
        const def = queryModeller.getOperationDef(op.id);
        if (!def) {
          return `Operation ${op.id} not found`;
        }
        const title = def.renderer(op, def, '<expr>');
        const body = def.explainHandler ? def.explainHandler(op, def) : def.documentation ?? 'no docs';

        return (
          <div
            key={index}
            onMouseEnter={() => onMouseEnter?.(op, index)}
            onMouseLeave={() => onMouseLeave?.(op, index)}
          >
            <OperationExplainedBox
              stepNumber={index + stepNumber}
              title={<RawQuery query={title} lang={lang} />}
              markdown={body}
            />
          </div>
        );
      })}
    </>
  );
}
