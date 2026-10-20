import { addLabelToQuery } from './add_label_to_query';

describe('addLabelToQuery()', () => {
  it('should add label to simple query', () => {
    expect(() => {
      addLabelToQuery('foo', '', '');
    }).toThrow();
    expect(addLabelToQuery('foo', 'bar', 'baz')).toBe('foo{bar="baz"}');
    expect(addLabelToQuery('foo{}', 'bar', 'baz')).toBe('foo{bar="baz"}');
    expect(addLabelToQuery('foo{x="yy"}', 'bar', 'baz')).toBe('foo{x="yy", bar="baz"}');
    expect(addLabelToQuery('metric > 0.001', 'foo', 'bar')).toBe('metric{foo="bar"} > 0.001');
  });

  it('should add custom operator', () => {
    expect(addLabelToQuery('foo{}', 'bar', 'baz', '!=')).toBe('foo{bar!="baz"}');
    expect(addLabelToQuery('foo{x="yy"}', 'bar', 'baz', '!=')).toBe('foo{x="yy", bar!="baz"}');
  });

  it('should not modify ranges', () => {
    expect(addLabelToQuery('rate(metric[1m])', 'foo', 'bar')).toBe('rate(metric{foo="bar"}[1m])');
  });

  it('should detect in-order function use', () => {
    expect(addLabelToQuery('sum by (xx) (foo)', 'bar', 'baz')).toBe('sum by (xx) (foo{bar="baz"})');
  });

  it('should convert number Infinity to +Inf', () => {
    expect(
      addLabelToQuery('sum(rate(prometheus_tsdb_compaction_chunk_size_bytes_bucket[5m])) by (le)', 'le', Infinity)
    ).toBe('sum(rate(prometheus_tsdb_compaction_chunk_size_bytes_bucket{le="+Inf"}[5m])) by (le)');
  });

  it('should handle selectors with punctuation', () => {
    expect(addLabelToQuery('foo{instance="my-host.com:9100"}', 'bar', 'baz')).toBe(
      'foo{instance="my-host.com:9100", bar="baz"}'
    );
    expect(addLabelToQuery('foo:metric:rate1m', 'bar', 'baz')).toBe('foo:metric:rate1m{bar="baz"}');
    expect(addLabelToQuery('avg(foo:metric:rate1m{a="b"})', 'bar', 'baz')).toBe(
      'avg(foo:metric:rate1m{a="b", bar="baz"})'
    );
    expect(addLabelToQuery('foo{list="a,b,c"}', 'bar', 'baz')).toBe('foo{list="a,b,c", bar="baz"}');
  });

  it('should work on arithmetical expressions', () => {
    expect(addLabelToQuery('foo + foo', 'bar', 'baz')).toBe('foo{bar="baz"} + foo{bar="baz"}');
    expect(addLabelToQuery('foo{x="yy"} + metric', 'bar', 'baz')).toBe('foo{x="yy", bar="baz"} + metric{bar="baz"}');
    expect(addLabelToQuery('avg(foo) + sum(xx_yy)', 'bar', 'baz')).toBe('avg(foo{bar="baz"}) + sum(xx_yy{bar="baz"})');
    expect(addLabelToQuery('foo{x="yy"} * metric{y="zz",a="bb"} * metric2', 'bar', 'baz')).toBe(
      'foo{x="yy", bar="baz"} * metric{y="zz",a="bb", bar="baz"} * metric2{bar="baz"}'
    );
  });

  it('should not add duplicate labels to a query', () => {
    expect(addLabelToQuery(addLabelToQuery('foo{x="yy"}', 'bar', 'baz', '!='), 'bar', 'baz', '!=')).toBe(
      'foo{x="yy", bar!="baz"}'
    );
    expect(addLabelToQuery(addLabelToQuery('rate(metric[1m])', 'foo', 'bar'), 'foo', 'bar')).toBe(
      'rate(metric{foo="bar"}[1m])'
    );
    expect(addLabelToQuery(addLabelToQuery('foo{list="a,b,c"}', 'bar', 'baz'), 'bar', 'baz')).toBe(
      'foo{list="a,b,c", bar="baz"}'
    );
    expect(addLabelToQuery(addLabelToQuery('avg(foo) + sum(xx_yy)', 'bar', 'baz'), 'bar', 'baz')).toBe(
      'avg(foo{bar="baz"}) + sum(xx_yy{bar="baz"})'
    );
  });

  it('should not remove filters', () => {
    expect(addLabelToQuery('{x="y"} |="yy"', 'bar', 'baz')).toBe('{x="y", bar="baz"} |="yy"');
    expect(addLabelToQuery('{x="y"} |="yy" !~"xx"', 'bar', 'baz')).toBe('{x="y", bar="baz"} |="yy" !~"xx"');
  });

  it('should add labels to metrics with logical operators', () => {
    expect(addLabelToQuery('foo_info or bar_info', 'bar', 'baz')).toBe('foo_info{bar="baz"} or bar_info{bar="baz"}');
    expect(addLabelToQuery('foo_info and bar_info', 'bar', 'baz')).toBe('foo_info{bar="baz"} and bar_info{bar="baz"}');
  });

  it('should not add ad-hoc filter to template variables', () => {
    expect(addLabelToQuery('sum(rate({job="foo"}[2m])) by (value $variable)', 'bar', 'baz')).toBe(
      'sum(rate({job="foo", bar="baz"}[2m])) by (value $variable)'
    );
  });

  it('should not add ad-hoc filter to range', () => {
    expect(addLabelToQuery('avg(rate((my_metric{job="foo"} > 0)[3h:])) by (label)', 'bar', 'baz')).toBe(
      'avg(rate((my_metric{job="foo", bar="baz"} > 0)[3h:])) by (label)'
    );
  });
  it('should not add ad-hoc filter to labels in label list provided with the group modifier', () => {
    expect(
      addLabelToQuery(
        'max by (id, name, type) (my_metric{type=~"foo|bar|baz-test"}) * on(id) group_right(id, type, name) sum by (id) (my_metric) * 1000',
        'bar',
        'baz'
      )
    ).toBe(
      'max by (id, name, type) (my_metric{type=~"foo|bar|baz-test", bar="baz"}) * on(id) group_right(id, type, name) sum by (id) (my_metric{bar="baz"}) * 1000'
    );
  });
  it('should to labels in label list provided with the group modifier', () => {
    expect(addLabelToQuery('rate(my_metric[${__range_s}s])', 'bar', 'baz')).toBe(
      'rate(my_metric{bar="baz"}[${__range_s}s])'
    );
  });
  it('should not add ad-hoc filter to labels to math operations', () => {
    expect(addLabelToQuery('count(my_metric{job!="foo"} < (5*1024*1024*1024) or vector(0)) - 1', 'bar', 'baz')).toBe(
      'count(my_metric{job!="foo", bar="baz"} < (5*1024*1024*1024) or vector(0)) - 1'
    );
  });

  it('should not add ad-hoc filter bool operator', () => {
    expect(addLabelToQuery('ALERTS < bool 1', 'bar', 'baz')).toBe('ALERTS{bar="baz"} < bool 1');
  });

  it('should put the filter first when the matchers end with a comment', () => {
    // Appending after the comment would make the filter part of the comment and silently drop it.
    expect(addLabelToQuery('foo{a="b" # c\n}', 'bar', 'baz')).toBe('foo{bar="baz", a="b" # c\n}');
    expect(addLabelToQuery('foo{\n  a="b", # c\n  d="e" # f\n}', 'bar', 'baz')).toBe(
      'foo{bar="baz", \n  a="b", # c\n  d="e" # f\n}'
    );
  });

  it('should preserve the original text of the selector', () => {
    expect(addLabelToQuery('foo{ a="b" ,c="d" }', 'bar', 'baz')).toBe('foo{ a="b" ,c="d", bar="baz" }');
    expect(addLabelToQuery('foo {a="b"}', 'bar', 'baz')).toBe('foo {a="b", bar="baz"}');
  });

  it('should reuse a trailing comma instead of adding a second one', () => {
    expect(addLabelToQuery('foo{a="b",}', 'bar', 'baz')).toBe('foo{a="b", bar="baz"}');
    expect(addLabelToQuery('foo{a="b", }', 'bar', 'baz')).toBe('foo{a="b", bar="baz" }');
  });

  describe('WITH templates (#551)', () => {
    it('should keep a bare template reference in the selector', () => {
      expect(addLabelToQuery('probe_success{f} == 0', 'service.name', 'public')).toBe(
        'probe_success{f, service.name="public"} == 0'
      );
      expect(addLabelToQuery('probe_success{f, a="b"} == 0', 'service.name', 'public')).toBe(
        'probe_success{f, a="b", service.name="public"} == 0'
      );
    });

    it('should keep the WITH block intact and add the filter only to the query body', () => {
      const query = `WITH(
  f={cloud.account.name=~"$account_name"}
)
probe_success{f} == 0`;
      expect(addLabelToQuery(query, 'service.name', 'public')).toBe(`WITH(
  f={cloud.account.name=~"$account_name"}
)
probe_success{f, service.name="public"} == 0`);
    });

    it('should find the end of the WITH block across nested brackets and strings', () => {
      const query = 'WITH (f(x) = rate(x[5m]), s = label_replace(up, "a", ")", "b", "(.*)")) f(foo{s})';
      expect(addLabelToQuery(query, 'bar', 'baz')).toBe(
        'WITH (f(x) = rate(x[5m]), s = label_replace(up, "a", ")", "b", "(.*)")) f(foo{s, bar="baz"})'
      );
    });

    it('should treat an unclosed WITH block as a plain query', () => {
      // The query is invalid anyway: the point is that the header is not stripped and nothing is corrupted.
      expect(addLabelToQuery('WITH (f={a="b"} foo', 'bar', 'baz')).toBe('WITH (f={a="b", bar="baz"} foo');
    });
  });
});
