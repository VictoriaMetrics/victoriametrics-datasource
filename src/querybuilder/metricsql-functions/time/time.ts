import { createFunction } from "../../operations";
import { PromOperationId } from "../../types";

const simpleTimeFunctions = [
  PromOperationId.End,
  PromOperationId.Now,
  PromOperationId.Start,
  PromOperationId.Step,
]

export function getSimpleTimeFunctions () {
  return simpleTimeFunctions.map(id => createFunction({
    id,
    renderer: (model) => `${model.id}()`
  }))
}
