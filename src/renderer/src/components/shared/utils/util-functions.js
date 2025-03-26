export const naturalSort = (arr) => {
  return arr.sort((a, b) => {
    // Ensure "Experimental data" always comes first
    if (a === "Experimental data") return -1;
    if (b === "Experimental data") return 1;

    // Ensure "Code" comes after "Experimental data" but before everything else
    if (a === "Code") return b === "Experimental data" ? 1 : -1;
    if (b === "Code") return a === "Experimental data" ? -1 : 1;

    // Apply natural sorting for all other items
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
};
