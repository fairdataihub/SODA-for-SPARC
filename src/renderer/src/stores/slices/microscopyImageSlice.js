import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageSlice = (set) => ({
  potentialMicroscopyImages: [],
  confirmedMicroscopyImages: [],
  confirmMicroscopySearchInput: "",
});

export const setPotentialMicroscopyImages = (potentialMicroscopyImages) => {
  useGlobalStore.setState(
    produce((state) => {
      state.potentialMicroscopyImages = potentialMicroscopyImages;
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

export const removeMicroscopyImageDesignation = (imageObj) => {
  useGlobalStore.setState(
    produce((state) => {
      state.confirmedMicroscopyImages = state.confirmedMicroscopyImages.filter(
        (img) => img.filePath !== imageObj.filePath
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
