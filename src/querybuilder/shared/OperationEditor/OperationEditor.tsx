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

import { Draggable } from '@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-migration';
import { cx } from '@emotion/css';
import React from 'react';

import { DataSourceApi } from '@grafana/data';
import { Button, Icon, Tooltip, useStyles2 } from '@grafana/ui';

import { Stack } from '../../../components/QueryEditor';
import { OperationHeader } from '../OperationHeader';
import { getOperationParamEditor } from '../OperationParamEditor';
import { getOperationParamId } from '../operationUtils';
import {
  QueryBuilderOperation,
  QueryBuilderOperationParamValue,
  VisualQueryModeller,
} from '../types';

import callParamChangedThenOnChange from './callParamChangedThenOnChange';
import renderAddRestParamButton from './renderAddRestParamButton';
import getStyles from './style';
import useFlash from './useFlash';
export type OperationEditorStyles = ReturnType<typeof getStyles>;

export interface Props {
  operation: QueryBuilderOperation;
  index: number;
  query: any;
  datasource: DataSourceApi;
  queryModeller: VisualQueryModeller;
  onChange: (index: number, update: QueryBuilderOperation) => void;
  onRemove: (index: number) => void;
  onRunQuery: () => void;
  flash?: boolean;
  highlight?: boolean;
}

export function OperationEditor({
  operation,
  index,
  onRemove,
  onChange,
  onRunQuery,
  queryModeller,
  query,
  datasource,
  flash,
  highlight,
}: Props) {
  const styles = useStyles2(getStyles);
  const def = queryModeller.getOperationDef(operation.id);
  const shouldFlash = useFlash(flash);

  if (!def) {
    return <span>Operation {operation.id} not found</span>;
  }

  const onParamValueChanged = (paramIdx: number, value: QueryBuilderOperationParamValue) => {
    const update: QueryBuilderOperation = { ...operation, params: [...operation.params] };
    update.params[paramIdx] = value;
    callParamChangedThenOnChange(def, update, index, paramIdx, onChange);
  };

  const onAddRestParam = () => {
    const restParamsToAdd = def.params.filter(param => param.restParam).map(() => '');

    const update: QueryBuilderOperation = {
      ...operation,
      params: [...operation.params, ...restParamsToAdd]
    };
    callParamChangedThenOnChange(def, update, index, operation.params.length, onChange);
  };

  const onRemoveRestParam = (paramIdx: number) => {
    const update: QueryBuilderOperation = {
      ...operation,
      params: [...operation.params.slice(0, paramIdx), ...operation.params.slice(paramIdx + 1)],
    };
    callParamChangedThenOnChange(def, update, index, paramIdx, onChange);
  };

  const operationElements: React.ReactNode[] = [];

  for (let paramIndex = 0; paramIndex < operation.params.length; paramIndex++) {
    const restParamsCount = def.params.filter(param => param.restParam).length;
    const totalParamsCount = def.params.length;

    let paramDefIndex;
    if (paramIndex < totalParamsCount - restParamsCount) {
      paramDefIndex = paramIndex;
    } else {
      paramDefIndex = totalParamsCount - restParamsCount + (paramIndex - (totalParamsCount - restParamsCount)) % restParamsCount;
    }

    const paramDef = def.params[paramDefIndex];
    const Editor = getOperationParamEditor(paramDef);

    operationElements.push(
      <div
        className={styles.paramRow}
        key={`${paramIndex}-1`}
      >
        {!paramDef.hideName && (
          <div className={styles.paramName}>
            <label htmlFor={getOperationParamId(index, paramIndex)}>{paramDef.name}</label>
            {paramDef.description && (
              <Tooltip
                placement='top'
                content={paramDef.description}
                theme='info'
              >
                <Icon
                  name='info-circle'
                  size='sm'
                  className={styles.infoIcon}
                />
              </Tooltip>
            )}
          </div>
        )}
        <div className={styles.paramValue}>
          <Stack
            gap={0.5}
            direction='row'
            alignItems='center'
            wrap={false}
          >
            {/* @ts-ignore */}
            <Editor
              index={paramIndex}
              paramDef={paramDef}
              value={operation.params[paramIndex]}
              operation={operation}
              operationIndex={index}
              onChange={onParamValueChanged}
              onRunQuery={onRunQuery}
              query={query}
              datasource={datasource}
            />
            {paramDef.restParam && (operation.params.length > def.params.length || paramDef.optional) && (
              <Button
                data-testid={`operations.${index}.remove-rest-param`}
                size='sm'
                fill='text'
                icon='times'
                variant='secondary'
                title={`Remove ${paramDef.name}`}
                aria-label={`Remove ${paramDef.name}`}
                onClick={() => onRemoveRestParam(paramIndex)}
              />
            )}
          </Stack>
        </div>
      </div>
    );
  }

  // Handle adding button for rest params
  let restParam: React.ReactNode | undefined;
  if (def.params.length > 0) {
    const params = def.params.filter(p => p.restParam);
    if (params.length) {
      restParam = renderAddRestParamButton(params, onAddRestParam, index, operation.params.length, styles);
    }
  }

  return (
    <Draggable
      draggableId={`operation-${index}`}
      index={index}
    >
      {(provided) => (
        <div
          className={cx(styles.card, (shouldFlash || highlight) && styles.cardHighlight)}
          ref={provided.innerRef}
          {...provided.draggableProps}
          data-testid={`operations.${index}.wrapper`}
        >
          <OperationHeader
            operation={operation}
            dragHandleProps={provided.dragHandleProps}
            def={def}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
            queryModeller={queryModeller}
          />
          <div className={styles.body}>{operationElements}</div>
          {restParam}
          {index < query.operations.length - 1 && (
            <div className={styles.arrow}>
              <div className={styles.arrowLine} />
              <div className={styles.arrowArrow} />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

