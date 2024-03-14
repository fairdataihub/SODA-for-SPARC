import { create } from "zustand";

const useGuidedModeStore = create((set) => ({
  datasetName: "",
  setDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  datasetSubtitle: "",
  setDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),
}));

export default useGuidedModeStore;
