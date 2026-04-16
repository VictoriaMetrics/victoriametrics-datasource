import { getArrayFromTemplate, formatTemplateString, mergeTemplateWithQuery } from './getArrayFromTemplate';

describe('getArrayFromTemplate', () => {
  it('should return empty array for undefined template', () => {
    expect(getArrayFromTemplate(undefined)).toEqual([]);
  });

  it('should parse simple expression', () => {
    const result = getArrayFromTemplate({ uid: '1', expr: 'cpuCount = sum(rate(node_cpu[5m]))' });
    expect(result).toEqual([
      { label: 'cpuCount', comment: '', value: 'cpuCount = sum(rate(node_cpu[5m]))' },
    ]);
  });

  it('should parse multiple comma-separated expressions', () => {
    const result = getArrayFromTemplate({ uid: '1', expr: 'a = 1,\nb = 2' });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('a');
    expect(result[1].label).toBe('b');
  });

  it('should handle comments with commas without splitting', () => {
    const expr = '# cpuCount=calc, used in dashboards\ncpuCount = sum(rate(node_cpu[5m]))';
    const result = getArrayFromTemplate({ uid: '1', expr });
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('cpuCount');
  });

  it('should handle comments with equals signs without wrong label', () => {
    const expr = '# key=value note\nmyVar = 42';
    const result = getArrayFromTemplate({ uid: '1', expr });
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('myVar');
  });

  it('should extract comment text without hash symbols', () => {
    const expr = '# some comment\nmyVar = 42';
    const result = getArrayFromTemplate({ uid: '1', expr });
    expect(result[0].comment).toBe('some comment');
  });

  it('should handle function-style variable names', () => {
    const result = getArrayFromTemplate({ uid: '1', expr: 'myFunc(x) = x + 1' });
    expect(result[0].label).toBe('myFunc(x)');
  });

  it('should filter out whitespace-only chunks', () => {
    const result = getArrayFromTemplate({ uid: '1', expr: 'a = 1,   , b = 2' });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('a');
    expect(result[1].label).toBe('b');
  });
});

describe('formatTemplateString', () => {
  it('should format expressions joined by comma and newline', () => {
    const result = formatTemplateString('a = 1,\nb = 2');
    expect(result).toBe('a = 1,\nb = 2');
  });

  it('should strip comments from formatted output', () => {
    const result = formatTemplateString('# comment\na = 1');
    expect(result).toBe('a = 1');
  });
});

describe('mergeTemplateWithQuery', () => {
  it('should return query unchanged when no template', () => {
    expect(mergeTemplateWithQuery('up', undefined)).toBe('up');
  });

  it('should return query unchanged when template expr is empty', () => {
    expect(mergeTemplateWithQuery('up', { uid: '1', expr: '' })).toBe('up');
  });

  it('should prepend WITH block when query uses template variable', () => {
    const template = { uid: '1', expr: 'cpuCount = sum(rate(node_cpu[5m]))' };
    const result = mergeTemplateWithQuery('cpuCount', template);
    expect(result).toContain('WITH(');
    expect(result).toContain('cpuCount');
  });

  it('should not prepend WITH block when query does not use template variable', () => {
    const template = { uid: '1', expr: 'cpuCount = sum(rate(node_cpu[5m]))' };
    const result = mergeTemplateWithQuery('up', template);
    expect(result).toBe('up');
  });

  it('should not match empty labels against query', () => {
    const template = { uid: '1', expr: '# just a comment\n' };
    const result = mergeTemplateWithQuery('some_query', template);
    expect(result).toBe('some_query');
  });

  it('should handle template with comments containing commas', () => {
    const template = {
      uid: '1',
      expr: '# cpuCount=calc, used in dashboards\ncpuCount = sum(rate(node_cpu[5m]))',
    };
    const result = mergeTemplateWithQuery('cpuCount', template);
    expect(result).toContain('WITH(');
    expect(result).toContain('cpuCount');
  });
});
