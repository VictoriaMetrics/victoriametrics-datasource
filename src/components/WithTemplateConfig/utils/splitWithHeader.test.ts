import { splitWithHeader } from './splitWithHeader';

describe('splitWithHeader', () => {
  it('returns the whole query as body when there is no WITH block', () => {
    expect(splitWithHeader('up{job="a"} == 0')).toEqual({ header: '', body: 'up{job="a"} == 0' });
  });

  it('splits a multi-line WITH block as produced by mergeTemplateWithQuery', () => {
    const header = 'WITH(\n  f={cloud.account.name=~"$account_name"}\n)';
    expect(splitWithHeader(`${header}\nprobe_success{f} == 0`)).toEqual({ header, body: '\nprobe_success{f} == 0' });
  });

  it('is case-insensitive and tolerates spaces before the bracket', () => {
    expect(splitWithHeader('with (f={a="b"}) up{f}')).toEqual({ header: 'with (f={a="b"})', body: ' up{f}' });
  });

  it('skips brackets inside string literals and nested brackets', () => {
    const header = 'WITH (f(x) = rate(x[5m]), s = label_replace(up, "a", ")", \'b\', "(.*)"), q = "it\'s")';
    expect(splitWithHeader(`${header} f(foo{s})`)).toEqual({ header, body: ' f(foo{s})' });
  });

  it('detects the WITH block after leading comment lines', () => {
    const header = '# note\n  # another\nWITH (f={a="b"})';
    expect(splitWithHeader(`${header} up{f}`)).toEqual({ header, body: ' up{f}' });
  });

  it('skips brackets inside comments', () => {
    const header = 'WITH (\n  f={a="b"}, # filter )\n)';
    expect(splitWithHeader(`${header}\nup{f}`)).toEqual({ header, body: '\nup{f}' });
  });

  it('returns the whole query as body when the block is not closed', () => {
    expect(splitWithHeader('WITH (f={a="b"} foo')).toEqual({ header: '', body: 'WITH (f={a="b"} foo' });
  });
});
