import { convertLDMLLayoutToGoTimeLayout } from './convertLDMLLayoutToGoTimeLayout';

describe('convertLDMLLayoutToGoTimeLayout', () => {
  it('converts LDML date format to Go time layout format', () => {
    expect(convertLDMLLayoutToGoTimeLayout('YYYY-MM-DD HH:mm:ss')).toBe('2006-01-02 15:04:05');
  });

  it('converts 12-hour format with AM/PM', () => {
    expect(convertLDMLLayoutToGoTimeLayout('hh:mm:ss A')).toBe('03:04:05 PM');
  });

  it('converts full month name format', () => {
    expect(convertLDMLLayoutToGoTimeLayout('MMMM DD, YYYY')).toBe('January 02, 2006');
  });

  it('converts short month name format', () => {
    expect(convertLDMLLayoutToGoTimeLayout('MMM DD, YY')).toBe('Jan 02, 06');
  });

  it('converts format with timezone offset', () => {
    expect(convertLDMLLayoutToGoTimeLayout('YYYY-MM-DD HH:mm:ss Z')).toBe('2006-01-02 15:04:05 -0700');
  });

  it('converts format with timezone abbreviation', () => {
    expect(convertLDMLLayoutToGoTimeLayout('YYYY-MM-DD HH:mm:ss ZZZ')).toBe('2006-01-02 15:04:05 MST');
  });

  it('converts format with milliseconds', () => {
    expect(convertLDMLLayoutToGoTimeLayout('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2006-01-02 15:04:05.000');
  });

  it('converts format with nanoseconds', () => {
    expect(convertLDMLLayoutToGoTimeLayout('YYYY-MM-DD HH:mm:ss.SSSSSSSSS')).toBe('2006-01-02 15:04:05.000000000');
  });

  it('returns empty string for empty input', () => {
    expect(convertLDMLLayoutToGoTimeLayout('')).toBe('');
  });

  it('returns unchanged string with no LDML tokens', () => {
    expect(convertLDMLLayoutToGoTimeLayout('no tokens here')).toBe('no tokens here');
  });
});
