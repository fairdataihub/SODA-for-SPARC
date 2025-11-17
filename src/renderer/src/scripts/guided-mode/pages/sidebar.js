import { getNonSkippedGuidedModePages } from "../pages/navigationUtils/pageSkipping";
import Swal from "sweetalert2";
import {
  setGuidedModePageStructureObject,
  setShowGuidedModePageNavigation,
} from "../../../stores/slices/sideBarSlice";
import { setOpenSidebarTab } from "../../../stores/slices/sideBarSlice";
/**
 *
 * @param {string} activePage - The id of the html page open in the current Prepare Dataset Step-by-Step workflow.
 * @description - Render the Prepare Dataset Step-by-Step sidebar. The sidebar contains the sections and available pages
 *                in the active workflow. Can be used to navigate to different pages in the workflow along with the continue and back buttons.
 */
// Builds and updates the sidebar structure for Guided Mode
// Functionality preserved exactly as in the original
export const renderSideBar = (activePage) => {
  // Do not render sidebar navigation for the dissemination tab
  if (activePage === "guided-dataset-dissemination-tab") {
    setShowGuidedModePageNavigation(false);
    return;
  }

  // Ensure sidebar navigation is visible
  setShowGuidedModePageNavigation(true);

  // List of completed page IDs stored in sodaJSONObj
  const completedTabs = window.sodaJSONObj["completed-tabs"];

  // Will hold the refreshed sidebar structure
  const newPageStructureObject = {};

  // Top-level sidebar sections
  const highLevelStepElements = Array.from(document.querySelectorAll(".guided--parent-tab"));

  // Build structure for each top-level section
  for (const element of highLevelStepElements) {
    const parentTabName = element.getAttribute("data-parent-tab-name");

    // Initialize container for this section
    newPageStructureObject[parentTabName] = [];

    // Fetch all pages not marked as skipped
    const notSkippedPages = getNonSkippedGuidedModePages(element);

    // Build structure for each page
    for (const page of notSkippedPages) {
      const pageName = page.getAttribute("data-page-name");
      const pageID = page.getAttribute("id");

      newPageStructureObject[parentTabName].push({
        pageID,
        pageName,
        completed: completedTabs.includes(pageID),
      });

      // Expand whichever high-level tab the active page belongs to
      if (pageID === activePage) {
        setOpenSidebarTab(parentTabName);
      }
    }
  }

  // Update Zustand store with new structure (triggers sidebar re-render)
  setGuidedModePageStructureObject(newPageStructureObject);
};

export const checkIfPageIsValid = async (pageID) => {
  await window.openPage(pageID);
  await window.savePageChanges(pageID);
};
