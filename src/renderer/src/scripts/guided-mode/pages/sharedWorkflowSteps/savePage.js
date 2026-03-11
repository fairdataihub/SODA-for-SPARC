import { isCheckboxCardChecked } from "../../../../stores/slices/checkboxCardSlice";
import useGlobalStore from "../../../../stores/globalStore";
import {
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "../../../guided-mode/pages/navigationUtils/pageSkipping";
import {
  setCheckboxCardChecked,
  setCheckboxCardUnchecked,
} from "../../../../stores/slices/checkboxCardSlice";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces";

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
    let prefix;
    if (pageBeingLeftID === "guided-pennsieve-generate-target-tab") {
      prefix = "gm";
    } else {
      prefix = "ffm";
    }
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
    } else {
      console.log(
        `User selected to generate on ${
          generateOnNewPennsieveDatasetCardChecked ? "a new" : "an existing"
        } Pennsieve dataset.`
      );
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
    setCheckboxCardUnchecked(`${prefix}-generate-on-new-pennsieve-dataset`);
    setCheckboxCardUnchecked(`${prefix}-generate-on-existing-pennsieve-dataset`);
  }
};
