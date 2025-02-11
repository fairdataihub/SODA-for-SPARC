export const guidedGetCurrentUserWorkSpace = () => {
  // Returns null if the user has not selected a workspace
  const workSpaceFromUI = document.getElementById(
    "guided-pennsive-selected-organization"
  ).innerHTML;
  if (
    workSpaceFromUI.includes("Click here to select workspace") ||
    workSpaceFromUI.includes("None")
  ) {
    return null;
  }
  return workSpaceFromUI;
};
