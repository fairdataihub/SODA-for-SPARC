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
  console.log("setConfirmedMicroscopyImagePaths", confirmedMicroscopyImagePaths);
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = confirmedMicroscopyImagePaths;
    })
  );
};

export const designateImageAsMicroscopyImage = (imageObj) => {
  console.log("designateImageAsMicroscopyImage", imageObj);
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = [...state.confirmedMicroscopyImagePaths, imageObj];
    })
  );
};

export const undesignateImageAsMicroscopyImage = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImagePaths = state.confirmedMicroscopyImagePaths.filter(
        (existingMicroscopyImagePath) => existingMicroscopyImagePath.filePath !== imageObj.filePath
      );
    })
  );
};

export const setMicroscopyImagesUploadableToBioLucida = (microscopyImagesUploadableToBioLucida) => {
  console.log("setMicroscopyImagesUploadableToBioLucida", microscopyImagesUploadableToBioLucida);
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
