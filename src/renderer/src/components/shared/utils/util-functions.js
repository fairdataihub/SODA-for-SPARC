export const naturalSort = (arr) => {
  return arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
};
