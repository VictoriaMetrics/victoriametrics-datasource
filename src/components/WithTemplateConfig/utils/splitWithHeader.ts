import { findClosingBracket } from '../../../utils/findClosingBracket';

// Leading comment lines are allowed before the WITH keyword.
const WITH_HEADER = /^(?:\s*#[^\n]*\n)*\s*WITH\s*\(/i;

/**
 * Split a leading `WITH (...)` block from the rest of a MetricsQL query.
 * A query without the block, or with an unbalanced one, is returned whole as the body.
 * MetricsQL `#` comments inside the block are skipped.
 */
export const splitWithHeader = (query: string): { header: string; body: string } => {
  const match = WITH_HEADER.exec(query);
  if (!match) {
    return { header: '', body: query };
  }
  const end = findClosingBracket(query, match[0].length - 1, { comment: '#' });
  if (end === -1) {
    return { header: '', body: query };
  }
  return { header: query.substring(0, end + 1), body: query.substring(end + 1) };
};
