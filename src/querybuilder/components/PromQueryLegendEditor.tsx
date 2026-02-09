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

import React, { useRef } from "react";

import { SelectableValue } from "@grafana/data";
import { Select } from "@grafana/ui";

import { EditorField } from "../../components/QueryEditor";
import { AutoSizeInput } from "../../components/QueryEditor/AutoSizeInput";
import { LegendFormatMode } from "../../types";

export interface Props {
  legendFormat: string | undefined;
  onChange: (legendFormat: string) => void;
  onRunQuery: () => void;
}

const legendModeOptions = [
  {
    label: "Auto",
    value: LegendFormatMode.Auto,
    description: "Only includes unique labels",
  },
  { label: "Verbose", value: LegendFormatMode.Verbose, description: "All label names and values" },
  { label: "Custom", value: LegendFormatMode.Custom, description: "Provide a naming template" },
];

/**
 * Tests for this component are on the parent level (PromQueryBuilderOptions).
 */
export const PromQueryLegendEditor = React.memo<Props>(({ legendFormat, onChange, onRunQuery }) => {
  const mode = getLegendMode(legendFormat);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onLegendFormatChanged = (evt: React.FormEvent<HTMLInputElement>) => {
    let newFormat = evt.currentTarget.value;
    if (newFormat.length === 0) {
      newFormat = LegendFormatMode.Auto;
    }

    if (newFormat !== legendFormat) {
      onChange(newFormat);
      onRunQuery();
    }
  };

  const onLegendModeChanged = (value: SelectableValue<LegendFormatMode>) => {
    switch (value.value!) {
      case LegendFormatMode.Auto:
        onChange(LegendFormatMode.Auto);
        break;
      case LegendFormatMode.Custom:
        onChange("{{label_name}}");
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.setSelectionRange(2, 12, "forward");
        }, 10);
        break;
      case LegendFormatMode.Verbose:
        onChange("");
        break;
    }
    onRunQuery();
  };

  return (
    <EditorField
      label="Legend"
      tooltip="Series name override or template. Ex. {{hostname}} will be replaced with label value for hostname."
    >
      <>
        {mode === LegendFormatMode.Custom && (
          <AutoSizeInput
            id="legendFormat"
            minWidth={22}
            placeholder="auto"
            defaultValue={legendFormat}
            onCommitChange={onLegendFormatChanged}
            ref={inputRef}
          />
        )}
        {mode !== LegendFormatMode.Custom && (
          <Select
            inputId="legend.mode"
            isSearchable={false}
            placeholder="Select legend mode"
            options={legendModeOptions}
            width={22}
            onChange={onLegendModeChanged}
            value={legendModeOptions.find((x) => x.value === mode)}
          />
        )}
      </>
    </EditorField>
  );
});

PromQueryLegendEditor.displayName = "PromQueryLegendEditor";

function getLegendMode(legendFormat: string | undefined) {
  // This special value means the new smart minimal series naming
  if (legendFormat === LegendFormatMode.Auto) {
    return LegendFormatMode.Auto;
  }

  // Missing or empty legend format is the old verbose behavior
  if (legendFormat == null || legendFormat === "") {
    return LegendFormatMode.Verbose;
  }

  return LegendFormatMode.Custom;
}

export function getLegendModeLabel(legendFormat: string | undefined) {
  const mode = getLegendMode(legendFormat);
  if (mode !== LegendFormatMode.Custom) {
    return legendModeOptions.find((x) => x.value === mode)?.label;
  }
  return legendFormat;
}
