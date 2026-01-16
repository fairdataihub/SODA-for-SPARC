import Swal from "sweetalert2";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import {
  guidedSkipPage,
  getNonSkippedGuidedModePages,
} from "../pages/navigationUtils/pageSkipping";
import { guidedGetCurrentUserWorkSpace } from "../workspaces/workspaces";
import { getProgressFileData } from "./progressFile";

import { clientError } from "../../others/http-error-handler/error-handler";
import { swalShowInfo } from "../../utils/swal-utils";

import useGlobalStore from "../../../stores/globalStore";
import { getExistingSites } from "../../../stores/slices/datasetEntityStructureSlice";
import { get } from "jquery";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 *
 * @param {string} progressFileName - The name of the dataset associated with the save progress file the user wants to resume.
 * @description Read the given progress file and resume the Prepare Dataset Step-by-Step workflow where the user last left off.
 */
window.guidedResumeProgress = async (progressFileName) => {
  const loadingSwal = Swal.fire({
    title: "Resuming where you last left off",
    html: `
        <div class="guided--loading-div">
          <div class="lds-roller">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      `,
    width: 500,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: false,
  });

  // pause for a second to allow the loading screen to render
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const datasetResumeJsonObj = await getProgressFileData(progressFileName);
    // Datasets successfully uploaded will have the "dataset-successfully-uploaded-to-pennsieve" key
    const datasetHasAlreadyBeenSuccessfullyUploaded =
      datasetResumeJsonObj["dataset-successfully-uploaded-to-pennsieve"];

    const lastVersionOfSodaUsed = datasetResumeJsonObj["last-version-of-soda-used"];
    if (lastVersionOfSodaUsed < "16.0.0") {
      await swalShowInfo(
        "This dataset requires an older version of SODA to resume.",
        `This progress file was created before SODA adopted the SDS3 workflow.<br><br>
        To continue working on this dataset, download the final version of SODA that supports SDS2:<br><br>
        <a href="https://github.com/fairdataihub/SODA-for-SPARC/releases/tag/v15.4.0" target="_blank" rel="noopener noreferrer">
          Download SODA v15.4.0 (SDS2 support)
        </a>`
      );
      return;
    }
    // If the dataset had been previously successfully uploaded, check to make sure it exists on Pennsieve still.
    if (datasetHasAlreadyBeenSuccessfullyUploaded) {
      const previouslyUploadedDatasetId =
        datasetResumeJsonObj["digital-metadata"]["pennsieve-dataset-id"];
      const datasetToResumeExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
        previouslyUploadedDatasetId
      );
      if (!datasetToResumeExistsOnPennsieve) {
        throw new Error(`This dataset no longer exists on Pennsieve`);
      }
    }

    window.sodaJSONObj = datasetResumeJsonObj;

    //patches the sodajsonobj if it was created in a previous version of guided mode
    await patchPreviousGuidedModeVersions();

    window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];

    // Save the skipped pages in a temp variable since guidedTransitionFromHome will remove them
    const prevSessionSkikppedPages = [...window.sodaJSONObj["skipped-pages"]];

    // Reskip the pages from a previous session
    for (const pageID of prevSessionSkikppedPages) {
      guidedSkipPage(pageID);
    }

    // Skip this page incase it was not skipped in a previous session
    guidedSkipPage("guided-select-starting-point-tab");

    // pageToReturnTo will be set to the page the user will return to
    const pageToReturnTo = await guidedGetPageToReturnTo(window.sodaJSONObj);

    await window.openPage(pageToReturnTo);

    // Close the loading screen, the user should be on the page they left off on now
    loadingSwal.close();
  } catch (error) {
    clientError(error);
    loadingSwal.close();
    await Swal.fire({
      icon: "info",
      title: "This dataset is not able to be resumed",
      html: `${error.message}`,
      width: 500,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `I understand`,
      focusConfirm: true,
      allowOutsideClick: false,
    });
  }
};

/**
 *
 * @description - Helper function for resuming a saved progress file in the Prepare Dataset Step-by-Step workflow. Determines if a user
 *                can continue where they last left off or if a change has occurred that requires they start on a different page.
 */
const guidedGetPageToReturnTo = async () => {
  // Set by openPage function
  const usersPageBeforeExit = window.sodaJSONObj["page-before-exit"];
  //If the dataset was successfully uploaded, send the user to the share with curation team
  if (window.sodaJSONObj?.["dataset-successfully-uploaded-to-pennsieve"]) {
    return "guided-dataset-dissemination-tab";
  }

  // returns the id of the first page of guided mode
  const firstPageID = getNonSkippedGuidedModePages(document)[0].id;
  const appVersion = await useGlobalStore.getState().appVersion;
  const lastVersionOfSodaUsedOnProgressFile = window.sodaJSONObj["last-version-of-soda-used"];

  if (lastVersionOfSodaUsedOnProgressFile != appVersion) {
    // If the progress file was last edited in a previous SODA version, reset to the first page
    await swalShowInfo(
      "SODA has been updated since you last worked on this dataset.",
      "You'll be taken to the first page to ensure compatibility with the latest workflow. Your previous work is saved and accessible."
    );
    return firstPageID;
  }

  if (guidedCheckIfUserNeedsToReconfirmAccountDetails() === true) {
    await swalShowInfo(
      "Your Pennsieve account or workspace has changed since you last worked on this dataset.",
      "Please confirm your Pennsieve account and workspace details."
    );
    return "guided-pennsieve-intro-tab";
  }

  // If the page the user was last on no longer exists, return them to the first page
  if (!document.getElementById(usersPageBeforeExit)) {
    return firstPageID;
  }

  // If the user left while the upload was in progress, send the user to the upload confirmation page
  if (usersPageBeforeExit === "guided-dataset-generation-tab") {
    return "guided-dataset-generation-confirmation-tab";
  }
  // If no special cases apply, return the user to the page they were on before they left
  return usersPageBeforeExit;
};

const patchPreviousGuidedModeVersions = async () => {
  const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];
  const datasetMetadata = window.sodaJSONObj["dataset_metadata"] || {};
  const oldHighLevelFolders = datasetEntityObj?.["high-level-folder-data-categorization"];

  if (oldHighLevelFolders && Object.keys(oldHighLevelFolders).length > 0) {
    // Ensure new keys exist
    datasetEntityObj["experimental"] = {};
    datasetEntityObj["non-data-folders"] = {};

    // Patch Experimental files
    const experimentalFiles = oldHighLevelFolders["Experimental"];
    if (experimentalFiles && Object.keys(experimentalFiles).length > 0) {
      datasetEntityObj["experimental"]["experimental"] = experimentalFiles;
    }

    // Patch Non-data folders
    const codeFiles = oldHighLevelFolders["Code"];
    if (codeFiles && Object.keys(codeFiles).length > 0) {
      datasetEntityObj["non-data-folders"]["Code"] = codeFiles;
    }

    const protocolFiles = oldHighLevelFolders["Protocol"];
    if (protocolFiles && Object.keys(protocolFiles).length > 0) {
      datasetEntityObj["non-data-folders"]["Protocol"] = protocolFiles;
    }

    const docsFiles = oldHighLevelFolders["Documentation"];
    if (docsFiles && Object.keys(docsFiles).length > 0) {
      datasetEntityObj["non-data-folders"]["Docs"] = docsFiles;
    }

    // Remove old key
    delete datasetEntityObj["high-level-folder-data-categorization"];
  }

  // Update "code" in selected-entities to "Code"
  const selectedEntities = window.sodaJSONObj["selected-entities"] || [];
  if (selectedEntities.includes("code")) {
    window.sodaJSONObj["selected-entities"] = selectedEntities
      .filter((entity) => entity.toLowerCase() !== "code")
      .concat("Code");
  }

  // specimen_id should be added to the old sites
  if (selectedEntities.includes("sites")) {
    // Add sampleSites because old save files had sites only applicable to samples
    window.sodaJSONObj["selected-entities"] = selectedEntities
      .filter((entity) => entity.toLowerCase() !== "sites")
      .concat("sampleSites");
  }

  // Change all fields named "disease_or_disorder" to "disease" in subjects metadata
  const datasetEntityArray = window.sodaJSONObj["dataset-entity-array"] || [];
  for (const subject of datasetEntityArray) {
    if (subject.type === "subject" && subject.metadata) {
      if (subject.metadata.disease_or_disorder !== undefined) {
        subject.metadata.disease = subject.metadata.disease_or_disorder;
        delete subject.metadata.disease_or_disorder;
      }
    }
  }
  // Change all fields named "disease_or_disorder" to "disease" in subjects metadata in dataset-entity-obj
  const subjectsMetadata = datasetMetadata?.subjects || [];
  for (const subjectMetadata of subjectsMetadata) {
    if (subjectMetadata.disease_or_disorder !== undefined) {
      subjectMetadata.disease = subjectMetadata.disease_or_disorder;
      delete subjectMetadata.disease_or_disorder;
    }
  }

  // Change the contributor role field to an array if it is a string
  const contributors = window.sodaJSONObj["dataset_contributors"];
  for (const contributor of contributors) {
    if (contributor.contributor_role && typeof contributor.contributor_role === "string") {
      contributor.contributor_roles = [contributor.contributor_role];
      delete contributor.contributor_role;
    }
  }
};

const guidedCheckIfUserNeedsToReconfirmAccountDetails = () => {
  // Check if guided-pennsieve-intro-tab is in completed tabs
  if (!window.sodaJSONObj["completed-tabs"].includes("guided-pennsieve-intro-tab")) {
    return false;
  }

  // Check if the user has changed their Pennsieve account
  if (window.sodaJSONObj?.["last-confirmed-ps-account-details"] !== window.defaultBfAccount) {
    if (window.sodaJSONObj["button-config"]?.["pennsieve-account-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["pennsieve-account-has-been-confirmed"];
    }
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }

  // Log current and previously confirmed workspace details
  const currentWorkspace = guidedGetCurrentUserWorkSpace();

  // Check if the user has changed their Pennsieve workspace
  if (currentWorkspace != window.sodaJSONObj?.["last-confirmed-pennsieve-workspace-details"]) {
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }

  // If no reconfirmation is needed, log that information
  return false;
};
