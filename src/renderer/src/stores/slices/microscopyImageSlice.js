import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImagePaths: [],
  microscopyImagesUploadableToBioLucida: [],
  microscopyImagesSelectedToBeUploadedToBioLucida: [],
  imagesSelectedToBeUploadedToBioLucida: [],
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

export const designateImageAsMicroscopyImage = (imagePath) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = [...state.confirmedMicroscopyImagePaths, imagePath];
    })
  );
};

export const undesignateImageAsMicroscopyImage = (imagePath) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = state.confirmedMicroscopyImagePaths.filter(
        (existingMicroscopyImagePath) => existingMicroscopyImagePath !== imagePath
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

export const setImagesSelectedToBeUploadedToBioLucida = (imagePaths) => {
  useGlobalStore.setState(
    produce((state) => {
      state.imagesSelectedToBeUploadedToBioLucida = imagePaths;
    })
  );
};
