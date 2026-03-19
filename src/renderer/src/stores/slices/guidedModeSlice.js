import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
  freeFormDatasetName: "",
  datasetType: null,
  hiddenGuidedModeSections: [],
  manifestFileGenerationDisabled: false,
  curationMode: null,
});

export const setGuidedDatasetName = (datasetName) => {
  useGlobalStore.setState({ guidedDatasetName: datasetName });
};

export const setFreeFormDatasetName = (datasetName) => {
  useGlobalStore.setState({ freeFormDatasetName: datasetName });
};

export const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  useGlobalStore.setState({ guidedDatasetSubtitle: datasetSubtitle });
};

export const setDatasetType = (datasetType) => {
  useGlobalStore.setState({ datasetType });
};

export const addHiddenGuidedModeSection = (sectionId) => {
  useGlobalStore.setState((state) => {
    if (!state.hiddenGuidedModeSections.includes(sectionId)) {
      state.hiddenGuidedModeSections.push(sectionId);
    }
  });
};

export const removeHiddenGuidedModeSection = (sectionId) => {
  useGlobalStore.setState((state) => {
    const index = state.hiddenGuidedModeSections.indexOf(sectionId);
    if (index !== -1) {
      state.hiddenGuidedModeSections.splice(index, 1);
    }
  });
};

export const setManifestFileGenerationDisabled = (disabled) => {
  useGlobalStore.setState({ manifestFileGenerationDisabled: disabled });
};

export const setCurationMode = (curationMode) => {
  useGlobalStore.setState({ curationMode });
};
