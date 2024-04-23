import useGlobalStore from "../globalStore";
import { produce } from "immer";
export const guidedModeSlice = (set) => ({
  currentGuidedModePage: null,
  guidedDatasetName: "",
  guidedDatasetSubtitle: "",
});

export const setGuidedModePage = (guidedModePageName) => {
  useGlobalStore.setState(
    produce((state) => {
      state.currentGuidedModePage = guidedModePageName;
    })
  );
};

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
