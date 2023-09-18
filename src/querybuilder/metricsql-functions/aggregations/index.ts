import { QueryBuilderOperationDef } from "../../shared/types";

import { getOperationFunctions } from "./operations";
import { getOverTimeFunctions } from "./overTime";

export function getAggregations(): QueryBuilderOperationDef[] {
  return [
    ...getOverTimeFunctions(),
    ...getOperationFunctions(),
  ]
}
