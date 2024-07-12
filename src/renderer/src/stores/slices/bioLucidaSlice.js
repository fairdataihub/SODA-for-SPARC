import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const bioLucidaSlice = (set) => ({
  bioLucidaImageSelectSearchInput: "",
  setBioLucidaImageSelectSearchInput: (searchInput) => {
    set((state) => {
      state.bioLucidaImageSelectSearchInput = searchInput.trim();
    });
  },

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
});
