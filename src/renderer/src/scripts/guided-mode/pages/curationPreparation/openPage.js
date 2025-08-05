import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "./utils.js";
// Import state management stores
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { guidedCreateSodaJSONObj } from "../../utils/sodaJSONObj.js";
import { guidedResetSkippedPages } from "../navigationUtils/pageSkipping.js";

export const openPageCurationPreparation = async (targetPageID) => {
  if (targetPageID === "guided-select-starting-point-tab") {
    guidedCreateSodaJSONObj();
    guidedResetSkippedPages();
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
