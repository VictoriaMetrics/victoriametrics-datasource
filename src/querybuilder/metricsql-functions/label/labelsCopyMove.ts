import { LabelParamEditor } from "../../components/LabelParamEditor";
import { createFunction } from "../../operations";
import { PromOperationId } from "../../types";

const copyMoveLabelFunctions = [
  PromOperationId.LabelCopy,
  PromOperationId.LabelMove
]

export function getCopyMoveLabelFunctions() {
  return copyMoveLabelFunctions.map(id => createFunction({
    id: id,
    params: [
      {
        name: 'src_label',
        type: 'string',
        restParam: true,
        editor: LabelParamEditor,
      },
      {
        name: 'dst_label',
        type: 'string',
        restParam: true,
        editor: LabelParamEditor,
      }
    ],
    defaultParams: ['', ''],
    renderer: (model, def, innerExpr) => {
      return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
    },
  }))
}
