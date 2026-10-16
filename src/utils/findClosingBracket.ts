const BRACKET_PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const QUOTES = ['"', "'", '`'];
// Backtick strings are raw: a backslash inside them is a literal character.
const RAW_QUOTE = '`';

export interface FindClosingBracketOptions {
  /** Marker of a line comment, e.g. `#`. Everything from it to the end of the line is skipped. */
  comment?: string;
}

/**
 * Find the bracket closing the one at `openIndex`. Only brackets of the same type are counted,
 * string literals (with backslash escapes, except in raw backtick strings) and, when `comment` is set,
 * line comments are skipped.
 * Returns -1 when `openIndex` does not point at an opening bracket or when the pair is not closed.
 */
export const findClosingBracket = (str: string, openIndex: number, options: FindClosingBracketOptions = {}): number => {
  const open = str[openIndex];
  const close = BRACKET_PAIRS[open];
  if (!close) {
    return -1;
  }

  let depth = 0;
  let quote: string | undefined;
  for (let i = openIndex; i < str.length; i++) {
    const char = str[i];
    if (quote) {
      if (char === '\\' && quote !== RAW_QUOTE) {
        i++;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (QUOTES.includes(char)) {
      quote = char;
    } else if (options.comment && str.startsWith(options.comment, i)) {
      const lineEnd = str.indexOf('\n', i);
      if (lineEnd === -1) {
        return -1;
      }
      i = lineEnd;
    } else if (char === open) {
      depth++;
    } else if (char === close && --depth === 0) {
      return i;
    }
  }
  return -1;
};
