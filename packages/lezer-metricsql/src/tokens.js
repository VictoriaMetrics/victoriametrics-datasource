import { ExternalTokenizer } from '@lezer/lr';

import { functionNames } from './functionNames.js';
import {
    TemplateIdentifier,
    With,
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
    Default,
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
    with: With,
};

// Keyword maps are plain objects: look up own keys only, so names inherited from Object.prototype
// (`constructor`, `__proto__`) stay ordinary identifiers.
const lookupToken = (tokens, name) => (Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : -1);

export const specializeIdentifier = (value) => {
    return lookupToken(keywordTokens, value.toLowerCase());
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
    default: Default,
    start: Start,
    end: End,
};

export const extendIdentifier = (value) => {
    return lookupToken(contextualKeywordTokens, value.toLowerCase());
};

const isIdentStart = (ch) => (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 /* _ */ || ch === 58 /* : */;
const isIdentChar = (ch) => isIdentStart(ch) || (ch >= 48 && ch <= 57) || ch === 46 /* . */ || ch === 45 /* - */;
const isSpace = (ch) => ch === 32 || ch === 9 || ch === 10 || ch === 13;

// A WITH template call looks like a function call with a name the grammar does not know.
// The token is produced only where the parser can accept it, so WITH argument names (`f(x) = ...`)
// and plain metric names stay Identifier.
export const templateIdentifier = new ExternalTokenizer((input, stack) => {
    if (!stack.canShift(TemplateIdentifier) || !isIdentStart(input.next)) {
        return;
    }
    let len = 0;
    let name = '';
    while (isIdentChar(input.peek(len)) || input.peek(len) === 92 /* \ */) {
        if (input.peek(len) === 92) {
            name += String.fromCharCode(input.peek(len + 1));
            len += 2;
        } else {
            name += String.fromCharCode(input.peek(len));
            len++;
        }
    }
    let ahead = len;
    while (isSpace(input.peek(ahead))) {
        ahead++;
    }
    if (input.peek(ahead) !== 40 /* ( */) {
        return;
    }
    const lower = name.toLowerCase();
    if (functionNames.has(lower) || lookupToken(contextualKeywordTokens, lower) !== -1 || lookupToken(keywordTokens, lower) !== -1) {
        return;
    }
    input.acceptToken(TemplateIdentifier, len);
}, { contextual: true });
