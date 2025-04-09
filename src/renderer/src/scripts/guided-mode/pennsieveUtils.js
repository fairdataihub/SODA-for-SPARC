import api from "../others/api/api";

// Function that checks if the page needs to be updated from Pennsieve
// This function will be return true if the user is updating a dataset from Pennsieve and
// the page has not yet been saved
export const pageNeedsUpdateFromPennsieve = (pageID) => {
  // Add the pages-fetched-from-pennsieve array to the window.sodaJSONObj if it does not exist
  if (!window.sodaJSONObj["pages-fetched-from-pennsieve"]) {
    window.sodaJSONObj["pages-fetched-from-pennsieve"] = [];
  }

  // The following conditions must be met for the page to be updated from Pennsieve:
  // 1. The user is updating a dataset from Pennsieve
  // 2. window.sodaJSONObj["pages-fetched-from-pennsieve"] does not include the pageID
  // Note: window.sodaJSONObj["pages-fetched-from-pennsieve"] gets the page id added to it when the page is fetched from Pennsieve to prevent duplicate page fetches
  // 3. window.sodaJSONObj["completed-tabs"] does not include the pageID (The page has not been saved yet)
  return (
    window.sodaJSONObj["starting-point"]["origin"] === "ps" &&
    !window.sodaJSONObj["pages-fetched-from-pennsieve"].includes(pageID) &&
    !window.sodaJSONObj["completed-tabs"].includes(pageID)
  );
};

export const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  let datasetName = null;
  const datasetList = await api.getDatasetsForAccount();
  for (const dataset of datasetList) {
    if (dataset.name === datasetNameOrID || dataset.id === datasetNameOrID) {
      datasetName = dataset.name;
      break;
    }
  }
  return datasetName;
};
