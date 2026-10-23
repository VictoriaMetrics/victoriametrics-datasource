import { parser } from 'lezer-metricsql';

// One line per node: indentation by depth, node name, ERR suffix for error nodes and the node text.
function dump(query: string): string {
  const lines: string[] = [];
  let depth = 0;
  parser.parse(query).iterate({
    enter: (node) => {
      if (depth > 0) {
        const err = node.type.isError ? ' ERR' : '';
        lines.push(`${'  '.repeat(depth - 1)}${node.name}${err} '${query.slice(node.from, node.to)}'`);
      }
      depth++;
    },
    leave: () => {
      depth--;
    },
  });
  return lines.join('\n');
}

describe('metricsql grammar', () => {
  it('parses a WITH expression with a template and a body', () => {
    expect(dump('WITH (f = {a="b"}) up{f}')).toBe(`Expr 'WITH (f = {a="b"}) up{f}'
  WithExpr 'WITH (f = {a="b"}) up{f}'
    With 'WITH'
    WithArgList 'f = {a="b"}'
      WithArg 'f = {a="b"}'
        WithArgName 'f'
          Identifier 'f'
        EqlSingle '='
        Expr '{a="b"}'
          VectorSelector '{a="b"}'
            LabelMatchers '{a="b"}'
              LabelMatchList 'a="b"'
                LabelMatcher 'a="b"'
                  LabelName 'a'
                  MatchOp '='
                    EqlSingle '='
                  StringLiteral '"b"'
    Expr 'up{f}'
      VectorSelector 'up{f}'
        MetricIdentifier 'up'
          Identifier 'up'
        LabelMatchers '{f}'
          LabelMatchList 'f'
            LabelMatcher 'f'
              LabelName 'f'
              ⚠ ERR ''`);
  });

  it('parses a WITH template with parameters and its call', () => {
    expect(dump('WITH (f(x) = rate(x[5m])) f(up)')).toBe(`Expr 'WITH (f(x) = rate(x[5m])) f(up)'
  WithExpr 'WITH (f(x) = rate(x[5m])) f(up)'
    With 'WITH'
    WithArgList 'f(x) = rate(x[5m])'
      WithArg 'f(x) = rate(x[5m])'
        WithArgName 'f'
          Identifier 'f'
        WithArgParams '(x)'
          WithArgParamList 'x'
            WithArgParam 'x'
              Identifier 'x'
        EqlSingle '='
        Expr 'rate(x[5m])'
          FunctionCall 'rate(x[5m])'
            FunctionIdentifier 'rate'
              Rate 'rate'
            FunctionCallBody '(x[5m])'
              FunctionCallArgs 'x[5m]'
                Expr 'x[5m]'
                  MatrixSelector 'x[5m]'
                    Expr 'x'
                      VectorSelector 'x'
                        MetricIdentifier 'x'
                          Identifier 'x'
                    Duration '5m'
    Expr 'f(up)'
      TemplateCall 'f(up)'
        TemplateIdentifier 'f'
        FunctionCallBody '(up)'
          FunctionCallArgs 'up'
            Expr 'up'
              VectorSelector 'up'
                MetricIdentifier 'up'
                  Identifier 'up'`);
  });

  it('parses or-separated label matcher groups without errors', () => {
    expect(dump('foo{a="b" or c="d"}')).toBe(`Expr 'foo{a="b" or c="d"}'
  VectorSelector 'foo{a="b" or c="d"}'
    MetricIdentifier 'foo'
      Identifier 'foo'
    LabelMatchers '{a="b" or c="d"}'
      LabelMatchList 'a="b"'
        LabelMatcher 'a="b"'
          LabelName 'a'
          MatchOp '='
            EqlSingle '='
          StringLiteral '"b"'
      Or 'or'
      LabelMatchList 'c="d"'
        LabelMatcher 'c="d"'
          LabelName 'c'
          MatchOp '='
            EqlSingle '='
          StringLiteral '"d"'`);
  });

  it('gives binary operators to the WITH body but postfix operators to the whole expression', () => {
    expect(dump('WITH (a = up) a + 1')).toBe(`Expr 'WITH (a = up) a + 1'
  WithExpr 'WITH (a = up) a + 1'
    With 'WITH'
    WithArgList 'a = up'
      WithArg 'a = up'
        WithArgName 'a'
          Identifier 'a'
        EqlSingle '='
        Expr 'up'
          VectorSelector 'up'
            MetricIdentifier 'up'
              Identifier 'up'
    Expr 'a + 1'
      BinaryExpr 'a + 1'
        Expr 'a'
          VectorSelector 'a'
            MetricIdentifier 'a'
              Identifier 'a'
        Add '+'
        BinModifiers ''
        Expr '1'
          NumberLiteral '1'`);
    expect(dump('WITH (a = up) a[5m]')).toBe(`Expr 'WITH (a = up) a[5m]'
  MatrixSelector 'WITH (a = up) a[5m]'
    Expr 'WITH (a = up) a'
      WithExpr 'WITH (a = up) a'
        With 'WITH'
        WithArgList 'a = up'
          WithArg 'a = up'
            WithArgName 'a'
              Identifier 'a'
            EqlSingle '='
            Expr 'up'
              VectorSelector 'up'
                MetricIdentifier 'up'
                  Identifier 'up'
        Expr 'a'
          VectorSelector 'a'
            MetricIdentifier 'a'
              Identifier 'a'
    Duration '5m'`);
  });

  it('keeps known functions as FunctionCall inside binary expressions and aggregations', () => {
    for (const query of ['rate(up[5m]) + 1', 'sum(x) / sum(y)', 'count(m < (5*1024) or vector(0)) - 1']) {
      expect(dump(query)).not.toContain('TemplateCall');
    }
  });

  it('reports a trailing comma after an or-group as an error', () => {
    expect(dump('foo{a="b" or c="d",}')).toContain(' ERR ');
  });

  it('keeps known functions and aggregations as FunctionCall and AggregateExpr', () => {
    for (const query of ['sum(rate(up[5m]))']) {
      expect(dump(query)).not.toContain('TemplateCall');
    }
  });

  it('parses an unknown function as a template call', () => {
    expect(dump('newfn(up)')).toBe(`Expr 'newfn(up)'
  TemplateCall 'newfn(up)'
    TemplateIdentifier 'newfn'
    FunctionCallBody '(up)'
      FunctionCallArgs 'up'
        Expr 'up'
          VectorSelector 'up'
            MetricIdentifier 'up'
              Identifier 'up'`);
  });

  it('parses a WITH expression nested in parentheses and function args', () => {
    expect(dump('(WITH (a = up) a) * 2')).toMatch(/ParenExpr[\s\S]*WithExpr 'WITH \(a = up\) a'/);
    expect(dump('sum(WITH (a = up) a)')).toMatch(/FunctionCallArgs[\s\S]*WithExpr 'WITH \(a = up\) a'/);
  });

  it('keeps a trailing comma and an empty matcher list valid', () => {
    for (const query of ['foo{a="b",}', 'foo{}']) {
      expect(dump(query)).not.toContain(' ERR ');
    }
  });

  it('keeps a metric named like a function and a function call with a space before the parenthesis', () => {
    expect(dump('rate{a="b"}')).toMatch(/^Expr[^\n]*\n {2}VectorSelector 'rate\{a="b"\}'/);
    expect(dump('WITH (f = up) f (up)')).toContain("TemplateCall 'f (up)'");
  });

  it('still reports an unclosed selector as an error', () => {
    expect(dump('foo{')).toContain(' ERR ');
  });

  it('treats lowercase with as the keyword', () => {
    expect(dump('with (a = up) a')).toContain("WithExpr 'with (a = up) a'");
  });
});
