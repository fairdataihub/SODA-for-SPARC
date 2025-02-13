import { openPage } from "./openPage";
import { savePageChanges } from "./savePageChanges";
import { guidedUnSkipPage, getNextPageNotSkipped, getPrevPageNotSkipped, guidedResetSkippedPages } from "./pageSkipping";
import { guidedUnLockSideBar, resetLazyLoading } from "../../../assets/nav";
import { guidedCreateSodaJSONObj, attachGuidedMethodsToSodaJSONObj } from "../utils/sodaJSONObj";
import lottie from "lottie-web";
import { existingDataset, modifyDataset } from "../../../assets/lotties/lotties";
import Swal from "sweetalert2";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

//next button click handler
$("#guided-next-button").on("click", async function () {
  console.log("Next button clicked");
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

    //Mark page as completed in JSONObj so we know what pages to load when loading local saves
    //(if it hasn't already been marked complete)
    if (!window.sodaJSONObj["completed-tabs"].includes(window.pageBeingLeftID)) {
      window.sodaJSONObj["completed-tabs"].push(window.pageBeingLeftID);
    }

    //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
    //if more tabs in parent tab, go to next tab and update capsule
    let targetPage = getNextPageNotSkipped(window.CURRENT_PAGE.id);
    let targetPageID = targetPage.id;

    console.log("Navigating to next page", targetPageID);

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

//back button click handler
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

// Save and exit button click handlers
document.getElementById("guided-button-save-and-exit").addEventListener("click", async () => {
  await guidedSaveAndExit();
});

export const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};
