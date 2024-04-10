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
  confirmedMicroscopyImagePaths: [],

  setPotentialMicroscopyImages: (potentialMicroscopyImages) =>
    set(() => ({
      potentialMicroscopyImages: potentialMicroscopyImages,
    })),
  setConfirmedMicroscopyImagePaths: (confirmedMicroscopyImagePaths) =>
    set(() => ({
      confirmedMicroscopyImagePaths: confirmedMicroscopyImagePaths,
    })),

  designateImageAsMicroscopyImage: (microscopyImage) =>
    set((state) => ({
      confirmedMicroscopyImagePaths: [
        ...state.confirmedMicroscopyImagePaths,
        microscopyImage.filePath,
      ],
    })),

  undesignateImageAsMicroscopyImage: (microscopyImage) =>
    set((state) => ({
      confirmedMicroscopyImagePaths: state.confirmedMicroscopyImagePaths.filter(
        (existingMicroscopyImagePath) => existingMicroscopyImagePath !== microscopyImage.filePath
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
