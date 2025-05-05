import { guidedSkipPage, guidedUnSkipPage } from "../navigationUtils/pageSkipping";
import { getGuidedDatasetName, getGuidedDatasetSubtitle } from "../curationPreparation/utils";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../../stores/slices/guidedModeSlice";
import { guidedUpdateFolderStructureUI } from "./utils";
export const openPageDatasetStructure = async (targetPageID) => {
  if (targetPageID === "guided-dataset-structure-intro-tab") {
    // Handle whether or not the spreadsheet importation page should be skipped
    // Note: this is done here to centralize the logic for skipping the page
    // The page is unskipped only if the user has not added any subjects,
    // indicated that they will be adding subjects, and the user is not starting from Pennsieve
    if (
      window.getExistingSubjectNames().length === 0 &&
      window.sodaJSONObj["starting-point"]["origin"] != "ps" &&
      window.sodaJSONObj["button-config"]["dataset-contains-subjects"] === "yes"
    ) {
      guidedUnSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    } else {
      guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    }
  }

  // Add handlers for other pages without componentType
  if (targetPageID === "guided-unstructured-data-import-tab") {
    guidedUpdateFolderStructureUI("data/");
  }
  if (targetPageID === "guided-entity-addition-method-selection-tab") {
    // Logic for entity addition method selection page
    console.log("Opening entity addition method selection page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "guided-manifest-file-generation-tab") {
    // Logic for manifest file generation page
    console.log("Opening manifest file generation page");
    // Page-specific initialization code will go here
  }

  if (targetPageID === "dataset-structure-review-tab") {
    // Logic for dataset structure review page
    console.log("Opening dataset structure review page");
    // Page-specific initialization code will go here
  }
};
