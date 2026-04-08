// Find the start and end offsets (0-based) of the dotted identifier around the cursor.
// Monaco's getWordAtPosition treats dots as word boundaries, so we scan manually.
export function getDottedIdentifierBounds(lineContent: string, cursorCol0: number): { start: number; end: number } {
  let start = cursorCol0;
  while (start > 0 && /[a-zA-Z0-9_.:]/.test(lineContent[start - 1])) {
    start--;
  }

  let end = cursorCol0;
  while (end < lineContent.length && /[a-zA-Z0-9_.:]/.test(lineContent[end])) {
    end++;
  }

  return { start, end };
}
