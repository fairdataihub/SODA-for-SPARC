export const naturalSort = (arr) => {
  return arr.sort((a, b) => {
    // Ensure "Experimental" always comes first
    if (a === "Experimental") return -1;
    if (b === "Experimental") return 1;

    // Ensure "Code" comes after "Experimental" but before everything else
    if (a === "Code") return b === "Experimental" ? 1 : -1;
    if (b === "Code") return a === "Experimental" ? -1 : 1;

    // Apply natural sorting for all other items
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
};
