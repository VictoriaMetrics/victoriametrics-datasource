import { QueryBuilderOperationDef } from "../../shared/types";

import { getLabelMap } from "./labelMap";
import { getLabelSet } from "./labelSet";
import { getBaseLabelFunctions } from "./labelsBasic";
import { getCopyMoveLabelFunctions } from "./labelsCopyMove";

export function getLabelFunctions(): QueryBuilderOperationDef[] {
  return [
    ...getCopyMoveLabelFunctions(),
    ...getBaseLabelFunctions(),
    getLabelMap(),
    getLabelSet(),
  ]
}
