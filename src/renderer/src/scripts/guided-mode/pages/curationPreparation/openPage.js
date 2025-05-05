import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "./utils.js";
// Import state management stores
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { setDropdownState } from "../../../../stores/slices/dropDownSlice";
import api from "../../../others/api/api";
import { clientError } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { setPageLoadingState } from "../navigationUtils/pageLoading.js";
import { setSelectedEntities } from "../../../../stores/slices/datasetContentSelectorSlice.js";
import client from "../../../client";

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
