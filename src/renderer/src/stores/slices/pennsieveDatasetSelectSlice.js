import client from "../../scripts/client";
import api from "../../scripts/others/api/api";
import { swalShowError } from "../../scripts/utils/swal-utils";
import { setCheckboxCardUnchecked } from "./checkboxCardSlice";
import useGlobalStore from "../globalStore";

export const pennsieveDatasetSelectSlice = (set) => ({
  selectableDatasets: [],
  selectedDatasetIdToUploadDataTo: null,
  selectedDatasetNameToUploadDataTo: null,
  availableDatasetsToUploadDataTo: [],
  isLoadingPennsieveDatasets: false,
  preferredPennsieveDatasetId: null,
});

export const setPreferredPennsieveDatasetId = (preferredPennsieveDatasetId) => {
  useGlobalStore.setState({
    preferredPennsieveDatasetId,
  });
};

export const fetchDatasetsToUploadDataTo = async () => {
  // Reset the selected dataset to upload data to
  setSelectedDatasetToUploadDataTo(null, null);
  const preferredPennsieveDatasetId = useGlobalStore.getState().preferredPennsieveDatasetId;
  console.log("preferredPennsieveDatasetId:", preferredPennsieveDatasetId);

  setIsLoadingPennsieveDatasets(true);

  try {
    console.log("🚀 Fetching empty datasets from Pennsieve...");

    const datasets = await api.getUsersDatasetList(true);
    console.log("📦 Datasets fetched:", datasets);

    const formattedOptions = (datasets || []).map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
    }));

    setAvailableDatasetsToUploadDataTo(formattedOptions);
    if (preferredPennsieveDatasetId) {
      const preferredDataset = datasets.find(
        (dataset) => dataset.id === preferredPennsieveDatasetId
      );
      if (preferredDataset) {
        setSelectedDatasetToUploadDataTo(preferredDataset.id, preferredDataset.name);
      } else {
        console.warn(
          `Preferred dataset with ID ${preferredPennsieveDatasetId} not found in fetched datasets.`
        );
      }
    }
  } catch (error) {
    console.error("❌ Failed to fetch datasets:", error?.response || error?.message || error);
    setAvailableDatasetsToUploadDataTo([]);
    swalShowError(
      "Failed to fetch datasets",
      "Please try again later. If this issue persists, please use the Contact Us page to report the issue."
    );
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");
  } finally {
    setIsLoadingPennsieveDatasets(false);
  }
};

export const setAvailableDatasetsToUploadDataTo = (availableDatasetsToUploadDataTo) => {
  useGlobalStore.setState({
    availableDatasetsToUploadDataTo,
  });
};

export const setIsLoadingPennsieveDatasets = (isLoadingPennsieveDatasets) => {
  useGlobalStore.setState({
    isLoadingPennsieveDatasets,
  });
};

export const setSelectableDatasets = (selectableDatasets) => {
  useGlobalStore.setState({
    selectableDatasets,
  });
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
