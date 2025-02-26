// // sourcery skip: merge-nested-ifs

import { guidedSetNavLoadingState } from "./pages/navigationUtils/pageLoading";
import { guidedSaveProgress } from "./pages/savePageChanges";
import {
  getContributorByOrcid,
  addContributor,
  renderDatasetDescriptionContributorsTable,
} from "./metadata/contributors";
import { renderManifestCards } from "./manifests/manifest";
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
  swalConfirmAction,
  swalShowError,
  swalFileListSingleAction,
  swalFileListDoubleAction,
  swalShowInfo,
} from "../utils/swal-utils";

// Import state management stores
import useGlobalStore from "../../stores/globalStore";
import { setDropdownState } from "../../stores/slices/dropDownSlice";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../stores/slices/guidedModeSlice";
import {
  setEntityType,
  getEntityObjForEntityType,
  setEntityListForEntityType,
  setActiveEntity,
  getDatasetEntityObj,
  setDatasetEntityObj,
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../stores/slices/datasetEntitySelectorSlice";
import {
  setTreeViewDatasetStructure,
  externallySetSearchFilterValue,
} from "../../stores/slices/datasetTreeViewSlice";
import { setSelectedEntities } from "../../stores/slices/datasetContentSelectorSlice";
import {
  getDatasetEntityArray,
  setDatasetEntityArray,
} from "../../stores/slices/datasetEntityStructureSlice";

import "bootstrap-select";
import Cropper from "cropperjs";

import "jstree";

import fileTxt from "/img/txt-file.png";
import filePng from "/img/png-file.png";
import filePdf from "/img/pdf-file.png";
import fileCsv from "/img/csv-file.png";
import fileDoc from "/img/doc-file.png";
import fileXlsx from "/img/excel-file.png";
import fileJpeg from "/img/jpeg-file.png";
import fileOther from "/img/other-file.png";
import hasConnectedAccountWithPennsieve from "../others/authentication/auth";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

window.returnToGuided = () => {
  document.getElementById("guided_mode_view").click();
};

const guidedGetDatasetType = () => {
  // Returns the dataset type (e.g. "computational" or "experimental")
  return window.sodaJSONObj?.["dataset-type"];
};

document
  .getElementById("guided-button-resume-pennsieve-dataset")
  .addEventListener("click", async () => {
    renderGuidedResumePennsieveDatasetSelectionDropdown();
  });

window.verifyProfile = async () => {
  const accountValid = await window.check_api_key();

  if (!accountValid) {
    await window.addBfAccount(null, false);
    return;
  }
};

const guidedLicenseOptions = [
  {
    licenseName: "Creative Commons Attribution",
    licenseDescription:
      "A permissive license commonly used for open data collections that allows others to use, modify, and distribute your work provided appropriate credit is given.",
    datasetTypes: ["experimental"],
  },
  {
    licenseName: "MIT",
    licenseDescription:
      "A permissive license that allows others to use, modify, and distribute your work provided they grant you credit.",
    datasetTypes: ["computational"],
  },
  {
    licenseName: "GNU General Public License v3.0",
    licenseDescription:
      "A copyleft license that allows others to use, modify, and distribute your work provided they grant you credit and distribute their modifications under the GNU GPL license as well.",
    datasetTypes: ["computational"],
  },
];

const guidedResetLocalGenerationUI = () => {
  // Hide the local dataset copy generation section that containst the table/generation progress
  document.getElementById("guided-section-local-generation-status-table").classList.add("hidden");
  // Hide the local dataset generation success section
  document.getElementById("guided-section-post-local-generation-success").classList.add("hidden");
  // Hide the local dataset generation retry section
  document.getElementById("guided-section-retry-local-generation").classList.add("hidden");
};

const folderImportedFromPennsieve = (folderJSONPath) => {
  return folderJSONPath.type === "bf";
};

const guidedModifyPennsieveFolder = (folderJSONPath, action) => {
  //Actions can be "delete"  or "restore"

  if (!folderJSONPath) {
    return;
  }
  if (action === "delete") {
    if (!folderJSONPath["action"].includes("deleted")) {
      folderJSONPath["action"].push("deleted");
    }

    window.recursive_mark_sub_files_deleted(folderJSONPath, "delete");
  }
  if (action === "restore") {
    folderJSONPath["action"] = folderJSONPath["action"].filter(
      (action) => action !== "recursive_deleted" || action !== "deleted"
    );
    window.recursive_mark_sub_files_deleted(folderJSONPath, "restore");
  }
};

const guidedMovePennsieveFolder = (movedFolderName, folderJSONPath, newFolderJSONPath) => {
  if (!folderJSONPath) {
    return;
  }
  if (!newFolderJSONPath) {
    return;
  }

  folderJSONPath["action"] = ["existing", "moved"];
  window.addMovedRecursively(folderJSONPath);
  newFolderJSONPath["folders"][movedFolderName] = folderJSONPath;
};

/* 
document.getElementById("guided-button-dataset-contains-code").addEventListener("click", () => {
  const codeFolder = window.datasetStructureJSONObj["folders"]["code"];
  if (codeFolder) {
    if (folderImportedFromPennsieve(codeFolder)) {
      // If the code folder is imported from Pennsieve, unmark it as deleted
      guidedModifyPennsieveFolder(codeFolder, "restore");
      // NOTE: We do not need to update the UI since this button is not on the ui structuring page
    }
  }
});
*/

window.getDatasetEntityObj = getDatasetEntityObj;

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
  let dataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
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

//Initialize description tagify variables as null
//to make them accessible to functions outside of $(document).ready
let guidedDatasetKeywordsTagify = null;
let guidedStudyTechniquesTagify = null;
let guidedStudyApproachTagify = null;
let guidedStudyOrganSystemsTagify = null;
let guidedOtherFundingsourcesTagify = null;

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
      renderManifestCards();
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
      if (sodaJSONObjCopy["starting-point"]["type"] === "bf") {
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

      // create the manifest files if the user auto generated manifest files at any point
      await guidedCreateManifestFilesAndAddToDatasetStructure();

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

window.handleGuidedModeOrgSwitch = async (buttonClicked) => {
  const clickedButtonId = buttonClicked.id;
  if (clickedButtonId === "guided-button-change-workspace-dataset-import") {
    renderGuidedResumePennsieveDatasetSelectionDropdown();
  }
  if (buttonClicked.classList.contains("guided--progress-button-switch-workspace")) {
    await guidedRenderProgressCards();
  }
};

$("#guided-select-pennsieve-dataset-to-resume").selectpicker();
const renderGuidedResumePennsieveDatasetSelectionDropdown = async () => {
  // First hide the error div if it is showing
  const errorDiv = document.getElementById("guided-panel-pennsieve-dataset-import-error");
  const logInDiv = document.getElementById("guided-panel-log-in-before-resuming-pennsieve-dataset");
  const loadingDiv = document.getElementById("guided-panel-pennsieve-dataset-import-loading");
  const loadingDivText = document.getElementById(
    "guided-panel-pennsieve-dataset-import-loading-para"
  );
  const pennsieveDatasetSelectDiv = document.getElementById(
    "guided-panel-pennsieve-dataset-select"
  );
  // Hide all of the divs incase they were previously shown
  errorDiv.classList.add("hidden");
  logInDiv.classList.add("hidden");
  loadingDiv.classList.add("hidden");
  pennsieveDatasetSelectDiv.classList.add("hidden");

  // If the user is not logged in, show the log in div and return
  if (!window.defaultBfAccount) {
    logInDiv.classList.remove("hidden");
    return;
  }

  //Show the loading Div and hide the dropdown div while the datasets the user has access to are being retrieved
  loadingDiv.classList.remove("hidden");

  try {
    loadingDivText.textContent = "Verifying account information";
    await window.verifyProfile();
    loadingDivText.textContent = "Verifying workspace information";
    await window.synchronizePennsieveWorkspace();
    loadingDivText.textContent = "Importing datasets from Pennsieve";
  } catch (e) {
    clientError(e);
    await swalShowInfo(
      "Something went wrong while verifying your profile",
      "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
    );
    loadingDiv.classList.add("hidden");
    return;
  }

  const datasetSelectionSelectPicker = $("#guided-select-pennsieve-dataset-to-resume");
  datasetSelectionSelectPicker.empty();
  try {
    let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
      params: { selected_account: window.defaultBfAccount },
    });
    const datasets = responseObject.data.datasets;
    //Add the datasets to the select picker
    datasetSelectionSelectPicker.append(
      `<option value="" selected>Select a dataset on Pennsieve to resume</option>`
    );
    for (const dataset of datasets) {
      datasetSelectionSelectPicker.append(`<option value="${dataset.id}">${dataset.name}</option>`);
    }
    datasetSelectionSelectPicker.selectpicker("refresh");

    //Hide the loading div and show the dropdown div
    loadingDiv.classList.add("hidden");
    pennsieveDatasetSelectDiv.classList.remove("hidden");
  } catch (error) {
    // Show the error div and hide the dropdown and loading divs
    errorDiv.classList.remove("hidden");
    loadingDiv.classList.add("hidden");
    pennsieveDatasetSelectDiv.classList.add("hidden");
    clientError(error);
    document.getElementById("guided-pennsieve-dataset-import-error-message").innerHTML =
      userErrorMessage(error);
  }
};

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

const guidedUpdateFolderStructure = (highLevelFolder, subjectsOrSamples) => {
  //add high level folder if it does not exist
  /*
  if (!window.datasetStructureJSONObj["folders"][highLevelFolder]) {
    window.datasetStructureJSONObj["folders"][highLevelFolder] = newEmptyFolderObj();
  }*/

  if (subjectsOrSamples === "subjects") {
    //Add subjects to datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
    for (const subject of subjectsInPools) {
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
          "folders"
        ][subject.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
          "folders"
        ][subject.subjectName] = newEmptyFolderObj();
      }
    }
    for (const subject of subjectsOutsidePools) {
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName] =
          newEmptyFolderObj();
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Add samples to datsetStructuresJSONObj if they don't exist
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    for (const sample of samplesInPools) {
      /**
       * Check to see if the sample's pool is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (!window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName] =
          newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's subject is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName] = newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's folder is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]["folders"][sample.sampleName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]["folders"][sample.sampleName] = newEmptyFolderObj();
      }
    }
    for (const sample of samplesOutsidePools) {
      /**
       * Check to see if the sample's subject is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName] =
          newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's folder is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName] = newEmptyFolderObj();
      }
    }
  }
};

const folderIsEmpty = (folder) => {
  if (!folder) {
    return true;
  }

  return Object.keys(folder.folders).length === 0 && Object.keys(folder.files).length === 0;
};

const cleanUpEmptyFoldersFromGeneratedGuidedStructure = (highLevelFolder) => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  for (const subject of subjectsInPools) {
    const poolName = subject["poolName"];
    const subjectName = subject["subjectName"];
    const subjectsSamplesArray = subject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName]?.["folders"]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName]["folders"][sample];
        }
      }

      // Then delete the subject folder if it is empty
      const subjectFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolder) {
        if (folderIsEmpty(subjectFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName];
        }
      }

      // Then delete the pool folder if it is empty
      const poolFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];
      if (poolFolder) {
        if (folderIsEmpty(poolFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    // If the sample folder exists and is empty, delete it
  }
  for (const subjectObject of subjectsOutsidePools) {
    const subjectName = subjectObject["subjectName"];
    const subjectsSamplesArray = subjectObject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName]?.[
          "folders"
        ]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName][
            "folders"
          ][sample];
        }
      }
    }
    // Then delete the subject folder if it is empty
    const subjectFolder =
      window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName];
    if (subjectFolder) {
      if (folderIsEmpty(subjectFolder)) {
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
      }
    }
  }
  for (const subject of subjectsInPools) {
    const poolName = subject["poolName"];
    const subjectName = subject["subjectName"];
    const subjectsSamplesArray = subject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName]?.["folders"]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName]["folders"][sample];
        }
      }

      // Then delete the subject folder if it is empty
      const subjectFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolder) {
        if (folderIsEmpty(subjectFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName];
        }
      }

      // Then delete the pool folder if it is empty
      const poolFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];
      if (poolFolder) {
        if (folderIsEmpty(poolFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    // If the sample folder exists and is empty, delete it
  }
  for (const subjectObject of subjectsOutsidePools) {
    const subjectName = subjectObject["subjectName"];
    const subjectsSamplesArray = subjectObject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.["primary"]?.["folders"]?.[subjectName]?.[
          "folders"
        ]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"]["primary"]["folders"][subjectName][
            "folders"
          ][sample];
        }
      }
    }
    // Then delete the subject folder if it is empty
    const subjectFolder =
      window.datasetStructureJSONObj["folders"]?.["primary"]?.["folders"]?.[subjectName];
    if (subjectFolder) {
      if (folderIsEmpty(subjectFolder)) {
        delete window.datasetStructureJSONObj["folders"]["primary"]["folders"][subjectName];
      }
    }
  }
};

const guidedAddUsersAndTeamsToDropdown = (usersArray, teamsArray) => {
  const guidedUsersAndTeamsDropdown = document.getElementById("guided_bf_list_users_and_teams");
  // Reset the dropdown
  guidedUsersAndTeamsDropdown.innerHTML =
    "<option>Select individuals or teams to grant permissions to</option>";

  // Loop through the users and add them to the dropdown
  for (const userString of usersArray) {
    const userNameAndEmail = userString.split("!|**|!")[0].trim();
    const userID = userString.split("!|**|!")[1].trim();
    const userOption = `
          <option
            permission-type="user"
            value="${userID}"
          >
            ${userNameAndEmail}
          </option>
        `;
    guidedUsersAndTeamsDropdown.insertAdjacentHTML("beforeend", userOption);
  }

  // Loop through the teams and add them to the dropdown
  for (const team of teamsArray) {
    const trimmedTeam = team.trim();
    const teamOption = `
          <option
            permission-type="team"
            value="${trimmedTeam}"
          >
            ${trimmedTeam}
          </option>
        `;
    guidedUsersAndTeamsDropdown.insertAdjacentHTML("beforeend", teamOption);
  }
};

const guidedResetUserTeamPermissionsDropdowns = () => {
  $("#guided_bf_list_users_and_teams").val("Select individuals or teams to grant permissions to");
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
  $("#select-permission-list-users-and-teams").val("Select role");
};

let addListener = true;
let removeEventListener = false;
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
  const contributorsBeforeDelete =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
    contributorsBeforeDelete.filter((contributor) => {
      return contributor.conID !== contributorOrcid;
    });
  contributorField.remove();
  //rerender the table after deleting a contributor
  renderDatasetDescriptionContributorsTable();
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

const renderSubjectsTable = () => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];

  // If there are no subjects, hide the subjects table
  const subjectsTableContainer = document.getElementById("guided-section-subjects-table");
  if (subjects.length === 0) {
    subjectsTableContainer.classList.add("hidden");
    return;
  } else {
    // If there are subjects, show the subjects table
    subjectsTableContainer.classList.remove("hidden");
  }

  // Map the subjects to HTML elements
  const subjectElementRows = subjects
    .map((subject) => {
      return generateSubjectRowElement(subject.subjectName);
    })
    .join("\n");
  document.getElementById("subject-specification-table-body").innerHTML = subjectElementRows;

  // Add event listeners to the subject edit buttons
  document.querySelectorAll(".guided-subject-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const subjectName = button.dataset.subjectName;
      await guidedOpenEntityEditSwal(subjectName);
    });
  });
};

const renderPoolsTable = () => {
  const pools = window.sodaJSONObj.getPools();
  const poolElementRows = Object.keys(pools)
    .map((pool) => {
      return generatePoolRowElement(pool);
    })
    .join("\n");
  document.getElementById("pools-specification-table-body").innerHTML = poolElementRows;

  // Add event listeners to the pool edit buttons
  document.querySelectorAll(".guided-pool-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const poolName = button.dataset.poolName;
      await guidedOpenEntityEditSwal(poolName);
    });
  });

  for (const poolName of Object.keys(pools)) {
    const newPoolSubjectsSelectElement = $(
      `select[name="${poolName}-subjects-selection-dropdown"]`
    );
    //create a select2 dropdown for the pool subjects
    $(newPoolSubjectsSelectElement).select2({
      placeholder: "Select subjects",
      tags: true,
      width: "100%",
      closeOnSelect: false,
      createTag: function () {
        // Disable tagging
        return null;
      },
    });
    //update the newPoolSubjectsElement with the subjects in the pool
    updatePoolDropdown($(newPoolSubjectsSelectElement), poolName);
    $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
      updatePoolDropdown($(e.currentTarget), poolName);
    });
    $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
      const subjectToRemove = e.params.data.id;
      window.sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
    });
    $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
      const selectedSubject = e.params.data.id;
      window.sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
    });
  }
};

const renderSamplesTable = () => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //Create the HTML for the subjects
  const subjectSampleAdditionTables = subjects
    .map((subject) => {
      return renderSubjectSampleAdditionTable(subject);
    })
    .join("\n");

  const subjectSampleAdditionTableContainer = document.getElementById(
    "guided-section-samples-tables"
  );
  subjectSampleAdditionTableContainer.innerHTML = subjectSampleAdditionTables;

  document.querySelectorAll(".button-subject-add-samples").forEach((button) => {
    button.addEventListener("click", async () => {
      const subjectName = button.dataset.samplesSubjectName;
      await guidedOpenEntityAdditionSwal(subjectName);
    });
  });

  // Add event listeners to the sample edit buttons
  document.querySelectorAll(".guided-sample-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const sampleName = button.dataset.sampleName;
      await guidedOpenEntityEditSwal(sampleName);
    });
  });
};

function setGuidedProgressBarValue(destination, value) {
  const progressBar = document.querySelector(`#guided-progress-bar-${destination}-generation`);
  if (progressBar) {
    progressBar.setAttribute("value", value);
  } else {
    console.error(`Could not find progress bar for ${destination}`);
  }
}

const generateAlertMessage = (elementToWarn) => {
  const alertMessage = elementToWarn.data("alert-message");
  const alertType = elementToWarn.data("alert-type");
  if (!elementToWarn.next().hasClass("alert")) {
    elementToWarn.after(generateAlertElement(alertType, alertMessage));
  }
  enableProgressButton();
};

const removeAlertMessageIfExists = (elementToCheck) => {
  const alertMessageToRemove = elementToCheck.next();
  if (alertMessageToRemove.hasClass("alert")) {
    elementToCheck.next().remove();
  }
};

const guidedCheckIfUserNeedsToReconfirmAccountDetails = () => {
  if (!window.sodaJSONObj["completed-tabs"].includes("guided-pennsieve-intro-tab")) {
    return false;
  }
  // If the user has changed their Pennsieve account, they need to confirm their new Pennsieve account and workspace
  if (window.sodaJSONObj?.["last-confirmed-bf-account-details"] !== window.defaultBfAccount) {
    if (window.sodaJSONObj["button-config"]?.["pennsieve-account-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["pennsieve-account-has-been-confirmed"];
    }
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }
  // If the user has changed their Pennsieve workspace, they need to confirm their new workspace
  if (
    guidedGetCurrentUserWorkSpace() !=
    window.sodaJSONObj?.["last-confirmed-pennsieve-workspace-details"]
  ) {
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }
  // Return false if the user does not need to reconfirm their account details
  return false;
};

const guidedGetPageToReturnTo = async () => {
  // Set by window.openPage function
  const usersPageBeforeExit = window.sodaJSONObj["page-before-exit"];

  //If the dataset was successfully uploaded, send the user to the share with curation team
  if (window.sodaJSONObj["previous-guided-upload-dataset-name"]) {
    return "guided-dataset-dissemination-tab";
  }

  // returns the id of the first page of guided mode
  const firstPageID = getNonSkippedGuidedModePages(document)[0].id;

  const currentSodaVersion = document.getElementById("version").innerHTML;
  const lastVersionOfSodaUsedOnProgressFile = window.sodaJSONObj["last-version-of-soda-used"];

  if (lastVersionOfSodaUsedOnProgressFile != currentSodaVersion) {
    // If the progress file was last edited in a previous SODA version, reset to the first page
    await swalShowInfo(
      "SODA has been updated since you last worked on this dataset.",
      "You'll be taken to the first page to ensure compatibility with the latest workflow. Your previous work is saved and accessible."
    );
    return firstPageID;
  }

  if (guidedCheckIfUserNeedsToReconfirmAccountDetails() === true) {
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

const guidedHighLevelFolders = ["primary", "source", "derivative"];

const guidedUpdateFolderStructureUI = (folderPathSeperatedBySlashes) => {
  console.log("Function called: guidedUpdateFolderStructureUI");
  console.log("Input - folder path (separated by slashes):", folderPathSeperatedBySlashes);

  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  console.log("File explorer element retrieved:", fileExplorer);

  // Remove transition class to reset animation or styles
  fileExplorer.classList.remove("file-explorer-transition");
  console.log("Removed 'file-explorer-transition' class from file explorer.");

  // Update the global path input value with the new path
  $("#guided-input-global-path").val(`dataset_root/${folderPathSeperatedBySlashes}`);
  console.log("Set global input path to:", `dataset_root/${folderPathSeperatedBySlashes}`);

  window.organizeDSglobalPath = $("#guided-input-global-path")[0];

  // Filter and format the path using the global path function
  const filtered = window.getGlobalPath(window.organizeDSglobalPath);
  console.log("Filtered path from getGlobalPath:", filtered);

  window.organizeDSglobalPath.value = `${filtered.join("/")}/`;
  console.log("Set window.organizeDSglobalPath.value to:", window.organizeDSglobalPath.value);

  // Prepare the path array for nested JSON retrieval
  const arrayPathToNestedJsonToRender = filtered.slice(1);
  console.log("Path array for JSON content retrieval:", arrayPathToNestedJsonToRender);

  // Retrieve content at the nested path in the dataset structure
  const datasetContent = getDatasetStructureJsonFolderContentsAtNestedArrayPath(
    arrayPathToNestedJsonToRender
  );
  console.log("Retrieved dataset content at nested path:", datasetContent);

  // Update the UI with the files and folders retrieved
  window.listItems(datasetContent, "#items", 500, true);
  console.log("Called window.listItems to update the UI.");

  // Set up click behavior for folder items in the list
  window.getInFolder(
    ".single-item",
    "#items",
    window.organizeDSglobalPath,
    window.datasetStructureJSONObj
  );
  console.log("arrayPathToNestedJsonToRender:", arrayPathToNestedJsonToRender);

  // Refresh the tree view to match the current folder structure
  setTreeViewDatasetStructure(window.datasetStructureJSONObj, arrayPathToNestedJsonToRender);
  console.log("Updated tree view structure based on current path.");
};

//Description metadata functions

window.deleteAdditionalLink = (linkName) => {
  const additionalLinks =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  //filter additional links to remove the one to be deleted
  const filteredAdditionalLinks = additionalLinks.filter((link) => {
    return link.link != linkName;
  });
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    filteredAdditionalLinks;
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

  const contributorsBeforeDelete =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
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

    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
      filteredContributors;
  }

  contributorField.remove();
};

const getExistingContributorORCiDs = () => {
  return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].map(
    (contributor) => {
      return contributor.conID;
    }
  );
};

const editContributorByOrcid = (
  prevContributorOrcid,
  contributorFirstName,
  contributorLastName,
  newContributorOrcid,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  const contributor = getContributorByOrcid(prevContributorOrcid);
  if (!contributor) {
    throw new Error("No contributor with the entered ORCID exists");
  }

  if (prevContributorOrcid !== newContributorOrcid) {
    if (getContributorByOrcid(newContributorOrcid)) {
      throw new Error("A contributor with the entered ORCID already exists");
    }
  }

  contributor.contributorFirstName = contributorFirstName;
  contributor.contributorLastName = contributorLastName;
  contributor.conName = `${contributorLastName}, ${contributorFirstName}`;
  contributor.conID = newContributorOrcid;
  contributor.conAffliation = contributorAffiliationsArray;
  contributor.conRole = contributorRolesArray;

  // Update the contributor's locally stored data
  try {
    window.addOrUpdateStoredContributor(
      contributorFirstName,
      contributorLastName,
      newContributorOrcid,
      contributorAffiliationsArray,
      contributorRolesArray
    );
  } catch (error) {
    console.error("Failed to edit contributor data" + error);
  }
};

window.openGuidedEditContributorSwal = async (contibuttorOrcidToEdit) => {
  const contributorData = getContributorByOrcid(contibuttorOrcidToEdit);
  const contributorFirstName = contributorData.contributorFirstName;
  const contributorLastName = contributorData.contributorLastName;
  const contributorORCID = contributorData.conID;
  const contributorAffiliationsArray = contributorData.conAffliation;
  const contributorRolesArray = contributorData.conRole;
  const contributorFullName = contributorData.conName;

  let boolShowIncorrectFullName = false;

  if (contributorFirstName.length === 0 && contributorLastName.length === 0) {
    boolShowIncorrectFullName = true;
  }

  let affiliationTagify;
  let contributorRolesTagify;

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "800px",
    heightAuto: false,
    html: `
      <div class="guided--flex-center mt-sm">
        <label class="guided--form-label centered mb-md">
          Make changes to the contributor's information below.
        </label>
        ${
          boolShowIncorrectFullName
            ? `
              <div class="guided--container-warning-text">
                <p class="guided--help-text">
                  Contributor names should be in the format of "Last name, First name".
                  <br />
                  The name found on Pennsieve was: <b>${contributorFullName}</b>
                </p>
              </div>
              `
            : ``
        }
        <div class="space-between w-100">
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">First name: </label>
            <input
              class="guided--input"
              id="guided-contributor-first-name"
              type="text"
              placeholder="Contributor's first name"
              value=""
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">Last name: </label>
            <input
              class="guided--input"
              id="guided-contributor-last-name"
              type="text"
              placeholder="Contributor's Last name"
              value=""
            />
            </div>
          </div>
          <label class="guided--form-label mt-md required">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset. Visit <a target="_blank" href="https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf">DataCite</a> for a definition of the roles.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Edit contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, { duplicate: false });
      window.createDragSort(affiliationTagify);
      affiliationTagify.addTags(contributorAffiliationsArray);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: { maxItems: Infinity, enabled: 0, closeOnSelect: true, position: "auto" },
      });
      window.createDragSort(contributorRolesTagify);
      contributorRolesTagify.addTags(contributorRolesArray);

      document.getElementById("guided-contributor-first-name").value = contributorFirstName;
      document.getElementById("guided-contributor-last-name").value = contributorLastName;
      document.getElementById("guided-contributor-orcid").value = contributorORCID;
    },

    preConfirm: async () => {
      const contributorFirstName = document.getElementById("guided-contributor-first-name").value;
      const contributorLastName = document.getElementById("guided-contributor-last-name").value;
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value;
      const contributorAffiliations = affiliationTagify.value.map((item) => item.value);
      const contributorRoles = contributorRolesTagify.value.map((item) => item.value);

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        contributorAffiliations.length === 0 ||
        contributorRoles.length === 0
      ) {
        return Swal.showValidationMessage("Please fill out all required fields");
      }

      if (contributorOrcid.length !== 37) {
        return Swal.showValidationMessage(
          "Please enter ORCID ID in the format: https://orcid.org/0000-0000-0000-0000"
        );
      }

      // If a contributor has already been marked as Principal Investigator, make sure that the
      // current contributor is the one marked as Principal Investigator
      // otherwise, show an error message
      if (contributorRoles.includes("PrincipalInvestigator")) {
        const currentPIsOrcid = getContributorMarkedAsPrincipalInvestigator();
        if (currentPIsOrcid && currentPIsOrcid !== contributorOrcid) {
          return Swal.showValidationMessage(
            "Only one contributor can be marked as Principal Investigator"
          );
        }
      }

      if (contributorFirstName.includes(",") || contributorLastName.includes(",")) {
        return Swal.showValidationMessage("Please remove commas from the name fields");
      }

      // Verify ORCID ID
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
        if (isNaN(digit)) {
          continue;
        }
        total = (total + digit) * 2;
      }

      const remainder = total % 11;
      const result = (12 - remainder) % 11;
      const checkDigit = result === 10 ? "X" : String(result);

      if (checkDigit !== contributorOrcid.substr(-1)) {
        return Swal.showValidationMessage("ORCID iD does not exist");
      }

      try {
        await editContributorByOrcid(
          contibuttorOrcidToEdit,
          contributorFirstName,
          contributorLastName,
          contributorOrcid,
          contributorAffiliations,
          contributorRoles
        );
      } catch (error) {
        return Swal.showValidationMessage(error);
      }

      renderDatasetDescriptionContributorsTable();
    },
  });
};

const handleAddContributorHeaderUI = () => {
  const existingContributorORCiDs = getExistingContributorORCiDs();
  const locallyStoredContributorArray = window.loadStoredContributors().filter((contributor) => {
    return !existingContributorORCiDs.includes(contributor.ORCiD);
  });

  // If no stored contributors are found, use the default header
  if (locallyStoredContributorArray.length === 0) {
    return `
      <label class="guided--form-label centered mb-md" style="font-size: 1em !important;">
        Enter the contributor's information below.
      </label>
    `;
  }

  const contributorOptions = locallyStoredContributorArray
    .filter((contributor) => {
      // Filter out any contributors that have already been added by ORCID
      return !existingContributorORCiDs.includes(contributor.ORCiD);
    })
    .map((contributor) => {
      return `
        <option
          value="${contributor.lastName}, ${contributor.firstName}"
          data-first-name="${contributor.firstName ?? ""}"
          data-last-name="${contributor.lastName ?? ""}"
          data-orcid="${contributor.ORCiD ?? ""}"
          data-affiliation="${contributor.affiliations ?? contributor.affiliations.join(",") ?? ""}"
          data-roles="${contributor.roles ? contributor.roles.join(",") : ""}"
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

window.openGuidedAddContributorSwal = async () => {
  let affiliationTagify;
  let contributorRolesTagify;

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "900px",
    heightAuto: false,
    // title: contributorSwalTitle,
    html: `
      <div class="guided--flex-center mb-1" style="font-size: 1em !important; height: 550px;">
        ${handleAddContributorHeaderUI()}
        <div class="space-between w-100">
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required" style="font-size: 1em !important;">First name: </label>
              <input
                class="guided--input"
                id="guided-contributor-first-name"
                type="text"
                placeholder="Contributor's first name"
                value=""
              />
            </div>
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required" style="font-size: 1em !important;">Last name: </label>
              <input
                class="guided--input"
                id="guided-contributor-last-name"
                type="text"
                placeholder="Contributor's Last name"
                value=""
              />
            </div>
          </div>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org/register"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset. Visit <a  target="_blank" rel="noopener noreferrer" href="https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf">DataCite</a> for a definition of the roles.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, { duplicate: false });
      window.createDragSort(affiliationTagify);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: { maxItems: Infinity, enabled: 0, closeOnSelect: true, position: "auto" },
      });
      window.createDragSort(contributorRolesTagify);

      $("#guided-stored-contributors-select").selectpicker({ style: "SODA-select-picker" });
      $("#guided-stored-contributors-select").selectpicker("refresh");
      $("#guided-stored-contributors-select").on("change", function () {
        const selectedFirstName = $("#guided-stored-contributors-select option:selected").data(
          "first-name"
        );
        const selectedLastName = $("#guided-stored-contributors-select option:selected").data(
          "last-name"
        );
        const selectedOrcid = $("#guided-stored-contributors-select option:selected").data("orcid");
        const selectedAffiliation = $("#guided-stored-contributors-select option:selected").data(
          "affiliation"
        );
        const selectedRoles = $("#guided-stored-contributors-select option:selected").data("roles");
        document.getElementById("guided-contributor-first-name").value = selectedFirstName;
        document.getElementById("guided-contributor-last-name").value = selectedLastName;
        document.getElementById("guided-contributor-orcid").value = selectedOrcid;
        affiliationTagify.removeAllTags();
        affiliationTagify.addTags(selectedAffiliation);
        contributorRolesTagify.removeAllTags();
        contributorRolesTagify.addTags(selectedRoles.split());
      });
    },

    preConfirm: () => {
      const contributorFirstName = document
        .getElementById("guided-contributor-first-name")
        .value.trim();
      const contributorLastName = document
        .getElementById("guided-contributor-last-name")
        .value.trim();
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value.trim();
      const contributorAffiliations = affiliationTagify.value.map((item) => item.value);
      const contributorRoles = contributorRolesTagify.value.map((item) => item.value);

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        contributorAffiliations.length === 0 ||
        contributorRoles.length === 0
      ) {
        return Swal.showValidationMessage("Please fill out all required fields");
      }

      if (contributorOrcid.length !== 37) {
        return Swal.showValidationMessage(
          "Please enter ORCID ID in the format: https://orcid.org/0000-0000-0000-0000"
        );
      }

      if (contributorRoles.includes("PrincipalInvestigator")) {
        if (getContributorMarkedAsPrincipalInvestigator()) {
          return Swal.showValidationMessage(
            "Only one contributor can be marked as Principal Investigator"
          );
        }
      }

      if (contributorFirstName.includes(",") || contributorLastName.includes(",")) {
        return Swal.showValidationMessage("Please remove commas from the name fields");
      }

      // Verify ORCID ID
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
        if (isNaN(digit)) {
          continue;
        }
        total = (total + digit) * 2;
      }

      const remainder = total % 11;
      const result = (12 - remainder) % 11;
      const checkDigit = result === 10 ? "X" : String(result);

      if (checkDigit !== contributorOrcid.substr(-1)) {
        return Swal.showValidationMessage("ORCID iD does not exist");
      }

      // Combine first and last name into full name
      const contributorsFullName = `${contributorLastName}, ${contributorFirstName}`;

      try {
        addContributor(
          contributorsFullName,
          contributorOrcid,
          contributorAffiliations,
          contributorRoles
        );
      } catch (error) {
        return Swal.showValidationMessage(error);
      }

      //rerender the table after adding a contributor
      renderDatasetDescriptionContributorsTable();
    },
  });
};

window.contributorDataIsValid = (contributorObj) => {
  if (
    contributorObj.conAffliation.length > 0 &&
    contributorObj.conID &&
    contributorObj.conRole.length > 0 &&
    contributorObj.contributorFirstName.length > 0 &&
    contributorObj.contributorLastName.length > 0
  ) {
    return true;
  } else {
    return false;
  }
};

const getContributorMarkedAsPrincipalInvestigator = () => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const PrincipalInvestigator = contributors.find((contributor) =>
    contributor["conRole"].includes("PrincipalInvestigator")
  );
  // If there is no Principal Investigator, return null
  if (!PrincipalInvestigator) {
    return null;
  }
  // Otherwise, return their ORCID
  return PrincipalInvestigator["conID"];
};

const switchOrderOfContributors = (draggedOrcid, targetOrcid) => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const draggedContributorIndex = contributors.findIndex(
    (contributor) => contributor["conID"] === draggedOrcid
  );
  const targetContributorIndex = contributors.findIndex(
    (contributor) => contributor["conID"] === targetOrcid
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
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = contributors;
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

  renderDatasetDescriptionContributorsTable();
};

const renderAdditionalLinksTable = () => {
  const additionalLinksTableBody = document.getElementById("additional-links-table-body");
  const additionalLinkData =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
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
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].push({
      link: link,
      relation: relation,
      description: description,
      type: linkType,
      isFair: true,
    });
    renderAdditionalLinksTable();
  }
};

const renderSubjectSampleAdditionTable = (subject) => {
  return `
    <table
      class="ui celled striped table"
      style="margin-bottom: 10px; width: 800px"
    >
      <thead>
        <tr>
          <th class="text-center" colspan="2" style="position: relative">   
            Samples taken from ${subject.subjectName}
            <button
              type="button"
              class="btn btn-primary btn-sm button-subject-add-samples"
              style="position: absolute; top: 10px; right: 20px;"
              data-samples-subject-name="${subject.subjectName}"
            >
              Add samples
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${subject.samples
          .map((sample) => {
            return generateSampleRowElement(sample);
          })
          .join("\n")}
      </tbody>
    </table>
  `;
};

const openModifySampleMetadataPage = (sampleMetadataID, samplesSubjectID) => {
  //Get all samples from the dataset and add all other samples to the was derived from dropdown
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const samplesBesidesCurrSample = samples.filter(
    (sample) => sample.sampleName !== sampleMetadataID
  );
  document.getElementById("guided-bootbox-wasDerivedFromSample").innerHTML = `
 <option value="">Sample not derived from another sample</option>
 ${samplesBesidesCurrSample
   .map((sample) => {
     return `<option value="${sample.sampleName}">${sample.sampleName}</option>`;
   })
   .join("\n")}))
 `;

  //Add protocol titles to the protocol dropdown
  const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  document.getElementById("guided-bootbox-sample-protocol-title").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.description}"
            data-protocol-link="${protocol.link}"
          >
            ${protocol.description}
          </option>
        `;
      })
      .join("\n")}))
  `;

  document.getElementById("guided-bootbox-sample-protocol-location").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.link}"
            data-protocol-description="${protocol.description}"
          >
            ${protocol.link}
          </option>
        `;
      })
      .join("\n")}))
  `;

  for (let i = 1; i < window.samplesTableData.length; i++) {
    if (
      window.samplesTableData[i][0] === samplesSubjectID &&
      window.samplesTableData[i][1] === sampleMetadataID
    ) {
      //if the id matches, load the metadata into the form
      window.populateFormsSamples(samplesSubjectID, sampleMetadataID, "", "guided");
      return;
    }
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
      await guidedSaveProgress();
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

const generateSubjectRowElement = (subjectName) => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <div class="space-between w-100">
            <span class="subject-id">${subjectName}</span>
            <i
              class="far fa-edit guided-subject-edit-button"
              style="cursor: pointer; margin-top: .2rem"
              data-subject-name="${subjectName}"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="window.deleteSubject($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSubjectSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sub-</span>
          <input
            id="guided--subject-input"
            class="guided--input"
            type="text"
            name="guided-subject-id"
            placeholder="Enter subject ID and press enter"
            onkeyup="specifySubject(event, window.$(this))"
            data-alert-message="Subject IDs may not contain spaces or special characters"
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
          onclick="window.deleteSubject($(this))"
        ></i>
      </td>
      </tr>
  `;
};

const generatePoolRowElement = (poolName) => {
  return `
    <tr>
      <td class="middle aligned pool-cell collapsing">
        <div class="space-between" style="align-items: center; width: 250px">
          <div class="space-between" style="width: 250px">
            <span class="pool-id">${poolName}</span>
            <i
              class="far fa-edit guided-pool-edit-button"
              data-pool-name="${poolName}"
              style="cursor: pointer"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned pool-subjects">
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="window.deletePool(window.$(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSampleRowElement = (sampleName) => {
  return `
    <tr>
    <td class="middle aligned sample-id-cell">
      <div class="space-between w-100" style="align-items: center">
    <div class="space-between w-100">
      <span class="sample-id">${sampleName}</span>
      <i class="far fa-edit jump-back guided-sample-edit-button" data-sample-name="${sampleName}" style="cursor: pointer;" >
      </i>
    </div>
  </div>
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i class="far fa-trash-alt" style="color: red; cursor: pointer" onclick="window.deleteSample(window.$(this))"></i>
    </td>
  </tr>`;
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

const getExistingPoolNames = () => {
  return Object.keys(
    window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
  );
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

const convertArrayToCommaSeparatedString = (array) => {
  // Convert the array to a comma separated string with an "and" before the last element if there are more than 2 elements
  if (array.length === 0) {
    return "";
  }
  if (array.length === 1) {
    return array[0];
  }
  if (array.length === 2) {
    return `${array[0]} and ${array[1]}`;
  }
  if (array.length > 2) {
    const lastElement = array.pop();
    return `${array.join(", ")}, and ${lastElement}`;
  }
};

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

//deletes subject from jsonObj and UI
window.deleteSubject = async (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();

  //Check to see if a subject has been added to the element
  //if it has, delete the subject from the pool-sub-sam structure
  if (subjectIdToDelete) {
    await window.sodaJSONObj.deleteSubject(subjectIdToDelete);
  }

  //Rerender the subjects table
  renderSubjectsTable();
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

const renderSamplesHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-samples-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectsWithSamples = subjects.filter((subject) => {
    return subject.samples.length > 0;
  });

  let asideElementTemplateLiteral = ``;

  //create an array of objects that groups subjectsWithSamples by poolName property
  const subjectsWithSamplesInPools = subjectsWithSamples.reduce((acc, subject) => {
    if (subject.poolName) {
      if (acc[subject.poolName]) {
        acc[subject.poolName].push(subject);
      } else {
        acc[subject.poolName] = [subject];
      }
    }
    return acc;
  }, {});
  //loop through the pools and create an aside element for each sample in the pools subjects
  for (const [_, subjects] of Object.entries(subjectsWithSamplesInPools)) {
    asideElementTemplateLiteral += `
    ${subjects
      .map((subject) => {
        return `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
            <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
              <label class="guided--form-label centered" style="color: black;">
                ${subject.subjectName}
              </label>
              </div>
                ${subject.samples
                  .map((sample) => {
                    return `
                    <a 
                      class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                      data-path-suffix="${subject.poolName}/${subject.subjectName}/${sample}"
                      style="padding-left: 1rem; direction: ltr"
                    >${sample}</a>
                  `;
                  })
                  .join("\n")}
            </div>`;
      })
      .join("\n")}`;
  }

  //filter out subjects that are not in a pool
  const subjectsWithSamplesOutsidePools = subjectsWithSamples.filter((subject) => {
    return !subject.poolName;
  });
  //loop through the subjects and create an aside element for each
  for (const subject of subjectsWithSamplesOutsidePools) {
    asideElementTemplateLiteral += `
      <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
      <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
        <label class="guided--form-label centered" style="color: black;">
          ${subject.subjectName}
        </label>
      </div>
        ${subject.samples
          .map((sample) => {
            return `  
              <a
                class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                style="direction: ltr; padding-left: 1rem;"
                data-path-suffix="${subject.subjectName}/${sample}"
              >${sample}</a>
`;
          })
          .join("\n")}
    `;
  }

  //Add the samples to the DOM
  asideElement.innerHTML = asideElementTemplateLiteral;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );

  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-samples-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle(
          `guided-${highLevelFolderName}-samples-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      //render folder section in #items
      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-subjects-aside`);
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${subject.poolName ? subject.poolName + "/" : ""}${
              subject.subjectName
            }"
          >${subject.subjectName}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-subjects-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle(
          `guided-${highLevelFolderName}-subjects-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
  });
};

const renderPoolsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-pools-aside`);
  asideElement.innerHTML = "";
  const pools = Object.keys(window.sodaJSONObj.getPools());

  const poolItems = pools
    .map((pool) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${pool}"
          >${pool}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = poolItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      hideEleShowEle(
        `guided-${highLevelFolderName}-pools-file-explorer-intro`,
        "guided-file-explorer-elements"
      );

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const { pathSuffix } = e.target.dataset;

      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
  });
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

const renderSamplesMetadataAsideItems = async () => {
  const asideElement = document.getElementById(`guided-samples-metadata-aside`);
  asideElement.innerHTML = "";

  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const sampleNames = samples.map((sample) => sample.sampleName);

  const sampleMetadataCopyButton = document.getElementById("guided-button-sample-metadata-copy");
  const sampleMetadataCopyTip = document.getElementById("guided-copy-samples-tip");

  if (samples.length > 1) {
    sampleMetadataCopyButton.classList.remove("hidden");
    sampleMetadataCopyTip.classList.remove("hidden");
  } else {
    sampleMetadataCopyButton.classList.add("hidden");
    sampleMetadataCopyTip.classList.add("hidden");
  }

  const samplesFormEntries = window.guidedSamplesFormDiv.querySelectorAll(".samples-form-entry");

  //Create an array of samplesFormEntries name attribute
  const samplesFormNames = [...samplesFormEntries].map((entry) => {
    return entry.name;
  });

  if (window.samplesTableData.length == 0) {
    //Get items with class "samples-form-entry" from samplesForDiv
    window.samplesTableData[0] = samplesFormNames;
    for (const sample of samples) {
      const sampleDataArray = [];
      sampleDataArray.push(sample.subjectName);
      sampleDataArray.push(sample.sampleName);
      //Push an empty string for was derived from
      sampleDataArray.push("");
      sampleDataArray.push(sample.poolName ? sample.poolName : "");
      for (let i = 0; i < samplesFormNames.length - 4; i++) {
        sampleDataArray.push("");
      }
      window.samplesTableData.push(sampleDataArray);
    }
  } else {
    //Add samples that have not yet been added to the table to the table
    for (const sample of samples) {
      let sampleAlreadyInTable = false;
      for (let i = 0; i < window.samplesTableData.length; i++) {
        if (window.samplesTableData[i][1] == sample.sampleName) {
          sampleAlreadyInTable = true;
        }
      }
      if (!sampleAlreadyInTable) {
        const sampleDataArray = [];
        sampleDataArray.push(sample.subjectName);
        sampleDataArray.push(sample.sampleName);
        //Push an empty string for was derived from
        sampleDataArray.push("");
        sampleDataArray.push(sample.poolName ? sample.poolName : "");
        for (let i = 0; i < window.samplesTableData[0].length - 4; i++) {
          sampleDataArray.push("");
        }
        window.samplesTableData.push(sampleDataArray);
      }
    }
  }

  // If the subject is in the table but not in the subjects array, remove it
  for (let i = 1; i < window.samplesTableData.length; i++) {
    if (!sampleNames.includes(window.samplesTableData[i][1])) {
      window.samplesTableData.splice(i, 1);
    }
  }

  //If custom fields have been added to the window.samplesTableData, create a field for each custom field
  //added
  // Samples metadata have 19 standard fields to fill, if the sample has more then additional fields are included
  if (window.samplesTableData[0].length > 19) {
    for (let i = 19; i < window.samplesTableData[0].length; i++) {
      if (
        !samplesFormNames.includes(window.samplesTableData[0][i]) ||
        !samplesFormNames.includes(
          window.samplesTableData[0][i].charAt(0).toUpperCase() +
            window.samplesTableData[0][i].slice(1)
        )
      ) {
        window.addCustomHeader("samples", window.samplesTableData[0][i], "guided");
      }
    }
  }

  //Create the HTML for the samples
  const sampleItems = samples
    .map((sample) => {
      return `
        <div
          class="samples-metadata-aside-item selection-aside-item"
          data-samples-subject-name="${sample.subjectName}"
        >
          ${sample.subjectName}/${sample.sampleName}
        </div>
      `;
    })
    .join("\n");

  //Add the samples to the DOM
  asideElement.innerHTML = sampleItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(`div.samples-metadata-aside-item`);
  selectionAsideItems.forEach(async (item) => {
    item.addEventListener("click", async (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-sample-intro");
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle("guided-form-add-a-sample-intro", "guided-form-add-a-sample");
      }

      let previousSample = document.getElementById("guided-bootbox-sample-id").value;

      //check to see if previousSample is empty
      if (previousSample) {
        window.addSample("guided");
        await guidedSaveProgress();
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      //clear all sample form fields
      window.clearAllSubjectFormFields(window.guidedSamplesFormDiv);

      openModifySampleMetadataPage(
        e.target.innerText.split("/")[1],
        e.target.innerText.split("/")[0]
      );

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

document
  .getElementById("guided-bootbox-sample-protocol-title")
  .addEventListener("change", function () {
    const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
    document.getElementById("guided-bootbox-sample-protocol-location").value =
      newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
  });
document
  .getElementById("guided-bootbox-sample-protocol-location")
  .addEventListener("change", function () {
    const newDescriptionAssociatedDescription = $(this)
      .find(":selected")
      .data("protocol-description");
    document.getElementById("guided-bootbox-sample-protocol-title").value =
      newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
  });

document
  .getElementById("guided-bootbox-subject-protocol-title")
  .addEventListener("change", function () {
    const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
    document.getElementById("guided-bootbox-subject-protocol-location").value =
      newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
  });
document
  .getElementById("guided-bootbox-subject-protocol-location")
  .addEventListener("change", function () {
    const newDescriptionAssociatedDescription = $(this)
      .find(":selected")
      .data("protocol-description");
    document.getElementById("guided-bootbox-subject-protocol-title").value =
      newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
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

//********************************************************************************************************
// Add click event listener to the button triggering local dataset generation
document.querySelectorAll(".button-starts-local-dataset-copy-generation").forEach((button) => {
  button.addEventListener("click", () => {
    // Send an IPC message to select the local dataset generation path
    window.electron.ipcRenderer.send("guided-select-local-dataset-generation-path");
  });
});

const convertBytesToGb = (bytes) => {
  return roundToHundredth(bytes / 1024 ** 3);
};

// Counts the number of files in the dataset structure
// Note: This function should only be used for local datasets (Not datasets pulled from Pennsieve)
const countFilesInDatasetStructure = (datasetStructure) => {
  let totalFiles = 0;
  const keys = Object.keys(datasetStructure);
  for (const key of keys) {
    if (key === "files") {
      totalFiles += Object.keys(datasetStructure[key]).length;
    }
    if (key === "folders") {
      const folders = Object.keys(datasetStructure[key]);
      for (const folder of folders) {
        totalFiles += countFilesInDatasetStructure(datasetStructure[key][folder]);
      }
    }
  }
  return totalFiles;
};

// Listen for the selected path for local dataset generation
window.electron.ipcRenderer.on(
  "selected-guided-local-dataset-generation-path",
  async (event, filePath) => {
    guidedSetNavLoadingState(true); // Lock the nav while local dataset generation is in progress
    guidedResetLocalGenerationUI();
    try {
      // Get the dataset name based on the sodaJSONObj
      const guidedDatasetName = guidedGetDatasetName(window.sodaJSONObj);

      const filePathToGenerateAt = window.path.join(filePath, guidedDatasetName);
      if (window.fs.existsSync(filePathToGenerateAt)) {
        throw new Error(
          `
            A folder named ${guidedDatasetName} already exists at the selected location.
            Please remove the folder at the selected location or choose a new location.
          `
        );
      }
      // Reset and show the progress bar
      setGuidedProgressBarValue("local", 0);
      updateDatasetUploadProgressTable("local", {
        "Current action": `Checking available free space on disk`,
      });
      unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");

      // Get available free memory on disk
      const freeMemoryInBytes = await window.electron.ipcRenderer.invoke("getDiskSpace", filePath);

      // Get the size of the dataset to be generated
      const localDatasetSizeReq = await client.post(
        "/curate_datasets/dataset_size",
        { soda_json_structure: window.sodaJSONObj },
        { timeout: 0 }
      );
      const localDatasetSizeInBytes = localDatasetSizeReq.data.dataset_size;

      // Check if there is enough free space on disk for the dataset
      if (freeMemoryInBytes < localDatasetSizeInBytes) {
        const diskSpaceInGb = convertBytesToGb(freeMemoryInBytes);
        const datasetSizeInGb = convertBytesToGb(localDatasetSizeInBytes);
        throw new Error(
          `Not enough free space on disk. Free space: ${diskSpaceInGb}GB. Dataset size: ${datasetSizeInGb}GB`
        );
      }

      // Attach manifest files to the dataset structure before local generation
      await guidedCreateManifestFilesAndAddToDatasetStructure();

      // Create a temporary copy of sodaJSONObj for local dataset generation
      const sodaJSONObjCopy = JSON.parse(JSON.stringify(window.sodaJSONObj));
      sodaJSONObjCopy["generate-dataset"] = {
        "dataset-name": guidedDatasetName,
        destination: "local",
        "generate-option": "new",
        "if-existing": "new",
        path: filePath,
      };
      // Remove unnecessary key from sodaJSONObjCopy since we don't need to
      // check if the account details are valid during local generation
      delete sodaJSONObjCopy["bf-account-selected"];
      delete sodaJSONObjCopy["bf-dataset-selected"];

      updateDatasetUploadProgressTable("local", {
        "Current action": `Preparing dataset for local generation`,
      });

      // Start the local dataset generation process
      client.post(
        `/curate_datasets/curation`,
        { soda_json_structure: sodaJSONObjCopy, resume: false },
        { timeout: 0 }
      );

      let userHasBeenScrolledToProgressTable = false;

      // Track the status of local dataset generation
      const trackLocalDatasetGenerationProgress = async () => {
        // Get the number of files that need to be generated to calculate the progress
        const numberOfFilesToGenerate = countFilesInDatasetStructure(
          window.datasetStructureJSONObj
        );
        while (true) {
          try {
            const response = await client.get(`/curate_datasets/curation/progress`);
            const { data } = response;
            const main_curate_progress_message = data["main_curate_progress_message"];
            const main_curate_status = data["main_curate_status"];
            if (
              main_curate_progress_message === "Success: COMPLETED!" ||
              main_curate_status === "Done"
            ) {
              break; // Exit the loop when generation is done
            }
            const elapsed_time_formatted = data["elapsed_time_formatted"];
            const totalUploadedFiles = data["total_files_uploaded"];

            // Get the current progress of local dataset generation
            // Note: The progress is calculated based on the number of files that have been generated
            // and the total number of files that need to be generated
            const localGenerationProgressPercentage = Math.min(
              100,
              Math.max(0, (totalUploadedFiles / numberOfFilesToGenerate) * 100)
            );
            setGuidedProgressBarValue("local", localGenerationProgressPercentage);
            updateDatasetUploadProgressTable("local", {
              "Files generated": `${totalUploadedFiles} of ${numberOfFilesToGenerate}`,
              "Percent generated": `${localGenerationProgressPercentage.toFixed(2)}%`,
              "Elapsed time": `${elapsed_time_formatted}`,
            });

            // Scroll the user down to the progress table if they haven't been scrolled down yet
            // (This only happens once)
            if (!userHasBeenScrolledToProgressTable) {
              unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");
              userHasBeenScrolledToProgressTable = true;
            }

            // Wait 1 second before checking the progress again
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          } catch (error) {
            console.error("Error tracking progress:", error);
            throw new Error(userErrorMessage(error)); // Re-throw with user-friendly message
          }
        }
      };

      // set a timeout for .5 seconds to allow the server to start generating the dataset
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await trackLocalDatasetGenerationProgress();

      setGuidedProgressBarValue("local", 100);
      updateDatasetUploadProgressTable("local", { "Current action": `Generating metadata files` });

      // Generate all dataset metadata files
      await guidedGenerateSubjectsMetadata(
        window.path.join(filePath, guidedDatasetName, "subjects.xlsx")
      );
      await guidedGenerateSamplesMetadata(
        window.path.join(filePath, guidedDatasetName, "samples.xlsx")
      );
      await guidedGenerateSubmissionMetadata(
        window.path.join(filePath, guidedDatasetName, "submission.xlsx")
      );
      await guidedGenerateDatasetDescriptionMetadata(
        window.path.join(filePath, guidedDatasetName, "dataset_description.xlsx")
      );
      await guidedGenerateReadmeMetadata(
        window.path.join(filePath, guidedDatasetName, "README.txt")
      );
      await guidedGenerateChangesMetadata(
        window.path.join(filePath, guidedDatasetName, "CHANGES.txt")
      );
      await guidedGenerateCodeDescriptionMetadata(
        window.path.join(filePath, guidedDatasetName, "code_description.xlsx")
      );

      // Save the location of the generated dataset to the sodaJSONObj
      window.sodaJSONObj["path-to-local-dataset-copy"] = window.path.join(
        filePath,
        guidedDatasetName
      );

      // Update UI for successful local dataset generation
      updateDatasetUploadProgressTable("local", {
        Status: `Dataset successfully generated locally`,
      });
      unHideAndSmoothScrollToElement("guided-section-post-local-generation-success");
    } catch (error) {
      // Handle and log errors
      const errorMessage = userErrorMessage(error);
      console.error(errorMessage);
      guidedResetLocalGenerationUI();
      await swalShowError("Error generating dataset locally", errorMessage);
      // Show and scroll down to the local dataset generation retry button
      unHideAndSmoothScrollToElement("guided-section-retry-local-generation");
    }
    guidedSetNavLoadingState(false); // Unlock the nav after local dataset generation is done
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
      await guidedPennsieveDatasetUpload();
    }
  });

$("#guided-add-subject-button").on("click", () => {
  $("#guided-subjects-intro").hide();
  $("#guided-add-subject-div").show();
});

$("#guided-button-edit-protocol-fields").on("click", () => {
  enableElementById("protocols-container");
  enableElementById("guided-button-add-protocol");
  //switch button from edit to save
  document.getElementById("guided-button-edit-protocol-fields").style.display = "none";
  document.getElementById("guided-button-save-protocol-fields").style.display = "flex";
  unPulseNextButton();
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
const guidedOtherFundingSourcesInput = document.getElementById("guided-ds-other-funding");
guidedOtherFundingsourcesTagify = new Tagify(guidedOtherFundingSourcesInput, { duplicates: false });
window.createDragSort(guidedOtherFundingsourcesTagify);
const guidedStudyOrganSystemsInput = document.getElementById("guided-ds-study-organ-system");
guidedStudyOrganSystemsTagify = new Tagify(guidedStudyOrganSystemsInput, {
  whitelist: [
    "autonomic ganglion",
    "brain",
    "colon",
    "heart",
    "intestine",
    "kidney",
    "large intestine",
    "liver",
    "lower urinary tract",
    "lung",
    "nervous system",
    "pancreas",
    "peripheral nervous system",
    "small intestine",
    "spinal cord",
    "spleen",
    "stomach",
    "sympathetic nervous system",
    "urinary bladder",
  ],
  duplicates: false,
  dropdown: { maxItems: Infinity, enabled: 0, closeOnSelect: true },
});
window.createDragSort(guidedStudyOrganSystemsTagify);

const guidedDatasetKeyWordsInput = document.getElementById("guided-ds-dataset-keywords");
guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeyWordsInput, {
  duplicates: false,
  maxTags: 5,
});

window.createDragSort(guidedDatasetKeywordsTagify);

const guidedStudyApproachInput = document.getElementById("guided-ds-study-approach");
guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, { duplicates: false });
window.createDragSort(guidedStudyApproachTagify);

const guidedStudyTechniquesInput = document.getElementById("guided-ds-study-technique");
guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, { duplicates: false });
window.createDragSort(guidedStudyTechniquesTagify);

/// back button Curate
$("#guided-button-back").on("click", function () {
  var slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = window.getGlobalPath(window.organizeDSglobalPath);
    if (filtered.length === 1) {
      window.organizeDSglobalPath.value = filtered[0] + "/";
    } else {
      window.organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
    }
    var myPath = window.datasetStructureJSONObj;
    for (var item of filtered.slice(1, filtered.length - 1)) {
      myPath = myPath["folders"][item];
    }
    // construct UI with files and folders
    $("#items").empty();
    window.already_created_elem = [];
    let items = window.loadFileFolder(myPath); //array -
    //we have some items to display
    window.listItems(myPath, "#items", 500, true);
    window.organizeLandingUIEffect();
    // reconstruct div with new elements
    window.getInFolder(
      ".single-item",
      "#items",
      window.organizeDSglobalPath,
      window.datasetStructureJSONObj
    );
  }
});

$("#guided-new-folder").on("click", () => {
  event.preventDefault();
  var slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var newFolderName = "New Folder";
    Swal.fire({
      title: "Add new folder...",
      text: "Enter a name below:",
      heightAuto: false,
      input: "text",
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: "Cancel",
      confirmButtonText: "Add folder",
      reverseButtons: window.reverseSwalButtons,
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
      didOpen: () => {
        let swal_container = document.getElementsByClassName("swal2-popup")[0];
        swal_container.style.width = "600px";
        swal_container.style.padding = "1.5rem";
        $(".swal2-input").attr("id", "add-new-folder-input");
        $(".swal2-confirm").attr("id", "add-new-folder-button");
        $("#add-new-folder-input").keyup(function () {
          let val = $("#add-new-folder-input").val();
          const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
            val,
            "folder-or-file-name-is-valid"
          );
          if (folderNameIsValid) {
            $("#add-new-folder-button").attr("disabled", false);
          } else {
            Swal.showValidationMessage(`The folder name contains non-allowed characters.`);
            $("#add-new-folder-button").attr("disabled", true);
            return;
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.value) {
        if (result.value !== null && result.value !== "") {
          newFolderName = result.value.trim();
          // check for duplicate or files with the same name
          var duplicate = false;
          var itemDivElements = document.getElementById("items").children;
          for (var i = 0; i < itemDivElements.length; i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true;
              break;
            }
          }
          if (duplicate) {
            Swal.fire({
              icon: "error",
              text: "Duplicate folder name: " + newFolderName,
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });

            window.logCurationForAnalytics(
              "Error",
              window.PrepareDatasetsAnalyticsPrefix.CURATE,
              window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );
          } else {
            var currentPath = window.organizeDSglobalPath.value;
            var jsonPathArray = currentPath.split("/");
            var filtered = jsonPathArray.slice(1).filter(function (el) {
              return el != "";
            });

            var myPath = window.getRecursivePath(filtered, window.datasetStructureJSONObj);
            // update Json object with new folder created
            var renamedNewFolder = newFolderName;
            myPath["folders"][renamedNewFolder] = newEmptyFolderObj();

            window.listItems(myPath, "#items", 500, true);
            window.getInFolder(
              ".single-item",
              "#items",
              window.organizeDSglobalPath,
              window.datasetStructureJSONObj
            );

            // log that the folder was successfully added
            window.logCurationForAnalytics(
              "Success",
              window.PrepareDatasetsAnalyticsPrefix.CURATE,
              window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );

            window.hideMenu(
              "folder",
              window.menuFolder,
              window.menuHighLevelFolders,
              window.menuFile
            );
            window.hideMenu(
              "high-level-folder",
              window.menuFolder,
              window.menuHighLevelFolders,
              window.menuFile
            );
          }
        }
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    });
  }
});

$("#guided-imoprt-file").on("click", () => {
  window.electron.ipcRenderer.send("open-files-organize-datasets-dialog");
});
$("#guided-import-folder").on("click", () => {
  window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog");
});

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

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {
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
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {
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
  const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
  const acknowledgements = acknowledgementsInput.value.trim();

  // Get tags from other funding tagify
  const otherFunding = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"] = {
    funding: otherFunding,
    acknowledgment: acknowledgements,
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
const continueHackGm = true;
if (continueHackGm) {
  doTheHack();
}
