// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-11: switch imports 'packages/grafana-ui/src' to 'components/QueryEditor'
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

import { css } from '@emotion/css';
import React, { ComponentType } from 'react';

import { GrafanaTheme2, SelectableValue, toOption } from '@grafana/data';
import { Button, Checkbox, Select, useStyles2 } from '@grafana/ui';

import { Stack } from '../../components/QueryEditor';
import { AutoSizeInput } from "../../components/QueryEditor/AutoSizeInput";

import { getOperationParamId } from './operationUtils';
import { QueryBuilderOperationParamDef, QueryBuilderOperationParamEditorProps } from './types';

export function getOperationParamEditor(
  paramDef: QueryBuilderOperationParamDef
): ComponentType<QueryBuilderOperationParamEditorProps> {
  if (paramDef.editor) {
    return paramDef.editor;
  }

  if (paramDef.options) {
    return SelectInputParamEditor;
  }

  switch (paramDef.type) {
    case 'boolean':
      return BoolInputParamEditor;
    case 'number':
    case 'string':
    default:
      return SimpleInputParamEditor;
  }
}

function SimpleInputParamEditor(props: QueryBuilderOperationParamEditorProps) {
  return (
    <AutoSizeInput
      id={getOperationParamId(props.operationIndex, props.index)}
      defaultValue={props.value?.toString()}
      minWidth={props.paramDef.minWidth}
      placeholder={props.paramDef.placeholder}
      title={props.paramDef.description}
      onCommitChange={(evt) => {
        props.onChange(props.index, evt.currentTarget.value);
        if (props.paramDef.runQueryOnEnter && evt.type === 'keydown') {
          props.onRunQuery();
        }
      }}
    />
  );
}

function BoolInputParamEditor(props: QueryBuilderOperationParamEditorProps) {
  return (
    <Checkbox
      id={getOperationParamId(props.operationIndex, props.index)}
      value={props.value as boolean}
      onChange={(evt) => props.onChange(props.index, evt.currentTarget.checked)}
    />
  );
}

function SelectInputParamEditor({
  paramDef,
  value,
  index,
  operationIndex,
  onChange,
}: QueryBuilderOperationParamEditorProps) {
  const styles = useStyles2(getStyles);
  let selectOptions = paramDef.options as Array<SelectableValue<any>>;

  if (!selectOptions[0]?.label) {
    selectOptions = paramDef.options!.map((option) => ({
      label: option.toString(),
      value: option as string,
    }));
  }

  let valueOption = selectOptions.find((x) => x.value === value) ?? toOption(value as string);

  // If we have optional options param and don't have value, we want to render button with which we add optional options.
  // This makes it easier to understand what needs to be selected and what is optional.
  if (!value && paramDef.optional) {
    return (
      <div className={styles.optionalParam}>
        <Button
          size="sm"
          variant="secondary"
          title={`Add ${paramDef.name}`}
          icon="plus"
          onClick={() => onChange(index, selectOptions[0].value)}
        >
          {paramDef.name}
        </Button>
      </div>
    );
  }

  return (
    <Stack gap={0.5} direction="row" alignItems="center" wrap={false}>
      <Select
        id={getOperationParamId(operationIndex, index)}
        value={valueOption}
        options={selectOptions}
        placeholder={paramDef.placeholder}
        allowCustomValue={true}
        onChange={(value) => onChange(index, value.value!)}
      />
      {paramDef.optional && (
        <Button
          data-testid={`operations.${index}.remove-param`}
          size="sm"
          fill="text"
          icon="times"
          variant="secondary"
          title={`Remove ${paramDef.name}`}
          aria-label={`Remove ${paramDef.name}`}
          onClick={() => onChange(index, '')}
        />
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    optionalParam: css({
      marginTop: theme.spacing(1),
    }),
  };
};
