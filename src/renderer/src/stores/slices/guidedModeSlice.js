import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
  datasetType: null,
  hiddenGuidedModeSections: [],
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

export const addHiddenGuidedModeSection = (sectionId) => {
  console.log("HIDING guided mode section:", sectionId);

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
