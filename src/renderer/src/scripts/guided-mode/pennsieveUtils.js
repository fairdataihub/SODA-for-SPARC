import api from "../others/api/api";

export const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  if (!datasetNameOrID) {
    throw new Error("Dataset name or ID is required");
  }
  console.log("Checking if dataset exists on Pennsieve:", datasetNameOrID);
  const datasetList = await api.getDatasetsForAccount();
  console.log("datasetList", datasetList);
  return datasetList.some(
    (dataset) => dataset.name === datasetNameOrID || dataset.id === datasetNameOrID
  );
};
