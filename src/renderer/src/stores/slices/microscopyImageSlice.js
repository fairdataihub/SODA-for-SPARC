import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImages: [],
  microscopyImagesSelectedToBeUploadedToBioLucida: [],
});

export const setPotentialMicroscopyImages = (potentialMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.potentialMicroscopyImages = potentialMicroscopyImages;
    })
  );
};

export const setConfirmedMicroscopyImages = (confirmedMicroscopyImages) => {
  console.log("setConfirmedMicroscopyImages", confirmedMicroscopyImages);
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImages = confirmedMicroscopyImages;
    })
  );
};

export const designateImageAsMicroscopyImage = (imageObj) => {
  console.log("designateImageAsMicroscopyImage", imageObj);
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImages = [...state.confirmedMicroscopyImages, imageObj];
    })
  );
};

export const undesignateImageAsMicroscopyImage = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImages = state.confirmedMicroscopyImages.filter(
        (existingMicroscopyImageObj) => existingMicroscopyImageObj.filePath !== imageObj.filePath
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
