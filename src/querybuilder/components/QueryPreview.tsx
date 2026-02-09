// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-10: switch imports 'packages/grafana-ui/src' to 'components/QueryEditor'
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

import React from 'react';

import { EditorRow, EditorFieldGroup, EditorField } from '../../components/QueryEditor';
import { WithTemplate } from '../../components/WithTemplateConfig/types';
import { mergeTemplateWithQuery } from '../../components/WithTemplateConfig/utils/getArrayFromTemplate';
import metricsqlGrammar from '../../metricsql';
import { RawQuery } from '../shared/RawQuery';

export interface Props {
  query: string;
  withTemplate?: WithTemplate
}

export function QueryPreview({ query, withTemplate }: Props) {
  return (
    <EditorRow>
      <EditorFieldGroup>
        <EditorField label='Raw query'>
          <RawQuery
            query={mergeTemplateWithQuery(query, withTemplate)}
            lang={{ grammar: metricsqlGrammar, name: 'promql' }}
          />
        </EditorField>
      </EditorFieldGroup>
    </EditorRow>
  );
}
