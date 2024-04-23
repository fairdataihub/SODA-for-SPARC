import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  currentGuidedModePage: null,
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
});

export const setGuidedModePage = (guidedModePageName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    currentGuidedModePage: guidedModePageName,
  }));
};

export const setGuidedDatasetName = (datasetName) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedDatasetName: datasetName,
  }));
};

export const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  useGlobalStore.setState((state) => ({
    ...state,
    guidedDatasetSubtitle: datasetSubtitle,
  }));
};
