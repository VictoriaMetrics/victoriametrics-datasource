import { createAggregationOverTime } from './aggregations';
import { LabelParamEditor } from './components/LabelParamEditor';
import { addOperationWithRangeVector, createFunction, operationTypeChangedHandlerForRangeFunction } from './operations';
import {
  createAggregationOperation,
  getRangeVectorParamDef,
  rangeRendererRightWithParams
} from './shared/operationUtils';
import { QueryBuilderOperation, QueryBuilderOperationDef } from './shared/types';
import { PromOperationId, PromVisualQueryOperationCategory } from './types';

// @ts-ignore
const timezones = Intl?.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];

export function getMetricsqlFunctions(): QueryBuilderOperationDef[] {
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
      PromOperationId.HistogramAvg,
      PromOperationId.HistogramStddev,
      PromOperationId.HistogramStdvar,
      PromOperationId.PrometheusBuckets,
    ].map(id => createAggregationOverTime(id)),

    ...[
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
    ].map(id => createFunction({ id })),

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
        { name: 'K-value', type: 'number' },
        { name: 'other_label=other_value', type: 'string', optional: true },
      ],
      defaultParams: [5, ''],
      renderer: (model: QueryBuilderOperation, def: QueryBuilderOperationDef, innerExpr: string) => {
        return `${model.id}(${model.params[0]}, ${innerExpr}, "${model.params[1]}")`;
      },
    })),

    ...[
      PromOperationId.Any,
      PromOperationId.Limitk,
      PromOperationId.Mad,
      PromOperationId.Median,
      PromOperationId.Mode,
      PromOperationId.Share,
      PromOperationId.Stdvar,
      PromOperationId.Sum2,
      PromOperationId.Zscore
    ].map(id => createAggregationOperation(id)).flat(),

    ...[
      PromOperationId.LabelDel,
      PromOperationId.LabelKeep,
      PromOperationId.LabelLowercase,
      PromOperationId.LabelUppercase,
      PromOperationId.SortByLabel,
      PromOperationId.SortByLabelDesc,
      PromOperationId.SortByLabelNumeric,
      PromOperationId.SortByLabelNumericDesc
    ].map(id => createFunction({
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
    })),

    ...[
      PromOperationId.End,
      PromOperationId.Now,
      PromOperationId.Start,
      PromOperationId.Step,
    ].map(id => createFunction({ id, renderer: (model) => `${model.id}()` })),

    ...[
      [PromOperationId.CountEqOverTime, 'eq'],
      [PromOperationId.CountGtOverTime, 'gt'],
      [PromOperationId.CountLeOverTime, 'le'],
      [PromOperationId.CountNeOverTime, 'ne'],
      [PromOperationId.DurationOverTime, 'max_interval'],
      [PromOperationId.ShareGtOverTime, 'gt'],
      [PromOperationId.ShareLeOverTime, 'le'],
      [PromOperationId.ShareEqOverTime, 'eq']
    ].map(id => createFunction({
      id: id[0],
      params: [getRangeVectorParamDef(), { name: id[1], type: 'number' }],
      defaultParams: ['$__interval', 60],
      alternativesKey: 'range function',
      category: PromVisualQueryOperationCategory.RangeFunctions,
      renderer: rangeRendererRightWithParams,
      addOperationHandler: addOperationWithRangeVector,
      changeTypeHandler: operationTypeChangedHandlerForRangeFunction,
    })),

    ...[
      PromOperationId.BitmapAnd,
      PromOperationId.BitmapOr,
      PromOperationId.BitmapXor,
    ].map(id => createFunction({
      id,
      params: [{ name: 'mask', type: 'number' }],
      defaultParams: [1],
    })),

    ...[
      PromOperationId.Rand,
      PromOperationId.RandExponential,
      PromOperationId.RandNormal
    ].map(id => createFunction({
      id,
      params: [{ name: 'seed', type: 'number', optional: true }],
      defaultParams: [1],
      renderer: (model) => `${model.id}(${model.params[0] ?? ''})`
    })),

    createFunction({
      id: PromOperationId.TimezoneOffset,
      params: [{ name: 'tz', type: 'string', options: timezones }],
      defaultParams: [''],
    }),

    createFunction({
      id: PromOperationId.LabelSet,
      params: [
        {
          name: 'Label',
          type: 'string',
          restParam: true,
          editor: LabelParamEditor,
        },
        {
          name: 'Value',
          type: 'string',
          restParam: true,
        }
      ],
      defaultParams: ['', ''],
      renderer: (model, def, innerExpr) => {
        return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
      },
    }),

    ...[
      PromOperationId.LabelCopy,
      PromOperationId.LabelMove
    ].map(id => createFunction({
      id: id,
      params: [
        {
          name: 'src_label',
          type: 'string',
          restParam: true,
          editor: LabelParamEditor,
        },
        {
          name: 'dst_label',
          type: 'string',
          restParam: true,
          editor: LabelParamEditor,
        }
      ],
      defaultParams: ['', ''],
      renderer: (model, def, innerExpr) => {
        return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
      },
    })),

    createFunction({
      id: PromOperationId.LabelMap,
      params: [
        {
          name: 'Label',
          type: 'string',
          editor: LabelParamEditor,
        },
        {
          name: 'src_value',
          type: 'string',
          restParam: true,
        },
        {
          name: 'dst_value',
          type: 'string',
          restParam: true,
        }
      ],
      defaultParams: ['', '', ''],
      renderer: (model, def, innerExpr) => {
        return `${model.id}(${innerExpr}, ${model.params.map(item => `"${item}"`).join(', ')})`;
      },
    })
  ];
}
