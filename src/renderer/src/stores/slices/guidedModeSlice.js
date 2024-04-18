export const guidedModeSlice = (set) => ({
  currentGuidedModePage: null,
  setCurrentGuidedModePage: (currentGuidedModePage) =>
    set(() => ({ currentGuidedModePage: currentGuidedModePage })),

  guidedDatasetName: "",
  guidedSetDatasetName: (datasetName) => set(() => ({ guidedDatasetName: datasetName })),

  guidedDatasetSubtitle: "",
  setGuidedDatasetSubtitle: (datasetSubtitle) =>
    set(() => ({ guidedDatasetSubtitle: datasetSubtitle })),
});
