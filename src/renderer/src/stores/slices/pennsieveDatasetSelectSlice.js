import client from "../../scripts/client";
import { swalShowError } from "../../scripts/utils/swal-utils";
import { setCheckboxCardUnchecked } from "./checkboxCardSlice";

export const fetchDatasets = async () => {
  const hasLoaded = useGlobalStore.getState().hasLoaded;
  const isLoading = useGlobalStore.getState().isLoading;
  const hasAttemptedFetch = useGlobalStore.getState().hasAttemptedFetch;
  if (hasLoaded || isLoading || hasAttemptedFetch) return;

  setIsLoading(true);
  setHasAttemptedFetch(true);

  try {
    console.log("🚀 Fetching empty datasets from Pennsieve...");

    const response = await client.get("manage_datasets/fetch_user_datasets", {
      params: { return_only_empty_datasets: "true" },
    });

    const datasets = response?.data?.datasets;
    if (!datasets || !Array.isArray(datasets)) {
      console.warn("⚠️ No datasets found or response structure invalid:", datasets);
    }

    const formattedOptions = (datasets || []).map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
    }));

    setDatasetOptions(formattedOptions);
    setHasLoaded(true);
  } catch (error) {
    console.error("❌ Failed to fetch datasets:", error?.response || error?.message || error);
    setDatasetOptions([]);
    swalShowError(
      "Failed to fetch datasets",
      "Please try again later. If this issue persists, please use the Contact Us page to report the issue."
    );
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");
  } finally {
    setIsLoading(false);
  }
};
import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const pennsieveDatasetSelectSlice = (set) => ({
  selectableDatasets: [],
  selectedDataset: null,
  datasetOptions: [],
  isLoading: false,
  hasLoaded: false,
  hasAttemptedFetch: false,
});

export const setDatasetOptions = (datasetOptions) => {
  useGlobalStore.setState({
    datasetOptions,
  });
};

export const setIsLoading = (isLoading) => {
  useGlobalStore.setState({
    isLoading,
  });
};

export const setHasLoaded = (hasLoaded) => {
  useGlobalStore.setState({
    hasLoaded,
  });
};

export const setHasAttemptedFetch = (hasAttemptedFetch) => {
  useGlobalStore.setState({
    hasAttemptedFetch,
  });
};

export const setSelectableDatasets = (selectableDatasets) => {
  useGlobalStore.setState({
    selectableDatasets,
  });
};

export const setSelectedDataset = (selectedDataset) => {
  useGlobalStore.setState({
    selectedDataset,
  });
};
