import { createFunction } from '../../operations';
import { QueryBuilderOperationDef } from '../../shared/types';
import { PromOperationId } from '../../types';

const randFunctions = [
  PromOperationId.Rand,
  PromOperationId.RandExponential,
  PromOperationId.RandNormal,
]

export function getRandFunctions(): QueryBuilderOperationDef[] {
  return randFunctions.map(id => createFunction({
    id,
    params: [{ name: 'seed', type: 'number', optional: true }],
    defaultParams: [1],
    renderer: (model) => `${model.id}(${model.params[0] ?? ''})`
  }))
}
