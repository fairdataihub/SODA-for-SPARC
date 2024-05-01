import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImagePaths: [],
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

export const setMicroscopyImagesUploadableToBioLucida = (imageObjs) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesSelectedToBeUploadedToBioLucida = imageObjs;
    })
  );
};

export const addImageToBioLucidaUploadList = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesSelectedToBeUploadedToBioLucida = [
        ...state.microscopyImagesSelectedToBeUploadedToBioLucida,
        imageObj,
      ];
    })
  );
};

export const removeImageFromBioLucidaUploadList = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      state.microscopyImagesSelectedToBeUploadedToBioLucida =
        state.microscopyImagesSelectedToBeUploadedToBioLucida.filter(
          (existingMicroscopyImagePath) =>
            existingMicroscopyImagePath.filePath !== imageObj.filePath
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
