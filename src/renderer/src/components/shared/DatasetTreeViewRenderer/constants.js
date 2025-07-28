export const naturalSort = (arr) =>
  arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

export const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};
