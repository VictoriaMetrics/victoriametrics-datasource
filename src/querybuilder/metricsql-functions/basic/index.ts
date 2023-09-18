import { createFunction } from "../../operations";
import { QueryBuilderOperationDef } from "../../shared/types";
import { PromOperationId } from "../../types";

const basicFunctions = [
  PromOperationId.Abs,
  PromOperationId.Interpolate,
  PromOperationId.KeepLastValue,
  PromOperationId.KeepNextValue,
  PromOperationId.RangeAvg,
  PromOperationId.RangeFirst,
  PromOperationId.RangeLast,
  PromOperationId.RangeLinearRegression,
  PromOperationId.RangeMad,
  PromOperationId.RangeMax,
  PromOperationId.RangeMedian,
  PromOperationId.RangeMin,
  PromOperationId.RangeStddev,
  PromOperationId.RangeStdvar,
  PromOperationId.RangeSum,
  PromOperationId.RangeZscore,
  PromOperationId.RemoveResets,
  PromOperationId.RunningAvg,
  PromOperationId.RunningMax,
  PromOperationId.RunningMin,
  PromOperationId.RunningSum,
  PromOperationId.Distinct,
  PromOperationId.Geomean,
  PromOperationId.Histogram
]

export function getBasicFunctions(): QueryBuilderOperationDef[] {
  return basicFunctions.map(id => createFunction({ id }))
}
