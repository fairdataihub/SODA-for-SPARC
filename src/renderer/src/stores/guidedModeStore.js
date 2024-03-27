import { create } from "zustand";

const useGuidedModeStore = create((set) => ({
  currentGuidedModePage: null,
  setCurrentGuidedModePage: (currentGuidedModePage) =>
    set(() => ({ currentGuidedModePage: currentGuidedModePage })),

  datasetName: "",
  setDatasetName: (datasetName) => set(() => ({ datasetName: datasetName })),

  datasetSubtitle: "",
  setDatasetSubtitle: (datasetSubtitle) => set(() => ({ datasetSubtitle: datasetSubtitle })),

  potentialMicroscopyImages: [],
  setPotentialMicroscopyImages: (potentialMicroscopyImages) =>
    set(() => ({ potentialMicroscopyImages: potentialMicroscopyImages })),

  confirmedMicroscopyImages: [],
  addPotentialMicroscopyImage: (potentialMicroscopyImage) =>
    set((state) => ({
      potentialMicroscopyImages: [...state.potentialMicroscopyImages, potentialMicroscopyImage],
    })),

  removePotentialMicroscopyImage: (potentialMicroscopyImage) =>
    set((state) => ({
      potentialMicroscopyImages: state.potentialMicroscopyImages.filter(
        (existingPotentialMicroscopyImage) =>
          existingPotentialMicroscopyImage.filePath !== potentialMicroscopyImage.filePath
      ),
    })),

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
