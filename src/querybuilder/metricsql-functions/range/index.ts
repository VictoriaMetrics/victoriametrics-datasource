import {
  addOperationWithRangeVector,
  createFunction,
  operationTypeChangedHandlerForRangeFunction
} from '../../operations';
import { getRangeVectorParamDef, rangeRendererRightWithParams } from '../../shared/operationUtils';
import { QueryBuilderOperationDef } from '../../shared/types';
import { PromOperationId, PromVisualQueryOperationCategory } from '../../types';

const rangeFunctions = [
  // [id, param_name]
  [PromOperationId.CountEqOverTime, 'eq'],
  [PromOperationId.CountGtOverTime, 'gt'],
  [PromOperationId.CountLeOverTime, 'le'],
  [PromOperationId.CountNeOverTime, 'ne'],
  [PromOperationId.DurationOverTime, 'max_interval'],
  [PromOperationId.ShareGtOverTime, 'gt'],
  [PromOperationId.ShareLeOverTime, 'le'],
  [PromOperationId.ShareEqOverTime, 'eq']
]

export function getRangeFunctions(): QueryBuilderOperationDef[] {
  return rangeFunctions.map(id => createFunction({
    id: id[0],
    params: [getRangeVectorParamDef(), { name: id[1], type: 'number' }],
    defaultParams: ['$__interval', 60],
    alternativesKey: 'range function',
    category: PromVisualQueryOperationCategory.RangeFunctions,
    renderer: rangeRendererRightWithParams,
    addOperationHandler: addOperationWithRangeVector,
    changeTypeHandler: operationTypeChangedHandlerForRangeFunction,
  }))
}
