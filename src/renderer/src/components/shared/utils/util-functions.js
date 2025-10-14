// Define once at the top level
const preferredOrder = [
  "Experimental",
  "Primary",
  "Source",
  "Derivative",
  "Code",

  "Protocol",
  "Documentation",
];
const orderMap = new Map(preferredOrder.map((item, index) => [item, index]));

export const naturalSort = (arr) => {
  return arr.sort((a, b) => {
    const aIndex = orderMap.has(a) ? orderMap.get(a) : Infinity;
    const bIndex = orderMap.has(b) ? orderMap.get(b) : Infinity;

    if (aIndex !== bIndex) return aIndex - bIndex;

    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
};
