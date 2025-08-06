import client from "../../scripts/client";
import api from "../../scripts/others/api/api";
import { swalShowError } from "../../scripts/utils/swal-utils";
import { setCheckboxCardUnchecked } from "./checkboxCardSlice";
import useGlobalStore from "../globalStore";

export const pennsieveDatasetSelectSlice = (set) => ({
  selectableDatasets: [],
  selectedDatasetIdToUploadDataTo: null,
  datasetOptions: [],
  isLoadingPennsieveDatasets: false,
  preferredPennsieveDatasetId: null,
});

export const setPreferredPennsieveDatasetId = (preferredPennsieveDatasetId) => {
  useGlobalStore.setState({
    preferredPennsieveDatasetId,
  });
};

export const fetchDatasetsToUploadDataTo = async () => {
  const isLoadingPennsieveDatasets = useGlobalStore.getState().isLoadingPennsieveDatasets;
  const preferredPennsieveDatasetId = useGlobalStore.getState().preferredPennsieveDatasetId;
  if (isLoadingPennsieveDatasets) return;

  setIsLoadingPennsieveDatasets(true);

  try {
    console.log("🚀 Fetching empty datasets from Pennsieve...");

    const datasets = await api.getUsersDatasetList(true);
    console.log("📦 Datasets fetched:", datasets);

    const formattedOptions = (datasets || []).map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
    }));

    setDatasetOptions(formattedOptions);
    if (preferredPennsieveDatasetId) {
      // Optionally handle preferred selection here
    }
  } catch (error) {
    console.error("❌ Failed to fetch datasets:", error?.response || error?.message || error);
    setDatasetOptions([]);
    swalShowError(
      "Failed to fetch datasets",
      "Please try again later. If this issue persists, please use the Contact Us page to report the issue."
    );
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");
  } finally {
    setIsLoadingPennsieveDatasets(false);
  }
};

export const setDatasetOptions = (datasetOptions) => {
  useGlobalStore.setState({
    datasetOptions,
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

export const setSelectedDatasetIdToUploadDataTo = (selectedDatasetIdToUploadDataTo) => {
  useGlobalStore.setState({
    selectedDatasetIdToUploadDataTo,
  });
};
