export const regexifyLabelValuesQueryString = (query: string) => {
  const queryArray = query.split(" ");
  return queryArray.map((query) => `${query}.*`).join("");
};
