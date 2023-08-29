import { MetricParamEditor } from "./components/MetricParamEditor";
import { createFunction, createRangeFunction } from "./operations";
import {
  createAggregationOperationWithParam,
  defaultAddOperationHandler,
  functionRendererLeft, renderParams
} from "./shared/operationUtils";
import { QueryBuilderOperation, QueryBuilderOperationDef } from "./shared/types";
import { PromOperationId, PromVisualQueryOperationCategory } from "./types";

// @ts-ignore
const timezones = Intl?.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [];

const toCapitalize = (id: string) => id.split("_").map(word =>
  word.charAt(0).toUpperCase() + word.slice(1)
).join(" ");

const functions = [
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
  PromOperationId.Any,
  PromOperationId.Distinct,
  PromOperationId.Geomean,
  PromOperationId.Histogram,
  PromOperationId.Mad,
  PromOperationId.Median,
  PromOperationId.Mode,
  PromOperationId.Share,
  PromOperationId.Stdvar,
  PromOperationId.Sum2,
  PromOperationId.Zscore
].map(id => createFunction({ id }));

const range = [
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
  PromOperationId.RollupIncrease,
  PromOperationId.RollupRate,
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
].map(id => createRangeFunction(id));

const transform = [
  PromOperationId.End,
  PromOperationId.Now,
  PromOperationId.Start,
  PromOperationId.Step,
].map(id => createFunction({ id, renderer: (model) => `${model.id}()` }));

const buckets = [
  PromOperationId.HistogramAvg,
  PromOperationId.HistogramStddev,
  PromOperationId.HistogramStdvar,
  PromOperationId.PrometheusBuckets
].map(id => ({
  id: id,
  name: toCapitalize(id),
  params: [],
  defaultParams: [],
  category: PromVisualQueryOperationCategory.Functions,
  renderer: functionRendererLeft,
  addOperationHandler: defaultAddOperationHandler,
}));

// @ts-ignore
const others = [
  ...createAggregationOperationWithParam(PromOperationId.RangeTrimOutliers, {
    params: [{ name: "K-value", type: "number" }],
    defaultParams: [5],
  }),
  ...createAggregationOperationWithParam(PromOperationId.Outliersk, {
    params: [{ name: "K-value", type: "number" }],
    defaultParams: [5],
  }),
  createFunction({
    id: PromOperationId.TimezoneOffset,
    params: [{ name: "tz", type: "string", options: timezones }],
    defaultParams: [""],
  }),
  createFunction({ id: PromOperationId.Ttf }),
  createFunction({
    id: PromOperationId.Ru,
    params: [
      {
        name: "free",
        type: "metric",
        editor: MetricParamEditor,
      },
      {
        name: "max",
        type: "metric",
        editor: MetricParamEditor,
      },
    ],
    defaultParams: ["", ""],
    renderer: (model: QueryBuilderOperation, def: QueryBuilderOperationDef) => {
      return `${model.id}(${renderParams(model, def)})`;
    },
  }),

  createFunction({
    id: PromOperationId.CountEqOverTime,
    params: [{ name: "eq", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.CountGtOverTime,
    params: [{ name: "gt", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.CountLeOverTime,
    params: [{ name: "le", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.CountNeOverTime,
    params: [{ name: "ne", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.DurationOverTime,
    params: [{ name: "max_interval", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.ShareGtOverTime,
    params: [{ name: "gt", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.ShareLeOverTime,
    params: [{ name: "le", type: "number" }],
    defaultParams: [1],
  }),
  createFunction({
    id: PromOperationId.ShareEqOverTime,
    params: [{ name: "eq", type: "number" }],
    defaultParams: [1],
  }),
  ...[
    PromOperationId.Rand,
    PromOperationId.RandExponential,
    PromOperationId.RandNormal
  ].map(id => (
    createFunction({
      id,
      params: [{ name: "seed", type: "number", optional: true }],
      defaultParams: [""],
    })
  )),
  ...[
    PromOperationId.BottomkAvg,
    PromOperationId.BottomkLast,
    PromOperationId.BottomkMax,
    PromOperationId.BottomkMedian,
    PromOperationId.BottomkMin,
    PromOperationId.TopkAvg,
    PromOperationId.TopkLast,
    PromOperationId.TopkMax,
    PromOperationId.TopkMedian,
    PromOperationId.TopkMin
  ].map(id => createFunction({
    id: id,
    params: [
      { name: "K-value", type: "number" },
      { name: "other_label=other_value", type: "string", optional: true },
    ],
    defaultParams: [5, ""],
    renderer: (model: QueryBuilderOperation, def: QueryBuilderOperationDef, innerExpr: string) => {
      return `${model.id}(${model.params[0]}, ${innerExpr}, "${model.params[1]}")`;
    },
  }))
];

export function getMetricsqlFunctions(): QueryBuilderOperationDef[] {
  return [
    ...range,
    ...transform,
    ...functions,
    ...buckets,
    ...others,
  ];
}
