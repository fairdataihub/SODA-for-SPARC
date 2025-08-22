import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
});

export const setGuidedDatasetName = (datasetName) => {
  useGlobalStore.setState({
    guidedDatasetName: datasetName,
  });
};

export const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  useGlobalStore.setState({
    guidedDatasetSubtitle: datasetSubtitle,
  });
};
