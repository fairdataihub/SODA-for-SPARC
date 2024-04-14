export const guidedModeSlice = (set) => ({
  currentGuidedModePage: null,
  setCurrentGuidedModePage: (currentGuidedModePage) =>
    set(() => ({ currentGuidedModePage: currentGuidedModePage })),

  datasetName: "",
  setDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  datasetSubtitle: "",
  setDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),
});
