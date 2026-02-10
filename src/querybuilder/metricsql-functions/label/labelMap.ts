import { LabelParamEditor } from '../../components/LabelParamEditor';
import { createFunction } from '../../operations';
import { PromOperationId } from '../../types';

export function getLabelMap() {
  return  createFunction({
    id: PromOperationId.LabelMap,
    params: [
      {
        name: 'Label',
        type: 'string',
        editor: LabelParamEditor,
      },
      {
        name: 'src_value',
        type: 'string',
        restParam: true,
      },
      {
        name: 'dst_value',
        type: 'string',
        restParam: true,
      }
    ],
    defaultParams: ['', '', ''],
    renderer: (model, def, innerExpr) => {
      return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
    },
  })
}
