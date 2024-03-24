import { create } from "zustand";

const useGuidedModeStore = create((set) => ({
  datasetName: "",
  setDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  datasetSubtitle: "",
  setDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),

  selectedBioLucidaImages: [],
  setSelectedBioLucidaImages: (selectedBioLucidaImages) => set(() => ({ selectedBioLucidaImages: selectedBioLucidaImages })),

}));




export default useGuidedModeStore;
