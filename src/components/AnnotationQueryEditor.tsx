// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: change imports components
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

import React from 'react';

import { AnnotationQuery } from '@grafana/data';
import { Input } from '@grafana/ui';

import { PromQueryCodeEditor } from '../querybuilder/components/PromQueryCodeEditor';
import { PromQuery } from '../types';

import { EditorField, EditorRow, EditorRows, EditorSwitch, Space } from './QueryEditor';
import { AutoSizeInput } from "./QueryEditor/AutoSizeInput";
import { PromQueryEditorProps } from './types';

type Props = PromQueryEditorProps & {
  annotation?: AnnotationQuery<PromQuery>;
  onAnnotationChange?: (annotation: AnnotationQuery<PromQuery>) => void;
};

export function AnnotationQueryEditor(props: Props) {
  // This is because of problematic typing. See AnnotationQueryEditorProps in grafana-data/annotations.ts.
  const annotation = props.annotation!;
  const onAnnotationChange = props.onAnnotationChange!;
  const query = { expr: annotation.expr, refId: annotation.name, interval: annotation.step };

  return (
    <>
      <EditorRows>
        <PromQueryCodeEditor
          {...props}
          query={query}
          showExplain={false}
          onChange={(query) => {
            onAnnotationChange({
              ...annotation,
              expr: query.expr,
            });
          }}
        />
        <EditorRow>
          <EditorField
            label="Min step"
            tooltip={
              <>
                An additional lower limit for the step parameter of the Prometheus query and for the{' '}
                <code>$__interval</code> and <code>$__rate_interval</code> variables.
              </>
            }
          >
            <AutoSizeInput
              type="text"
              aria-label="Set lower limit for the step parameter"
              placeholder={'auto'}
              minWidth={10}
              onCommitChange={(ev) => {
                onAnnotationChange({
                  ...annotation,
                  step: ev.currentTarget.value,
                });
              }}
              defaultValue={query.interval}
            />
          </EditorField>
        </EditorRow>
      </EditorRows>
      <Space v={0.5} />
      <EditorRow>
        <EditorField
          label="Title"
          tooltip={
            'Use either the name or a pattern. For example, {{instance}} is replaced with label value for the label instance.'
          }
        >
          <Input
            type="text"
            placeholder="{{alertname}}"
            value={annotation.titleFormat}
            onChange={(event) => {
              onAnnotationChange({
                ...annotation,
                titleFormat: event.currentTarget.value,
              });
            }}
          />
        </EditorField>
        <EditorField label="Tags">
          <Input
            type="text"
            placeholder="label1,label2"
            value={annotation.tagKeys}
            onChange={(event) => {
              onAnnotationChange({
                ...annotation,
                tagKeys: event.currentTarget.value,
              });
            }}
          />
        </EditorField>
        <EditorField
          label="Text"
          tooltip={
            'Use either the name or a pattern. For example, {{instance}} is replaced with label value for the label instance.'
          }
        >
          <Input
            type="text"
            placeholder="{{instance}}"
            value={annotation.textFormat}
            onChange={(event) => {
              onAnnotationChange({
                ...annotation,
                textFormat: event.currentTarget.value,
              });
            }}
          />
        </EditorField>
        <EditorField
          label="Series value as timestamp"
          tooltip={
            'The unit of timestamp is milliseconds. If the unit of the series value is seconds, multiply its range vector by 1000.'
          }
        >
          <EditorSwitch
            value={annotation.useValueForTime}
            onChange={(event) => {
              onAnnotationChange({
                ...annotation,
                useValueForTime: event.currentTarget.value,
              });
            }}
          />
        </EditorField>
      </EditorRow>
    </>
  );
}
