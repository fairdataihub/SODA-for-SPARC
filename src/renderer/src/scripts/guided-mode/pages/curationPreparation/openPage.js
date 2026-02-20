import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "./utils.js";
// Import state management stores
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { initializeGuidedDatasetObject } from "../../utils/sodaJSONObj.js";
import { guidedResetSkippedPages } from "../navigationUtils/pageSkipping.js";

export const openPageCurationPreparation = async (targetPageID) => {
  if (targetPageID === "ffm-select-starting-point-tab") {
    initializeGuidedDatasetObject();
    guidedResetSkippedPages("ffm");
  }
  if (targetPageID === "guided-select-starting-point-tab") {
    initializeGuidedDatasetObject();
    guidedResetSkippedPages("gm");
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
