// Sorts an array of strings in natural order (but with "Experimental data" coming before "Code")
export const naturalSort = (arr) => {
  return arr.sort((a, b) => {
    if (a === "Experimental data") return -1;
    if (b === "Experimental data") return 1;
    if (a === "Code") return 1;
    if (b === "Code") return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
};
