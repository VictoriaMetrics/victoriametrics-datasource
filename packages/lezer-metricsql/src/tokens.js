import {
    And,
    Avg,
    Atan2,
    Bool,
    Bottomk,
    By,
    Count,
    CountValues,
    End,
    Group,
    GroupLeft,
    GroupRight,
    Ignoring,
    inf,
    Max,
    Min,
    nan,
    Offset,
    On,
    Or,
    Quantile,
    Start,
    Stddev,
    Stdvar,
    Sum,
    Topk,
    Unless,
    Without,
} from './parser.terms.js';

const keywordTokens = {
    inf: inf,
    nan: nan,
    bool: Bool,
    ignoring: Ignoring,
    on: On,
    group_left: GroupLeft,
    group_right: GroupRight,
    offset: Offset,
};

export const specializeIdentifier = (value) => {
    return keywordTokens[value.toLowerCase()] || -1;
};

const contextualKeywordTokens = {
    avg: Avg,
    atan2: Atan2,
    bottomk: Bottomk,
    count: Count,
    count_values: CountValues,
    group: Group,
    max: Max,
    min: Min,
    quantile: Quantile,
    stddev: Stddev,
    stdvar: Stdvar,
    sum: Sum,
    topk: Topk,
    by: By,
    without: Without,
    and: And,
    or: Or,
    unless: Unless,
    start: Start,
    end: End,
};

export const extendIdentifier = (value) => {
    return contextualKeywordTokens[value.toLowerCase()] || -1;
};
