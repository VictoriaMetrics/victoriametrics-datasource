import { QueryBuilderOperationDef } from '../shared/types';

import { getAggregations } from "./aggregations/";
import { getBasicFunctions } from "./basic/";
import { getBitmapFunctions } from "./bitmap/";
import { getLabelFunctions } from "./label/";
import { getRandFunctions } from "./rand/";
import { getRangeFunctions } from "./range/";
import { getTimeFunctions } from "./time/";
import { getTopBottomKFunctions } from "./topbottomk/";

export function getMetricsqlFunctions(): QueryBuilderOperationDef[] {
  return [
    ...getAggregations(),
    ...getBasicFunctions(),
    ...getBitmapFunctions(),
    ...getLabelFunctions(),
    ...getRandFunctions(),
    ...getRangeFunctions(),
    ...getTimeFunctions(),
    ...getTopBottomKFunctions(),
  ];
}
