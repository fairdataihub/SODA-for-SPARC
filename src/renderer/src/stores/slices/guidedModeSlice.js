export const guidedModeSlice = (set) => ({
  currentGuidedModePage: null,
  setCurrentGuidedModePage: (currentGuidedModePage) =>
    set(() => ({ currentGuidedModePage: currentGuidedModePage })),

  guidedDatasetName: "",
  guidedSetDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  guidedDatasetSubtitle: "",
  setGuidedDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),
});
