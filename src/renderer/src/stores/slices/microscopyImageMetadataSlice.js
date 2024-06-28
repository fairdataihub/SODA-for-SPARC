import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const microscopyImageMetadataSlice = (set) => ({
  selectedImageFileName: "sub-a-img-1.tif",
  setSelectedImageFileName: (selectedImageFileName) => {
    set((state) => {
      state.selectedImageFileName = selectedImageFileName;
    });
  },

  magnification: "",
  setMagnification: (magnification) => {
    set((state) => {
      state.magnification = magnification;
    });
  },

  channelName: "",
  setChannelName: (channelName) => {
    set((state) => {
      state.channelName = channelName;
    });
  },

  channelColor: "",
  setChannelColor: (channelColor) => {
    set((state) => {
      state.channelColor = channelColor;
    });
  },

  spacingX: "",
  setSpacingX: (spacingX) => {
    set((state) => {
      state.spacingX = spacingX;
    });
  },

  spacingY: "",
  setSpacingY: (spacingY) => {
    set((state) => {
      state.spacingY = spacingY;
    });
  },

  copyImageMetadataModeActive: false,
  setCopyImageMetadataModeActive: (copyImageMetadataModeActive) => {
    set((state) => {
      state.copyImageMetadataModeActive = copyImageMetadataModeActive;
    });
  },

  imageMetadataSearchValue: "",
  setImageMetadataSearchValue: (imageMetadataSearchValue) => {
    set((state) => {
      state.imageMetadataSearchValue = imageMetadataSearchValue;
    });
  },

  imageMetadataStore: {
    "sub-a-img-1.tif": {
      channelName: "DAPI",
      channelColor: "blue",
      magnification: "20x",
      spacingX: "0.1",
      spacingY: "0.1",
    },
    "sub-a-img-2.tif": {
      channelName: "GFP",
      channelColor: "green",
      magnification: "20x",
      spacingX: "0.1",
      spacingY: "0.1",
    },
    "sub-a-img-3.tif": {
      channelName: "RFP",
      channelColor: "red",
      magnification: "20x",
      spacingX: "0.1",
      spacingY: "0.1",
    },
  },

  setImageMetadata: (imageFileName, imageMetadataKey, imageMetadataValue) => {
    set(
      produce((state) => {
        state.imageMetadataStore[imageFileName][imageMetadataKey] = imageMetadataValue;
      })
    );
  },

  imageMetadataFields: [
    {
      key: "channelName",
      label: "Channel Name",
    },
    {
      key: "channelColor",
      label: "Channel Color",
    },
    {
      key: "magnification",
      label: "Magnification",
    },
    {
      key: "spacingX",
      label: "Spacing X",
    },
    {
      key: "spacingY",
      label: "Spacing Y",
    },
  ],
});
