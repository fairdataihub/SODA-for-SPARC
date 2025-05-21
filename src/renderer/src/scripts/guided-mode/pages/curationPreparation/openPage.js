import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "./utils.js";
// Import state management stores
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";

export const openPageCurationPreparation = async (targetPageID) => {
  if (targetPageID === "guided-select-starting-point-tab") {
    // Hide the pennsieve dataset import progress circle
    const importProgressCircle = document.querySelector(
      "#guided_loading_pennsieve_dataset-organize"
    );

    importProgressCircle.classList.add("hidden");
  }

  if (targetPageID === "guided-name-subtitle-tab") {
    // Get the dataset name and subtitle from the JSON obj
    const datasetName = getGuidedDatasetName() || "";

    // Set the zustand datasetName state value to the dataset name
    setGuidedDatasetName(datasetName);

    const datasetSubtitle = getGuidedDatasetSubtitle();
    setGuidedDatasetSubtitle(datasetSubtitle);
  }
};
