import useGlobalStore from "../globalStore";
import { produce } from "immer";
export const guidedModeSlice = (set) => ({
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
  awardNumber: "",
});

export const setGuidedDatasetName = (datasetName) => {
  useGlobalStore.setState(
    produce((state) => {
      state.guidedDatasetName = datasetName;
    })
  );
};

export const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  useGlobalStore.setState(
    produce((state) => {
      state.guidedDatasetSubtitle = datasetSubtitle;
    })
  );
};

export const setAwardNumber = (awardNumber) => {
  useGlobalStore.setState(
    produce((state) => {
      state.awardNumber = awardNumber;
    })
  );
};
