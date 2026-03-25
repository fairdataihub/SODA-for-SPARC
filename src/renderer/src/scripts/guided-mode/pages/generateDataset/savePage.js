import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import {
  isCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../../stores/slices/checkboxCardSlice";
import { getSodaTextInputValue } from "../../../../stores/slices/sodaTextInputSlice";

import { guidedGetCurrentUserWorkSpace } from "../../../guided-mode/workspaces/workspaces";
export const savePageGenerateDataset = async (pageBeingLeftID) => {
  const errorArray = [];
  if (pageBeingLeftID === "guided-dataset-generation-options-tab") {
    const generateDatasetLocallyCardChecked = isCheckboxCardChecked("generate-dataset-locally");
    const generateDatasetOnPennsieveCardChecked = isCheckboxCardChecked(
      "generate-dataset-on-pennsieve"
    );
    if (!generateDatasetLocallyCardChecked && !generateDatasetOnPennsieveCardChecked) {
      errorArray.push({
        type: "notyf",
        message: "You must select at least one dataset generation option.",
      });
      throw errorArray;
    }
    window.sodaJSONObj["generate-dataset-locally"] = generateDatasetLocallyCardChecked;
    window.sodaJSONObj["generate-dataset-on-pennsieve"] = generateDatasetOnPennsieveCardChecked;

    const localGenerationPageSetClass = "local-generation-page-set";
    const pennsieveGenerationPageSetClass = "pennsieve-generation-page-set";
    // If the user selected to generate the dataset locally, UnSkip the local generation page set
    // Otherwise, skip it
    if (generateDatasetLocallyCardChecked) {
      guidedUnSkipPageSet(localGenerationPageSetClass);
    } else {
      guidedSkipPageSet(localGenerationPageSetClass);
    }
    // If the user selected to generate the dataset on Pennsieve, UnSkip the Pennsieve generation page set
    // Otherwise, skip it
    if (generateDatasetOnPennsieveCardChecked) {
      guidedUnSkipPageSet(pennsieveGenerationPageSetClass);
    } else {
      guidedSkipPageSet(pennsieveGenerationPageSetClass);
    }
  }

  if (pageBeingLeftID === "guided-pennsieve-settings-tab") {
    // Handle saving the Pennsieve dataset name
    const pennsieveDatasetName = getSodaTextInputValue("pennsieve-dataset-name");
    if (!pennsieveDatasetName) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset name for Pennsieve.",
      });
      throw errorArray;
    }
    const pennsieveDatasetNameContainsForbiddenCharacters =
      window.evaluateStringAgainstSdsRequirements(
        pennsieveDatasetName,
        "string-contains-forbidden-pennsieve-dataset-name-characters"
      );
    if (pennsieveDatasetNameContainsForbiddenCharacters) {
      errorArray.push({
        type: "notyf",
        message:
          'Pennsieve dataset names cannot contain any of the following characters: / ? % * : | " < > .',
      });
      throw errorArray;
    }
    window.sodaJSONObj["generate-dataset"]["dataset-name"] = pennsieveDatasetName;

    // Handle saving the Pennsieve dataset subtitle
    const pennsieveDatasetSubtitle = getSodaTextInputValue("pennsieve-dataset-subtitle");
    if (!pennsieveDatasetSubtitle) {
      errorArray.push({
        type: "notyf",
        message: "Please enter a dataset subtitle for Pennsieve.",
      });
      throw errorArray;
    }
    window.sodaJSONObj["pennsieve-dataset-subtitle"] = pennsieveDatasetSubtitle;
  }

  if (pageBeingLeftID === "guided-dataset-generation-tab") {
    if (window.sodaJSONObj["curation-mode"] === "free-form") {
      const datasetSaveFilePath = window.sodaJSONObj["save-file-path"];

      if (datasetSaveFilePath && window.fs.existsSync(datasetSaveFilePath)) {
        try {
          window.fs.unlinkSync(datasetSaveFilePath);
          console.log(`Deleted free-form progress file: ${datasetSaveFilePath}`);
        } catch (error) {
          console.error(`Failed to delete free-form progress file ${datasetSaveFilePath}:`, error);
        }
      }
    }
  }
};
