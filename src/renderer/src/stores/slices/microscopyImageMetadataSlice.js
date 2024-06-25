import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageMetadataSlice = (set) => ({
  selectedImageFileName: "sub-a-img-1.tif",
  magnification: "",
  channelName: "",
  channelColor: "",
  spacingX: "",
  spacingY: "",
});

export const setSelectedImageFileName = (selectedImageFileName) => {
  set(
    produce((state) => {
      state.selectedImageFileName = selectedImageFileName;
    })
  );
};

export const setChannelName = (channelName) => {
  set(
    produce((state) => {
      state.channelName = channelName;
    })
  );
};

export const setChannelColor = (channelColor) => {
  set(
    produce((state) => {
      state.channelColor = channelColor;
    })
  );
};

export const setMagnification = (magnification) => {
  set(
    produce((state) => {
      state.magnification = magnification;
    })
  );
};

export const setSpacingX = (spacingX) => {
  set(
    produce((state) => {
      state.spacingX = spacingX;
    })
  );
};

export const setSpacingY = (spacingY) => {
  set(
    produce((state) => {
      state.spacingY = spacingY;
    })
  );
};
