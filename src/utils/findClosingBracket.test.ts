import { findClosingBracket } from './findClosingBracket';

describe('findClosingBracket', () => {
  it('finds the matching bracket for each supported pair', () => {
    expect(findClosingBracket('(a)', 0)).toBe(2);
    expect(findClosingBracket('x[a]', 1)).toBe(3);
    expect(findClosingBracket('{a}', 0)).toBe(2);
  });

  it('counts only brackets of the type being closed, other types are ignored', () => {
    //                          0123456789
    expect(findClosingBracket('f((a)[x]b)', 1)).toBe(9);
    expect(findClosingBracket('{a(}', 0)).toBe(3);
    // a ")" inside "[...]" still closes the pair
    expect(findClosingBracket('([)])', 0)).toBe(2);
  });

  it('skips brackets inside string literals, with backslash escapes', () => {
    expect(findClosingBracket('(")")', 0)).toBe(4);
    expect(findClosingBracket("(')')", 0)).toBe(4);
    expect(findClosingBracket('(`)`)', 0)).toBe(4);
    //                          0123456789
    expect(findClosingBracket('("\\")")', 0)).toBe(6);
  });

  it('treats backslashes inside backtick strings as literal characters', () => {
    //                          0123456
    expect(findClosingBracket('(`a\\`)', 0)).toBe(5);
    expect(findClosingBracket('(`)\\`)', 0)).toBe(5);
  });

  it('skips line comments when a comment marker is given', () => {
    const str = '(\n  a # )\n)';
    expect(findClosingBracket(str, 0, { comment: '#' })).toBe(str.length - 1);
    expect(findClosingBracket(str, 0)).toBe(8);
    // a marker inside a string literal is not a comment
    expect(findClosingBracket('("#")', 0, { comment: '#' })).toBe(4);
  });

  it('returns -1 when the position is not an opening bracket', () => {
    expect(findClosingBracket('a(b)', 0)).toBe(-1);
    expect(findClosingBracket('(a)', 2)).toBe(-1);
    expect(findClosingBracket('(a)', 10)).toBe(-1);
    expect(findClosingBracket('', 0)).toBe(-1);
  });

  it('returns -1 when the pair is not closed', () => {
    expect(findClosingBracket('(a', 0)).toBe(-1);
    expect(findClosingBracket('(a")"', 0)).toBe(-1);
    expect(findClosingBracket('(a # )', 0, { comment: '#' })).toBe(-1);
  });
});
