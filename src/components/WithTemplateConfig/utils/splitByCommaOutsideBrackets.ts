const isOpeningBracket = (char: string): boolean => ["(", "{", "["].includes(char);
const isClosingBracket = (char: string): boolean => [")", "}", "]"].includes(char);
const isQuote = (char: string): boolean => ['"', "'"].includes(char);

const shouldSplit = (char: string, bracketsCount: number, quotesCount: number): boolean =>
  char === "," && bracketsCount === 0 && quotesCount % 2 === 0;

const splitByCommaOutsideBrackets = (str: string): string[] => {
  let bracketsCount = 0;
  let quotesCount = 0;

  return str.split("").reduce((result: string[], char: string) => {
    if (isQuote(char)) {quotesCount++;}

    if (quotesCount % 2 === 0) {
      if (isOpeningBracket(char)) {bracketsCount++;}
      if (isClosingBracket(char)) {bracketsCount--;}
    }

    if (shouldSplit(char, bracketsCount, quotesCount)) {
      result.push("");
    } else {
      result[result.length - 1] += char;
    }

    return result;
  }, [""]);
};

export default splitByCommaOutsideBrackets;
