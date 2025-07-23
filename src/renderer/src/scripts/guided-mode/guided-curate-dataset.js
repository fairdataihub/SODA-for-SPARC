// // sourcery skip: merge-nested-ifs

import { guidedSetNavLoadingState } from "./pages/navigationUtils/pageLoading";
import { guidedSaveProgress } from "./pages/savePageChanges";
import {
  getContributorByOrcid,
  addContributor,
  renderContributorsTable,
} from "./metadata/contributors";
import { generateAlertElement } from "./metadata/utils";
import determineDatasetLocation from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import api from "../others/api/api";
import kombuchaEnums from "../analytics/analytics-enums";
import Swal from "sweetalert2";
import Tagify from "@yaireo/tagify/dist/tagify.esm.js";
import { v4 as uuid } from "uuid";
import client from "../client";
import {
  guidedGenerateDatasetLocally,
  guidedGenerateDatasetOnPennsieve,
} from "./generateDataset/generate";
import { guidedDatasetKeywordsTagify } from "./tagifies/tagifies";
import { updateDatasetUploadProgressTable } from "./generateDataset/uploadProgressBar";
import {
  swalConfirmAction,
  swalShowError,
  swalFileListSingleAction,
  swalFileListDoubleAction,
  swalShowInfo,
} from "../utils/swal-utils";

import { guidedCreateManifestFilesAndAddToDatasetStructure } from "./manifests/manifest";
import { createStandardizedDatasetStructure } from "../utils/datasetStructure";
import { guidedRenderProgressCards } from "./resumeProgress/progressCards";

import { guidedGetDatasetName } from "./utils/sodaJSONObj";

import { getDatasetEntityObj } from "../../stores/slices/datasetEntitySelectorSlice";

import "bootstrap-select";
import Cropper from "cropperjs";

import "jstree";

import { newEmptyFolderObj } from "../utils/datasetStructure";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

window.returnToGuided = () => {
  document.getElementById("guided_mode_view").click();
};

export const guidedGetDatasetType = () => {
  // Returns the dataset type (e.g. "computational" or "experimental")
  return window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["type"];
};

window.verifyProfile = async () => {
  const accountValid = await window.check_api_key();

  if (!accountValid) {
    await window.addBfAccount(null, false);
    return;
  }
};

export const guidedResetLocalGenerationUI = () => {
  // Hide the local dataset copy generation section that containst the table/generation progress
  document.getElementById("guided-section-local-generation-status-table").classList.add("hidden");
  // Hide the local dataset generation success section
  document.getElementById("guided-section-post-local-generation-success").classList.add("hidden");
  // Hide the local dataset generation retry section
  document.getElementById("guided-section-retry-local-generation").classList.add("hidden");
};

// This function reads the innerText of the textSharedWithCurationTeamStatus element
// and hides or shows the share and unshare buttons accordingly
window.guidedSetCurationTeamUI = () => {
  const textSharedWithCurationTeamStatus = document.getElementById(
    "guided--para-review-dataset-info-disseminate"
  );
  if (textSharedWithCurationTeamStatus.innerText != "Dataset is not under review currently") {
    $("#guided-button-share-dataset-with-curation-team").addClass("hidden");
    $("#guided-button-unshare-dataset-with-curation-team").addClass("hidden");
    $("#guided-unshare-dataset-with-curation-team-message").removeClass("hidden");
  } else {
    $("#guided--prepublishing-checklist-container").addClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").addClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").removeClass("hidden");
    $("#guided-button-unshare-dataset-with-curation-team").addClass("hidden");
    $("#guided-unshare-dataset-with-curation-team-message").addClass("hidden");
  }
};

// Function used to reserve a DOI for the current dataset and account
window.guidedReserveAndSaveDOI = async () => {
  let dataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];
  $("#curate-button-reserve-doi").addClass("loading");
  $("#curate-button-reserve-doi").disabled = true;

  let doiInformation = await api.reserveDOI(dataset);
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.DISSEMINATE_DATASETS,
    kombuchaEnums.Action.GUIDED_MODE,
    kombuchaEnums.Label.RESERVE_DOI,
    kombuchaEnums.Status.SUCCESS,
    { value: 1 }
  );
  guidedSetDOIUI(doiInformation);
};

// Function is for displaying DOI information on the Guided UI
const guidedSetDOIUI = (doiInformation) => {
  $("#curate-button-reserve-doi").removeClass("loading");
  $("#curate-button-reserve-doi").disabled = false;
  if (doiInformation === "locked") {
    // Show reserve DOI button and hide copy button
    // $("#guided-pennsieve-copy-doi").addClass("hidden");
    $("#curate-button-reserve-doi").addClass("hidden");

    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot reserve DOI",
      text: "Your dataset is locked, so modification is not allowed.",
      icon: "error",
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    });

    return;
  }

  $("#guided--para-doi-info").text(doiInformation);

  if (doiInformation === "No DOI found for this dataset" || doiInformation === false) {
    // Hide the reserve DOI button and show copy button
    //  $("#guided-pennsieve-copy-doi").addClass("hidden");
    $("#curate-button-reserve-doi").removeClass("hidden");
  } else {
    // Show reserve DOI button and hide copy button
    // $("#guided-pennsieve-copy-doi").removeClass("hidden");
    $("#curate-button-reserve-doi").addClass("hidden");
  }
};

// This function is for when a user clicks the share/unshare with curation team (requires Dataset to be published and locked)
window.guidedModifyCurationTeamAccess = async (action) => {
  const guidedShareWithCurationTeamButton = document.getElementById(
    "guided-button-share-dataset-with-curation-team"
  );
  const guidedUnshareWithCurationTeamButton = document.getElementById(
    "guided-button-unshare-dataset-with-curation-team"
  );
  const guidedUnshareMessage = document.getElementById(
    "guided-unshare-dataset-with-curation-team-message"
  );
  const curationMode = "guided";

  if (action === "share") {
    guidedShareWithCurationTeamButton.disabled = true;
    guidedShareWithCurationTeamButton.classList.add("loading");

    let publishPreCheckStatus = await window.beginPrepublishingFlow(curationMode);
    let embargoDetails = publishPreCheckStatus[1];

    // Will return false if there are issues running the precheck flow
    if (publishPreCheckStatus[0]) {
      guidedShareWithCurationTeamButton.classList.add("hidden");
      await window.submitReviewDataset(embargoDetails[1], curationMode);
      guidedUnshareMessage.classList.remove("hidden");
    }
    guidedShareWithCurationTeamButton.classList.remove("loading");
    guidedShareWithCurationTeamButton.disabled = false;
  }
  if (action === "unshare") {
    // Add your dataset has been shared, to withdraw please do so from Pennsieve
    guidedUnshareWithCurationTeamButton.disabled = true;
    guidedUnshareWithCurationTeamButton.classList.add("loading");

    const { value: withdraw } = await Swal.fire({
      title: "Unshare this dataset from Curation Team?",
      icon: "warning",
      showDenyButton: true,
      confirmButtonText: "Yes",
      denyButtonText: "No",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    if (!withdraw) {
      guidedUnshareWithCurationTeamButton.disabled = false;
      guidedUnshareWithCurationTeamButton.classList.remove("loading");
      return;
    }

    let removeStatus = await withdrawDatasetSubmission("guided");

    if (removeStatus) {
      guidedUnshareWithCurationTeamButton.classList.add("hidden");
      guidedShareWithCurationTeamButton.classList.remove("hidden");
    }

    guidedUnshareWithCurationTeamButton.disabled = false;
    guidedUnshareWithCurationTeamButton.classList.remove("loading");
  }
};

// Adds the click handlers to the info drop downs in Guided Mode
// The selectors also append the info icon before the label depending on data attributes
// passed in the HTML
const infoDropdowns = document.getElementsByClassName("info-dropdown");
for (const infoDropdown of Array.from(infoDropdowns)) {
  const infoTextElement = infoDropdown.querySelector(".info-dropdown-text");
  const dropdownType = infoTextElement.dataset.dropdownType;
  if (dropdownType === "info") {
    //insert the info icon before the text
    infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-info-circle"></i>`);
  }
  if (dropdownType === "warning") {
    //insert the warning icon before the text
    infoTextElement.insertAdjacentHTML(
      "beforebegin",
      ` <i class="fas fa-exclamation-triangle"></i>`
    );
  }

  infoDropdown.addEventListener("click", () => {
    const infoContainer = infoDropdown.nextElementSibling;
    const infoContainerChevron = infoDropdown.querySelector(".fa-chevron-right");

    const infoContainerIsopen = infoContainer.classList.contains("container-open");

    if (infoContainerIsopen) {
      infoContainerChevron.style.transform = "rotate(0deg)";
      infoContainer.classList.remove("container-open");
    } else {
      infoContainerChevron.style.transform = "rotate(90deg)";
      infoContainer.classList.add("container-open");
    }
  });
}

//main nav variables initialized to first page of guided mode
window.CURRENT_PAGE;

/////////////////////////////////////////////////////////
/////////////       Util functions      /////////////////
/////////////////////////////////////////////////////////
const pulseNextButton = () => {
  $("#guided-next-button").addClass("pulse-blue");
};
const unPulseNextButton = () => {
  $("#guided-next-button").removeClass("pulse-blue");
};
const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};

const hideEleShowEle = (elementIdToHide, elementIdToShow) => {
  let elementToHide = document.getElementById(elementIdToHide);
  let elementToShow = document.getElementById(elementIdToShow);
  elementToHide.classList.add("hidden");
  elementToShow.classList.remove("hidden");
};

document.querySelectorAll(".pass-button-click-to-next-button").forEach((element) => {
  element.addEventListener("click", () => {
    document.getElementById("guided-next-button").click();
  });
});

const deleteProgresFile = async (progressFileName) => {
  //Get the path of the progress file to delete
  const progressFilePathToDelete = window.path.join(
    guidedProgressFilePath,
    progressFileName + ".json"
  );
  //delete the progress file
  window.fs.unlinkSync(progressFilePathToDelete, (err) => {
    console.log(err);
  });
};

window.deleteProgressCard = async (progressCardDeleteButton) => {
  const progressCard = progressCardDeleteButton.parentElement.parentElement;
  const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent;

  const result = await Swal.fire({
    title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
    text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
    icon: "warning",
    heightAuto: false,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Delete progress file",
    cancelButtonText: "Cancel",
    focusCancel: true,
  });
  if (result.isConfirmed) {
    //delete the progress file
    deleteProgresFile(progressCardNameToDelete);

    //remove the progress card from the DOM
    progressCard.remove();
  }
};

window.guidedOpenManifestEditSwal = async () => {
  const existingManifestData = window.sodaJSONObj["guided-manifest-file-data"];
  //send manifest data to main.js to then send to child window
  window.electron.ipcRenderer.invoke("spreadsheet", existingManifestData);

  //upon receiving a reply of the spreadsheet, handle accordingly
  window.electron.ipcRenderer.on("spreadsheet-reply", async (event, result) => {
    if (!result || result === "") {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
      return;
    } else {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");

      window.sodaJSONObj["guided-manifest-file-data"] = { headers: result[0], data: result[1] };
      await guidedSaveProgress();
    }
  });
};

window.diffCheckManifestFiles = (newManifestData, existingManifestData) => {
  // If the new manifest data is identical to the existing, return the new manifest data
  if (JSON.stringify(existingManifestData) === JSON.stringify(newManifestData)) {
    return newManifestData;
  }

  // If the existing manifest data is empty (or missing crucial keys), return the new manifest data
  if (!existingManifestData["headers"] || !existingManifestData["data"]) {
    return newManifestData;
  }

  console.log("newManifestData", newManifestData);
  console.log("existingManifestData", existingManifestData);

  const columnValuesNotToUseOldValuesFor = new Set(["filename", "timestamp", "file type"]);

  const newManifestDataHeaders = newManifestData["headers"];
  const newManifestDataData = newManifestData["data"];
  const existingManifestDataHeaders = existingManifestData["headers"];
  const existingManifestDataData = existingManifestData["data"];

  // Initialize combined manifest headers and data
  const combinedManifestDataHeaders = [...newManifestDataHeaders];
  const combinedManifestDataData = [...newManifestDataData];

  // Add headers from the existing manifest that are not present in the new manifest
  for (const header of existingManifestDataHeaders) {
    if (!newManifestDataHeaders.includes(header)) {
      console.log(`Adding header "${header}" to combined manifest data headers`);
      combinedManifestDataHeaders.push(header);
      // Add empty values for the new column in each row of the combined data
      for (const row of combinedManifestDataData) {
        row.push("");
      }
    }
  }

  // Build a hash table for the existing manifest data
  const existingManifestDataHashTable = {};
  for (const row of existingManifestDataData) {
    const relativePath = row[0];
    const fileObj = {};
    for (const header of existingManifestDataHeaders) {
      if (columnValuesNotToUseOldValuesFor.has(header)) continue;
      const headerIndex = existingManifestDataHeaders.indexOf(header);
      fileObj[header] = row[headerIndex];
    }
    existingManifestDataHashTable[relativePath] = fileObj;
  }

  console.log("existingManifestDataHashTable", existingManifestDataHashTable);

  // Update rows in the combined data by looping over the new manifest data
  for (const row of combinedManifestDataData) {
    const relativePath = row[0];
    if (existingManifestDataHashTable[relativePath]) {
      for (const header of combinedManifestDataHeaders) {
        if (columnValuesNotToUseOldValuesFor.has(header)) continue;
        const headerIndex = combinedManifestDataHeaders.indexOf(header);
        row[headerIndex] = existingManifestDataHashTable[relativePath][header] || row[headerIndex];
      }
    }
  }

  return { headers: combinedManifestDataHeaders, data: combinedManifestDataData };
};
/* Disable the dataset validation page until implemented for sds 3 
document
  .getElementById("guided-button-run-dataset-validation")
  .addEventListener("click", async () => {
    //Wait for current call stack to finish so page navigation happens before this function is run
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Reset the UI for the page
    const validationLoadingDiv = document.getElementById("guided-section-validation-loading");
    const validationResultsDiv = document.getElementById("guided-section-validation-errors-table");
    const validationSucessNoErrorsDiv = document.getElementById(
      "guided-section-validation-success-no-errors"
    );
    const errorDuringValidationDiv = document.getElementById("guided-section-validation-failed");

    validationLoadingDiv.classList.add("hidden");
    validationResultsDiv.classList.add("hidden");
    validationSucessNoErrorsDiv.classList.add("hidden");
    errorDuringValidationDiv.classList.add("hidden");

    if (window.sodaJSONObj["dataset-validated"] === "true") {
      const errorsFromLastValidation = window.sodaJSONObj["dataset-validation-errors"];
      if (errorsFromLastValidation) {
        handleValidationTableUi(errorsFromLastValidation);
        return;
      }
    }

    let validationReportStatusIncomplete = false;
    const validationReportPath = window.path.join(window.homeDirectory, "SODA", "validation.txt");

    let file_counter = 0;
    let folder_counter = 0;

    try {
      // Lock the navigation buttons while the validation is in process
      guidedSetNavLoadingState(true);

      // Show the Loading div
      validationLoadingDiv.classList.remove("hidden");

      let sodaJSONObjCopy = JSON.parse(JSON.stringify(window.sodaJSONObj));
      // formatForDatasetGeneration(window.sodaJSONObjCopy);

      // if the user performed move, rename, delete on files in an imported dataset we need to perform those actions before creating the validation report;
      // rationale for this can be found in the function definition
      if (sodaJSONObjCopy["starting-point"]["origin"] === "ps") {
        await api.performUserActions(sodaJSONObjCopy);
      }

      // count the amount of files in the dataset
      file_counter = 0;
      window.get_num_files_and_folders(sodaJSONObjCopy["dataset-structure"]);

      if (file_counter >= 50000) {
        await Swal.fire({
          title: `Dataset Too Large`,
          text: "At the moment we cannot validate a dataset with 50,000 or more files.",
          allowEscapeKey: true,
          allowOutsideClick: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          showConfirmButton: true,
          icon: "error",
        });
        throw new Error("Dataset is too large for validation");
      }

      // get the manifest files
      let manifestJSONResponse;
      try {
        manifestJSONResponse = await client.post(
          "/skeleton_dataset/manifest_json",
          { sodajsonobject: window.sodaJSONObj },
          { timeout: 0 }
        );
      } catch (error) {
        throw new Error("Failed to generate manifest files");
      }

      let manifests = manifestJSONResponse.data;
      // If the manifest files are not generated, throw an error
      if (!manifests) {
        throw new Error("Failed to generate manifest files2");
      }

      let clientUUID = uuid();
      try {
        await client.post(`https://validation.sodaforsparc.io/validator/validate`, {
          clientUUID: clientUUID,
          dataset_structure: window.sodaJSONObj,
          metadata_files: {},
          manifests: manifests,
        });
      } catch (error) {
        clientError(error);

        file_counter = 0;
        folder_counter = 0;
        window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);
        // log successful validation run to analytics
        const kombuchaEventData = {
          value: file_counter,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Validation - Number of Files",
          "Number of Files",
          file_counter
        );

        if (error.response && (error.response.status == 503 || error.response.status == 502)) {
          await Swal.fire({
            title: "Validation Service Unavailable",
            text: "The validation service is currently too busy to validate your dataset. Please try again shortly.",
            icon: "error",
            confirmButtonText: "Ok",
            backdrop: "rgba(0,0,0, 0.4)",
            reverseButtons: window.reverseSwalButtons,
            heightAuto: false,
            showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
            hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
          });
        } else if (error.response && error.response.status == 400) {
          let msg = error.response.data.message;
          if (msg.includes("Missing required metadata files")) {
            msg = "Please add the required metadata files then re-run validation.";
          }
          await Swal.fire({
            title: "Validation Error",
            text: msg,
            icon: "error",
            confirmButtonText: "Ok",
            backdrop: "rgba(0,0,0, 0.4)",
            reverseButtons: window.reverseSwalButtons,
            heightAuto: false,
            showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
            hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
          });
        } else {
          await Swal.fire({
            title: "Failed to Validate Your Dataset",
            text: "Please try again. If this issue persists contect the SODA for SPARC team at help@fairdataihub.org",
            allowEscapeKey: true,
            allowOutsideClick: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            showConfirmButton: true,
            icon: "error",
          });
        }

        // Hide the loading div
        validationLoadingDiv.classList.add("hidden");
        // Show the error div
        errorDuringValidationDiv.classList.remove("hidden");
        guidedSetNavLoadingState(false);

        return;
      }

      let validationReport = undefined;
      while (validationReport === undefined) {
        await window.wait(15000);
        validationReport = await window.pollForValidationResults(clientUUID);
      }

      if (validationReport.status === "Error") {
        file_counter = 0;
        folder_counter = 0;
        window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);
        // log successful validation run to analytics
        const kombuchaEventData = {
          value: file_counter,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Validation - Number of Files",
          "Number of Files",
          file_counter
        );
        throw new Error("Could not validate your dataset");
      }

      // write the full report to the ~/SODA/validation.txt file
      const fullReport = validationReport.full_report;
      window.fs.writeFileSync(validationReportPath, fullReport);

      file_counter = 0;
      folder_counter = 0;
      window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);

      // log successful validation run to analytics
      if (file_counter > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: file_counter,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Validation - Number of Files",
        "Number of Files",
        file_counter
      );

      if (validationReport.status === "Incomplete") {
        // An incomplete validation report happens when the validator is unable to generate
        // a path_error_report upon validating the selected dataset.
        validationReportStatusIncomplete = true;
        throw new Error("Could Not Generate a Sanitized Validation Report");
      }

      // get the parsed error report since the validation has been completed
      const errors = validationReport.parsed_report;

      let hasValidationErrors = Object.getOwnPropertyNames(validationReport).length >= 1;

      Swal.fire({
        title: hasValidationErrors ? "Validator detected potential issues" : `Dataset is Valid`,
        text: hasValidationErrors
          ? `Note that the validator is currently in beta and may contain false positives. Review the validation report and continue to the next page.`
          : `Your dataset conforms to the SPARC Dataset Structure.`,
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
        icon: hasValidationErrors ? "error" : "success",
      });

      // Hide the loading div
      validationLoadingDiv.classList.add("hidden");

      // Displays the table with validation errors if the errors object is not empty
      // Otherwise displays a success message
      handleValidationTableUi(errors);

      window.sodaJSONObj["dataset-validated"] = "true";
      window.sodaJSONObj["dataset-validation-errors"] = errors;
    } catch (error) {
      clientError(error);
      // Hide the loading div
      validationLoadingDiv.classList.add("hidden");
      // Show the error div
      errorDuringValidationDiv.classList.remove("hidden");
      // Validation failed. Show a swal and have the user go back to fix stuff (or retry)
      window.sodaJSONObj["dataset-validated"] = "false";
      delete window.sodaJSONObj["dataset-validation-errors"];
      if (validationReportStatusIncomplete) {
        let viewReportResult = await Swal.fire({
          title: error,
          html: `If you repeatedly have this issue please contact the SODA for SPARC team at help@fairdataihub.org. Would you like to view your raw validation report?`,
          allowEscapeKey: true,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "error",
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        });

        if (viewReportResult.isConfirmed) {
          // open a shell to the raw validation report
          window.electron.ipcRenderer.invoke("shell-open-path", validationReportPath);
        }
      } else {
        await Swal.fire({
          icon: "warning",
          title: "An Error occured while validating your dataset",
          html: `${error}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      }
    }
    guidedSetNavLoadingState(false);
  });
*/

window.handleGuidedModeOrgSwitch = async (buttonClicked) => {
  if (buttonClicked.classList.contains("guided--progress-button-switch-workspace")) {
    await guidedRenderProgressCards();
  }
};

const guidedResetUserTeamPermissionsDropdowns = () => {
  $("#guided_bf_list_users_and_teams").val("Select individuals or teams to grant permissions to");
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
  $("#select-permission-list-users-and-teams").val("Select role");
};

const copyLink = (link) => {
  Clipboard.writeText(link);

  window.notyf.open({
    duration: "2000",
    type: "success",
    message: "Link copied!",
  });
};

const handleValidationTableUi = (errors) => {
  const validationResultsDiv = document.getElementById("guided-section-validation-errors-table");
  const validationSucessNoErrorsDiv = document.getElementById(
    "guided-section-validation-success-no-errors"
  );
  validationResultsDiv.classList.add("hidden");
  validationSucessNoErrorsDiv.classList.add("hidden");

  if (!window.validationErrorsOccurred(errors)) {
    // Dataset successfully validated without errors
    validationSucessNoErrorsDiv.classList.remove("hidden");
  } else {
    // get validation table body
    let validationErrorsTable = document.querySelector(
      "#guided-section-dataset-validation-table tbody"
    );
    // clear the table
    window.clearValidationResults(validationErrorsTable);
    // display errors onto the page
    window.displayValidationErrors(
      errors,
      document.querySelector("#guided-section-dataset-validation-table tbody")
    );

    // Unhide the validation errors section
    validationResultsDiv.classList.remove("hidden");
  }
};

window.deleteContributor = (clickedDelContribuButton, contributorOrcid) => {
  const contributorField = clickedDelContribuButton.parentElement.parentElement;
  const contributorsBeforeDelete = window.sodaJSONObj["dataset_contributors"];

  window.sodaJSONObj["dataset_contributors"] = contributorsBeforeDelete.filter((contributor) => {
    return contributor.contributor_orcid_id !== contributorOrcid;
  });
  //rerender the table after deleting a contributor
  renderContributorsTable();
};

// end imported openPage stuff

const guidedOpenEntityEditSwal = async (entityName) => {
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  if (entityName.startsWith("sub-")) {
    preExistingEntities = window.getExistingSubjectNames();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }
  if (entityName.startsWith("pool-")) {
    preExistingEntities = getExistingPoolNames();
    entityNameSingular = "pool";
    entityPrefix = "pool-";
  }
  if (entityName.startsWith("sam-")) {
    preExistingEntities = getExistingSampleNames();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  let newEntityName;

  const entityEditConfirmed = await Swal.fire({
    title: `Editing ${entityNameSingular} ${entityName}`,
    html: `
      <p class="help-text text-center">
        Enter the new name for the ${entityNameSingular} below and press edit.
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input value="${entityName.replace(
          entityPrefix,
          ""
        )}" id='input-new-entity-name' class='guided--input' type='text' placeholder='Enter new ${entityNameSingular} name and press edit'/>
      </div>
    `,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    confirmButtonText: `Edit`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Add event listener to the input to enable the confirm button when the input is changed
      document.getElementById("input-new-entity-name").addEventListener("keyup", () => {
        Swal.resetValidationMessage();
        Swal.enableButtons();
      });
    },
    preConfirm: () => {
      let newEntityInputValue = document.getElementById("input-new-entity-name").value;
      if (newEntityInputValue.length === 0) {
        Swal.showValidationMessage(`Please enter a new ${entityNameSingular} name`);
        return;
      }

      newEntityName = `${entityPrefix}${newEntityInputValue}`;
      if (newEntityName === entityName) {
        Swal.close();
      }
      const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
        newEntityName,
        "string-adheres-to-identifier-conventions"
      );
      if (!entityNameIsValid) {
        Swal.showValidationMessage(
          `${entityNameSingular} names can not contain spaces or special characters`
        );
        return;
      }
      if (preExistingEntities.includes(newEntityName)) {
        Swal.showValidationMessage(`A ${entityNameSingular} with that name already exists`);
        return;
      }
    },
  });

  if (entityEditConfirmed.isConfirmed) {
    if (entityName.startsWith("sub-")) {
      window.sodaJSONObj.renameSubject(entityName, newEntityName);
      renderSubjectsTable();
    }
    if (entityName.startsWith("pool-")) {
      window.sodaJSONObj.renamePool(entityName, newEntityName);
      renderPoolsTable();
    }
    if (entityName.startsWith("sam-")) {
      window.sodaJSONObj.renameSample(entityName, newEntityName);
      renderSamplesTable();
    }
  }
};

const removeAlertMessageIfExists = (elementToCheck) => {
  const alertMessageToRemove = elementToCheck.next();
  if (alertMessageToRemove.hasClass("alert")) {
    elementToCheck.next().remove();
  }
};

window.deleteAdditionalLink = (linkName) => {
  const additionalLinks = window.sodaJSONObj["dataset_additional_links"];
  //filter additional links to remove the one to be deleted
  const filteredAdditionalLinks = additionalLinks.filter((link) => {
    return link.link != linkName;
  });
  window.sodaJSONObj["dataset_additional_links"] = filteredAdditionalLinks;
  //update the UI
  renderAdditionalLinksTable();
};

const generateadditionalLinkRowElement = (link, linkType, linkRelation) => {
  return `
    <tr>
      <td class="middle aligned collapsing link-name-cell">
        ${link}
      </td>
      <td class="middle aligned collapsing">
        ${linkType}
      </td>
      <td class="middle aligned collapsing">
        ${linkRelation}
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="window.deleteAdditionalLink('${link}')"
        >   
          Delete link
        </button>
      </td>
    </tr>
  `;
};

window.removeContributorField = (contributorDeleteButton) => {
  const contributorField = contributorDeleteButton.parentElement;
  const { contributorFirstName, contributorLastName } = contributorField.dataset;

  const contributorsBeforeDelete = window.sodaJSONObj["dataset_contributors"];
  //If the contributor has data-first-name and data-last-name, then it is a contributor that
  //already been added. Delete it from the contributors array.
  if (contributorFirstName && contributorLastName) {
    const filteredContributors = contributorsBeforeDelete.filter((contributor) => {
      //remove contributors with matching first and last name
      return !(
        contributor.contributorFirstName == contributorFirstName &&
        contributor.contributorLastName == contributorLastName
      );
    });

    window.sodaJSONObj["dataset_contributors"];
    filteredContributors;
  }

  contributorField.remove();
};

const getExistingContributorORCiDs = () => {
  return window.sodaJSONObj["dataset_contributors"].map((contributor) => {
    return contributor.contributor_orcid_id;
  });
};

const editContributorByOrcid = (
  prevContributorOrcid,
  contributorLastName,
  contributorFirstName,
  newContributorOrcid,
  contributor_affiliation,
  contributor_role
) => {
  // Get the index of the contributor to edit
  const contributorsIndex = window.sodaJSONObj["dataset_contributors"].findIndex(
    (contributor) => contributor["contributor_orcid_id"] === prevContributorOrcid
  );

  if (contributorsIndex === -1) {
    throw new Error("No contributor with the entered ORCID exists");
  }

  if (prevContributorOrcid !== newContributorOrcid) {
    if (getContributorByOrcid(newContributorOrcid)) {
      throw new Error("A contributor with the entered ORCID already exists");
    }
  }

  // Update the contributor's information
  window.sodaJSONObj["dataset_contributors"][contributorsIndex] = {
    contributor_orcid_id: newContributorOrcid,
    contributor_first_name: contributorFirstName,
    contributor_last_name: contributorLastName,
    contributor_affiliation: contributor_affiliation,
    contributor_role: contributor_role,
  };
};

const handleAddOrEditContributorHeaderUI = (boolEditingContributor) => {
  // This is a WIP return empty string for now
  return "";
  // When editing a contributor, simply display the header for editing
  if (boolEditingContributor) {
    return `
      <label class="guided--form-label centered mb-md" style="font-size: 1em !important;">
        Edit the contributor's information below.
      </label>
    `;
  }
  const existingContributorORCiDs = getExistingContributorORCiDs();
  console.log("existingContributorORCiDs", existingContributorORCiDs);

  const locallyStoredContributorArray = window.loadStoredContributors().filter((contributor) => {
    return !existingContributorORCiDs.includes(contributor["contributor_orcid_id"]);
  });

  console.log("locallyStoredContributorArray", locallyStoredContributorArray);

  // If no stored contributors are found, use the default header
  if (locallyStoredContributorArray.length === 0) {
    return `
      <label class="guided--form-label centered mb-md" style="font-size: 1em !important;">
        Enter the contributor's information below.
      </label>
    `;
  }

  const contributorOptions = locallyStoredContributorArray.map((contributor) => {
    return `
        <option
          value="${contributor.contributor_last_name}, ${contributor.contributor_first_name}"
          data-first-name="${contributor.contributor_first_name ?? ""}"
          data-last-name="${contributor.contributor_last_name ?? ""}"
          data-orcid="${contributor.contributor_orcid_id ?? ""}"
          data-affiliation="${contributor.contributor_affiliation ?? ""}"
          data-roles="${contributor.contributor_role ?? ""}"
        >
          ${contributor.lastName}, ${contributor.firstName}
        </option>
      `;
  });

  return `
    <label class="guided--form-label centered mb-2" style="font-size: 1em !important;">
      If the contributor has been previously added, select them from the dropdown below.
    </label>
    <select
      class="w-100 SODA-select-picker"
      id="guided-stored-contributors-select"
      data-live-search="true"
      name="Dataset contributor"
    >
      <option
        value=""
        data-first-name=""
        data-last-name=""
        data-orcid=""
        data-affiliation=""
        data-roles=""
      >
        Select a saved contributor
      </option>
      ${contributorOptions}
    </select>
    <label class="guided--form-label centered mt-2" style="font-size: 1em !important;">
      Otherwise, enter the contributor's information below.
    </label>
  `;
};

window.guidedOpenAddOrEditContributorSwal = async (contributorIdToEdit = null) => {
  let defaultFirstName = "";
  let defaultLastName = "";
  let defaultOrcid = "";
  let defaultAffiliation = "";
  let defaultRole = "";
  let contributorSwalTitle = "Adding a new contributor";

  if (contributorIdToEdit) {
    const contributorData = getContributorByOrcid(contributorIdToEdit);
    defaultFirstName = contributorData["contributor_first_name"] || "";
    defaultLastName = contributorData["contributor_last_name"] || "";
    defaultOrcid = contributorData["contributor_orcid_id"] || "";
    defaultAffiliation = contributorData["contributor_affiliation"] || "";
    defaultRole = contributorData["contributor_role"] || "";
    contributorSwalTitle = `Edit contributor ${defaultLastName}, ${defaultFirstName}`;
  }

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "900px",
    heightAuto: false,
    title: contributorSwalTitle,
    html: `
      <div class="guided--flex-center mb-1" style="font-size: 1em !important; height: 550px;">
        ${handleAddOrEditContributorHeaderUI(!!contributorIdToEdit)}
        <div class="space-between w-100">
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required" style="font-size: 1em !important;">Last name: </label>
            <input
              class="guided--input"
              id="guided-contributor-last-name"
              type="text"
              placeholder="Contributor's last name"
              value="${defaultLastName}"
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required" style="font-size: 1em !important;">First name: </label>
            <input
              class="guided--input"
              id="guided-contributor-first-name"
              type="text"
              placeholder="Contributor's first name"
              value="${defaultFirstName}"
            />
          </div>
        </div>
        <label class="guided--form-label mt-md required" style="font-size: 1em !important;">ORCID: </label>
        <input
          class="guided--input"
          id="guided-contributor-orcid"
          type="text"
          placeholder="https://orcid.org/0000-0000-0000-0000"
          value="${defaultOrcid}"
        />
        <p class="guided--text-input-instructions mb-0 text-left">
          If your contributor does not have an ORCID, have the contributor <a
          target="_blank"
          href="https://orcid.org/register"
          >sign up for one on orcid.org</a>.
        </p>

        <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Affiliation: </label>
        <input
          class="guided--input"
          id="guided-contributor-affiliation-input"
          type="text"
          placeholder="Institution name"
          value="${defaultAffiliation}"
        />
        <p class="guided--text-input-instructions mb-0 text-left">
          Institution the contributor is affiliated with.
        </p>

        <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Role: </label>
        <select
          id="guided-contributor-role-select"
          class="w-100 SODA-select-picker"
          title="Select a role"
          data-live-search="true"
          name="Dataset contributor role"
        >
          <option value="">Select a role</option>
          <option value="ContactPerson">Contact Person</option>
          <option value="CoInvestigator">Co-Investigator</option>
          <option value="CorrespondingAuthor">Corresponding Author</option>
          <option value="Creator">Creator</option>
          <option value="DataCollector">Data Collector</option>
          <option value="DataCurator">Data Curator</option>
          <option value="DataManager">Data Manager</option>
          <option value="Distributor">Distributor</option>
          <option value="Editor">Editor</option>
          <option value="HostingInstitution">Hosting Institution</option>
          <option value="PrincipalInvestigator">Principal Investigator</option>
          <option value="Producer">Producer</option>
          <option value="ProjectLeader">Project Leader</option>
          <option value="ProjectManager">Project Manager</option>
          <option value="ProjectMember">Project Member</option>
          <option value="RegistrationAgency">Registration Agency</option>
          <option value="RegistrationAuthority">Registration Authority</option>
          <option value="RelatedPerson">Related Person</option>
          <option value="ResearchGroup">Research Group</option>
          <option value="Researcher">Researcher</option>
          <option value="RightsHolder">Rights Holder</option>
          <option value="Sponsor">Sponsor</option>
          <option value="Supervisor">Supervisor</option>
          <option value="WorkPackageLeader">Work Package Leader</option>
          <option value="Other">Other</option>
        </select>
        <p class="guided--text-input-instructions mb-0 text-left">
          Role the contributor played in the creation of the dataset. Visit <a target="_blank" rel="noopener noreferrer" href="https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf">DataCite</a> for a definition of the roles.
          <br />
          <b>Select a role from the dropdown.</b>
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: contributorIdToEdit ? "Edit contributor" : "Add contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      // Initialize selectpicker on stored contributors dropdown
      $("#guided-stored-contributors-select").selectpicker({ style: "SODA-select-picker" });
      $("#guided-stored-contributors-select").selectpicker("refresh");

      // Initialize selectpicker on role select dropdown
      $("#guided-contributor-role-select").selectpicker({ style: "SODA-select-picker" });
      $("#guided-contributor-role-select").selectpicker("refresh");

      // If editing, set default role in role select
      if (defaultRole) {
        $("#guided-contributor-role-select").selectpicker("val", defaultRole);
      }

      // When selecting a stored contributor, populate fields including role select
      $("#guided-stored-contributors-select").on("change", function () {
        const selectedFirstName =
          $("#guided-stored-contributors-select option:selected").data("first-name") || "";
        const selectedLastName =
          $("#guided-stored-contributors-select option:selected").data("last-name") || "";
        const selectedOrcid =
          $("#guided-stored-contributors-select option:selected").data("orcid") || "";
        const selectedAffiliation =
          $("#guided-stored-contributors-select option:selected").data("affiliation") || "";
        const selectedRole =
          $("#guided-stored-contributors-select option:selected").data("roles") || "";

        document.getElementById("guided-contributor-first-name").value = selectedFirstName;
        document.getElementById("guided-contributor-last-name").value = selectedLastName;
        document.getElementById("guided-contributor-orcid").value = selectedOrcid;
        document.getElementById("guided-contributor-affiliation-input").value = selectedAffiliation;

        $("#guided-contributor-role-select").selectpicker("val", selectedRole);
      });
    },
    preConfirm: () => {
      const contributorFirstNameValue = document
        .getElementById("guided-contributor-first-name")
        .value.trim();
      const contributorLastNameValue = document
        .getElementById("guided-contributor-last-name")
        .value.trim();
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value.trim();
      const contributorAffiliation = document
        .getElementById("guided-contributor-affiliation-input")
        .value.trim();
      const contributorRole = document.getElementById("guided-contributor-role-select").value;

      console.log("contributorFirstNameValue", contributorFirstNameValue);
      console.log("contributorLastNameValue", contributorLastNameValue);
      console.log("contributorOrcid", contributorOrcid);
      console.log("contributorAffiliation", contributorAffiliation);
      console.log("contributorRole", contributorRole);

      if (
        !contributorFirstNameValue ||
        !contributorLastNameValue ||
        !contributorOrcid ||
        !contributorAffiliation ||
        !contributorRole
      ) {
        return Swal.showValidationMessage("Please fill out all required fields");
      }

      if (contributorOrcid.length !== 37) {
        return Swal.showValidationMessage(
          "Please enter ORCID ID in the format: https://orcid.org/0000-0000-0000-0000"
        );
      }

      if (contributorFirstNameValue.includes(",") || contributorLastNameValue.includes(",")) {
        return Swal.showValidationMessage("Please remove commas from the name fields");
      }

      const orcidSite = contributorOrcid.substr(0, 18);
      if (orcidSite !== "https://orcid.org/") {
        return Swal.showValidationMessage(
          "Please enter your ORCID ID with https://orcid.org/ in the beginning"
        );
      }

      const orcidDigits = contributorOrcid.substr(18);
      let total = 0;
      for (let i = 0; i < orcidDigits.length - 1; i++) {
        const digit = parseInt(orcidDigits.substr(i, 1));
        if (isNaN(digit)) continue;
        total = (total + digit) * 2;
      }

      const remainder = total % 11;
      const result = (12 - remainder) % 11;
      const checkDigit = result === 10 ? "X" : String(result);

      if (checkDigit !== contributorOrcid.substr(-1)) {
        return Swal.showValidationMessage("ORCID iD does not exist");
      }

      try {
        if (contributorIdToEdit) {
          console.log("Editing existing contributor with ORCID:", contributorIdToEdit);
          // If editing an existing contributor, update their data
          editContributorByOrcid(
            contributorIdToEdit,
            contributorLastNameValue,
            contributorFirstNameValue,
            contributorOrcid,
            contributorAffiliation,
            contributorRole
          );
          console.log("Contributor edited successfully");
        } else {
          // If adding a new contributor, add them to the dataset
          addContributor(
            contributorLastNameValue,
            contributorFirstNameValue,
            contributorOrcid,
            contributorAffiliation,
            contributorRole // keep role as an array for compatibility
          );
          console.log("Contributor added successfully");
        }
      } catch (error) {
        return Swal.showValidationMessage(error);
      }

      renderContributorsTable();
    },
  });
};

const switchOrderOfContributors = (draggedOrcid, targetOrcid) => {
  const contributors = window.sodaJSONObj["dataset_contributors"];
  const draggedContributorIndex = contributors.findIndex(
    (contributor) => contributor["contributor_orcid_id"] === draggedOrcid
  );
  const targetContributorIndex = contributors.findIndex(
    (contributor) => contributor["contributor_orcid_id"] === targetOrcid
  );

  // If the dragged contributor is above the target contributor
  // then the dragged contributor should be inserted after the target contributor
  if (draggedContributorIndex < targetContributorIndex) {
    contributors.splice(targetContributorIndex + 1, 0, contributors[draggedContributorIndex]);
    contributors.splice(draggedContributorIndex, 1);
  } else {
    // If the dragged contributor is below the target contributor
    // then the dragged contributor should be inserted before the target contributor
    contributors.splice(targetContributorIndex, 0, contributors[draggedContributorIndex]);
    contributors.splice(draggedContributorIndex + 1, 1);
  }
  window.sodaJSONObj["dataset_contributors"] = contributors;
};

// Constants used for drag and drop functionality for contributors
let draggedRow;
let targetRow;
window.handleContributorDragStart = (event) => {
  draggedRow = event.target.closest("tr");
};
window.handleContributorDragOver = (event) => {
  event.preventDefault();
  targetRow = event.target.closest("tr");
};

window.handleContributorDrop = (event) => {
  event.preventDefault();
  if (targetRow === draggedRow) {
    return;
  }

  const draggedOrcid = draggedRow.dataset.contributorOrcid;
  const targetOrcid = targetRow.dataset.contributorOrcid;

  switchOrderOfContributors(draggedOrcid, targetOrcid);

  renderContributorsTable();
};

export const renderAdditionalLinksTable = () => {
  const additionalLinksTableBody = document.getElementById("additional-links-table-body");
  const additionalLinkData = window.sodaJSONObj["dataset_additional_links"] || [];
  if (additionalLinkData.length != 0) {
    const additionalLinkElements = additionalLinkData
      .map((link) => {
        return generateadditionalLinkRowElement(link.link, link.type, link.relation);
      })
      .join("\n");
    additionalLinksTableBody.innerHTML = additionalLinkElements;
  } else {
    const emptyRowWarning = generateAlertElement(
      "warning",
      `You currently have no additional links. To add a link, click the "Add additional link" button below.`
    );
    let warningRowElement = `<tr><td colspan="5">${emptyRowWarning}</td></tr>`;
    //add empty rowWarning to additionalLinksTableBody
    additionalLinksTableBody.innerHTML = warningRowElement;
  }
};
const openAddAdditionLinkSwal = async () => {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html: `
      <label>
        URL or DOI:
      </label>
      <input
        id="guided-other-link"
        class="swal2-input"
        placeholder="Enter a URL"
      />
      <label>
        Relation to the dataset:
      </label>
      <select id="guided-other-link-relation" class="swal2-input">
        <option value="Select">Select a relation</option>
        <option value="IsCitedBy">IsCitedBy</option>
        <option value="Cites">Cites</option>
        <option value="IsSupplementTo">IsSupplementTo</option>
        <option value="IsSupplementedBy">IsSupplementedBy</option>
        <option value="IsContinuedByContinues">IsContinuedByContinues</option>
        <option value="IsDescribedBy">IsDescribedBy</option>
        <option value="Describes">Describes</option>
        <option value="HasMetadata">HasMetadata</option>
        <option value="IsMetadataFor">IsMetadataFor</option>
        <option value="HasVersion">HasVersion</option>
        <option value="IsVersionOf">IsVersionOf</option>
        <option value="IsNewVersionOf">IsNewVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="HasPart">HasPart</option>
        <option value="IsPublishedIn">IsPublishedIn</option>
        <option value="IsReferencedBy">IsReferencedBy</option>
        <option value="References">References</option>
        <option value="IsDocumentedBy">IsDocumentedBy</option>
        <option value="Documents">Documents</option>
        <option value="IsCompiledBy">IsCompiledBy</option>
        <option value="Compiles">Compiles</option>
        <option value="IsVariantFormOf">IsVariantFormOf</option>
        <option value="IsOriginalFormOf">IsOriginalFormOf</option>
        <option value="IsIdenticalTo">IsIdenticalTo</option>
        <option value="IsReviewedBy">IsReviewedBy</option>
        <option value="Reviews">Reviews</option>
        <option value="IsDerivedFrom">IsDerivedFrom</option>
        <option value="IsSourceOf">IsSourceOf</option>
        <option value="IsRequiredBy">IsRequiredBy</option>
        <option value="Requires">Requires</option>
        <option value="IsObsoletedBy">IsObsoletedBy</option>
        <option value="Obsoletes">Obsoletes</option>
      </select>
      <label>
        Link description:
      </label>
      <textarea
        id="guided-other-description"
        class="swal2-textarea"
        placeholder="Enter a description"
      ></textarea>
    `,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "800",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#guided-other-link").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link.`);
        return;
      }
      if ($("#guided-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please select a link relation.`);
        return;
      }
      if ($("#guided-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
        return;
      }
      var duplicate = window.checkLinkDuplicate(
        link,
        document.getElementById("other-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage("Duplicate URL/DOI. The URL/DOI you entered is already added.");
      }
      return [
        $("#guided-other-link").val(),
        $("#guided-other-link-relation").val(),
        $("#guided-other-description").val(),
      ];
    },
  });
  if (values) {
    const link = values[0];
    const relation = values[1];
    let linkType;
    //check if link starts with "https://"
    if (link.startsWith("https://doi.org/")) {
      linkType = "DOI";
    } else {
      linkType = "URL";
    }
    const description = values[2];
    //add link to jsonObj
    window.sodaJSONObj["dataset_additional_links"].push({
      link: link,
      relation: relation,
      description: description,
      type: linkType,
    });
    renderAdditionalLinksTable();
  }
};

window.openCopySubjectMetadataPopup = async () => {
  //save current subject metadata entered in the form
  window.addSubject("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < window.subjectsTableData.length; i++) {
    const subjectID = window.subjectsTableData[i][0];
    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between" style="max-height: 500px; overflow-y: auto;">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subject would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subjects would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;
  Swal.fire({
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: 950,
    html: copyMetadataElement,
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    confirmButtonColor: "Copy",
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      const selectedCopyFromSubject = $("input[name='copy-from']:checked").val();
      //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
      let selectedCopyToSubjects = [];
      $("input[name='copy-to']:checked").each(function () {
        selectedCopyToSubjects.push($(this).val());
      });
      let copyFromSubjectData = [];
      for (var i = 1; i < window.subjectsTableData.length; i++) {
        if (window.subjectsTableData[i][0] === selectedCopyFromSubject) {
          //copy all elements from matching array except the first two
          copyFromSubjectData = window.subjectsTableData[i].slice(2);
        }
      }
      for (const subject of selectedCopyToSubjects) {
        //loop through all window.subjectsTableData elements besides the first one
        for (let i = 1; i < window.subjectsTableData.length; i++) {
          //check through elements of tableData to find a subject ID match
          if (window.subjectsTableData[i][0] === subject) {
            window.subjectsTableData[i] = [
              window.subjectsTableData[i][0],
              window.subjectsTableData[i][1],
              ...copyFromSubjectData,
            ];
          }
        }
      }
      const currentSubjectOpenInView = document.getElementById("guided-bootbox-subject-id").value;
      if (currentSubjectOpenInView) {
        //If a subject was open in the UI, update it with the new metadata
        window.populateForms(currentSubjectOpenInView, "", "guided");
      }

      await guidedSaveProgress();
    }
  });
};

window.openCopySampleMetadataPopup = async () => {
  window.addSample("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < window.samplesTableData.length; i++) {
    const sampleID = window.samplesTableData[i][1];

    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${sampleID}">
          <label>${sampleID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
        <input type="checkbox" name="copy-to" value="${sampleID}">
        <label>${sampleID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which sample would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which samples would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: 950,
    html: copyMetadataElement,
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    confirmButtonText: "Copy",
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      /*
      Commented out BUT THIS IS PROBABLY WHERE COPY METADATA STUFF IS
      const selectedCopyFromSample = $("input[name='copy-from']:checked").val();
      //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
      let selectedCopyToSamples = []; //["sam2","sam3"]
      $("input[name='copy-to']:checked").each(function () {
        selectedCopyToSamples.push($(this).val());
      });

      let copyFromSampleData = [];
      //Create a variable for the third entry ("was derived from") to make it easier to copy into the
      //middle of the array
      let wasDerivedFrom = "";

      //Add the data from the selected copy fro sample to cpoyFromSampleData array
      for (let i = 1; i < window.samplesTableData.length; i++) {
        if (window.samplesTableData[i][1] === selectedCopyFromSample) {
          //copy all elements from matching array except the first one
          wasDerivedFrom = window.samplesTableData[i][2];
          copyFromSampleData = window.samplesTableData[i].slice(4);
        }
      }
      for (const sample of selectedCopyToSamples) {
        window.samplesTableData.forEach((sampleData, index) => {
          if (sampleData[1] === sample) {
            sampleData = [sampleData[0], sampleData[1], wasDerivedFrom, sampleData[3]];
            sampleData = sampleData.concat(copyFromSampleData);
            window.samplesTableData[index] = sampleData;
          }
        });
      }
      const currentSampleOpenInView = document.getElementById("guided-bootbox-sample-id").value;
      const currentSampleSubjectOpenInView = document.getElementById(
        "guided-bootbox-subject-id-samples"
      ).value;

      //If a sample was open in the UI, update it with the new metadata
      if (currentSampleOpenInView) {
        openModifySampleMetadataPage(currentSampleOpenInView, currentSampleSubjectOpenInView);
      }
      await guidedSaveProgress();*/
    }
  });
};

const updatePoolDropdown = (poolDropDown, poolName) => {
  poolDropDown.empty().trigger("change");
  //add subjects in pool to dropdown and set as selected
  const poolsSubjects = window.sodaJSONObj.getPoolSubjects(poolName);
  for (const subject of poolsSubjects) {
    var newOption = new Option(subject, subject, true, true);
    poolDropDown.append(newOption).trigger("change");
  }

  //add subject options not in pool to dropdown and set as unselected
  const subjectsNotInPools = window.sodaJSONObj.getSubjectsOutsidePools();
  for (const subject of subjectsNotInPools) {
    var newOption = new Option(subject, subject, false, false);
    poolDropDown.append(newOption).trigger("change");
  }
};

//On edit button click, creates a new subject ID rename input box
window.openSubjectRenameInput = (subjectNameEditButton) => {
  const subjectIdCellToRename = subjectNameEditButton.closest("td");
  const prevSubjectName = subjectIdCellToRename.find(".subject-id").text();
  let prevSubjectInput = prevSubjectName.substr(prevSubjectName.search("-") + 1);
  const subjectRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sub-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-subject-id"
        value=${prevSubjectInput}
        placeholder="Enter subject ID and press enter"
        onkeyup="specifySubject(event, window.$(this))"
        data-alert-message="Subject IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSubjectName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
    </div>
  `;
  subjectIdCellToRename.html(subjectRenameElement);
};

const generateSampleSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned sample-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sam-</span>
          <input
            id="guided--sample-input"
            class="guided--input"
            type="text"
            name="guided-sample-id"
            placeholder="Enter sample ID and press enter"
            onkeyup="specifySample(event, window.$(this))"
            data-alert-message="Sample IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer; display: none;"
          onclick="window.deleteSample(window.$(this))"
        ></i>
      </td>
    </tr>
  `;
};

window.confirmEnter = (button) => {
  let input_id = button.previousElementSibling.id;
  let sampleTable = false;
  let addSampleButton = "";
  let sampleTableContainers = "";
  if (input_id === "guided--sample-input") {
    //confirming the sample input, manually create another one
    addSampleButton =
      button.parentElement.parentElement.parentElement.parentElement.previousElementSibling
        .children[0].children[0].children[1];
    sampleTableContainers = document.getElementById("guided-section-subjects-tables").children;
    sampleTable = true;
    // window.addSampleSpecificationTableRow();
  }
  const ke = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, keyCode: 13 });

  let input_field = button.previousElementSibling;
  if (input_field.tagName === "INPUT") {
    input_field.dispatchEvent(ke);
  } else {
    //alert message is the previousElement
    input_field.parentNode.children[1].dispatchEvent(ke);
  }
  if (sampleTable) {
    //for adding a new sample row
    let clickSampleButton = true;
    for (let i = 0; i < sampleTableContainers.length; i++) {
      let sampleEntries = sampleTableContainers[i].children[1];
      if (sampleEntries.children.length > 0) {
        //entries have been create so look at the last one if an input is there
        let lastEntryCount = sampleEntries.children.length - 1;
        let lastEntry = sampleEntries.children[lastEntryCount];
        let lastEntryTagType = lastEntry.children[0].children[0].children[1];
        if (lastEntryTagType === "INPUT") {
          //an input is already made (duplicates will have duplicate ids)
          clickSampleButton = false;
          break;
        }
      }
      if (clickSampleButton) {
        addSampleButton.click();
      }
    }
  }
};

const keydownListener = (event) => {
  if (event.key === "Enter") {
    enterKey = true;
  } else {
    enterKey = false;
  }
};

const onBlurEvent = () => {
  if (event.path[0].value.length > 0) {
    if (enterKey === false) {
      window.confirmEnter(event.path[1].children[2]);
    }
  }
};

var enterKey = false;
const confirmOnBlur = (element) => {
  window.addEventListener("keydown", keydownListener);
  document.getElementById(element).addEventListener("blur", onBlurEvent);
};

const addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById("subject-specification-table-body");
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput = subjectSpecificationTableBody.querySelector(
    "input[name='guided-subject-id']"
  );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    //create a new table row on
    subjectSpecificationTableBody.innerHTML += generateSubjectSpecificationRowElement();

    const newSubjectRow = subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector("input[name='guided-subject-id']");
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER FOR ON FOCUS
    confirmOnBlur("guided--subject-input");
  }
};

window.getExistingSubjectNames = () => {
  // Get all subjects in pools and outside of pools
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  // Combine the two arrays
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];
  // Map each subject object to its name
  return subjects.map((subject) => subject["subjectName"]);
};

const getSubjectsPool = (subjectName) => {
  const [subjectsInPools] = window.sodaJSONObj.getAllSubjects();
  for (const subject of subjectsInPools) {
    if (subject["subjectName"] === subjectName) {
      return subject["poolName"];
    }
  }
  return "";
};

const getExistingSampleNames = () => {
  // Get all samples in pools and outside of pools
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  // Combine the two arrays
  return [...samplesInPools, ...samplesOutsidePools].map((sample) => sample["sampleName"]);
};

const setUiBasedOnSavedDatasetStructurePath = (pathToSpreadsheet) => {
  // If the dataset structure spreadsheet path is set, hide the button to create a new one
  // And show the required elements for the user to view/import the spreadsheet
  const stepOneElements = document.querySelectorAll(".step-before-spreadsheet-path-declared");
  const stepTwoElements = document.querySelectorAll(".step-after-spreadsheet-path-declared");

  if (!pathToSpreadsheet || !fs.existsSync(pathToSpreadsheet)) {
    stepOneElements.forEach((element) => {
      element.classList.remove("hidden");
    });
    stepTwoElements.forEach((element) => {
      element.classList.add("hidden");
    });
  } else {
    stepOneElements.forEach((element) => {
      element.classList.add("hidden");
    });
    stepTwoElements.forEach((element) => {
      element.classList.remove("hidden");
    });
  }
};

/*document
  .getElementById("guided-button-choose-dataset-structure-spreadsheet-path")
  .addEventListener("click", () => {
    // Create a new spreadsheet based on the dataset structure
    window.electron.ipcRenderer.send(
      "open-create-dataset-structure-spreadsheet-path-selection-dialog"
    );
  });*/

window.electron.ipcRenderer.on(
  "selected-create-dataset-structure-spreadsheet-path",
  async (event, path) => {
    try {
      // Set the column widths
      const datasetHasPools = document
        .getElementById("guided-button-spreadsheet-subjects-are-pooled")
        .classList.contains("selected");
      const datasetHasSamples = document
        .getElementById("guided-button-spreadsheet-subjects-have-samples")
        .classList.contains("selected");
      const filePath = path + "/dataset_structure.xlsx";

      await window.electron.ipcRenderer.invoke(
        "create-and-save-dataset-structure-spreadsheet",
        datasetHasPools,
        datasetHasSamples,
        filePath
      );

      window.sodaJSONObj["dataset-structure-spreadsheet-path"] = filePath;
      setUiBasedOnSavedDatasetStructurePath(filePath);
      const openTemplateForUser = await swalConfirmAction(
        null,
        "Template successfully generated",
        `
        Would you like to open the template now?
      `,
        "Yes",
        "No"
      );
      if (openTemplateForUser) {
        window.electron.ipcRenderer.send("open-file-at-path", filePath);
      }
    } catch (error) {
      clientError(error);
      notyf.error(`Error creating dataset structure spreadsheet: ${error}`);
    }
  }
);

const guidedAddListOfSubjects = async (subjectNameArray, showWarningForExistingSubjects) => {
  // Check to see if any of the subject names are invalid
  const validSubjecNames = [];
  const invalidSubjectNames = [];
  for (const subjectName of subjectNameArray) {
    if (subjectName.length === 0) {
      continue;
    }

    const subjectNameIsValid = window.evaluateStringAgainstSdsRequirements(
      subjectName,
      "string-adheres-to-identifier-conventions"
    );
    if (subjectNameIsValid) {
      validSubjecNames.push(subjectName);
    } else {
      invalidSubjectNames.push(subjectName);
    }
  }
  if (invalidSubjectNames.length > 0) {
    await swalFileListSingleAction(
      invalidSubjectNames,
      "Invalid subject names detected",
      "Subject names can not contain spaces or special characters. The following subjects will not be imported into SODA:",
      ""
    );
  }

  // append sub- to each subject name if it doesn't already start with sub-
  const formattedSubjectNameArray = validSubjecNames.map((subjectName) => {
    if (!subjectName.startsWith("sub-")) {
      subjectName = `sub-${subjectName}`;
    }
    return subjectName;
  });
  // Remove empty strings from the array
  formattedSubjectNameArray.filter((subjectName) => subjectName.length > 0);

  // Get an array of existing subjects to check for duplicates
  const existingSubjects = window.getExistingSubjectNames();

  // Array of the subjects that already exist in the dataset
  const duplicateSubjects = formattedSubjectNameArray.filter((subjectName) =>
    existingSubjects.includes(subjectName)
  );

  // Array of the subjects that do not already exist in the dataset
  const newSubjects = formattedSubjectNameArray.filter(
    (subjectName) => !existingSubjects.includes(subjectName)
  );

  if (showWarningForExistingSubjects && duplicateSubjects.length > 0) {
    // Let the user know that duplicate subjects will not be added
    await swalFileListSingleAction(
      duplicateSubjects,
      "Duplicate subjects detected",
      "The following subjects have already been specified and will not be added:",
      ""
    );
  }

  if (newSubjects.length > 0) {
    // Confirm that the user wants to add the subjects
    const subjectAdditionConfirmed = await swalFileListDoubleAction(
      newSubjects,
      `${newSubjects.length} subjects will be added to the dataset`,
      "Please review the list of subjects before proceeding:",
      "yes, import the subjects",
      "No, cancel the import",
      "Would you like to import the subjects into SODA?"
    );
    if (subjectAdditionConfirmed) {
      // Add the new subjects to the dataset
      for (const subjectName of newSubjects) {
        window.sodaJSONObj.addSubject(subjectName);
      }

      notyf.open({
        duration: "3000",
        type: "success",
        message: `${newSubjects.length} subjects added`,
      });

      // Refresh the UI
      renderSubjectsTable();
    }
  }
};

window.electron.ipcRenderer.on("selected-subject-names-from-dialog", async (event, folders) => {
  const subjectNames = folders.map((folder) => window.path.basename(folder));
  guidedAddListOfSubjects(subjectNames, true);
});

const guidedOpenEntityAdditionSwal = async (entityName) => {
  // Get a list of the existing entities so we can check for duplicates
  // const subjects = window.getExistingSubjectNames();
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  // case when adding subjects
  if (entityName === "subjects") {
    preExistingEntities = window.getExistingSubjectNames();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }

  // case when adding samples to a subject
  if (entityName.startsWith("sub-")) {
    preExistingEntities = getExistingSampleNames();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  // case when adding pools
  if (entityName === "pools") {
    preExistingEntities = getExistingPoolNames();
    entityNameSingular = "pool";
    entityPrefix = "pool-";
  }

  let newEntities = [];

  const handleSwalEntityAddition = (entityName) => {
    if (entityName.length < 1) {
      throw new Error(`Please enter a ${entityNameSingular} name`);
    }
    // Check to see if the subjectName starts with sub- otherwise prepend sub- to it
    if (!entityName.startsWith(entityPrefix)) {
      entityName = `${entityPrefix}${entityName}`;
    }
    // Check to see if the subjectName already exists
    if (preExistingEntities.includes(entityName) || newEntities.includes(entityName)) {
      throw new Error(`${entityNameSingular} name has already been added`);
    }

    const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
      entityName,
      "string-adheres-to-identifier-conventions"
    );

    if (!entityNameIsValid) {
      throw new Error(`${entityNameSingular} names may not contain spaces or special characters`);
    }

    // Hide any validation messages that may exist in the sweet alert
    Swal.resetValidationMessage();

    // Add the subject to the beginning of the subjects array
    newEntities.unshift(entityName);
    // Re-render the subjects in the Swal
    renderEntitiesInSwal();
  };

  const deleteSwalEntity = (entityName) => {
    // Remove subject from subjects array
    const index = newEntities.indexOf(entityName);
    if (index > -1) {
      newEntities.splice(index, 1);
    }
    Swal.resetValidationMessage();
    renderEntitiesInSwal();
  };

  const renderEntitiesInSwal = () => {
    const entitiesList = document.getElementById("entities-list");
    if (newEntities.length === 0) {
      entitiesList.classList.add("hidden");
    } else {
      entitiesList.classList.remove("hidden");
      entitiesList.innerHTML = newEntities
        .map(
          (entity) => `
            <div class="swal-file-row px-2">
              <span class="swal-file-text">${entity}</span>
              <button class="delete-button btn btn-sm btn-outline-danger" data-entity-name="${entity}">Delete</button>
            </div>
          `
        )
        .join("");

      entitiesList.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => {
          deleteSwalEntity(button.dataset.entityName);
        });
      });
    }
  };
  `${entityNameSingular} addition`;
  const additionConfirmed = await Swal.fire({
    title: `${
      entityName.startsWith("sub-")
        ? `Add samples taken from ${entityName}`
        : `${entityNameSingular} addition`
    }`,
    html: `
      <p class="help-text">
        Enter a unique ${entityNameSingular} ID and press enter or the
        'Add ${entityNameSingular}' button for each ${entityNameSingular} in your dataset.
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input id='input-entity-addition' class='guided--input' type='text' name='guided-subject-id' placeholder='Enter ${entityNameSingular} ID and press enter'/>
        <button
          class="ui positive button soda-green-background ml-1"
          style="width: 180px;"
          id="guided-button-add-subject-in-swal"
        >
          Add ${entityNameSingular}
        </button>
      </div>
      <div id="entities-list" class="swal-file-list my-3"></div>
    `,
    width: 850,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    allowOutsideClick: false,
    confirmButtonText: `Confirm`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Render the initial subjects in the Swal
      renderEntitiesInSwal();
      const swalEntityNameInput = document.getElementById("input-entity-addition");

      // Add an event listener for the enter key so the user can press enter to add the subject
      swalEntityNameInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          try {
            handleSwalEntityAddition(swalEntityNameInput.value);
            swalEntityNameInput.value = "";
          } catch (error) {
            Swal.showValidationMessage(error);
          }
        }
      });

      const addEntityButton = document.getElementById("guided-button-add-subject-in-swal");
      addEntityButton.addEventListener("click", () => {
        try {
          handleSwalEntityAddition(swalEntityNameInput.value);
          swalEntityNameInput.value = "";
        } catch (error) {
          Swal.showValidationMessage(error);
        }
      });
    },
    preConfirm: () => {
      if (newEntities.length === 0) {
        Swal.showValidationMessage(`Please add at least one ${entityNameSingular} or click Cancel`);
      }
    },
  });

  // If the user confirmed the addition of the entities, add them to the sodaJSONObj
  // and re-render the table
  if (additionConfirmed.isConfirmed) {
    // reverse newEntities array
    newEntities.reverse();
    if (entityName === "subjects") {
      for (const subjectName of newEntities) {
        window.sodaJSONObj.addSubject(subjectName);
      }
      renderSubjectsTable();
    }
    if (entityName === "pools") {
      for (const poolName of newEntities) {
        window.sodaJSONObj.addPool(poolName);
      }
      renderPoolsTable();
    }
    if (entityName.startsWith("sub-")) {
      const subjectsPool = getSubjectsPool(entityName);
      for (const sampleName of newEntities) {
        window.sodaJSONObj.addSampleToSubject(sampleName, subjectsPool, entityName);
      }
      renderSamplesTable();
    }
  }
};

/*document.getElementById("guided-button-add-subjects").addEventListener("click", async () => {
  guidedOpenEntityAdditionSwal("subjects");
});*/

window.addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById("subject-specification-table-body");
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput = subjectSpecificationTableBody.querySelector(
    "input[name='guided-subject-id']"
  );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    //create a new table row on
    subjectSpecificationTableBody.innerHTML += generateSubjectSpecificationRowElement();

    const newSubjectRow = subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector("input[name='guided-subject-id']");
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER FOR ON FOCUS
    confirmOnBlur("guided--subject-input");
  }
};

window.addSampleSpecificationTableRow = (clickedSubjectAddSampleButton) => {
  const addSampleTable = clickedSubjectAddSampleButton.closest("table");
  const addSampleTableBody = addSampleTable.querySelector("tbody");

  //check if subject specification table body has an input with the name guided-subject-id
  const sampleSpecificationTableInput = addSampleTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  //check for any

  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    //No need to create a new row
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row Input element
    addSampleTableBody.innerHTML += generateSampleSpecificationRowElement();
    const newSamplerow = addSampleTableBody.querySelector("tr:last-child");
    //Focus the new sample row element
    const newSampleInput = newSamplerow.querySelector("input[name='guided-sample-id']");
    window.addEventListener("keydown", keydownListener);
    newSampleInput.addEventListener("blur", onBlurEvent);
    newSampleInput.focus();
  }
};

const generateNewSampleRowTd = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">sam-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-sample-id"
          placeholder="Enter sample ID"
          onkeyup="specifySample(event, window.$(this))"
          data-alert-message="Sample IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 250px"
        />
      </div>
    </td>
    <td
      class="middle aligned samples-subject-dropdown-cell remove-left-border"
    ></td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="window.deleteSample(window.$(this))"
      ></i>
    </td>
  `;
};
const addSampleTableRow = () => {
  const sampleSpecificationTableBody = document.getElementById("samples-specification-table-body");
  //check if sample specification table body has an input with the name guided-sample-id
  const sampleSpecificationTableInput = sampleSpecificationTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row on
    const newSamplesTableRow = sampleSpecificationTableBody.insertRow(-1);
    newSamplesTableRow.innerHTML = generateNewSampleRowTd();
    const newSampleRow = sampleSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSampleRow
    const newSampleInput = newSampleRow.querySelector("input[name='guided-sample-id']");
    window.smoothScrollToElement(newSampleRow);
    newSampleInput.focus();
  }
};

window.deletePool = (poolDeleteButton) => {
  const poolIdCellToDelete = poolDeleteButton.closest("tr");
  const poolIdToDelete = poolIdCellToDelete.find(".pool-id").text();
  //delete the table row element in the UI
  poolIdCellToDelete.remove();
  window.sodaJSONObj.deletePool(poolIdToDelete);
  removeAlertMessageIfExists($("#pools-table"));
};

window.deleteSample = async (sampleDeleteButton) => {
  const sampleIdCellToDelete = sampleDeleteButton.closest("tr");
  const sampleIdToDelete = sampleIdCellToDelete.find(".sample-id").text();

  //Check to see if a sample has been added to the element
  //if it has, delete the sample from the pool-sub-sam structure
  if (sampleIdToDelete) {
    await window.sodaJSONObj.deleteSample(sampleIdToDelete, true);
  }

  //Rerender the samples table
  renderSamplesTable();
};

//SAMPLE TABLE FUNCTIONS
window.openSampleRenameInput = (subjectNameEditButton) => {
  const sampleIdCellToRename = subjectNameEditButton.closest("td");
  const prevSampleName = sampleIdCellToRename.find(".sample-id").text();
  const prevSampleInput = prevSampleName.substr(prevSampleName.search("-") + 1);
  const sampleRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sam-</span>
      <input
        class="guided--input"
        type="text"
        value=${prevSampleInput}
        name="guided-sample-id"
        placeholder="Enter new sample ID"
        onkeyup="specifySample(event, window.$(this))"
        data-alert-message="Sample IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSampleName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
    </div>
  `;
  sampleIdCellToRename.html(sampleRenameElement);
};

window.removePennsievePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove.find(".permission-name-cell").text();

  if (permissionElementToRemove.prevObject[0].classList.contains("btn-danger")) {
    permissionElementToRemove.prevObject[0].style.display = "none";
    permissionElementToRemove.prevObject[0].nextElementSibling.style.display = "inline-block";
    // add removeFromPennsieve css
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].classList.add(
      "removeFromPennsieve"
    );
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].style.opacity =
      "0.5";
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[1].style.opacity =
      "0.5";

    if (permissionEntityType === "user") {
      const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
      for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i]["userString"] === permissionNameToRemove) {
          currentUsers[i]["deleteFromPennsieve"] = true;
        }
      }
    }
    if (permissionEntityType === "team") {
      const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
      for (let i = 0; i < currentTeams.length; i++) {
        if (currentTeams[i]["teamString"] === permissionNameToRemove) {
          currentTeams[i]["deleteFromPennsieve"] = true;
        }
      }
    }
  } else {
    //restore was triggered
    permissionElementToRemove.prevObject[0].style.display = "none";
    permissionElementToRemove.prevObject[0].previousElementSibling.style.display = "inline-block";
    // remove removeFromPennsieve css
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].classList.remove(
      "removeFromPennsieve"
    );
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].style.opacity =
      "1";
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[1].style.opacity =
      "1";
    if (permissionEntityType === "user") {
      const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
      for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i]["userString"] === permissionNameToRemove) {
          currentUsers[i]["deleteFromPennsieve"] = false;
        }
      }
    }
    if (permissionEntityType === "team") {
      const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
      for (let i = 0; i < currentTeams.length; i++) {
        if (currentTeams[i]["teamString"] === permissionNameToRemove) {
          currentTeams[i]["deleteFromPennsieve"] = false;
        }
      }
    }
  }
};

window.removePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove.find(".permission-name-cell").text();
  let permissionTypeToRemove = permissionElementToRemove.find(".permission-type-cell").text();

  if (permissionEntityType === "owner") {
    window.notyf.open({
      duration: "6000",
      type: "error",
      message: "You can not remove yourself as the owner of this dataset",
    });
    return;
  }
  if (permissionEntityType === "loggedInUser") {
    window.notyf.open({
      duration: "6000",
      type: "error",
      message:
        "You can not deselect yourself as a manager, as you need manager permissions to upload a dataset",
    });
    return;
  }
  if (permissionEntityType === "user") {
    const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
    const filteredUsers = currentUsers.filter((user) => {
      return !(
        user.userString == permissionNameToRemove &&
        user.permission == permissionTypeToRemove &&
        !user.loggedInUser
      );
    });
    window.sodaJSONObj["digital-metadata"]["user-permissions"] = filteredUsers;
  }
  if (permissionEntityType === "team") {
    const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
    const filteredTeams = currentTeams.filter((team) => {
      return !(
        team.teamString == permissionNameToRemove && team.permission == permissionTypeToRemove
      );
    });
    window.sodaJSONObj["digital-metadata"]["team-permissions"] = filteredTeams;
  }
  //rerender the permissions table to reflect changes to user/team permissions
  renderPermissionsTable();
};

const createPermissionsTableRowElement = (entityType, name, permission) => {
  return `
    <tr data-entity-type=${entityType}>
      <td class="middle aligned permission-name-cell">${name}</td>
      <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <button type="button" class="btn btn-danger btn-sm" onclick="window.removePermission($(this))">Delete</button>
      </td>
    </tr>
  `;
};

const createPennsievePermissionsTableRowElement = (entityType, name, permission, deleted) => {
  if (deleted) {
    return `
    <tr class="fromPennsieve" data-entity-type=${entityType}>
      <td style="opacity: 0.5" class="middle aligned permission-name-cell">${name}</td>
      <td style="opacity: 0.5" class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <button type="button" style="display: none" class="btn btn-danger btn-sm" onclick="window.removePennsievePermission($(this))">Delete</button>
        <button type="button" class="btn btn-sm" style="display: inline-block;color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);" onclick="window.removePennsievePermission($(this))">Restore</button>
      </td>
    </tr>
  `;
  } else {
    return `
      <tr class="fromPennsieve" data-entity-type=${entityType}>
        <td class="middle aligned permission-name-cell">${name}</td>
        <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
        <td class="middle aligned text-center remove-left-border" style="width: 20px">
          <button type="button" class="btn btn-danger btn-sm" onclick="window.removePennsievePermission($(this))">Delete</button>
          <button type="button" class="btn btn-sm" style="display: none;color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);" onclick="window.removePennsievePermission($(this))">Restore</button>
        </td>
      </tr>
    `;
  }
};
const renderPermissionsTable = () => {
  // when rendering permissions we will need to check if the permission was fetched from pennsieve
  // we will then create a different table element that will behave differently
  // visually showing user that the permission will be deleted upon upload
  // along with restore option and role modification
  let permissionsTableElements = [];
  const owner = window.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
  const users = window.sodaJSONObj["digital-metadata"]["user-permissions"];
  const teams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
  permissionsTableElements.push(createPermissionsTableRowElement("owner", owner, "owner"));

  for (const user of users) {
    if (user?.["permissonSource"]) {
      // user was pull from pennsieve, create pennsieve element
      if (user?.["deleteFromPennsieve"] === true) {
        permissionsTableElements.push(
          createPennsievePermissionsTableRowElement(
            user.loggedInUser ? "loggedInUser" : "user",
            user.userString,
            user.permission,
            true
          )
        );
      } else {
        permissionsTableElements.push(
          createPennsievePermissionsTableRowElement(
            user.loggedInUser ? "loggedInUser" : "user",
            user.userString,
            user.permission,
            false
          )
        );
      }
    } else {
      permissionsTableElements.push(
        createPermissionsTableRowElement(
          user.loggedInUser ? "loggedInUser" : "user",
          user["userString"],
          user["permission"]
        )
      );
    }
  }
  for (const team of teams) {
    if (team?.["permissionSource"]) {
      //team was pulled from Pennsieve, create Pennsieve element
      permissionsTableElements.push(
        createPennsievePermissionsTableRowElement("team", team["teamString"], team["permission"])
      );
    } else {
      permissionsTableElements.push(
        createPermissionsTableRowElement("team", team["teamString"], team["permission"])
      );
    }
  }

  let permissionsTable = permissionsTableElements.join("\n");
  let permissionsTableBody = document.getElementById("permissions-table-body");
  permissionsTableBody.innerHTML = permissionsTable;
};

$("#guided-button-no-source-data").on("click", () => {
  //ask user to confirm they would like to delete source folder if it exists
  if (window.datasetStructureJSONObj["folders"]["source"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the source folder.",
      text: "Are you sure you would like to delete your source folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: window.reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete source folder
        delete window.datasetStructureJSONObj["folders"]["source"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no source files
        $("#guided-button-has-source-data").click();
      }
    });
  }
});

window.getTagsFromTagifyElement = (tagifyElement) => {
  return Array.from(tagifyElement.getTagElms()).map((tag) => {
    return tag.textContent;
  });
};

$("#guided-submission-completion-date").change(function () {
  const text = $("#guided-submission-completion-date").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return { date: input_date };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#guided-submission-completion-date-manual").change(function () {
  const text = $("#guided-submission-completion-date-manual").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return { date: input_date };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date-manual option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date-manual").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date-manual").children().last();
        $option.prop("selected", true);
      }
    });
  }
});
/////////////////////////////////////////////////////////
//////////       GUIDED OBJECT ACCESSORS       //////////
/////////////////////////////////////////////////////////

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  window.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] = newPiOwnerObj.userString;
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
  //If an existing user with the same ID already exists, update the existing user's position
  for (userPermission of window.sodaJSONObj["digital-metadata"]["user-permissions"]) {
    if (
      userPermission["userString"] == newUserPermissionObj.userString &&
      userPermission["UUID"] == newUserPermissionObj.UUID
    ) {
      userPermission["permission"] = newUserPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  window.sodaJSONObj["digital-metadata"]["user-permissions"].push(newUserPermissionObj);
  renderPermissionsTable();
};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
  //If an existing team with the same ID already exists, update the existing team's position
  for (teamPermission of window.sodaJSONObj["digital-metadata"]["team-permissions"]) {
    if (
      teamPermission["teamString"] == newTeamPermissionObj.teamString &&
      teamPermission["UUID"] == newTeamPermissionObj.UUID
    ) {
      teamPermission["permission"] = newTeamPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  window.sodaJSONObj["digital-metadata"]["team-permissions"].push(newTeamPermissionObj);
  renderPermissionsTable();
};

const renderSubjectsMetadataAsideItems = async () => {
  const asideElement = document.getElementById(`guided-subjects-metadata-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectMetadataCopyButton = document.getElementById("guided-button-subject-metadata-copy");
  const subjectMetadataCopyTip = document.getElementById("guided-copy-subjects-tip");

  if (subjects.length > 1) {
    subjectMetadataCopyButton.classList.remove("hidden");
    subjectMetadataCopyTip.classList.remove("hidden");
  } else {
    subjectMetadataCopyButton.classList.add("hidden");
    subjectMetadataCopyTip.classList.add("hidden");
  }

  const subjectsFormNames = [
    ...window.guidedSubjectsFormDiv.querySelectorAll(".subjects-form-entry"),
  ].map((entry) => {
    return entry.name;
  });

  if (window.subjectsTableData.length == 0) {
    window.subjectsTableData[0] = subjectsFormNames;
    for (const subject of subjects) {
      const subjectDataArray = [];
      subjectDataArray.push(subject.subjectName);
      subjectDataArray.push(subject.poolName ? subject.poolName : "");

      for (let i = 0; i < subjectsFormNames.length - 2; i++) {
        subjectDataArray.push("");
      }
      window.subjectsTableData.push(subjectDataArray);
    }
  } else {
    //Add subjects that have not yet been added to the table to the table
    for (const subject of subjects) {
      let subjectAlreadyInTable = false;
      for (let i = 0; i < window.subjectsTableData.length; i++) {
        if (window.subjectsTableData[i][0] == subject.subjectName) {
          subjectAlreadyInTable = true;
        }
      }
      if (!subjectAlreadyInTable) {
        const subjectDataArray = [];
        subjectDataArray.push(subject.subjectName);
        subjectDataArray.push(subject.poolName ? subject.poolName : "");
        for (let i = 0; i < window.subjectsTableData[0].length - 2; i++) {
          subjectDataArray.push("");
        }
        window.subjectsTableData.push(subjectDataArray);
      }
    }

    // If the subject is in the table but not in the subjects array, remove it
    const subjectNames = subjects.map((subject) => subject.subjectName);
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (!subjectNames.includes(window.subjectsTableData[i][0])) {
        window.subjectsTableData.splice(i, 1);
      }
    }

    //If custom fields have been added to the window.subjectsTableData, create a field for each custom field
    //added
    // There are 27 standard fields for subjects so if there are more headers than that, there exists additional information
    if (window.subjectsTableData[0].length > 27) {
      for (let i = 27; i < window.subjectsTableData[0].length; i++) {
        if (
          !subjectsFormNames.includes(
            window.subjectsTableData[0][i].charAt(0).toUpperCase() +
              window.subjectsTableData[0][i].slice(1)
          ) ||
          !subjectsFormNames.includes(window.subjectsTableData[0][i])
        ) {
          window.addCustomHeader("subjects", window.subjectsTableData[0][i], "guided");
        }
      }
    }
  }

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <div 
            class="subjects-metadata-aside-item selection-aside-item"
          >
            ${subject.subjectName}
          </div>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each subject item
  const selectionAsideItems = document.querySelectorAll(`div.subjects-metadata-aside-item`);
  selectionAsideItems.forEach(async (item) => {
    item.addEventListener("click", async (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-subject-intro");
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle("guided-form-add-a-subject-intro", "guided-form-add-a-subject");
      }
      //Save the subject metadata from the previous subject being worked on
      let previousSubject = document.getElementById("guided-bootbox-subject-id").value;
      //check to see if previousSubject is empty
      if (previousSubject) {
        window.addSubject("guided");
        await guidedSaveProgress();
      }

      window.clearAllSubjectFormFields(window.guidedSubjectsFormDiv);

      window.populateForms(e.target.innerText, "", "guided");

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      document.getElementById("guided-bootbox-subject-id").value = e.target.innerText;

      await guidedSaveProgress();
    });
  });
};

// Guided mode event listener (from curate and share page)

// Free form mode event listener (from curate and share page)
document.querySelector("#button-homepage-freeform-mode").addEventListener("click", async () => {
  //Free form mode will open through here
  window.guidedPrepareHomeScreen();

  // guidedResetSkippedPages();

  directToFreeFormMode();
  document.getElementById("guided_mode_view").classList.add("is-selected");
});

$("#guided-button-add-permission-user-or-team").on("click", function () {
  try {
    //get the selected permission element
    const newPermissionElement = $("#guided_bf_list_users_and_teams option:selected");
    const newPermissionRoleElement = $("#select-permission-list-users-and-teams");

    //throw error if no user/team or role is selected
    if (
      newPermissionElement.val().trim() === "Select individuals or teams to grant permissions to"
    ) {
      throw "Please select a user or team to designate a permission to";
    }
    if (newPermissionRoleElement.val().trim() === "Select role") {
      throw "Please select a role for the user or team";
    }

    if (
      newPermissionElement.val().trim() ===
      window.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"]
    ) {
      throw `${newPermissionElement.text().trim()} is designated as the PI owner.
        To designate them as a ${newPermissionRoleElement
          .val()
          .trim()}, go back and remove them as the PI owner.`;
    }

    if (newPermissionElement[0].getAttribute("permission-type") == "user") {
      //if the selected element is a user, add the user to the user permissions array
      let userString = newPermissionElement.text().trim();
      let userName = userString.split("(")[0].trim();
      let UUID = newPermissionElement.val().trim();
      let userPermission = newPermissionRoleElement.val().trim();
      const newUserPermissionObj = {
        userString: userString,
        userName: userName,
        UUID: UUID,
        permission: userPermission,
      };
      guidedAddUserPermission(newUserPermissionObj);
    }
    if (newPermissionElement[0].getAttribute("permission-type") == "team") {
      //if the selected element is a team, add the team to the team permissions array
      const newTeamPermissionObj = {
        teamString: newPermissionElement.text().trim(),
        UUID: newPermissionElement.val().trim(),
        permission: newPermissionRoleElement.val().trim(),
      };
      guidedAddTeamPermission(newTeamPermissionObj);
    }
    $(this)[0].scrollIntoView({ behavior: "smooth" });
    guidedResetUserTeamPermissionsDropdowns();
  } catch (error) {
    window.notyf.open({ duration: "4000", type: "error", message: error });
  }
});

$("#guided-button-add-permission-user").on("click", function () {
  const newUserPermission = {
    userString: $("#guided_bf_list_users option:selected").text().trim(),
    UUID: $("#guided_bf_list_users").val().trim(),
    permission: $("#select-permission-list-users-and-teams").val(),
  };
  removeAlertMessageIfExists($("#guided-designated-user-permissions-info"));
  guidedAddUserPermission(newUserPermission);
});

$("#guided-button-add-permission-team").on("click", function () {
  const newTeamPermissionObj = {
    teamString: $("#guided_bf_list_teams").val().trim(),
    permission: $("#select-permission-list-4").val(),
  };
  removeAlertMessageIfExists($("#guided-designated-team-permissions-info"));
  guidedAddTeamPermission(newTeamPermissionObj);
});

const arraysHaveSameElements = (arr1, arr2) => {
  if (arr1.length != arr2.length) {
    return false;
  }
  for (const elementValue of arr1) {
    if (!arr2.includes(elementValue)) {
      return false;
    }
  }
  return true;
};

const showCorrectSpreadsheetInstructionSection = (datasetEntities) => {
  if (arraysHaveSameElements(datasetEntities, ["subjects"])) {
    // show the subjects only spreadsheet instructions
    document.getElementById("import-instructions-subjects").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "pools"])) {
    // show the subjects and pools spreadsheet instructions
    document.getElementById("import-instructions-subjects-pools").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "samples"])) {
    // show the subjects and samples spreadsheet instructions

    document.getElementById("import-instructions-subjects-samples").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "pools", "samples"])) {
    // show the subjects, pools, and samples spreadsheet instructions
    document
      .getElementById("import-instructions-subjects-pools-samples")
      .classList.remove("hidden");
  }
};

$("#guided-button-samples-not-same").on("click", () => {
  $("#guided-button-generate-subjects-table").show();
});
$("#guided-button-samples-same").on("click", () => {
  $("#guided-button-generate-subjects-table").hide();
});

/////////////////////////////////////////////////////////
/////////  PENNSIEVE METADATA BUTTON HANDLERS   /////////
/////////////////////////////////////////////////////////

$("#guided-dataset-subtitle-input").on("keyup", () => {
  const guidedDatasetSubtitleCharCount = document.getElementById("guided-subtitle-char-count");
  window.countCharacters(
    document.getElementById("guided-dataset-subtitle-input"),
    guidedDatasetSubtitleCharCount
  );
});

// function for importing a banner image if one already exists
$("#guided-button-add-banner-image").click(async () => {
  $("#guided-banner-image-modal").modal("show");
  $("#guided-banner-image-modal").parents()[0].style.zIndex = "1002";
  $("#guided-banner-image-modal").addClass("show");
  window.myCropper.destroy();
  window.myCropper = new Cropper(window.guidedBfViewImportedImage, window.guidedCropOptions);
});

// Action when user click on "Import image" button for banner image
$("#guided-button-import-banner-image").click(async () => {
  $("#guided-para-dataset-banner-image-status").html("");
  // add show class to modal
  let filePaths = await window.electron.ipcRenderer.invoke("open-file-dialog-import-banner-image");
  $("#guided-banner-image-modal").modal("show");
  window.handleSelectedBannerImage(filePaths, "guided-mode");
  $("#guided-banner-image-modal").addClass("show");
});

/////////////////////////////////////////////////////////
//////////    GUIDED IPC RENDERER LISTENERS    //////////
/////////////////////////////////////////////////////////

$("#guided-input-destination-getting-started-locally").on("click", () => {
  window.electron.ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
});

// add a click listener to button with id guided-generate-dataset-locally-button that triggers local gen
document.querySelector("#guided-generate-dataset-locally-button").addEventListener("click", () => {
  // Send an IPC message to select the local dataset generation path
  window.electron.ipcRenderer.send("guided-select-local-dataset-generation-path");
});

// Listen for the selected path for local dataset generation that starts the local dataset generation process
window.electron.ipcRenderer.on(
  "selected-guided-local-dataset-generation-path",
  async (event, filePath) => {
    console.log("Calling from the renderer with filePath:", filePath);
    await guidedGenerateDatasetLocally(filePath);
  }
);

document
  .querySelector("#guided--verify-file-status-retry-upload")
  .addEventListener("click", async () => {
    window.retryGuidedMode = true; //set the retry flag to true
    let supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // hide the verify files sections
    document.querySelector("#guided--verify-files").classList.add("hidden");
    document.querySelector("#guided--question-validate-dataset-upload-2").classList.add("hidden");
    document.querySelector("#guided--validate-dataset-upload").classList.add("hidden");

    // check if the user made it to the last step
    if (
      !document
        .querySelector("#guided-div-dataset-upload-status-table")
        .classList.contains("hidden")
    ) {
      // scroll to the upload status table
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
      // upload on the last step
      await guidedUploadDatasetToPennsieve();
    } else {
      // restart the whole process
      await guidedGenerateDatasetOnPennsieve();
    }
  });

$("#guided-button-save-other-link-fields").on("click", () => {
  let allInputsValid = true;
  //get all contributor fields
  const otherLinkFields = document.querySelectorAll(".guided-other-links-field-container");
  //check if contributorFields is empty
  if (otherLinkFields.length === 0) {
    window.notyf.error("Please add at least one other link");
    return;
  }

  //loop through contributor fields and get values
  const otherLinkFieldsArray = Array.from(otherLinkFields);
  ///////////////////////////////////////////////////////////////////////////////
  otherLinkFieldsArray.forEach((otherLinkField) => {
    const linkUrl = otherLinkField.querySelector(".guided-other-link-url-input");
    const linkDescription = otherLinkField.querySelector(".guided-other-link-description-input");
    const linkRelation = otherLinkField.querySelector(".guided-other-link-relation-dropdown");

    const textInputs = [linkUrl, linkDescription];

    //check if all text inputs are valid
    textInputs.forEach((textInput) => {
      if (textInput.value === "") {
        textInput.style.setProperty("border-color", "red", "important");
        allInputsValid = false;
      } else {
        textInput.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
      }
    });
    if (linkRelation.value === "Select") {
      linkRelation.style.setProperty("border-color", "red", "important");
      allInputsValid = false;
    } else {
      linkRelation.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
    }
  });
  ///////////////////////////////////////////////////////////////////////////////
  if (!allInputsValid) {
    window.notyf.error("Please fill out all link fields");
    return;
  }

  //set opacity and remove pointer events for table and show edit button
  disableElementById("other-links-container");
  disableElementById("guided-button-add-other-link");

  //switch button from save to edit
  document.getElementById("guided-button-save-other-link-fields").style.display = "none";
  document.getElementById("guided-button-edit-other-link-fields").style.display = "flex";
  pulseNextButton();
});
$("#guided-button-add-additional-link").on("click", async () => {
  openAddAdditionLinkSwal();
});
$("#guided-button-edit-other-link-fields").on("click", () => {
  enableElementById("other-links-container");
  enableElementById("guided-button-add-other-link");
  //switch button from edit to save
  document.getElementById("guided-button-edit-other-link-fields").style.display = "none";
  document.getElementById("guided-button-save-other-link-fields").style.display = "flex";
  unPulseNextButton();
});

const guidedGenerateRCFilesHelper = (type) => {
  let textValue = $(`#guided-textarea-create-${type}`).val().trim();
  if (textValue === "") {
    Swal.fire({
      title: "Incomplete information",
      text: "Plase fill in the textarea.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
      showCancelButton: false,
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    });
    return "empty";
  }
};
const guidedSaveRCFile = async (type) => {
  var result = guidedGenerateRCFilesHelper(type);
  if (result === "empty") {
    return;
  }
  var { value: continueProgress } = await Swal.fire({
    title: `Any existing ${type.toUpperCase()}.txt file in the specified location will be replaced.`,
    text: "Are you sure you want to continue?",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Yes",
  });
  if (!continueProgress) {
    return;
  }
  let data = $(`#guided-textarea-create-${type}`).val().trim();
  let destinationPath;
  if (type === "changes") {
    destinationPath = window.path.join($("#guided-dataset-path").text().trim(), "CHANGES.xlsx");
  } else {
    destinationPath = window.path.join($("#guided-dataset-path").text().trim(), "README.xlsx");
  }
  window.fs.writeFile(destinationPath, data, (err) => {
    if (err) {
      console.log(err);
      window.log.error(err);
      var emessage = userErrorMessage(err);
      Swal.fire({
        title: `Failed to generate the existing ${type}.txt file`,
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
        didOpen: () => {
          Swal.hideLoading();
        },
      });
    } else {
      var newName =
        type === "changes"
          ? window.path.join(window.path.dirname(destinationPath), "CHANGES.txt")
          : window.path.join(window.path.dirname(destinationPath), "README.txt");
      window.fs.rename(destinationPath, newName, async (err) => {
        if (err) {
          console.log(err);
          window.log.error(err);
          Swal.fire({
            title: `Failed to generate the ${type}.txt file`,
            html: err,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            icon: "error",
            didOpen: () => {
              Swal.hideLoading();
            },
          });
        } else {
          Swal.fire({
            title: `The ${type.toUpperCase()}.txt file has been successfully generated at the specified location.`,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          });
        }
      });
    }
  });
};
$("#guided-generate-subjects-file").on("click", () => {
  window.addSubject("guided");
  window.clearAllSubjectFormFields(window.guidedSubjectsFormDiv);
});

$("#guided-generate-submission-file").on("click", () => {
  guidedSaveSubmissionFile();
});
$("#guided-generate-readme-file").on("click", () => {
  guidedSaveRCFile("readme");
});
$("#guided-generate-changes-file").on("click", () => {
  guidedSaveRCFile("changes");
});

// /**************************************/

//tagify initializations

const guidedSaveDescriptionDatasetInformation = () => {
  const title = window.sodaJSONObj["digital-metadata"]["name"];
  const subtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
  let studyType = window.sodaJSONObj["dataset-type"] || "";
  //get the keywords from the keywords textarea
  const keywordArray = window.getTagsFromTagifyElement(guidedDatasetKeywordsTagify);
  if (keywordArray.length < 3) {
    throw "Please enter at least 3 keywords";
  }

  //Get the count of all subjects in and outside of pools
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  const numSubjects = [...subjectsInPools, ...subjectsOutsidePools].length;

  //Get the count of all samples
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  const numSamples = [...samplesInPools, ...samplesOutsidePools].length;

  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"] = {
    name: title,
    description: subtitle,
    type: studyType,
    keywords: keywordArray,
    "number of samples": numSamples,
    "number of subjects": numSubjects,
  };

  // Save keywords as the tags to be uploaded as the Pennsieve dataset tags
  window.sodaJSONObj["digital-metadata"]["dataset-tags"] = keywordArray;
};

const guidedSaveDescriptionStudyInformation = () => {
  const studyOrganSystemTags = window.getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
  const studyApproachTags = window.getTagsFromTagifyElement(guidedStudyApproachTagify);
  const studyTechniqueTags = window.getTagsFromTagifyElement(guidedStudyTechniquesTagify);

  const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
  const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
  const studyPrimaryConclusionInput = document.getElementById("guided-ds-study-primary-conclusion");
  const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");
  //Initialize the study information variables
  let studyPurpose = null;
  let studyDataCollection = null;
  let studyPrimaryConclusion = null;
  let studyCollectionTitle = null;

  //Throw an error if any study information variables are not filled out
  if (!studyPurposeInput.value.trim()) {
    throw "Please add a study purpose";
  } else {
    studyPurpose = studyPurposeInput.value.trim();
  }
  if (!studyDataCollectionInput.value.trim()) {
    throw "Please add a study data collection";
  } else {
    studyDataCollection = studyDataCollectionInput.value.trim();
  }
  if (!studyPrimaryConclusionInput.value.trim()) {
    throw "Please add a study primary conclusion";
  } else {
    studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim();
  }
  if (studyOrganSystemTags.length < 1) {
    throw "Please add at least one study organ system";
  }
  if (studyApproachTags.length < 1) {
    throw "Please add at least one study approach";
  }
  if (studyTechniqueTags.length < 1) {
    throw "Please add at least one study technique";
  }

  studyCollectionTitle = studyCollectionTitleInput.value.trim();

  //After validation, add the study information to the JSON object
  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"] = {
    "study organ system": studyOrganSystemTags,
    "study approach": studyApproachTags,
    "study technique": studyTechniqueTags,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle,
  };

  // Generate the dataset description to be added to Pennsieve based off of the dd metadata
  window.sodaJSONObj["digital-metadata"]["description"] = {
    "study-purpose": studyPurpose,
    "data-collection": studyDataCollection,
    "primary-conclusion": studyPrimaryConclusion,
  };
};
const guidedSaveDescriptionContributorInformation = () => {
  const acknowledgmentsInput = document.getElementById("guided-ds-acknowledgments");
  const acknowledgments = acknowledgmentsInput.value.trim();

  // Get tags from other funding tagify
  const otherFunding = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);

  window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributor-information"] = {
    funding: otherFunding,
    acknowledgment: acknowledgments,
  };
};

const doTheHack = async () => {
  console.log("Doing the hack");
  // wait for a second
  await new Promise((resolve) => setTimeout(resolve, 5000));
  document.getElementById("button-homepage-guided-mode").click();
  document.getElementById("guided-button-resume-progress-file").click();
  // wait for 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Search the dom for a button with the classes "ui positive button guided--progress-button-resume-curation"
  const resumeCurationButton = document.querySelector(
    ".ui.positive.button.guided--progress-button-resume-curation"
  );
  if (resumeCurationButton) {
    resumeCurationButton.click();
  } else {
    // wait for 3 more seconds then click
    await new Promise((resolve) => setTimeout(resolve, 3000));
    document.querySelector(".ui.positive.button.guided--progress-button-resume-curation").click();
  }
  // wait for 4 seconds then click the next button
  await new Promise((resolve) => setTimeout(resolve, 4000));
  document.querySelector(".primary-selection-aside-item.selection-aside-item").click();
};

// If this variable is set to true, you will be taken back to the last guided mode page you were working on
// (always set to false when making production builds)
const continueHackGm = false;
if (continueHackGm) {
  doTheHack();
}

// Add the event listener for the Data importation component
const dragDropElementId = document.getElementById("data-importer-dropzone");
dragDropElementId.addEventListener("click", (event) => {
  event.preventDefault();
  window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog", {
    importRelativePath: "data/",
  });
});
// Add a drop listener that handles the drop event
dragDropElementId.addEventListener("drop", (event) => {
  event.preventDefault();
  const itemsDroppedInFileExplorer = Array.from(event.dataTransfer.files).map((file) => file.path);
  console.log("Items dropped in file explorer:", itemsDroppedInFileExplorer);

  window.electron.ipcRenderer.send("file-explorer-dropped-datasets", {
    filePaths: itemsDroppedInFileExplorer,
    importRelativePath: "data/",
  });
});
