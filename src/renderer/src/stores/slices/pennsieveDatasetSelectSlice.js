import api from "../../scripts/others/api/api";
import useGlobalStore from "../globalStore";

// Store slice definition
export const pennsieveDatasetSelectSlice = (set) => ({
  selectableDatasets: [],
  selectedDatasetIdToUploadDataTo: null,
  selectedDatasetNameToUploadDataTo: null,
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

export const setSelectedDatasetToUploadDataTo = (
  selectedDatasetIdToUploadDataTo,
  selectedDatasetNameToUploadDataTo
) => {
  useGlobalStore.setState({
    selectedDatasetIdToUploadDataTo,
    selectedDatasetNameToUploadDataTo,
  });
};

// Fetch logic
export const fetchDatasetsToUploadDataTo = async () => {
  // Reset selection
  setSelectedDatasetToUploadDataTo(null, null);

  const preferredPennsieveDatasetId = useGlobalStore.getState().preferredPennsieveDatasetId;
  console.log("preferredPennsieveDatasetId:", preferredPennsieveDatasetId);

  setIsLoadingPennsieveDatasets(true);
  useGlobalStore.setState({ datasetFetchErrorMessage: null });

  try {
    console.log("🚀 Fetching empty datasets from Pennsieve...");
    const datasets = await api.getUsersDatasetList(true);
    console.log("📦 Datasets fetched:", datasets);

    const formattedOptions = (datasets || []).map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
    }));

    setAvailableDatasetsToUploadDataTo(formattedOptions);

    // Auto-select preferred dataset if it's found
    if (preferredPennsieveDatasetId) {
      const preferredDataset = datasets.find(
        (dataset) => dataset.id === preferredPennsieveDatasetId
      );

      if (preferredDataset) {
        setSelectedDatasetToUploadDataTo(preferredDataset.id, preferredDataset.name);
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
