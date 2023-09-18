import { createAggregationOperation } from "../../shared/operationUtils";
import { PromOperationId } from "../../types";

const operationFunctions = [
  PromOperationId.Any,
  PromOperationId.Limitk,
  PromOperationId.Mad,
  PromOperationId.Median,
  PromOperationId.Mode,
  PromOperationId.Share,
  PromOperationId.Stdvar,
  PromOperationId.Sum2,
  PromOperationId.Zscore
]

export function getOperationFunctions () {
  return operationFunctions.map(id => createAggregationOperation(id)).flat()
}
