import api from "../others/api/api";

export const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  if (!datasetNameOrID) {
    throw new Error("Dataset name or ID is required");
  }
  const datasetList = await api.getUsersDatasetList(false);
  return datasetList.some(
    (dataset) => dataset.name === datasetNameOrID || dataset.id === datasetNameOrID
  );
};
