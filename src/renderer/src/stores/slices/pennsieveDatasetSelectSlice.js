import api from "../../scripts/others/api/api";
import useGlobalStore from "../globalStore";

// Store slice definition
export const pennsieveDatasetSelectSlice = (set) => ({
  selectableDatasets: [],
  selectedDatasetIdToUploadDataTo: null,
  selectedDatasetNameToUploadDataTo: null,
  selectedDatasetIntIdToUploadTo: null,
  availableDatasetsToUploadDataTo: [],
  isLoadingPennsieveDatasets: false,
  preferredPennsieveDatasetId: null,
  datasetFetchErrorMessage: null,
});

// Setters
export const setAvailableDatasetsToUploadDataTo = (availableDatasetsToUploadDataTo) => {
  useGlobalStore.setState({ availableDatasetsToUploadDataTo });
};

export const setIsLoadingPennsieveDatasets = (isLoadingPennsieveDatasets) => {
  useGlobalStore.setState({ isLoadingPennsieveDatasets });
};

export const setSelectableDatasets = (selectableDatasets) => {
  useGlobalStore.setState({ selectableDatasets });
};

export const setPreferredPennsieveDatasetId = (preferredPennsieveDatasetId) => {
  useGlobalStore.setState({ preferredPennsieveDatasetId });
};

export const setPreferredPennsieveDatasetIntId = (preferredPennsieveDatasetIntId) => {
  useGlobalStore.setState({ preferredPennsieveDatasetIntId });
};

export const setSelectedDatasetToUploadDataTo = (
  selectedDatasetIdToUploadDataTo,
  selectedDatasetNameToUploadDataTo,
  selectedDatasetIntIdToUploadTo
) => {
  useGlobalStore.setState({
    selectedDatasetIdToUploadDataTo,
    selectedDatasetNameToUploadDataTo,
    selectedDatasetIntIdToUploadTo,
  });
};

// Fetch logic
export const fetchDatasetsToUploadDataTo = async () => {
  console.log("Fetching data");
  // Reset selection
  setSelectedDatasetToUploadDataTo(null, null, null);

  const preferredPennsieveDatasetId = useGlobalStore.getState().preferredPennsieveDatasetId;

  setIsLoadingPennsieveDatasets(true);
  useGlobalStore.setState({ datasetFetchErrorMessage: null });

  try {
    const datasets = await api.getUsersDatasetList(true);

    const formattedOptions = (datasets || []).map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
      intId: dataset.intId,
    }));

    setAvailableDatasetsToUploadDataTo(formattedOptions);

    // Auto-select preferred dataset if it's found
    if (preferredPennsieveDatasetId) {
      const preferredDataset = datasets.find(
        (dataset) => dataset.id === preferredPennsieveDatasetId
      );

      if (preferredDataset) {
        setSelectedDatasetToUploadDataTo(
          preferredDataset.id,
          preferredDataset.name,
          preferredDataset.intId
        );
      } else {
        console.warn(
          `⚠️ Preferred dataset with ID ${preferredPennsieveDatasetId} not found in fetched datasets.`
        );
      }
    }
  } catch (error) {
    console.error("❌ Failed to fetch datasets:", error?.response || error?.message || error);
    setAvailableDatasetsToUploadDataTo([]);
    useGlobalStore.setState({
      datasetFetchErrorMessage:
        "Failed to fetch datasets. Please try again or contact support if the issue persists.",
    });
  } finally {
    setIsLoadingPennsieveDatasets(false);
  }
};
