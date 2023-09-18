import { LabelParamEditor } from "../../components/LabelParamEditor";
import { createFunction } from "../../operations";
import { PromOperationId } from "../../types";

const labelFunctions = [
  PromOperationId.LabelDel,
  PromOperationId.LabelKeep,
  PromOperationId.LabelLowercase,
  PromOperationId.LabelUppercase,
  PromOperationId.SortByLabel,
  PromOperationId.SortByLabelDesc,
  PromOperationId.SortByLabelNumeric,
  PromOperationId.SortByLabelNumericDesc
]

export function getBaseLabelFunctions () {
  return labelFunctions.map(id => createFunction({
    id: id,
    params: [
      {
        name: 'Label',
        type: 'string',
        restParam: true,
        optional: true,
        editor: LabelParamEditor,
      },
    ],
    defaultParams: [''],
    renderer: (model, def, innerExpr) => {
      return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
    },
    addOperationHandler: (def, query) => ({
      ...query,
      operations: [...query.operations, {
        id: def.id,
        params: def.defaultParams,
      }],
    }),
  }))
}
