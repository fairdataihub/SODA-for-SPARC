import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImages: [],
  deniedMicroscopyImages: [],
  confirmMicroscopySearchInput: "",
});

export const setPotentialMicroscopyImages = (potentialMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.potentialMicroscopyImages = potentialMicroscopyImages;
    })
  );
};

export const setDeniedMicroscopyImages = (deniedMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.deniedMicroscopyImages = deniedMicroscopyImages;
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
      state.deniedMicroscopyImages = state.deniedMicroscopyImages.filter(
        (existingMicroscopyImageObj) => existingMicroscopyImageObj.filePath !== imageObj.filePath
      );
    })
  );
};

export const undesignateImageAsMicroscopyImage = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      if (!state.deniedMicroscopyImages.some((img) => img.filePath === imageObj.filePath)) {
        state.deniedMicroscopyImages.push(imageObj);
      } else {
        console.log("Image already exists in deniedMicroscopyImages");
      }

      state.confirmedMicroscopyImages = state.confirmedMicroscopyImages.filter(
        (existingMicroscopyImageObj) => existingMicroscopyImageObj.filePath !== imageObj.filePath
      );
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
