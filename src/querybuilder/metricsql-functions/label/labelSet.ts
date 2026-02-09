import { LabelParamEditor } from '../../components/LabelParamEditor';
import { createFunction } from '../../operations';
import { PromOperationId } from '../../types';

export function getLabelSet() {
  return createFunction({
    id: PromOperationId.LabelSet,
    params: [
      {
        name: 'Label',
        type: 'string',
        restParam: true,
        editor: LabelParamEditor,
      },
      {
        name: 'Value',
        type: 'string',
        restParam: true,
      }
    ],
    defaultParams: ['', ''],
    renderer: (model, def, innerExpr) => {
      return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
    },
  })
}
