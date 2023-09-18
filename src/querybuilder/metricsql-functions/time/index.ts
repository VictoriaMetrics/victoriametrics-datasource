import { QueryBuilderOperationDef } from "../../shared/types";

import { getSimpleTimeFunctions } from "./time";
import { getTimezoneOffset } from "./timezoneOffset";

export function getTimeFunctions(): QueryBuilderOperationDef[] {
  return [
    ...getSimpleTimeFunctions(),
    getTimezoneOffset(),
  ]
}
