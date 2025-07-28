import useGlobalStore from "../globalStore";
import { produce } from "immer";

export const modalitiesSlice = (set) => ({
  selectedModalities: [],
});

export const setSelectedModalities = (selectedModalities) => {
  useGlobalStore.setState({
    selectedModalities,
  });
};

export const modalityIsSelected = (modality) => {
  return useGlobalStore((state) => state.selectedModalities.includes(modality));
};

export const toggleModalitySelection = (modality) => {
  useGlobalStore.setState(
    produce((state) => {
      if (state.selectedModalities.includes(modality)) {
        state.selectedModalities = state.selectedModalities.filter((m) => m !== modality);
      } else {
        state.selectedModalities.push(modality);
      }
    })
  );
};
