import splitByCommaOutsideBrackets from './splitByCommaOutsideBrackets';

describe('splitByCommaOutsideBrackets', () => {
  it('should split simple comma-separated values', () => {
    expect(splitByCommaOutsideBrackets('a = 1, b = 2')).toEqual(['a = 1', ' b = 2']);
  });

  it('should not split commas inside brackets', () => {
    expect(splitByCommaOutsideBrackets('a = f(1, 2), b = 3')).toEqual(['a = f(1, 2)', ' b = 3']);
  });

  it('should not split commas inside quotes', () => {
    expect(splitByCommaOutsideBrackets('a = "hello, world", b = 2')).toEqual([
      'a = "hello, world"',
      ' b = 2',
    ]);
  });

  it('should not split commas inside comments', () => {
    const input = '# cpuCount=calc, used in dashboards\ncpuCount = sum(rate(node_cpu[5m]))';
    const result = splitByCommaOutsideBrackets(input);
    expect(result).toEqual([input]);
  });

  it('should split after comment line ends', () => {
    const input = '# comment with, commas\na = 1, b = 2';
    const result = splitByCommaOutsideBrackets(input);
    expect(result).toEqual(['# comment with, commas\na = 1', ' b = 2']);
  });

  it('should handle multiple comment lines with commas', () => {
    const input = '# first, comment\n# second, comment\na = 1';
    const result = splitByCommaOutsideBrackets(input);
    expect(result).toEqual([input]);
  });

  it('should handle inline comment after expression', () => {
    const input = 'a = 1, # inline, comment\nb = 2';
    const result = splitByCommaOutsideBrackets(input);
    expect(result).toEqual(['a = 1', ' # inline, comment\nb = 2']);
  });

  it('should return single element for no commas', () => {
    expect(splitByCommaOutsideBrackets('a = 1')).toEqual(['a = 1']);
  });

  it('should handle empty string', () => {
    expect(splitByCommaOutsideBrackets('')).toEqual(['']);
  });
});
