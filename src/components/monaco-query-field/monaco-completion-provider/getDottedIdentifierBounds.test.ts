import { getDottedIdentifierBounds } from './getDottedIdentifierBounds';

describe('getDottedIdentifierBounds', () => {
  it('should cover the full dotted metric name when cursor is at the end', () => {
    // "kubernetes.pod" with cursor at end (col 14, 0-based)
    const { start, end } = getDottedIdentifierBounds('kubernetes.pod', 14);
    expect(start).toBe(0);
    expect(end).toBe(14);
  });

  it('should cover the full dotted metric name when cursor is in the middle', () => {
    //                              cursor here ──┐
    // "kubernetes.pod.id"  indices: 0123456789...14..16
    const { start, end } = getDottedIdentifierBounds('kubernetes.pod.id', 14);
    expect(start).toBe(0);
    expect(end).toBe(17); // "kubernetes.pod.id".length === 17
  });

  it('should handle simple metric name without dots', () => {
    const { start, end } = getDottedIdentifierBounds('metric_name', 6);
    expect(start).toBe(0);
    expect(end).toBe(11);
  });

  it('should handle cursor at the beginning of a dotted name', () => {
    const { start, end } = getDottedIdentifierBounds('kubernetes.pod.id', 0);
    expect(start).toBe(0);
    expect(end).toBe(17);
  });

  it('should handle metric name after other text', () => {
    // "rate(kubernetes.pod.id" with cursor at end (col 22, 0-based)
    const { start, end } = getDottedIdentifierBounds('rate(kubernetes.pod.id', 22);
    expect(start).toBe(5);
    expect(end).toBe(22);
  });

  it('should stop at non-identifier characters like {', () => {
    // "kubernetes.pod.id{" with cursor before "{" (col 17, 0-based)
    const { start, end } = getDottedIdentifierBounds('kubernetes.pod.id{', 17);
    expect(start).toBe(0);
    expect(end).toBe(17);
  });

  it('should handle empty line', () => {
    const { start, end } = getDottedIdentifierBounds('', 0);
    expect(start).toBe(0);
    expect(end).toBe(0);
  });

  it('should handle metric with colon', () => {
    const { start, end } = getDottedIdentifierBounds('namespace:container.cpu', 23);
    expect(start).toBe(0);
    expect(end).toBe(23);
  });
});
