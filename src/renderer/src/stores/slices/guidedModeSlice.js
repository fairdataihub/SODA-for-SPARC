import useGlobalStore from "../globalStore";

export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
  datasetType: null,
  hiddenGuidedModeSections: [],
  dataStandard: null,
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

export const setDataStandard = (dataStandard) => {
  console.log("Setting store data standard to:", dataStandard);
  useGlobalStore.setState({ dataStandard });
};
