import { addOperationWithRangeVector } from './operations';
import {
  createAggregationOperation,
  createAggregationOperationWithParam,
  getPromAndLokiOperationDisplayName,
  getRangeVectorParamDef,
} from './shared/operationUtils';
import { QueryBuilderOperation, QueryBuilderOperationDef } from './shared/types';
import { PromOperationId, PromVisualQueryOperationCategory } from './types';

export function getAggregationOperations(): QueryBuilderOperationDef[] {
  return [
    ...createAggregationOperation(PromOperationId.Sum),
    ...createAggregationOperation(PromOperationId.Avg),
    ...createAggregationOperation(PromOperationId.Min),
    ...createAggregationOperation(PromOperationId.Max),
    ...createAggregationOperation(PromOperationId.Count),
    ...createAggregationOperation(PromOperationId.Distinct),
    ...createAggregationOperation(PromOperationId.Geomean),
    ...createAggregationOperation(PromOperationId.Histogram),
    ...createAggregationOperationWithParam(PromOperationId.TopK, {
      params: [{ name: 'K-value', type: 'number' }],
      defaultParams: [5],
    }),
    ...createAggregationOperationWithParam(PromOperationId.BottomK, {
      params: [{ name: 'K-value', type: 'number' }],
      defaultParams: [5],
    }),
    ...createAggregationOperationWithParam(PromOperationId.CountValues, {
      params: [{ name: 'Identifier', type: 'string' }],
      defaultParams: ['count'],
    }),
    createAggregationOverTime(PromOperationId.SumOverTime),
    createAggregationOverTime(PromOperationId.AvgOverTime),
    createAggregationOverTime(PromOperationId.MinOverTime),
    createAggregationOverTime(PromOperationId.MaxOverTime),
    createAggregationOverTime(PromOperationId.CountOverTime),
    createAggregationOverTime(PromOperationId.LastOverTime),
    createAggregationOverTime(PromOperationId.PresentOverTime),
    createAggregationOverTime(PromOperationId.AbsentOverTime),
    createAggregationOverTime(PromOperationId.StddevOverTime),
  ];
}

export function createAggregationOverTime(
  name: string,
  override: Partial<QueryBuilderOperationDef> = {},
): QueryBuilderOperationDef {
  return {
    id: name,
    name: getPromAndLokiOperationDisplayName(name),
    params: [getRangeVectorParamDef()],
    defaultParams: ['$__interval'],
    alternativesKey: 'overtime function',
    category: PromVisualQueryOperationCategory.RangeFunctions,
    renderer: operationWithRangeVectorRenderer,
    addOperationHandler: addOperationWithRangeVector,
    ...override
  };
}

function operationWithRangeVectorRenderer(
  model: QueryBuilderOperation,
  def: QueryBuilderOperationDef,
  innerExpr: string
) {
  let rangeVector = (model.params ?? [])[0] ?? '$__interval';
  return `${def.id}(${innerExpr}[${rangeVector}])`;
}
