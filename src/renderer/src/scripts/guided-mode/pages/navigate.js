import { openPage } from "./openPage";
import { savePageChanges } from "./savePageChanges";
import { guidedUnSkipPage, getNextPageNotSkipped, getPrevPageNotSkipped } from "./pageSkipping";
import { guidedUnLockSideBar } from "../../../assets/nav";
import Swal from "sweetalert2";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

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

// Save and exit button click handlers
document.getElementById("guided-button-save-and-exit").addEventListener("click", async () => {
  await guidedSaveAndExit();
});

export const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};
