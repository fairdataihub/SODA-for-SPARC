import api from "../others/api/api";

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
