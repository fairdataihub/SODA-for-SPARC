import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImagePaths: [],
  microscopyImagesUploadableToBioLucida: [],
  microscopyImagesSelectedToBeUploadedToBioLucida: [],
});

export const setPotentialMicroscopyImages = (potentialMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.potentialMicroscopyImages = potentialMicroscopyImages;
    })
  );
};

export const setConfirmedMicroscopyImagePaths = (confirmedMicroscopyImagePaths) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = confirmedMicroscopyImagePaths;
    })
  );
};

export const designateImageAsMicroscopyImage = (microscopyImage) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = [
        ...state.confirmedMicroscopyImagePaths,
        microscopyImage.filePath,
      ];
    })
  );
};

export const undesignateImageAsMicroscopyImage = (microscopyImage) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = state.confirmedMicroscopyImagePaths.filter(
        (existingMicroscopyImagePath) => existingMicroscopyImagePath !== microscopyImage.filePath
      );
    })
  );
};

export const setMicroscopyImagesUploadableToBioLucida = (microscopyImagesUploadableToBioLucida) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesUploadableToBioLucida = microscopyImagesUploadableToBioLucida;
    })
  );
};

export const addMicroscopyImageToBeUploadedToBioLucida = (filePath) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesSelectedToBeUploadedToBioLucida = [
        ...state.microscopyImagesSelectedToBeUploadedToBioLucida,
        filePath,
      ];
    })
  );
};

export const removeMicroscopyImageToBeUploadedToBioLucida = (filePath) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesSelectedToBeUploadedToBioLucida =
        state.microscopyImagesSelectedToBeUploadedToBioLucida.filter(
          (existingFilePath) => existingFilePath !== filePath
        );
    })
  );
};
