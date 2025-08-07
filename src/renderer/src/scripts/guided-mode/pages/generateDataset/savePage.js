import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import {
  isCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../../stores/slices/checkboxCardSlice";
import { getSodaTextInputValue } from "../../../../stores/slices/sodaTextInputSlice";
export const savePageGenerateDataset = async (pageBeingLeftID) => {
  const errorArray = [];

  // Check if the page being left is part of a page set
  const pageBeingLeftElement = document.getElementById(pageBeingLeftID);
  const pageBeingLeftDataSet = pageBeingLeftElement.dataset;
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

  if (pageBeingLeftID === "guided-pennsieve-generate-target-tab") {
    const generateOnNewPennsieveDatasetCardChecked = isCheckboxCardChecked(
      "generate-on-new-pennsieve-dataset"
    );
    const generateOnExistingPennsieveDatasetCardChecked = isCheckboxCardChecked(
      "generate-on-existing-pennsieve-dataset"
    );

    if (
      !generateOnNewPennsieveDatasetCardChecked &&
      !generateOnExistingPennsieveDatasetCardChecked
    ) {
      errorArray.push({
        type: "notyf",
        message: "Please select where you would like to generate your dataset.",
      });
      throw errorArray;
    }

    if (generateOnNewPennsieveDatasetCardChecked) {
      // If the previous pennsieve generation target was set to "existing", we need to delete
      // the previous pennsieve dataset id to ensure it's not used in the new dataset generation
      if (window.sodaJSONObj["pennsieve-generation-target"] === "existing") {
        console.log("Removing old Pennsieve dataset ID from sodaJSONObj");
        delete window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      }

      window.sodaJSONObj["pennsieve-generation-target"] = "new";
      guidedUnSkipPageSet("new-pennsieve-dataset-config-page-set");
      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": null, // This will be set later in the new dataset config page
        destination: "ps",
        "generate-option": "new",
        "if-existing": "new",
        "if-existing-files": "new",
      };
    }
    if (generateOnExistingPennsieveDatasetCardChecked) {
      // If the datasets are still loading, wait for them to finish loading
      while (useGlobalStore.getState().isLoadingPennsieveDatasets) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      const selectedDatasetIdToUploadDataTo =
        useGlobalStore.getState().selectedDatasetIdToUploadDataTo;
      const selectedDatasetNameToUploadDataTo =
        useGlobalStore.getState().selectedDatasetNameToUploadDataTo;
      if (!selectedDatasetIdToUploadDataTo) {
        errorArray.push({
          type: "notyf",
          message: "Please select an existing Pennsieve dataset to upload data to.",
        });
        throw errorArray;
      }
      window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"] =
        selectedDatasetIdToUploadDataTo;
      window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] =
        selectedDatasetIdToUploadDataTo;
      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": selectedDatasetNameToUploadDataTo,
        destination: "ps",
        "generate-option": "existing-ps",
        "if-existing": "merge",
        "if-existing-files": "replace",
      };
      window.sodaJSONObj["pennsieve-generation-target"] = "existing";
      guidedSkipPageSet("new-pennsieve-dataset-config-page-set");
    }
    // (Hackish) Uncheck the checkboxes to make sure the events trigger when the page
    // is re-entered (this is necessary due to execution batching by React)
    setCheckboxCardUnchecked("generate-on-new-pennsieve-dataset");
    setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");
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

  if (pageBeingLeftID === "guided-assign-license-tab") {
    const licenseRadioButtonContainer = document.getElementById(
      "guided-license-radio-button-container"
    );
    // Get the button that contains the class selected
    const selectedLicenseButton = licenseRadioButtonContainer.getElementsByClassName("selected")[0];
    if (!selectedLicenseButton) {
      errorArray.push({
        type: "notyf",
        message: "Please select a license",
      });
      throw errorArray;
    }
    const selectedLicense = selectedLicenseButton.dataset.value;
    window.sodaJSONObj["digital-metadata"]["license"] = selectedLicense;
  }
};
