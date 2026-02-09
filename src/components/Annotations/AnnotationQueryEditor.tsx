import React from "react";

import { AnnotationQuery } from "@grafana/data";
import { AutoSizeInput, LegacyForms } from "@grafana/ui";

const { Input } = LegacyForms;
import { PromQueryCodeEditor } from "../../querybuilder/components/PromQueryCodeEditor";
import { PromQuery } from "../../types";
import { EditorField, EditorRows, EditorRow, Space, EditorSwitch } from "../QueryEditor";
import { PromQueryEditorProps } from "../types";

type Props = PromQueryEditorProps & {
  annotation?: AnnotationQuery<PromQuery>;
  onAnnotationChange?: (annotation: AnnotationQuery<PromQuery>) => void;
};

export function AnnotationQueryEditor(props: Props) {
  // This is because of problematic typing. See AnnotationQueryEditorProps in grafana-data/annotations.ts.
  const annotation = props.annotation!;
  const onAnnotationChange = props.onAnnotationChange!;
  const query = { expr: annotation.expr, refId: annotation.name, interval: annotation.step };

  const handlerChangeAnnotation = (value: string, key: string) => {
    onAnnotationChange({
      ...annotation,
      [key]: value,
    });
  }

  return (
    <>
      <EditorRows>
        <PromQueryCodeEditor
          {...props}
          query={query}
          showExplain={false}
          onChange={(query) => handlerChangeAnnotation(query.expr, "expr")}
        />
      </EditorRows>
      <Space v={0.5} />
      <EditorRow>
        <EditorField
          label="Min step"
          tooltip={
            <>
              An additional lower limit for the step parameter of the Prometheus query and for the{" "}
              <code>$__interval</code> and <code>$__rate_interval</code> variables.
            </>
          }
        >
          <AutoSizeInput
            type="text"
            aria-label="Set lower limit for the step parameter"
            placeholder={"auto"}
            minWidth={10}
            defaultValue={query.interval}
            onCommitChange={(ev) => handlerChangeAnnotation(ev.currentTarget.value, "step")}
          />
        </EditorField>
        <EditorField
          label="Title"
          tooltip={
            "Use either the name or a pattern. For example, {{instance}} is replaced with label value for the label instance."
          }
        >
          <Input
            type="text"
            placeholder="{{alertname}}"
            value={annotation.titleFormat}
            onChange={(ev) => handlerChangeAnnotation(ev.currentTarget.value, "titleFormat")}
          />
        </EditorField>
        <EditorField label="Tags">
          <Input
            type="text"
            placeholder="label1,label2"
            value={annotation.tagKeys}
            onChange={(ev) => handlerChangeAnnotation(ev.currentTarget.value, "tagKeys")}
          />
        </EditorField>
        <EditorField
          label="Text"
          tooltip={
            "Use either the name or a pattern. For example, {{instance}} is replaced with label value for the label instance."
          }
        >
          <Input
            type="text"
            placeholder="{{instance}}"
            value={annotation.textFormat}
            onChange={(ev) => handlerChangeAnnotation(ev.currentTarget.value, "textFormat")}
          />
        </EditorField>
        <EditorField
          label="Series value as timestamp"
          tooltip={
            "The unit of timestamp is milliseconds. If the unit of the series value is seconds, multiply its range vector by 1000."
          }
        >
          <EditorSwitch
            checked={annotation.useValueForTime}
            onChange={(ev) => handlerChangeAnnotation(ev.currentTarget.value, "useValueForTime")}
          />
        </EditorField>
      </EditorRow>
    </>
  );
}
