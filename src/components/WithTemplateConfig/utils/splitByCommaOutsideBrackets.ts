const isOpeningBracket = (char: string): boolean => ['(', '{', '['].includes(char);
const isClosingBracket = (char: string): boolean => [')', '}', ']'].includes(char);
const isQuote = (char: string): boolean => ['"', "'"].includes(char);

const splitByCommaOutsideBrackets = (str: string): string[] => {
  let bracketsCount = 0;
  let quotesCount = 0;
  let inComment = false;

  return str.split('').reduce((result: string[], char: string) => {
    if (char === '\n') {inComment = false;}

    if (isQuote(char) && !inComment) {quotesCount++;}

    if (!inComment && quotesCount % 2 === 0) {
      if (char === '#') {inComment = true;}
      if (isOpeningBracket(char)) {bracketsCount++;}
      if (isClosingBracket(char)) {bracketsCount--;}
    }

    const isSplitPoint = char === ',' && !inComment && bracketsCount === 0 && quotesCount % 2 === 0;

    if (isSplitPoint) {
      result.push('');
    } else {
      result[result.length - 1] += char;
    }

    return result;
  }, ['']);
};

export default splitByCommaOutsideBrackets;
