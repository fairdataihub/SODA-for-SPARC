import { openPageCurationPreparation } from "./curationPreparation/openPage.js";
import { openPageDatasetStructure } from "./datasetStructure/openPage.js";
import { openPagePrepareMetadata } from "./prepareMetadata/openPage.js";
import { openPageGenerateDataset } from "./generateDataset/openPage.js";
import {
  resetGuidedRadioButtons,
  updateGuidedRadioButtonsFromJSON,
} from "../buttons/radioButtons.js";
import {
  externallySetSearchFilterValue,
  reRenderTreeView,
  clearEntityFilter,
  setEntityFilter,
  setDatasetMetadataToPreview,
  setActiveFileExplorer,
  setPathToRender,
} from "../../../stores/slices/datasetTreeViewSlice.js";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
  setActiveEntity,
  setShowFullMetadataFormFields,
} from "../../../stores/slices/datasetEntitySelectorSlice.js";
import {
  setDatasetEntityArray,
  setActiveFormType,
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice.js";
import {
  setSelectedEntities,
  setDeSelectedEntities,
} from "../../../stores/slices/datasetContentSelectorSlice.js";
import {
  setDatasetEntityObj,
  filterRemovedFilesFromDatasetEntityObj,
  setEntityType,
} from "../../../stores/slices/datasetEntitySelectorSlice.js";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice.js";
import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading.js";
import Swal from "sweetalert2";
import { userErrorMessage } from "../../others/http-error-handler/error-handler.js";
import { getNonSkippedGuidedModePages } from "./navigationUtils/pageSkipping.js";
import { startOrStopAnimationsInContainer } from "../lotties/lottie.js";
import { renderSideBar } from "./sidebar.js";
import useGlobalStore from "../../../stores/globalStore.js";
import { setPerformanceList } from "../../../stores/slices/performancesSlice.js";
import { setSelectedModalities } from "../../../stores/slices/modalitiesSlice.js";
import { guidedSaveProgress } from "./savePageChanges.js";
import { createStandardizedDatasetStructure } from "../../utils/datasetStructure.js";
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Function that handles the visibility of the back button
const handleBackButtonVisibility = (targetPageID) => {
  if (
    targetPageID === "guided-dataset-dissemination-tab" ||
    targetPageID === "guided-dataset-generation-tab"
  ) {
    $("#guided-back-button").css("visibility", "hidden");
  } else {
    $("#guided-back-button").css("visibility", "visible");
  }
};

// Function that handles the visibility of the next button
const handleNextButtonVisibility = (targetPageID) => {
  if (
    targetPageID === "guided-dataset-generation-confirmation-tab" ||
    targetPageID === "guided-dataset-generation-tab" ||
    targetPageID === "guided-dataset-dissemination-tab"
  ) {
    $("#guided-next-button").css("visibility", "hidden");
  } else {
    $("#guided-next-button").css("visibility", "visible");
  }
};

const handleSaveAndExitButtonVisibility = (targetPageID) => {
  if (targetPageID === "guided-select-starting-point-tab") {
    $("#guided-button-save-and-exit").css("visibility", "hidden");
  } else {
    $("#guided-button-save-and-exit").css("visibility", "visible");
  }
};

// Function that handles the validation state of the dataset
// When the user goes back to before the validation tab, the dataset is no longer validated
// This function will reset the dataset-validated value to false so validation will be retriggered
// when the user goes to the validation tab

const handleGuidedValidationState = (targetPageID) => {
  if (window.sodaJSONObj["dataset-validated"] === "true") {
    const nonSkippedPages = getNonSkippedGuidedModePages(document);
    const indexOfCurrentPage = nonSkippedPages.findIndex((page) => page.id === targetPageID);
    const indexOfValidationPage = nonSkippedPages.findIndex(
      (page) => page.id === "guided-dataset-validation-tab"
    );
    if (indexOfCurrentPage < indexOfValidationPage) {
      window.sodaJSONObj["dataset-validated"] = "false";
    }
  }
};

const guidedLockSideBar = (boolShowGuidedModeContainerElements) => {
  const sidebar = document.getElementById("sidebarCollapse");
  const guidedModeSection = document.getElementById("guided_mode-section");
  const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
  const guidedNav = document.getElementById("guided-nav");
  const guidedProgressContainer = document.getElementById("guided-header-div");

  if (!sidebar.classList.contains("active")) {
    sidebar.click();
  }

  sidebar.disabled = true;
  guidedModeSection.style.marginLeft = "-70px";

  if (boolShowGuidedModeContainerElements) {
    guidedDatsetTab.style.marginLeft = "215px";
    guidedNav.style.display = "flex";
    guidedProgressContainer.classList.remove("hidden");
  } else {
    guidedDatsetTab.style.marginLeft = "0px";
    guidedNav.style.display = "none";
    guidedProgressContainer.classList.add("hidden");
  }
};

const hideAndShowElementsDependingOnStartType = (pageElement) => {
  const startingFromPennsieve = window.sodaJSONObj?.["starting-point"]?.["origin"] === "ps";
  const textToShowWhenStartingFromPennsieve = pageElement.querySelectorAll(
    ".showWhenStartingFromPennsieve"
  );
  const textToShowWhenStartingNew = pageElement.querySelectorAll(".showWhenStartingNew");
  if (startingFromPennsieve) {
    textToShowWhenStartingFromPennsieve.forEach((element) => {
      element.classList.remove("hidden");
    });
    textToShowWhenStartingNew.forEach((element) => {
      element.classList.add("hidden");
    });
  } else {
    textToShowWhenStartingFromPennsieve.forEach((element) => {
      element.classList.add("hidden");
    });
    textToShowWhenStartingNew.forEach((element) => {
      element.classList.remove("hidden");
    });
  }
};

const setActiveProgressionTab = (targetPageID) => {
  $(".guided--progression-tab").removeClass("selected-tab");
  let targetPageParentID = $(`#${targetPageID}`).parent().attr("id");
  let targetProgressionTabID = targetPageParentID.replace("parent-tab", "progression-tab");
  let targetProgressionTab = $(`#${targetProgressionTabID}`);
  targetProgressionTab.addClass("selected-tab");
};

/**
 *
 * Prepares the state of the target page based on the state of the window.sodaJSONObj and then displays the page.
 * Handles page loading and displaying for the 'start new dataset' workflow and the Update existing Pennsieve dataset workflow.
 * @param {string} targetPageID - The html element id of the page to display.
 *
 */
window.openPage = async (targetPageID) => {
  //NOTE: 2 Bottom back buttons (one handles sub pages, and the other handles main pages)
  //Back buttons should be disabled and the function setLoading should be (set as false?)

  // This function is used by both the navigation bar and the side buttons,
  // and whenever it is being called, we know that the user is trying to navigate to a new page
  // this function is async because we sometimes need to fetch data before the page is ready to be opened

  guidedSetNavLoadingState(true);

  const targetPage = document.getElementById(targetPageID);
  const targetPageName = targetPage.dataset.pageName || targetPageID;
  const targetPageParentTab = targetPage.closest(".guided--parent-tab");
  const targetPageDataset = targetPage.dataset;

  //when the promise completes there is a catch for error handling
  //upon resolving it will set navLoadingstate to false
  try {
    //reset the radio buttons for the page being navigated to
    resetGuidedRadioButtons(targetPageID);
    //update the radio buttons using the button config from window.sodaJSONObj
    updateGuidedRadioButtonsFromJSON(targetPageID);

    // Reset the zustand store search filter value
    externallySetSearchFilterValue("");

    // clear the entity filter when navigating to a new page
    clearEntityFilter();
    setSelectedHierarchyEntity(null);
    setActiveEntity(null);

    if (targetPageDataset.entityType) {
      setEntityType(targetPageDataset.entityType);
    } else {
      setEntityType(null);
    }

    // Synchronize state between the SODA JSON object and the zustand store
    setSelectedEntities(window.sodaJSONObj["selected-entities"] || []);
    setDeSelectedEntities(window.sodaJSONObj["deSelected-entities"] || []);
    setPerformanceList(window.sodaJSONObj["dataset_metadata"]?.["performance_metadata"] || []);

    const pagesToShowMetadataPreview = [
      "guided-generate-dataset-locally",
      "guided-dataset-structure-review-tab",
      "guided-dataset-generation-confirmation-tab",
    ];
    if (pagesToShowMetadataPreview.includes(targetPageID)) {
      // Set the dataset metadata to preview
      setDatasetMetadataToPreview(Object.keys(window.sodaJSONObj["dataset_metadata"] || {}));
    } else {
      // Clear the dataset metadata preview if not on the generation page
      setDatasetMetadataToPreview(null);
    }

    handleNextButtonVisibility(targetPageID);
    handleBackButtonVisibility(targetPageID);
    handleSaveAndExitButtonVisibility(targetPageID);
    handleGuidedValidationState(targetPageID);

    // If the user has not saved the dataset name and subtitle, then the next button should say "Continue"
    // as they are not really saving anything
    // If they have saved the dataset name and subtitle, then the next button should say "Save and Continue"
    // as their progress is saved when continuing to the next page
    const datasetName = window.sodaJSONObj?.["digital-metadata"]?.["name"];
    const nextButton = document.getElementById("guided-next-button");
    const nextButtonSpans = document.querySelectorAll(".next-button-span");

    if (!datasetName) {
      // set the span inside of nextButton to "Continue"
      nextButton.querySelector("span.nav-button-text").innerHTML = "Continue";
      nextButtonSpans.forEach((span) => {
        span.innerHTML = "Continue";
      });
      guidedLockSideBar(false);
    } else {
      // Set the dataset name display in the side bar
      const datasetNameDisplay = document.getElementById("guided-navbar-dataset-name-display");
      datasetNameDisplay.innerHTML = datasetName;

      nextButton.querySelector("span.nav-button-text").innerHTML = "Save and Continue";
      nextButtonSpans.forEach((span) => {
        span.innerHTML = "Save and Continue";
      });
      guidedLockSideBar(true);
    }

    if (targetPageDataset.componentType) {
      const targetPageComponentType = targetPageDataset.componentType;
      if (targetPageComponentType === "performance-id-management-page") {
        const performanceList = window.sodaJSONObj["dataset_performances"] || [];
        setPerformanceList(performanceList);
      }

      if (targetPageComponentType === "modality-selection-page") {
        const modalities = window.sodaJSONObj["selected-modalities"] || [];
        setSelectedModalities(modalities);
      }

      if (targetPageComponentType === "data-categorization-page") {
        const pageEntityType = targetPageDataset.entityType;
        const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
        const selectedEntities = window.sodaJSONObj["selected-entities"] || [];
        const filteredDatasetEntityObj =
          filterRemovedFilesFromDatasetEntityObj(savedDatasetEntityObj);
        setDatasetEntityObj(filteredDatasetEntityObj);

        // Make any adjustments to the dataset entity object before setting it in the zustand store
        if (pageEntityType === "high-level-folder-data-categorization") {
          // Delete the manifest file because it throws off the count of files selected
          delete window.datasetStructureJSONObj?.["files"]?.["manifest.xlsx"];
          const bucketTypes = ["Experimental", "Protocol", "Documentation"];
          if (selectedEntities.includes("code")) {
            bucketTypes.push("Code");
          } else {
            removeEntityFromEntityList("high-level-folder-data-categorization", "Code");
          }

          for (const bucketType of bucketTypes) {
            addEntityToEntityList("high-level-folder-data-categorization", bucketType);
          }
        }

        if (pageEntityType === "sites") {
          const sites = getExistingSites().map((site) => site.id);
          for (const site of sites) {
            addEntityToEntityList("sites", site);
          }
        }

        if (pageEntityType === "samples") {
          const samples = getExistingSamples().map((sample) => sample.id);
          for (const sample of samples) {
            addEntityToEntityList("samples", sample);
          }
        }

        if (pageEntityType === "subjects") {
          const subjects = getExistingSubjects().map((subject) => subject.id);
          for (const subject of subjects) {
            addEntityToEntityList("subjects", subject);
          }
        }

        if (pageEntityType === "performances") {
          const performanceList = window.sodaJSONObj["dataset_performances"];
          for (const performance of performanceList) {
            addEntityToEntityList("performances", performance.performance_id);
          }
          setEntityFilter(
            [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
            []
          );
        }

        if (pageEntityType === "modalities") {
          const modalities = window.sodaJSONObj["selected-modalities"] || [];
          for (const modality of modalities) {
            addEntityToEntityList("modalities", modality);
          }
          setEntityFilter(
            [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
            []
          );
        }
      }

      if (targetPageComponentType === "entity-file-mapping-page") {
        /* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */
        setSelectedHierarchyEntity(null);

        const datasetEntityArray = window.sodaJSONObj["dataset-entity-array"] || [];
        const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};

        // Make sure the datasetEntityObj is set before applying filters
        setDatasetEntityObj(savedDatasetEntityObj);

        // Check if there are files in the Experimental data bucket
        const hasExperimentalData =
          !!savedDatasetEntityObj?.["high-level-folder-data-categorization"]?.["Experimental"] &&
          Object.keys(
            savedDatasetEntityObj["high-level-folder-data-categorization"]["Experimental"]
          ).length > 0;

        // If experimental data exists, apply the filter
        if (hasExperimentalData) {
          // Apply the filter for experimental data
          setEntityFilter(
            [{ type: "high-level-folder-data-categorization", names: ["Experimental"] }],
            []
          );
        }

        setDatasetEntityArray(datasetEntityArray);
      }

      if (
        targetPageComponentType === "entity-metadata-page" ||
        targetPageComponentType === "entity-spreadsheet-import-page"
      ) {
        const datasetEntityArray = window.sodaJSONObj["dataset-entity-array"] || [];

        setDatasetEntityArray(datasetEntityArray);
        setActiveFormType(null);
      }
    }

    if (targetPageID === "guided-manual-dataset-entity-and-metadata-tab") {
      // Make sure the entity metadata forms show only the key form fields
      setShowFullMetadataFormFields(false);
    } else {
      // Show the full entity metadata forms for all other pages
      setShowFullMetadataFormFields(true);
    }

    await openPageCurationPreparation(targetPageID);
    await openPageDatasetStructure(targetPageID);
    await openPagePrepareMetadata(targetPageID);
    await openPageGenerateDataset(targetPageID);

    const showCorrectFileExplorerByPage = (pageID) => {
      // Get the element for the pageId
      const pageElement = document.getElementById(pageID);

      // Special case for data categorization pages
      if (pageElement.dataset.componentType === "data-categorization-page") {
        setActiveFileExplorer("entity-data-selector");
        return;
      }

      setActiveFileExplorer(pageID);
    };
    showCorrectFileExplorerByPage(targetPageID);

    const renderCorrectFileExplorerByPage = (pageID) => {
      // List of pages where the file explorer should render the dataset structure
      // as it will get generated
      const reviewPages = [
        "guided-dataset-structure-and-manifest-review-tab",
        "guided-generate-dataset-locally",
        "guided-dataset-generation-confirmation-tab",
        "guided-dataset-structure-review-tab",
      ];

      console.log("Rendering dataset structure for page:", pageID);

      // Check if the current page is one of the review pages
      if (reviewPages.includes(pageID)) {
        console.log("Rendering standardized dataset structure");
        const standardizedDatasetStructure = createStandardizedDatasetStructure(
          window.datasetStructureJSONObj,
          window.sodaJSONObj["dataset-entity-obj"]
        );
        console.log("Standardized dataset structure created:", standardizedDatasetStructure);
        setPathToRender([]);
        useGlobalStore.setState({ datasetStructureJSONObj: standardizedDatasetStructure });
        reRenderTreeView();
      } else {
        console.log("Rendering default dataset structure");
        setPathToRender(["data"]);
        useGlobalStore.setState({ datasetStructureJSONObj: window.datasetStructureJSONObj });
        reRenderTreeView();
      }
    };
    renderCorrectFileExplorerByPage(targetPageID);

    let currentParentTab = window.CURRENT_PAGE.closest(".guided--parent-tab");

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveProgressionTab(targetPageID);

    renderSideBar(targetPageID);

    const guidedBody = document.getElementById("guided-body");
    //Check to see if target element has the same parent as current sub step
    if (currentParentTab.id === targetPageParentTab.id) {
      window.CURRENT_PAGE.classList.add("hidden");
      window.CURRENT_PAGE = targetPage;
      window.CURRENT_PAGE.classList.remove("hidden");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.CURRENT_PAGE.classList.add("hidden");
      currentParentTab.classList.add("hidden");
      targetPageParentTab.classList.remove("hidden");
      window.CURRENT_PAGE = targetPage;
      window.CURRENT_PAGE.classList.remove("hidden");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
      });
    }

    // Start any animations that need to be started
    startOrStopAnimationsInContainer(targetPageID, "start");

    hideAndShowElementsDependingOnStartType(targetPage);

    // Set the last opened page and save it
    window.sodaJSONObj["page-before-exit"] = targetPageID;
    await guidedSaveProgress();
  } catch (error) {
    console.error("Error opening page:", targetPageID);
    console.error("Error: ", error);
    const eMessage = userErrorMessage(error);
    Swal.fire({
      icon: "error",
      title: `Error opening the ${targetPageName} page`,
      html: eMessage,
      width: 600,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `OK`,
      focusConfirm: true,
      allowOutsideClick: false,
    });

    guidedSetNavLoadingState(false);
    throw error;
  }

  guidedSetNavLoadingState(false);
};
