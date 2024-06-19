import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImages: [],
  confirmMicroscopySearchInput: "",
  microscopyImagesSelectedToBeUploadedToBioLucida: [],
});

export const setPotentialMicroscopyImages = (potentialMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.potentialMicroscopyImages = potentialMicroscopyImages;
    })
  );
};

export const setConfirmMicroscopySearchInput = (searchInput) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmMicroscopySearchInput = searchInput;
    })
  );
};

export const setConfirmedMicroscopyImages = (confirmedMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImages = confirmedMicroscopyImages;
    })
  );
};

export const designateImageAsMicroscopyImage = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.confirmedMicroscopyImages.some((img) => img.filePath === imageObj.filePath)) {
        state.confirmedMicroscopyImages.push(imageObj);
      } else {
        console.log("Image already exists in confirmedMicroscopyImages");
      }
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
      state.microscopyImagesSelectedToBeUploadedToBioLucida.push(imageObj);
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
