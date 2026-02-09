import { createFunction } from '../../operations';
import { QueryBuilderOperation, QueryBuilderOperationDef } from '../../shared/types';
import { PromOperationId } from '../../types';

const TopBottomKFunctions = [
  PromOperationId.BottomkAvg,
  PromOperationId.BottomkLast,
  PromOperationId.BottomkMax,
  PromOperationId.BottomkMedian,
  PromOperationId.BottomkMin,
  PromOperationId.TopkAvg,
  PromOperationId.TopkLast,
  PromOperationId.TopkMax,
  PromOperationId.TopkMedian,
  PromOperationId.TopkMin
]

export function getTopBottomKFunctions(): QueryBuilderOperationDef[] {
  return TopBottomKFunctions.map(id => createFunction({
    id: id,
    params: [
      { name: 'K-value', type: 'number' },
      { name: 'other_label=other_value', type: 'string', optional: true },
    ],
    defaultParams: [5, ''],
    renderer: (model: QueryBuilderOperation, def: QueryBuilderOperationDef, innerExpr: string) => {
      return `${model.id}(${model.params[0]}, ${innerExpr}, "${model.params[1]}")`;
    },
  }))
}
