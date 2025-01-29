import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const datasetContentSelectorSlice = (set) => ({
  selectedDatasetContent: [],
});

export const toggleComponent = (value) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.selectedComponents.includes(value)) {
        state.selectedComponents = state.selectedComponents.filter((item) => item !== value);
      } else {
        state.selectedComponents.push(value);
      }
    })
  );
};

export const resetSelection = () => {
  useGlobalStore.setState(
    produce((state) => {
      state.selectedComponents = [];
    })
  );
};
