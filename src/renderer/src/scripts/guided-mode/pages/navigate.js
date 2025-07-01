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
 * @description Navigate to the next page in the active prepare datasets step-by-step workflow.
 */
export const handleNextButtonClick = async () => {
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

    if (!window.sodaJSONObj["completed-tabs"].includes(window.pageBeingLeftID)) {
      window.sodaJSONObj["completed-tabs"].push(window.pageBeingLeftID);
    }

    const targetPage = getNextPageNotSkipped(window.CURRENT_PAGE.id);
    const targetPageID = targetPage.id;

    await openPage(targetPageID);
  } catch (error) {
    window.log.error(error);
    if (Array.isArray(error)) {
      error.forEach((err) => {
        if (err.type === "notyf") {
          window.notyf.open({
            duration: "7000",
            type: "error",
            message: err.message,
          });
        }

        if (err.type === "swal") {
          Swal.fire({
            icon: "error",
            title: err.title,
            html: err.message,
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
};

/**
 * @description Navigate to the previous page in the workflow.
 */
export const handleBackButtonClick = async () => {
  window.pageBeingLeftID = window.CURRENT_PAGE.id;

  try {
    await savePageChanges(window.pageBeingLeftID);
  } catch (error) {
    console.error("Error saving page changes during back button click", error);
  }

  const targetPage = getPrevPageNotSkipped(window.pageBeingLeftID);

  if (!targetPage) {
    await guidedSaveAndExit();
    return;
  }

  const targetPageID = targetPage.id;
  await openPage(targetPageID);
};

const nextButton = document.getElementById("guided-next-button");
nextButton.addEventListener("click", handleNextButtonClick);

const backButton = document.getElementById("guided-back-button");
backButton.addEventListener("click", handleBackButtonClick);
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

  if (!startingNewCuration && !resumingExistingProgress) {
    errorArray.push({
      type: "notyf",
      message: "Please select a dataset start location",
    });
    throw errorArray;
  }

  if (startingNewCuration) {
    window.sodaJSONObj["starting-point"]["origin"] = "new";
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

  //Skip this page because we should not come back to it
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

  document.getElementById("guided-footer-div").classList.add("hidden");
  document.getElementById("guided-header-div").classList.add("hidden");
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
