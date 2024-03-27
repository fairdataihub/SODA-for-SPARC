import { create } from "zustand";

const useGuidedModeStore = create((set) => ({
  datasetName: "",
  setDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  datasetSubtitle: "",
  setDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),

  microscopyImagesSelectedToBeUploadedToBioLucida: [],
  addMicroscopyImageToBeUploadedToBioLucida: (filePath) =>
    set((state) => ({
      microscopyImagesSelectedToBeUploadedToBioLucida: [
        ...state.microscopyImagesSelectedToBeUploadedToBioLucida,
        filePath,
      ],
    })),

  removeMicroscopyImageToBeUploadedToBioLucida: (filePath) =>
    set((state) => ({
      microscopyImagesSelectedToBeUploadedToBioLucida:
        state.microscopyImagesSelectedToBeUploadedToBioLucida.filter(
          (existingFilePath) => existingFilePath !== filePath
        ),
    })),

  microscopyImagesUploadableToBioLucida: [],
  setMicroscopyImagesUploadableToBioLucida: (microscopyImagesUploadableToBioLucida) =>
    set(() => ({ microscopyImagesUploadableToBioLucida: microscopyImagesUploadableToBioLucida })),
}));

export default useGuidedModeStore;
