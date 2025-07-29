import { countFilesInDatasetStructure } from "../../../utils/datasetStructure";
import useGlobalStore from "../../../../stores/globalStore";
import { contentOptionsMap } from "../../../../components/pages/DatasetContentSelector";
import {
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
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
    console.log("saving the pennsieve target tab");
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
    window.sodaJSONObj["pennsieve-dataset-name"] = pennsieveDatasetName;

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
