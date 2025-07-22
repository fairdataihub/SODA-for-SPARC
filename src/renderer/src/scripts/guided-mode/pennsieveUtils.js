import api from "../others/api/api";

export const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  const datasetList = await api.getDatasetsForAccount();
  console.log("datasetList", datasetList);
  return datasetList.some(
    (dataset) => dataset.name === datasetNameOrID || dataset.id === datasetNameOrID
  );
};
