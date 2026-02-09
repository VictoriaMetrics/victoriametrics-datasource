import { createAggregationOverTime } from "../../aggregations";
import { getRangeVectorParamDef } from "../../shared/operationUtils";
import { QueryBuilderOperation, QueryBuilderOperationDef } from "../../shared/types";
import { PromOperationId } from "../../types";

export function getOverTimeFunctions() {
  return [
    ...[
      PromOperationId.AscentOverTime,
      PromOperationId.ChangesPrometheus,
      PromOperationId.DecreasesOverTime,
      PromOperationId.DefaultRollup,
      PromOperationId.DeltaPrometheus,
      PromOperationId.DerivFast,
      PromOperationId.DescentOverTime,
      PromOperationId.DistinctOverTime,
      PromOperationId.FirstOverTime,
      PromOperationId.GeomeanOverTime,
      PromOperationId.HistogramOverTime,
      PromOperationId.Ideriv,
      PromOperationId.IncreasePrometheus,
      PromOperationId.IncreasePure,
      PromOperationId.IncreasesOverTime,
      PromOperationId.Integrate,
      PromOperationId.Lag,
      PromOperationId.Lifetime,
      PromOperationId.MadOverTime,
      PromOperationId.MedianOverTime,
      PromOperationId.ModeOverTime,
      PromOperationId.RangeOverTime,
      PromOperationId.RateOverSum,
      PromOperationId.Rollup,
      PromOperationId.RollupCandlestick,
      PromOperationId.RollupDelta,
      PromOperationId.RollupDeriv,
      PromOperationId.RollupIncrease
    ].map(id => createAggregationOverTime(id)),

    createAggregationOverTime(
      PromOperationId.RollupRate,
      {
        params: [getRangeVectorParamDef(), {
          name: "Rollup",
          type: "string",
          optional: true,
          options: [
            { label: "min", value: "min" },
            { label: "max", value: "max" },
            { label: "avg", value: "avg" },
          ],
        }],
        defaultParams: ["$__interval", ""],
        renderer: rollupRateRenderer
      }
    ),

    ...[
      PromOperationId.RollupScrapeInterval,
      PromOperationId.ScrapeInterval,
      PromOperationId.StaleSamplesOverTime,
      PromOperationId.StdvarOverTime,
      PromOperationId.Sum2OverTime,
      PromOperationId.TimestampWithName,
      PromOperationId.TfirstOverTime,
      PromOperationId.TlastChangeOverTime,
      PromOperationId.TlastOverTime,
      PromOperationId.TmaxOverTime,
      PromOperationId.TminOverTime,
      PromOperationId.ZscoreOverTime,
      PromOperationId.HistogramAvg,
      PromOperationId.HistogramStddev,
      PromOperationId.HistogramStdvar,
      PromOperationId.PrometheusBuckets,
    ].map(id => createAggregationOverTime(id)),
  ]
}

export const overTimeFunctionNames = getOverTimeFunctions().map(({ id }) => id);

function rollupRateRenderer(
  model: QueryBuilderOperation,
  def: QueryBuilderOperationDef,
  innerExpr: string
) {
  let rangeVector = model.params?.[0] ?? "$__interval";
  const args = [`${innerExpr}[${rangeVector}]`];
  const rollupParam = model.params?.[1];
  if (rollupParam) {
    args.push(`"${rollupParam}"`);
  }
  return `${def.id}(${args.join(", ")})`;
}
