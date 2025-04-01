import { openPage } from "./openPage";
import { savePageChanges } from "./savePageChanges";
import { getGuidedProgressFileNames } from "./curationPreparation/savePage";
import {
  guidedUnSkipPage,
  getNextPageNotSkipped,
  getPrevPageNotSkipped,
  guidedResetSkippedPages,
  guidedSkipPage,
  getNonSkippedGuidedModePages,
} from "./navigationUtils/pageSkipping";
import { guidedUnLockSideBar, resetLazyLoading } from "../../../assets/nav";
import { guidedCreateSodaJSONObj, attachGuidedMethodsToSodaJSONObj } from "../utils/sodaJSONObj";
import api from "../../others/api/api";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../../../assets/lotties/lotties";
import Swal from "sweetalert2";
import { clientError } from "../../others/http-error-handler/error-handler";
import client from "../../client";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * @description Navigate to the next page in the active prepare datasets step-by-step workflow. Navigating to the next page saves the
 * current page's progress if the page is valid.
 */
$("#guided-next-button").on("click", async function () {
  console.log("Next button clicked");

  // make a dummy request to the  POST prepare_metadata/submission endpoint
  let dummySodaObj = {
    dataset_metadata: {
      dataset_description: {
        "dataset_information": {
          "title": "dummy title",
          "description": "dummy description",
          "type": "computational",
          "number of subjects": "1", 
          "number of samples": "1",
          "keywords": ["tummy", "scholar"]
        },
        "study_information": {
          "study purpose": "Dummy purpose",
          "study data collection": "dummy collection",
          "study primary conclusion": "dummy conclusion",
          "study collection title": "title dummy",
          "study organ system": ["whosman"],
          "study approach": ["one approach"],
          "study technique": ["wwww", "wwww"]
        },
        "contributor_information": [{
          "contributor_orcid_id": "https://orcid.org/0000-0000-0000-0001",
          "contributor_affiliation": "dummy affiliation",
          "contributor_name": "dummy name",
          "contributor_role": "dummy role"
        }],
        "basic_information": {
          "funding": ["dummy funding", "cheese"],
          "acknowledgment": "dummy ack",
        },
        "related_information": [{
          "identifier": "https://google.com",
          "identifier_type": "URL",
          "relation_type": "ISProtocolFor",
          "identifier_description": "Does protocol stuff"
        }]
      },
    },
  };
  const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
  let filePath = window.path.join(
    homeDirectory,
    "SODA",
    "Guided-Progress",
    "dummy_submission_metadata.xlsx"
  );
  let uploadBoolean = false;
  try {
    await client.post("/prepare_metadata/dataset_description_file", {
      soda: dummySodaObj,
      filepath: filePath,
      upload_boolean: uploadBoolean,
    });
  } catch (error) {
    clientError(error);
    return;
  }

  //Get the ID of the current page to handle actions on page leave (next button pressed)
  window.pageBeingLeftID = window.CURRENT_PAGE.id;

  if (window.pageBeingLeftID === "guided-dataset-generation-tab") {
    guidedUnSkipPage("guided-dataset-dissemination-tab");
    await openPage("guided-dataset-dissemination-tab");
    return;
  }

  try {
    console.log("About to save");
    await savePageChanges(window.pageBeingLeftID);
    console.log("Past save changes");

    if (pageBeingLeftID === "guided-select-starting-point-tab") {
      await handleStartCuration(window.pageBeingLeftID);
    }

    //Mark page as completed in JSONObj so we know what pages to load when loading local saves
    //(if it hasn't already been marked complete)
    if (!window.sodaJSONObj["completed-tabs"].includes(window.pageBeingLeftID)) {
      window.sodaJSONObj["completed-tabs"].push(window.pageBeingLeftID);
    }

    //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
    //if more tabs in parent tab, go to next tab and update capsule
    let targetPage = getNextPageNotSkipped(window.CURRENT_PAGE.id);
    let targetPageID = targetPage.id;

    await openPage(targetPageID);
  } catch (error) {
    window.log.error(error);
    if (Array.isArray(error)) {
      error.map((error) => {
        // get the total number of words in error.message
        if (error.type === "notyf") {
          window.notyf.open({
            duration: "7000",
            type: "error",
            message: error.message,
          });
        }

        if (error.type === "swal") {
          Swal.fire({
            icon: "error",
            title: error.title,
            html: error.message,
            width: 600,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: `OK`,
            focusConfirm: true,
            allowOutsideClick: false,
          });
        }
      });
    }
  }
});

/**
 * @description Navigate to the previous page in the active prepare datasets step-by-step workflow.Navigating
 * to the previous page saves the current page's progress if the page is valid.
 */
$("#guided-back-button").on("click", async () => {
  window.pageBeingLeftID = window.CURRENT_PAGE.id;
  const targetPage = getPrevPageNotSkipped(window.pageBeingLeftID);

  // If the target page when clicking the back button does not exist, then we are on the first not skipped page.
  // In this case, we want to save and exit guided mode.
  if (!targetPage) {
    await guidedSaveAndExit();
    return;
  }

  // Get the id of the target page
  const targetPageID = targetPage.id;

  // open the target page
  await openPage(targetPageID);
});

// Save and exit button click handlers
document.getElementById("guided-button-save-and-exit").addEventListener("click", async () => {
  await guidedSaveAndExit();
});

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

const guidedHighLevelFolders = ["primary", "source", "derivative"];
const nonGuidedHighLevelFolders = ["code", "protocol", "docs"];

/**
 *
 *
 * @returns {Promise<void>}
 * @description This function is called when the user clicks the next button on the guided mode pages.
 *              It handles the logic for properly determining which page to open first, which
 *              depends upon whether the user is starting a new curation, resuming an existing progress file,
 *              or resuming a Pennsieve dataset.
 */
const handleStartCuration = async () => {
  const errorArray = [];
  const startingNewCuration = document
    .getElementById("guided-button-start-new-curation")
    .classList.contains("selected");
  const resumingExistingProgress = document
    .getElementById("guided-button-resume-progress-file")
    .classList.contains("selected");

  const resumingPennsieveDataset = document
    .getElementById("guided-button-resume-pennsieve-dataset")
    .classList.contains("selected");

  if (!startingNewCuration && !resumingExistingProgress && !resumingPennsieveDataset) {
    errorArray.push({
      type: "notyf",
      message: "Please select a dataset start location",
    });
    throw errorArray;
  }

  if (startingNewCuration) {
    window.sodaJSONObj["starting-point"]["type"] = "new";
    window.sodaJSONObj["generate-dataset"]["generate-option"] = "new";

    // Skip the changes metadata tab as new datasets do not have changes metadata
    guidedSkipPage("guided-create-changes-metadata-tab");

    // Open the first page
    const firstPage = getNonSkippedGuidedModePages(document)[0];
    console.log(firstPage);
    await openPage(firstPage.id);
  }

  if (resumingExistingProgress) {
    errorArray.push({
      type: "notyf",
      message: "Please click the button of the dataset you would like to resume above",
    });
    throw errorArray;
  }
  // This is the case where the user is resuming a Pennsieve dataset
  if (resumingPennsieveDataset) {
    if (
      !document
        .getElementById("guided-panel-pennsieve-dataset-import-loading")
        .classList.contains("hidden")
    ) {
      errorArray.push({
        type: "notyf",
        message: "Please wait for your datasets on Pennsieve to load",
      });
      throw errorArray;
    }

    const selectedPennsieveDatasetToResume = $(
      "#guided-select-pennsieve-dataset-to-resume option:selected"
    );
    // Get the text currently in the dropdown
    const selectedPennsieveDataset = selectedPennsieveDatasetToResume[0].innerHTML;
    // Get the value of the dropdown (the dataset ID)
    const selectedPennsieveDatasetID = selectedPennsieveDatasetToResume.val().trim();

    if (!selectedPennsieveDatasetID) {
      errorArray.push({
        type: "notyf",
        message: "Please select a dataset on Pennsieve to resume from the dropdown above",
      });
      throw errorArray;
    }

    // Check if the user already has a progress file for this dataset
    const currentProgressFileNames = getGuidedProgressFileNames();
    if (currentProgressFileNames.includes(selectedPennsieveDataset)) {
      errorArray.push({
        type: "swal",
        title: "You already have a progress file for this dataset",
        message: `
            To resume progress saved in SODA for this dataset, please go back to the main page and click "continue curating" on the dataset you want to resume.
            <br />
            <br />
            If you would like to restart your progress and edit the dataset as it is on Pennsieve, go back to the main menu and click "delete progress file" on the dataset you want to restart.
          `,
      });
      throw errorArray;
    }

    const datasetIsLocked = await api.isDatasetLocked(selectedPennsieveDataset);
    if (datasetIsLocked) {
      errorArray.push({
        type: "swal",
        title: `${selectedPennsieveDataset} is locked from editing`,
        message: `
            This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
            <br />
            <br />
            If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a  target="_blank" href="mailto:curation@sparc.science">curation@sparc.science.</a>
          `,
      });
      throw errorArray;
    }

    //Pull the dataset folders and files from Pennsieve\
    window.sodaJSONObj["bf-dataset-selected"] = {};
    window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = selectedPennsieveDataset;
    window.sodaJSONObj["bf-account-selected"]["account-name"] = window.defaultBfAccount;
    const importProgressCircle = document.querySelector(
      "#guided_loading_pennsieve_dataset-organize"
    );
    importProgressCircle.classList.remove("hidden");

    try {
      let data = await window.bf_request_and_populate_dataset(
        window.sodaJSONObj,
        importProgressCircle,
        true
      );
      // Save a copy of the dataset structure used to make sure the user doesn't change it
      // on future progress continuations
      window.sodaJSONObj["initially-pulled-dataset-structure"] = JSON.parse(
        JSON.stringify(data["soda_object"]["dataset-structure"])
      );
      window.datasetStructureJSONObj = data["soda_object"]["dataset-structure"];
    } catch (error) {
      clientError(error);
      errorArray.push({
        type: "swal",
        title: "Error pulling dataset from Pennsieve",
        message: `Error message: ${userErrorMessage(error)}`,
      });
      throw errorArray;
    }

    // If there are folders and/or files in the dataset on Pennsieve, validate the structure and
    // extract various metadata from the dataset structure to prepare the guided workflow.
    if (
      Object.keys(window.datasetStructureJSONObj["folders"]).length > 0 ||
      Object.keys(window.datasetStructureJSONObj["files"]).length > 0
    ) {
      // Reject if any non-sparc folders are in the root of the dataset
      let invalidBaseFolders = [];
      for (const baseFolder of Object.keys(window.datasetStructureJSONObj["folders"])) {
        if (
          !guidedHighLevelFolders.includes(baseFolder) &&
          !nonGuidedHighLevelFolders.includes(baseFolder)
        ) {
          invalidBaseFolders.push(baseFolder);
        }
      }
      if (invalidBaseFolders.length > 0) {
        errorArray.push({
          type: "swal",
          title: "This dataset is not eligible to be edited via Guided Mode",
          message: `The following folders are not allowed in the root of your dataset: ${invalidBaseFolders.join(
            ", "
          )}`,
        });
        throw errorArray;
      }

      // Datasets pulled into Guided Mode should only have pool-folders or sub-folders inside of the primary, source,
      // and derivative high level folders. If this is not the case with the pulled dataset, reject it.
      const [invalidFolders, invalidFiles] = guidedCheckHighLevelFoldersForImproperFiles(
        window.datasetStructureJSONObj
      );
      if (invalidFolders.length > 0 || invalidFiles.length > 0) {
        errorArray.push({
          type: "swal",
          title: "This dataset is not eligible to be edited via Guided Mode",
          message: `
            Your primary, source, and derivative folders must only contain pool- folders or sub- folders when resuming a Pennsieve dataset via Guided Mode
            <br />
            <br />
            Please remove any folders or files that are not pool- folders or sub- folders from your primary, source, and derivative folders and try again.
          `,
        });
        throw errorArray;
      }

      // Extract the pool/subject/sample structure from the folders and files pulled from Pennsieve
      // Note: this Also adds the pool/subject/sample structure to the window.sodaJSONObj
      const datasetSubSamStructure = extractPoolSubSamStructureFromDataset(
        window.datasetStructureJSONObj
      );
      const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
      const subjects = [...subjectsInPools, ...subjectsOutsidePools];

      // If no subjects from the dataset structure are found and the dataset does have primary, source, or derivative folders,
      if (subjects.length === 0) {
        for (const highLevelFolder of guidedHighLevelFolders) {
          if (window.datasetStructureJSONObj["folders"][highLevelFolder]) {
            errorArray.push({
              type: "swal",
              title: "This dataset is not eligible to be edited via Guided Mode",
              message: `
                The dataset contains either the primary, source, or derivative folders, but no subjects were detected in the dataset structure.
              `,
            });
            throw errorArray;
          }
        }
        // Also throw an error if the dataset does not have a code folder (If the dataset does not contain subjects +prim/src/deriv, then it must have a code folder)
        if (!window.datasetStructureJSONObj["folders"]["code"]) {
          errorArray.push({
            type: "swal",
            title: "This dataset is not eligible to be edited via Guided Mode",
            message: `
              The dataset does not contain a code folder, which is required for datasets that do not contain primary, source, or derivative files.
            `,
          });
          throw errorArray;
        }
      }

      // If the dataset has subjects, then we need to fetch the subjects metadata from Pennsieve
      if (subjects.length > 0) {
        window.subjectsTableData = [];
        //Fetch subjects and sample metadata and set window.subjectsTableData and sampleTableData
        try {
          let fieldEntries = [];
          for (const field of $("#guided-form-add-a-subject")
            .children()
            .find(".subjects-form-entry")) {
            fieldEntries.push(field.name.toLowerCase());
          }
          const subjectsMetadataResponse = await client.get(
            `/prepare_metadata/import_metadata_file`,
            {
              params: {
                selected_account: window.defaultBfAccount,
                selected_dataset: selectedPennsieveDatasetID,
                file_type: "subjects.xlsx",
                ui_fields: fieldEntries.toString(),
              },
            }
          );
          // Set window.subjectsTableData as the res
          window.subjectsTableData = subjectsMetadataResponse.data.subject_file_rows;
        } catch (error) {
          const emessage = userErrorMessage(error);
          errorArray.push({
            type: "swal",
            title: "Unable to fetch subjects metadata to check dataset structure",
            message: `
              The following error occurred while trying to fetch subjects metadata from Pennsieve: ${emessage}
            `,
          });
          throw errorArray;
        }

        const [samplesInPools, samplesOutsidePools] =
          window.sodaJSONObj.getAllSamplesFromSubjects();
        const samples = [...samplesInPools, ...samplesOutsidePools];

        window.samplesTableData = [];

        if (samples.length > 0) {
          try {
            let fieldEntries = [];
            for (const field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
              fieldEntries.push(field.name.toLowerCase());
            }
            let samplesMetadataResponse = await client.get(
              `/prepare_metadata/import_metadata_file`,
              {
                params: {
                  selected_account: window.defaultBfAccount,
                  selected_dataset: selectedPennsieveDatasetID,
                  file_type: "samples.xlsx",
                  ui_fields: fieldEntries.toString(),
                },
              }
            );
            // Set the window.samplesTableData as the samples metadata response
            window.samplesTableData = samplesMetadataResponse.data.sample_file_rows;
          } catch (error) {
            const emessage = userErrorMessage(error);
            errorArray.push({
              type: "swal",
              title: "Unable to fetch samples metadata to check dataset structure",
              message: `
              The following error occurred while trying to fetch samples metadata from Pennsieve: ${emessage}
            `,
            });
            throw errorArray;
          }
        }

        // If window.subjectsTableData was found, check if the subject/sample metadata has the same structure as the
        // dataset structure. If subject and sample metadata were not found, reset it and we'll add the metadata later
        const metadataSubSamStructure = createGuidedStructureFromSubSamMetadata(
          window.subjectsTableData.slice(1),
          window.samplesTableData.slice(1)
        );

        if (!objectsHaveSameKeys(metadataSubSamStructure, datasetSubSamStructure)) {
          errorArray.push({
            type: "swal",
            title: "This dataset is not eligible to be edited via Guided Mode",
            message: `
              Your dataset's structure does not align with your dataset's subject and sample metadata.
              <br />
              <br />
              Please ensure your subject and sample metadata files match the structure of your dataset folders and try again.
            `,
          });
          throw errorArray;
        }
      }

      // Pre-select the buttons that ask if the dataset contains *hlf* data based on the imported dataset structure
      for (const hlf of nonGuidedHighLevelFolders) {
        if (window.datasetStructureJSONObj["folders"][hlf]) {
          window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-data`] = "yes";
        } else {
          window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-data`] = "no";
        }
      }
    }

    await Swal.fire({
      icon: "info",
      title: "Begining Pennsieve Dataset edit session",
      html: `
          Note: it is imperative that you do not manually make any changes to your dataset folders and files
          directly on Pennsieve while working on this dataset on SODA.
          <br />
          <br />
          If you do, all saved changes that you have made on SODA will be lost and you will have to start over.
        `,
      width: 500,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `Got it!`,
      focusConfirm: true,
      allowOutsideClick: false,
    });

    // Set the json options for resuming a pennsieve dataset from Pennsieve
    window.sodaJSONObj["starting-point"]["type"] = "bf";
    window.sodaJSONObj["generate-dataset"]["generate-option"] = "existing-bf";
    window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = selectedPennsieveDatasetID;
    window.sodaJSONObj["digital-metadata"]["name"] = selectedPennsieveDataset;

    const changesCheckRes = await checkIfChangesMetadataPageShouldBeShown(
      selectedPennsieveDatasetID
    );
    if (changesCheckRes.shouldShow === true) {
      window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changesCheckRes.changesMetadata;
      guidedUnSkipPage("guided-create-changes-metadata-tab");
    } else {
      window.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
      guidedSkipPage("guided-create-changes-metadata-tab");
    }

    // Skip the page where they confirm their log in and workspace because we should already have it
    window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = guidedGetCurrentUserWorkSpace();
    guidedSkipPage("guided-pennsieve-intro-tab");
  }

  //Skip this page becausae we should not come back to it
  guidedSkipPage("guided-select-starting-point-tab");
};

/**
 *
 * @returns {Promise<void>}
 * @description This function is called when the user clicks the save and exit button while working through a prepare datasets step-by-step workflow.
 *              It saves the current page's progress if the page is valid and then transitions the user back to the prepare datasets step-by-step home screen.
 *              Progress is saved to a progress file that can be resumed by the user.
 */
const guidedSaveAndExit = async () => {
  if (!window.sodaJSONObj["digital-metadata"]["name"]) {
    // If a progress file has not been created, then we don't need to save anything
    guidedTransitionToHome();
    return;
  }
  const { value: returnToGuidedHomeScreen } = await Swal.fire({
    title: "Are you sure?",
    text: `Exiting Guided Mode will discard any changes you have made on the
      current page. You will be taken back to the homescreen, where you will be able
      to continue the current dataset you are curating which will be located under datasets
      in progress.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Exit guided mode",
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
  });
  if (returnToGuidedHomeScreen) {
    const currentPageID = window.CURRENT_PAGE.id;

    try {
      await savePageChanges(currentPageID);
    } catch (error) {
      const pageWithErrorName = window.CURRENT_PAGE.dataset.pageName;

      const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
        title: "The current page was not able to be saved before exiting",
        html: `The following error${
          error.length > 1 ? "s" : ""
        } occurred when attempting to save the ${pageWithErrorName} page:
            <br />
            <br />
            <ul>
              ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
            </ul>
            <br />
            Would you like to exit without saving the changes to the current page?`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, exit without saving",
        cancelButtonText: "No, address errors before saving",
        focusCancel: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        width: 700,
      });
      if (continueWithoutSavingCurrPageChanges) {
        guidedTransitionToHome();
      } else {
        return;
      }
    }
    guidedTransitionToHome();
  }
};

export const guidedTransitionToHome = () => {
  guidedUnLockSideBar();
  window.guidedPrepareHomeScreen();

  document.getElementById("guided-home").classList.remove("hidden");
  // Hide all of the parent tabs
  const guidedParentTabs = Array.from(document.querySelectorAll(".guided--parent-tab"));
  for (const guidedParentTab of guidedParentTabs) {
    guidedParentTab.classList.add("hidden");
  }
  window.CURRENT_PAGE = undefined;

  document.getElementById("guided-header-div").classList.add("hidden");
  document.getElementById("guided-footer-div").classList.add("hidden");
};

/**
 * @description Prepares the prepare dataset step-by-step menu page for user interaction.
 */
window.guidedPrepareHomeScreen = async () => {
  //Wipe out existing progress if it exists
  guidedResetProgressVariables();
  //Check if Guided-Progress folder exists. If not, create it.

  if (!window.fs.existsSync(guidedProgressFilePath)) {
    window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  }

  document.getElementById("existing-dataset-lottie").innerHTML = "";
  document.getElementById("edit-dataset-component-lottie").innerHTML = "";

  lottie.loadAnimation({
    container: document.getElementById("existing-dataset-lottie"),
    animationData: existingDataset,
    renderer: "svg",
    loop: true,
    autoplay: true,
  });

  lottie.loadAnimation({
    container: document.getElementById("edit-dataset-component-lottie"),
    animationData: modifyDataset,
    renderer: "svg",
    loop: true,
    autoplay: true,
  });

  guidedUnLockSideBar();
};

const itemsContainer = document.getElementById("items");
const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
const freeFormButtons = document.getElementById("organize-path-and-back-button-div");

document.getElementById("button-homepage-guided-mode").addEventListener("click", async () => {
  console.log("Homepage button called");
  //Transition file explorer elements to guided mode
  window.organizeDSglobalPath = document.getElementById("guided-input-global-path");
  window.organizeDSglobalPath.value = "";
  window.dataset_path = document.getElementById("guided-input-global-path");
  window.scroll_box = document.querySelector("#guided-body");
  itemsContainer.innerHTML = "";
  resetLazyLoading();
  freeFormItemsContainer.classList.remove("freeform-file-explorer");
  freeFormButtons.classList.remove("freeform-file-explorer-buttons");
  $(".shared-folder-structure-element").appendTo($("#guided-folder-structure-container"));

  guidedCreateSodaJSONObj();
  attachGuidedMethodsToSodaJSONObj();
  guidedTransitionFromHome();

  guidedUnLockSideBar();

  guidedUnSkipPage("guided-select-starting-point-tab");
  await openPage("guided-select-starting-point-tab");
});

export const guidedTransitionFromHome = async () => {
  //Hide the home screen
  document.getElementById("guided-home").classList.add("hidden");
  document.getElementById("curation-preparation-parent-tab").classList.remove("hidden");
  document.getElementById("guided-header-div").classList.remove("hidden");

  //Remove the lotties (will be added again upon visting the home page)
  document.getElementById("existing-dataset-lottie").innerHTML = "";
  document.getElementById("edit-dataset-component-lottie").innerHTML = "";

  //Hide all guided pages (first one will be unHidden automatically)
  const guidedPages = document.querySelectorAll(".guided--page");
  guidedPages.forEach((page) => {
    page.classList.add("hidden");
  });

  window.CURRENT_PAGE = document.getElementById("guided-select-starting-point-tab");

  document.getElementById("guided-footer-div").classList.remove("hidden");

  //Unskip all pages besides the ones that should always be skipped
  guidedResetSkippedPages();
};

const guidedResetProgressVariables = () => {
  window.sodaJSONObj = {};
  window.datasetStructureJSONObj = {};
  window.subjectsTableData = [];
  window.samplesTableData = [];
};

const objectsHaveSameKeys = (...objects) => {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every((object) => union.size === Object.keys(object).length);
};

const checkIfChangesMetadataPageShouldBeShown = async (pennsieveDatasetID) => {
  try {
    const changesRes = await client.get(`/prepare_metadata/readme_changes_file`, {
      params: {
        file_type: "CHANGES",
        selected_account: window.defaultBfAccount,
        selected_dataset: pennsieveDatasetID,
      },
    });
    const changes_text = changesRes.data.text;
    return { shouldShow: true, changesMetadata: changes_text };
  } catch (error) {
    const datasetInfo = await api.getDatasetInformation(pennsieveDatasetID);
    const isPublished = datasetInfo?.publication?.status === "completed";

    if (isPublished) {
      return { shouldShow: true, changesMetadata: "" };
    } else {
      return { shouldShow: false };
    }
  }
};

// This function extracts the pool, subject, and sample structure from an imported dataset
// and adds the pools, subjects, and samples to the guided mode structure if they exist.
// This function also handles setting the button config options, for example, if the function
// detects that there's primary subject data in the dataset, the yes button will be selected.
const extractPoolSubSamStructureFromDataset = (datasetStructure) => {
  const guidedFoldersInDataset = guidedHighLevelFolders.filter((folder) =>
    Object.keys(datasetStructure["folders"]).includes(folder)
  );

  const addedSubjects = [];
  const subjectsMovedIntoPools = [];
  const addedPools = [];
  const addedSamples = [];

  // Loop through prim, src, and deriv if they exist in the datasetStructure
  for (const hlf of guidedFoldersInDataset) {
    //Get the names of the subfolders directly in the hlf
    const hlfFolderNames = Object.keys(datasetStructure["folders"][hlf]["folders"]);
    const subjectFoldersInBase = hlfFolderNames.filter((folder) => folder.startsWith("sub-"));
    const poolFoldersInBase = hlfFolderNames.filter((folder) => folder.startsWith("pool-"));

    // Loop through any folders starting with sub- in the hlf
    for (const subjectFolder of subjectFoldersInBase) {
      if (!addedSubjects.includes(subjectFolder)) {
        try {
          window.sodaJSONObj.addSubject(subjectFolder);
          addedSubjects.push(subjectFolder);
        } catch (error) {
          console.log(error);
        }
      }
      // Get the names of the subfolders directly in the subject folder
      const potentialSampleFolderNames = Object.keys(
        datasetStructure["folders"][hlf]["folders"][subjectFolder]["folders"]
      );
      const sampleFoldersInSubject = potentialSampleFolderNames.filter((folder) =>
        folder.startsWith("sam-")
      );
      if (sampleFoldersInSubject.length > 0) {
        window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-sample-data`] = "yes";
      }
      // Loop through any folders starting with sam- in the subject folder
      for (const sampleFolder of sampleFoldersInSubject) {
        if (!addedSamples.includes(sampleFolder)) {
          try {
            window.sodaJSONObj.addSampleToSubject(sampleFolder, null, subjectFolder);
            addedSamples.push(sampleFolder);
          } catch (error) {
            console.log(error);
          }
        }
      }
    }

    if (subjectFoldersInBase.length > 0) {
      window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-subject-data`] = "yes";
    }

    // Loop through any folders starting with pool- in the hlf
    for (const poolFolder of poolFoldersInBase) {
      if (!addedPools.includes(poolFolder)) {
        try {
          window.sodaJSONObj.addPool(poolFolder);
          addedPools.push(poolFolder);
        } catch (error) {
          console.log(error);
        }
      }
      // Get the names of the subfolders directly in the pool folder
      const potentialSubjectFolderNames = Object.keys(
        datasetStructure["folders"][hlf]["folders"][poolFolder]["folders"]
      );
      const subjectFoldersInPool = potentialSubjectFolderNames.filter((folder) =>
        folder.startsWith("sub-")
      );

      if (subjectFoldersInPool.length > 0) {
        window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-subject-data`] = "yes";
      }
      // Loop through any folders starting with sub- in the pool folder
      for (const subjectFolder of subjectFoldersInPool) {
        if (!addedSubjects.includes(subjectFolder)) {
          try {
            window.sodaJSONObj.addSubject(subjectFolder);
            addedSubjects.push(subjectFolder);
          } catch (error) {
            console.log(error);
          }
        }

        if (!subjectsMovedIntoPools.includes(subjectFolder)) {
          try {
            window.sodaJSONObj.moveSubjectIntoPool(subjectFolder, poolFolder);
            subjectsMovedIntoPools.push(subjectFolder);
          } catch (error) {
            console.log(error);
          }
        }

        const potentialSampleFolderNames = Object.keys(
          datasetStructure["folders"][hlf]["folders"][poolFolder]["folders"][subjectFolder][
            "folders"
          ]
        );
        const sampleFoldersInSubject = potentialSampleFolderNames.filter((folder) =>
          folder.startsWith("sam-")
        );
        if (sampleFoldersInSubject.length > 0) {
          window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-sample-data`] = "yes";
        }
        // Loop through any folders starting with sam- in the subject folder
        for (const sampleFolder of sampleFoldersInSubject) {
          if (!addedSamples.includes(sampleFolder)) {
            try {
              window.sodaJSONObj.addSampleToSubject(sampleFolder, poolFolder, subjectFolder);
              addedSamples.push(sampleFolder);
            } catch (error) {
              console.log(error);
            }
          }
        }
      }
    }

    if (poolFoldersInBase.length > 0) {
      window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-pool-data`] = "yes";
    }
  }

  if (addedSubjects.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-subjects"] = "yes";
  }
  if (addedPools.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-pools"] = "yes";
  } else {
    window.sodaJSONObj["button-config"]["dataset-contains-pools"] = "no";
  }
  if (addedSamples.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-samples"] = "yes";
  }

  return window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"];
};

const guidedCheckHighLevelFoldersForImproperFiles = (datasetStructure) => {
  const invalidFolders = [];
  const invalidFiles = [];

  for (const hlf of guidedHighLevelFolders) {
    if (datasetStructure["folders"][hlf]) {
      const hlfFolders = Object.keys(datasetStructure["folders"][hlf]["folders"]);
      //filter out hlfFolders that do not start with pool- or sub-
      const invalidBaseFolders = hlfFolders.filter((folder) => {
        return !folder.startsWith("pool-") && !folder.startsWith("sub-");
      });

      for (const invalidBaseFolder of invalidBaseFolders) {
        invalidFolders.push(invalidBaseFolder);
      }

      const hlfFiles = Object.keys(datasetStructure["folders"][hlf]["files"]);
      const invalidBaseFiles = hlfFiles.filter((file) => {
        return !file.startsWith("manifest");
      });
      for (const invalidBaseFile of invalidBaseFiles) {
        invalidFiles.push(invalidBaseFile);
      }
    }
  }
  return [invalidFolders, invalidFiles];
};

const createGuidedStructureFromSubSamMetadata = (subjectsMetadataRows, samplesMetadataRows) => {
  const poolSubSamStructure = {
    pools: {},
    subjects: {},
  };

  const datasetPools = [
    ...new Set(
      subjectsMetadataRows
        .map((subjectDataArray) => subjectDataArray[1])
        .filter((pool) => pool !== "")
    ),
  ];

  for (const pool of datasetPools) {
    poolSubSamStructure["pools"][pool] = {};
  }

  for (const subject of subjectsMetadataRows) {
    const subjectID = subject[0];
    const poolID = subject[1];
    if (poolID !== "") {
      poolSubSamStructure["pools"][poolID][subjectID] = {};
    } else {
      poolSubSamStructure["subjects"][subjectID] = {};
    }
  }

  for (const sample of samplesMetadataRows) {
    const subjectID = sample[0];
    const sampleID = sample[1];
    const poolID = sample[3];
    if (poolID !== "") {
      poolSubSamStructure["pools"][poolID][subjectID][sampleID] = {};
    } else {
      poolSubSamStructure["subjects"][subjectID][sampleID] = {};
    }
  }
  return poolSubSamStructure;
};

export const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};
