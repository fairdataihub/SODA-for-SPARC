import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPage,
  guidedUnSkipPage,
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../../stores/slices/checkboxCardSlice";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces";
import { countFilesInDatasetStructure } from "../../generateDataset/generate";
import { createOrUpdateProgressFileSaveInfo } from "../../resumeProgress/progressFile";
import api from "../../../others/api/api";

export const savePageSharedWorkflowSteps = async (pageBeingLeftID) => {
  const errorArray = [];

  if (
    pageBeingLeftID === "gm-pennsieve-login-tab" ||
    pageBeingLeftID === "ffm-pennsieve-login-tab"
  ) {
    const prefix = pageBeingLeftID === "gm-pennsieve-login-tab" ? "gm" : "ffm";
    const confirmAccountButtonId = `${prefix}-confirm-pennsieve-account-button`;
    const confirmOrgButtonId = `${prefix}-confirm-pennsieve-organization-button`;

    // Check if the user has confirmed their Pennsieve account
    const userConfirmedPennsieveAccount = isCheckboxCardChecked(confirmAccountButtonId);
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
    const userConfirmedOrganization = isCheckboxCardChecked(confirmOrgButtonId);
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
      const agentCheckElementId = `${prefix}-mode-post-log-in-pennsieve-agent-check`;
      window.unHideAndSmoothScrollToElement(agentCheckElementId);
      errorArray.push({
        type: "notyf",
        message: "The Pennsieve Agent must be installed and running to continue.",
      });
      throw errorArray;
    }
    window.sodaJSONObj["last-confirmed-ps-account-details"] = window.defaultBfAccount;
    window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] = userSelectedWorkSpace;
  }

  if (
    pageBeingLeftID === "guided-pennsieve-generate-target-tab" ||
    pageBeingLeftID === "ffm-pennsieve-generate-target-tab"
  ) {
    const prefix = pageBeingLeftID === "guided-pennsieve-generate-target-tab" ? "gm" : "ffm";

    const generateOnNewPennsieveDatasetCardChecked = isCheckboxCardChecked(
      `${prefix}-generate-on-new-pennsieve-dataset`
    );
    const generateOnExistingPennsieveDatasetCardChecked = isCheckboxCardChecked(
      `${prefix}-generate-on-existing-pennsieve-dataset`
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

    const isFreeform = prefix === "ffm";

    if (generateOnNewPennsieveDatasetCardChecked) {
      // Clear previous selection if switching from existing -> new
      if (window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"]) {
        delete window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
        delete window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"];
        delete window.sodaJSONObj["previously-selected-dataset-id-to-upload-data-to"];
      }

      window.sodaJSONObj["pennsieve-generation-target"] = "new";

      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": null,
        destination: "ps",
        "generate-option": "new",
        "if-existing": "new",
        "if-existing-files": "new",
      };

      if (isFreeform) {
        const freeformDatasetName = useGlobalStore.getState().freeFormDatasetName;

        if (!freeformDatasetName) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset name before continuing.",
          });
          throw errorArray;
        }
        // Create a new progress file with the new dataset name, or update the existing progress
        // file if it already exists and was changed
        try {
          await createOrUpdateProgressFileSaveInfo(freeformDatasetName);
        } catch (error) {
          errorArray.push({
            type: "notyf",
            message: error.message,
          });
          throw errorArray;
        }

        // For free-form datasets, set the digital metadata name and the generate-dataset dataset-name
        // because they do not get set elsewhere in free-form mode.
        window.sodaJSONObj["digital-metadata"]["name"] = freeformDatasetName;
        window.sodaJSONObj["generate-dataset"]["dataset-name"] = freeformDatasetName;

        guidedSkipPage("ffm-existing-files-handling-tab");
        guidedSkipPage("guided-pennsieve-settings-tab");
      } else {
        guidedUnSkipPage("guided-pennsieve-settings-tab");
      }
    }

    if (generateOnExistingPennsieveDatasetCardChecked) {
      while (useGlobalStore.getState().isLoadingPennsieveDatasets) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      window.sodaJSONObj["pennsieve-generation-target"] = "existing";

      const selectedDatasetIdToUploadDataTo =
        useGlobalStore.getState().selectedDatasetIdToUploadDataTo;
      const selectedDatasetNameToUploadDataTo =
        useGlobalStore.getState().selectedDatasetNameToUploadDataTo;
      const selectedDatasetIntIdToUploadTo =
        useGlobalStore.getState().selectedDatasetIntIdToUploadTo;

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

      window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"] = selectedDatasetIntIdToUploadTo;

      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": selectedDatasetNameToUploadDataTo,
        destination: "ps",
        "generate-option": "existing-ps",
        "if-existing": "merge",
        "if-existing-files": "replace",
        "existing-dataset-id": selectedDatasetIdToUploadDataTo,
      };

      guidedSkipPage("guided-pennsieve-settings-tab");

      if (isFreeform) {
        // Create a new progress file name using the dataset on Pennsieve's name, or update
        // the existing progress file if it already exists and was changed
        try {
          await createOrUpdateProgressFileSaveInfo(selectedDatasetNameToUploadDataTo);
        } catch (error) {
          errorArray.push({
            type: "notyf",
            message: error.message,
          });
          throw errorArray;
        }
        window.sodaJSONObj["digital-metadata"]["name"] = selectedDatasetNameToUploadDataTo;

        const datasetIsEmpty = await api.isDatasetEmpty(selectedDatasetIdToUploadDataTo);
        if (datasetIsEmpty) {
          guidedSkipPage("ffm-existing-files-handling-tab");
        } else {
          guidedUnSkipPage("ffm-existing-files-handling-tab");
        }
      }
    }

    // Reset checkboxes (React batching workaround)
    setCheckboxCardUnchecked(`${prefix}-generate-on-new-pennsieve-dataset`);
    setCheckboxCardUnchecked(`${prefix}-generate-on-existing-pennsieve-dataset`);
  }

  if (
    pageBeingLeftID === "guided-unstructured-data-import-tab" ||
    pageBeingLeftID === "ffm-unstructured-data-import-tab"
  ) {
    // Count the files imported into the dataset to make sure they imported something
    const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
    if (datasetFileCount === 0) {
      errorArray.push({
        type: "notyf",
        message:
          "Please select the data you would like to include in the dataset before continuing.",
      });
      throw errorArray;
    }
  }
};
