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

  if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
    const userConfirmedPennsieveAccount = isCheckboxCardChecked(
      "guided-confirm-pennsieve-account-button"
    );
    if (!userConfirmedPennsieveAccount) {
      if (!window.defaultBfAccount) {
        // If the user has not logged in, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please sign in to Pennsieve before continuing",
        });
        throw errorArray;
      } else {
        // If the user has not confirmed their account, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please confirm your account before continuing",
        });
        throw errorArray;
      }
    }
    // Check if the user has confirmed their organization
    const userConfirmedOrganization = isCheckboxCardChecked(
      "guided-confirm-pennsieve-organization-button"
    );
    if (!userConfirmedOrganization) {
      // If the user has not confirmed their organization, throw an error
      errorArray.push({
        type: "notyf",
        message: "Please confirm your organization before continuing",
      });
      throw errorArray;
    }
    const userSelectedWorkSpace = guidedGetCurrentUserWorkSpace();
    if (!userSelectedWorkSpace) {
      // If the user has not selected an organization, throw an error
      errorArray.push({
        type: "notyf",
        message: "Please select an organization before continuing",
      });
      throw errorArray;
    } else {
      window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = userSelectedWorkSpace;
    }
    if (userSelectedWorkSpace === "Welcome") {
      errorArray.push({
        type: "notyf",
        message: "Please change to a workspace other than 'Welcome' before continuing",
      });
      throw errorArray;
    }

    const pennsieveAgentChecksPassed = await window.getPennsieveAgentStatus();
    if (!pennsieveAgentChecksPassed) {
      window.unHideAndSmoothScrollToElement("guided-mode-post-log-in-pennsieve-agent-check");
      errorArray.push({
        type: "notyf",
        message: "The Pennsieve Agent must be installed and running to continue.",
      });
      throw errorArray;
    }
    window.sodaJSONObj["last-confirmed-ps-account-details"] = window.defaultBfAccount;
    window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] = userSelectedWorkSpace;
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
      // the previous pennsieve dataset id and int id to ensure it's not used in the new dataset generation
      if (window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"]) {
        if ("pennsieve-dataset-id" in window.sodaJSONObj["digital-metadata"]) {
          delete window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
        }
        if ("pennsieve-int-id" in window.sodaJSONObj["digital-metadata"]) {
          delete window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"];
        }
        delete window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"];
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
      window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"] =
        useGlobalStore.getState().selectedDatasetIntIdToUploadTo;
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
};
