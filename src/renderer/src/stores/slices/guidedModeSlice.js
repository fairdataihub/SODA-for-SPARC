import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
  datasetType: null,
});

export const setGuidedDatasetName = (datasetName) => {
  useGlobalStore.setState({ guidedDatasetName: datasetName });
};

export const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  useGlobalStore.setState({ guidedDatasetSubtitle: datasetSubtitle });
};

export const setDatasetType = (datasetType) => {
  useGlobalStore.setState({ datasetType });
};
