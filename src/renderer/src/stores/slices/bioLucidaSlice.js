import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const bioLucidaSlice = (set) => ({
  bioLucidaImages: [],
  setBioLucidaImages: (images) => {
    set((state) => {
      state.bioLucidaImages = images;
    });
  },
  addBioLucidaImage: (image) => {
    set((state) => {
      state.bioLucidaImages = [...state.bioLucidaImages, image];
    });
  },
  removeBioLucidaImage: (image) => {
    set((state) => {
      state.bioLucidaImages = state.bioLucidaImages.filter(
        (existingImage) => existingImage.filePath !== image.filePath
      );
    });
  },
  chooseFiftyRandomBioLucidaImages: () => {
    const getRandomElements = (arr, n) => {
      return arr.sort(() => 0.5 - Math.random()).slice(0, n);
    };
    set((state) => {
      state.bioLucidaImages = getRandomElements(state.confirmedMicroscopyImages, 50);
    });
  },
});
