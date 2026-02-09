import { createFunction } from '../../operations';
import { QueryBuilderOperationDef } from '../../shared/types';
import { PromOperationId } from '../../types';

const bitmapFunctions = [
  PromOperationId.BitmapAnd,
  PromOperationId.BitmapOr,
  PromOperationId.BitmapXor,
]

export function getBitmapFunctions(): QueryBuilderOperationDef[] {
  return bitmapFunctions.map(id => createFunction({
    id,
    params: [{ name: 'mask', type: 'number' }],
    defaultParams: [1],
  }))
}
