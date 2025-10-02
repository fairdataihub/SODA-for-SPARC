import { savePageChanges } from "./savePageChanges";
import { getGuidedProgressFileNames } from "./curationPreparation/savePage";
import {
  guidedUnSkipPage,
  getNextPageNotSkipped,
  getPrevPageNotSkipped,
  guidedSkipPage,
  getNonSkippedGuidedModePages,
} from "./navigationUtils/pageSkipping";
import { guidedUnLockSideBar, resetLazyLoading } from "../../../assets/nav";
import api from "../../others/api/api";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../../../assets/lotties/lotties";
import Swal from "sweetalert2";
import { clientError } from "../../others/http-error-handler/error-handler";
import client from "../../client";
import { swalShowError, swalShowInfo } from "../../utils/swal-utils";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

/**
 * @description Navigate to the next page in the active prepare datasets step-by-step workflow.
 */
export const handleNextButtonClick = async () => {
  //Get the ID of the current page to handle actions on page leave (next button pressed)
  window.pageBeingLeftID = window.CURRENT_PAGE.id;

  try {
    await savePageChanges(window.pageBeingLeftID);
    if (!window.sodaJSONObj["completed-tabs"].includes(window.pageBeingLeftID)) {
      window.sodaJSONObj["completed-tabs"].push(window.pageBeingLeftID);
    }

    // If the current page is the dataset generation page, go to the share with curation team
    // page, otherwise, go to the next page in the workflow.

    if (window.pageBeingLeftID === "guided-dataset-generation-tab") {
      await window.openPage("guided-dataset-dissemination-tab");
    } else {
      const targetPage = getNextPageNotSkipped(window.CURRENT_PAGE.id);
      const targetPageID = targetPage.id;

      await window.openPage(targetPageID);
    }
  } catch (error) {
    window.log.error(error);
    if (Array.isArray(error)) {
      for (const err of error) {
        if (err.type === "notyf") {
          window.notyf.open({
            duration: "7000",
            type: "error",
            message: err.message,
          });
        }
        if (err.type === "swal") {
          await swalShowError(err.errorTitle, err.errorText);
        }
      }
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
  await window.openPage(targetPageID);
};

const nextButton = document.getElementById("guided-next-button");
nextButton.addEventListener("click", handleNextButtonClick);

const backButton = document.getElementById("guided-back-button");
backButton.addEventListener("click", handleBackButtonClick);
// Save and exit button click handlers
document.getElementById("guided-button-save-and-exit").addEventListener("click", async () => {
  await guidedSaveAndExit();
});

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

  document.getElementById("soda-home-page").classList.remove("hidden");
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

  guidedUnLockSideBar();
};

const itemsContainer = document.getElementById("items");
const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
const freeFormButtons = document.getElementById("organize-path-and-back-button-div");

document.getElementById("button-homepage-guided-mode").addEventListener("click", async () => {
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
  guidedTransitionFromHome();
  guidedUnLockSideBar();
  await window.openPage("guided-select-starting-point-tab");
});

export const guidedTransitionFromHome = async () => {
  //Hide the home screen
  document.getElementById("soda-home-page").classList.add("hidden");
  document.getElementById("curation-preparation-parent-tab").classList.remove("hidden");
  document.getElementById("guided-header-div").classList.remove("hidden");

  //Hide all guided pages (first one will be unHidden automatically)
  const guidedPages = document.querySelectorAll(".guided--page");
  guidedPages.forEach((page) => {
    page.classList.add("hidden");
  });

  window.CURRENT_PAGE = document.getElementById("guided-select-starting-point-tab");
  await window.openPage("guided-select-starting-point-tab");

  document.getElementById("guided-footer-div").classList.remove("hidden");
};

const guidedResetProgressVariables = () => {
  window.sodaJSONObj = {};
  window.datasetStructureJSONObj = {};
};

export const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};
