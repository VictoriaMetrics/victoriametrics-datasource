import { styleTags, tags } from "@lezer/highlight";

const functions = [
  'Abs', 'Absent', 'AbsentOverTime', 'Acos', 'Acosh', 'Asin', 'Asinh', 'Atan', 'Atanh', 'AvgOverTime', 'Ceil',
  'Changes', 'Clamp', 'ClampMax', 'ClampMin', 'Cos', 'Cosh', 'CountOverTime', 'DaysInMonth', 'DayOfMonth', 'DayOfWeek',
  'DayOfYear', 'Deg', 'Delta', 'Deriv', 'Exp', 'Floor', 'HistogramQuantile', 'HoltWinters', 'Hour', 'Idelta',
  'Increase', 'Irate', 'LabelReplace', 'LabelJoin', 'LastOverTime', 'Ln', 'Log10', 'Log2', 'MaxOverTime', 'MinOverTime',
  'Minute', 'Month', 'Pi', 'PredictLinear', 'PresentOverTime', 'QuantileOverTime', 'Rad', 'Rate', 'Resets', 'Round',
  'Scalar', 'Sgn', 'Sin', 'Sinh', 'Sort', 'SortDesc', 'Sqrt', 'StddevOverTime', 'StdvarOverTime', 'SumOverTime', 'Tan',
  'Tanh', 'Time', 'Timestamp', 'Vector', 'Year'
];

const operatorKeywords = [
  'Avg', 'Bottomk', 'Count', 'Count_values', 'Group', 'Max', 'Min', 'Quantile', 'Stddev', 'Stdvar', 'Sum', 'Topk'
];

const modifiers = [
  'By', 'Without', 'Bool', 'On', 'Ignoring', 'GroupLeft', 'GroupRight', 'Offset', 'Start', 'End'
];

const logicOperators = ['And', 'Unless', 'Or'];

const operators = [
  'Sub', 'Add', 'Mul', 'Mod', 'Div', 'Atan2', 'Eql', 'Neq', 'Lte', 'Lss', 'Gte', 'Gtr', 'EqlRegex', 'EqlSingle',
  'NeqRegex', 'Pow', 'At'
];

export const metricsQLHighLight = styleTags({
  LineComment: tags.comment,
  LabelName: tags.labelName,
  StringLiteral: tags.string,
  NumberLiteral: tags.number,
  Duration: tags.number,
  [functions.join(' ')]: tags.function(tags.variableName),
  [operatorKeywords.join(' ')]: tags.operatorKeyword,
  [modifiers.join(' ')]: tags.modifier,
  [logicOperators.join(' ')]: tags.logicOperator,
  [operators.join(' ')]: tags.operator,
  UnaryOp: tags.arithmeticOperator,
  '( )': tags.paren,
  '[ ]': tags.squareBracket,
  '{ }': tags.brace,
  '⚠': tags.invalid,
});
