import { openPageCurationPreparation } from "./curationPreparation/openPage.js";
import { openPageDatasetStructure } from "./datasetStructure/openPage.js";
import { openPagePrepareMetadata } from "./prepareMetadata/openPage.js";
import { openPageGenerateDataset } from "./generateDataset/openPage.js";
import { openPageSharedWorkflowSteps } from "./sharedWorkflowSteps/openPage.js";
import {
  resetGuidedRadioButtons,
  updateGuidedRadioButtonsFromJSON,
} from "../buttons/radioButtons.js";
import {
  externallySetSearchFilterValue,
  reRenderTreeView,
  clearFileVisibilityFilter,
  setFileVisibilityFilter,
  setDatasetMetadataToPreview,
  setActiveFileExplorer,
  setPathToRender,
} from "../../../stores/slices/datasetTreeViewSlice.js";
import {
  addEntityNameToEntityType,
  getEntityNamesByEntityType,
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
  setSelectedDataCategoriesByEntityType,
} from "../../../stores/slices/datasetContentSelectorSlice.js";
import {
  setDatasetEntityObj,
  filterRemovedFilesFromDatasetEntityObj,
  setEntityType,
} from "../../../stores/slices/datasetEntitySelectorSlice.js";
import { setDatasetType } from "../../../stores/slices/guidedModeSlice.js";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice.js";
import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading.js";
import Swal from "sweetalert2";
import { userErrorMessage } from "../../others/http-error-handler/error-handler.js";
import {
  getNonSkippedGuidedModePages,
  returnUserToFirstPage,
} from "./navigationUtils/pageSkipping.js";
import { startOrStopAnimationsInContainer } from "../lotties/lottie.js";
import { renderSideBar } from "./sidebar.js";
import useGlobalStore from "../../../stores/globalStore.js";
import { setPerformanceList } from "../../../stores/slices/performancesSlice.js";
import { setSelectedModalities } from "../../../stores/slices/modalitiesSlice.js";
import { guidedSaveProgress } from "./savePageChanges.js";
import { createStandardizedDatasetStructure } from "../../utils/datasetStructure.js";
import { setCurrentStep } from "../../../stores/slices/stepperSlice.js";
import { setGuidedModeSidebarDatasetName } from "../../../stores/slices/sideBarSlice.js";

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
    targetPageID === "guided-dataset-dissemination-tab" ||
    (targetPageID === "guided-generate-dataset-locally" &&
      window.sodaJSONObj["generate-dataset-on-pennsieve"] === false)
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

const guidedRenderSideBar = (pageBeingOpenedID) => {
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
  const pagesToNotRenderSidebarOn = ["guided-select-starting-point-tab"];

  if (!pagesToNotRenderSidebarOn.includes(pageBeingOpenedID)) {
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
  let targetPageParentID = $(`#${targetPageID}`).parent().attr("id");
  // Get the text for the current step from the target page's data attribute
  const stepText = document.getElementById(targetPageParentID).getAttribute("data-parent-tab-name");
  setCurrentStep("guided-mode-progress-stepper", stepText);
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

    // clear the file visibility filter when navigating to a new page
    clearFileVisibilityFilter();
    setSelectedHierarchyEntity(null);
    setActiveEntity(null);

    if (targetPageDataset.entityType) {
      setEntityType(targetPageDataset.entityType);
      // For single-category entity pages (like experimental), set activeEntity to entityType
      if (targetPageDataset.entityTypeOnlyHasOneCategory === "true") {
        setActiveEntity(targetPageDataset.entityType);
      }
    } else {
      setEntityType(null);
    }

    // Synchronize state between the SODA JSON object and the zustand store
    setSelectedEntities(window.sodaJSONObj["selected-entities"] || []);
    setDeSelectedEntities(window.sodaJSONObj["deSelected-entities"] || []);

    setDatasetEntityArray(window.sodaJSONObj["dataset-entity-array"] || []);

    // Filter out any file/folder references from the entity object that no longer exist in the dataset structure
    // This prevents errors when users delete files/folders after previously assigning them to entities
    const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
    const filteredDatasetEntityObj = filterRemovedFilesFromDatasetEntityObj(savedDatasetEntityObj);
    setDatasetEntityObj(filteredDatasetEntityObj);

    handleNextButtonVisibility(targetPageID);
    handleBackButtonVisibility(targetPageID);
    handleSaveAndExitButtonVisibility(targetPageID);
    handleGuidedValidationState(targetPageID);
    guidedRenderSideBar(targetPageID);

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
      setGuidedModeSidebarDatasetName(null);
    } else {
      setGuidedModeSidebarDatasetName(datasetName);
      nextButton.querySelector("span.nav-button-text").innerHTML = "Save and Continue";
      nextButtonSpans.forEach((span) => {
        span.innerHTML = "Save and Continue";
      });
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
        // Delete the manifest file because it throws off the count of files selected
        delete window.datasetStructureJSONObj?.["files"]?.["manifest.xlsx"];
        const datasetType = window.sodaJSONObj["dataset-type"];
        setDatasetType(datasetType);

        if (pageEntityType === "non-data-folders") {
          // Filter files that may have been marked as experimental in a previous step
          setFileVisibilityFilter([], [{ type: "experimental", names: ["experimental"] }]);
        }

        // Make any adjustments to the dataset entity object before setting it in the zustand store
        if (pageEntityType === "experimental") {
          // Filter out files that are selected as belonging to the supporting data folders
          setFileVisibilityFilter(
            [],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }

        if (pageEntityType === "experimental-data-categorization") {
          // Filter out files that are selected as belonging to the supporting data folders
          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }
        if (pageEntityType === "remaining-data-categorization") {
          // Filter out files that are selected as belonging to the supporting data folders
          setFileVisibilityFilter(
            [],
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }

        if (pageEntityType === "sites") {
          const sites = getExistingSites().map((site) => site.id);
          for (const site of sites) {
            addEntityNameToEntityType("sites", site);
          }

          const prevSiteNames = getEntityNamesByEntityType("sites");
          for (const siteName of prevSiteNames) {
            if (!sites.includes(siteName)) {
              removeEntityFromEntityList("sites", siteName);
            }
          }

          const filterList = [
            {
              type: "non-data-folders",
              names: ["Protocol", "Docs", "Code"],
            },
          ];
          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            filterList
          );
        }

        if (pageEntityType === "derived-samples") {
          const derivedSamples = getExistingSamples("derived-from-samples").map(
            (sample) => sample.id
          );

          for (const derivedSample of derivedSamples) {
            addEntityNameToEntityType("derived-samples", derivedSample);
          }

          const prevDerivedSampleNames = getEntityNamesByEntityType("derived-samples");
          for (const derivedSampleName of prevDerivedSampleNames) {
            if (!derivedSamples.includes(derivedSampleName)) {
              removeEntityFromEntityList("derived-samples", derivedSampleName);
            }
          }

          const sites = getExistingSites().map((site) => site.id);
          const samples = getExistingSamples("derived-from-subjects").map((sample) => sample.id);
          const filterList = [
            {
              type: "non-data-folders",
              names: ["Protocol", "Docs", "Code"],
            },
            {
              type: "sites",
              names: sites,
            },
            {
              type: "samples",
              names: samples,
            },
          ];
          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            filterList
          );
        }

        if (pageEntityType === "samples") {
          const samples = getExistingSamples("derived-from-subjects").map((sample) => sample.id);
          for (const sample of samples) {
            addEntityNameToEntityType("samples", sample);
          }
          const prevSampleNames = getEntityNamesByEntityType("samples");
          for (const sampleName of prevSampleNames) {
            if (!samples.includes(sampleName)) {
              removeEntityFromEntityList("samples", sampleName);
            }
          }

          const sites = getExistingSites().map((site) => site.id);
          const derivedSamples = getExistingSamples("derived-from-samples").map(
            (sample) => sample.id
          );
          const filterList = [
            {
              type: "non-data-folders",
              names: ["Protocol", "Docs", "Code"],
            },
            {
              type: "sites",
              names: sites,
            },
            {
              type: "derived-samples",
              names: derivedSamples,
            },
          ];
          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            filterList
          );
        }

        if (pageEntityType === "subjects") {
          const subjects = getExistingSubjects().map((subject) => subject.id);
          for (const subject of subjects) {
            addEntityNameToEntityType("subjects", subject);
          }

          const prevSubjectNames = getEntityNamesByEntityType("subjects");
          for (const subjectName of prevSubjectNames) {
            if (!subjects.includes(subjectName)) {
              removeEntityFromEntityList("subjects", subjectName);
            }
          }

          const sites = getExistingSites().map((site) => site.id);
          const samples = getExistingSamples("derived-from-subjects").map((sample) => sample.id);
          const derivedSamples = getExistingSamples("derived-from-samples").map(
            (sample) => sample.id
          );
          const filterList = [
            {
              type: "non-data-folders",
              names: ["Protocol", "Docs", "Code"],
            },
            {
              type: "sites",
              names: sites,
            },
            {
              type: "samples",
              names: samples,
            },
            {
              type: "derived-samples",
              names: derivedSamples,
            },
          ];

          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            filterList
          );
        }

        if (pageEntityType === "performances") {
          const performanceList = window.sodaJSONObj["dataset_performances"] || [];
          for (const performance of performanceList) {
            addEntityNameToEntityType("performances", performance.performance_id);
          }

          const prevPerformanceNames = getEntityNamesByEntityType("performances");
          for (const performanceName of prevPerformanceNames) {
            const performanceExists = performanceList.some(
              (p) => p.performance_id === performanceName
            );
            if (!performanceExists) {
              removeEntityFromEntityList("performances", performanceName);
            }
          }

          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }

        if (pageEntityType === "modalities") {
          const modalities = window.sodaJSONObj["selected-modalities"] || [];
          for (const modality of modalities) {
            addEntityNameToEntityType("modalities", modality);
          }

          const prevModalityNames = getEntityNamesByEntityType("modalities");
          for (const modalityName of prevModalityNames) {
            if (!modalities.includes(modalityName)) {
              removeEntityFromEntityList("modalities", modalityName);
            }
          }

          setFileVisibilityFilter(
            [],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }
      }
      if (targetPageComponentType === "data-categories-questionnaire-page") {
        // Extract the questionnaire entity type from the data attribute
        const questionnaireEntityType = targetPageDataset.questionnaireEntityType;

        // Restore user selections from JSON
        if (questionnaireEntityType === "experimental-data-categorization") {
          const savedExperimentalCategories =
            window.sodaJSONObj["selected-experimental-data-categories"] || [];
          setSelectedDataCategoriesByEntityType({
            "experimental-data-categorization": savedExperimentalCategories,
          });

          setFileVisibilityFilter(
            [
              {
                type: "experimental",
                names: ["experimental"],
              },
            ],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
            ]
          );
        }

        if (questionnaireEntityType === "remaining-data-categorization") {
          const savedNonExperimentalCategories =
            window.sodaJSONObj["selected-remaining-data-categories"] || [];
          setSelectedDataCategoriesByEntityType({
            "remaining-data-categorization": savedNonExperimentalCategories,
          });

          setFileVisibilityFilter(
            [],
            [
              {
                type: "non-data-folders",
                names: ["Protocol", "Docs", "Code"],
              },
              {
                type: "experimental",
                names: ["experimental"],
              },
            ]
          );
        }
      }

      if (targetPageComponentType === "entity-file-mapping-page") {
        /* ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** */
        setSelectedHierarchyEntity(null);
      }

      if (
        targetPageComponentType === "entity-metadata-page" ||
        targetPageComponentType === "entity-spreadsheet-import-page"
      ) {
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
    // await openPageFreeFormMode(targetPageID);

    await openPageCurationPreparation(targetPageID);
    await openPageDatasetStructure(targetPageID);
    await openPagePrepareMetadata(targetPageID);
    await openPageGenerateDataset(targetPageID);
    await openPageSharedWorkflowSteps(targetPageID);

    const showCorrectFileExplorerByPage = (pageID) => {
      // Get the element for the pageId

      // Special case for data categorization pages
      if (targetPageDataset.componentType === "data-categorization-page") {
        setActiveFileExplorer("entity-data-selector");
      } else {
        setActiveFileExplorer(pageID);
      }
    };
    showCorrectFileExplorerByPage(targetPageID);

    const renderCorrectFileExplorerByPage = (pageID) => {
      const reviewPages = [
        "guided-dataset-structure-and-manifest-review-tab",
        "guided-generate-dataset-locally",
        "guided-dataset-generation-confirmation-tab",
        "guided-dataset-structure-review-tab",
      ];

      // For review-related pages: use standardized structure
      if (reviewPages.includes(pageID)) {
        const standardizedDatasetStructure = createStandardizedDatasetStructure(
          window.datasetStructureJSONObj,
          window.sodaJSONObj["dataset-entity-obj"]
        );

        if (pageID === "guided-dataset-structure-and-manifest-review-tab") {
          // Only show the manifest file for the dataset metadata preview
          // even if there are other metadata files like sites or performances
          setDatasetMetadataToPreview(["manifest.xlsx"]);
        } else {
          setDatasetMetadataToPreview(Object.keys(window.sodaJSONObj["dataset_metadata"] || {}));
        }

        setPathToRender([]);
        useGlobalStore.setState({
          datasetStructureJSONObj: standardizedDatasetStructure,
          calculateEntities: false,
        });
        reRenderTreeView(true);
        return;
      } else {
        // Clear the dataset metadata preview if not on the generation page
        setDatasetMetadataToPreview(null);
      }

      // For categorization or unstructured import pages: use raw structure
      if (
        targetPageDataset.componentType === "data-categorization-page" ||
        targetPageDataset.componentType === "data-categories-questionnaire-page" ||
        pageID === "guided-unstructured-data-import-tab"
      ) {
        setPathToRender(["data"]);

        useGlobalStore.setState({
          datasetStructureJSONObj: window.datasetStructureJSONObj,
          calculateEntities: true,
        });
        reRenderTreeView(true);
      }
    };
    renderCorrectFileExplorerByPage(targetPageID);
    console.log("window.CURRENT_PAGE: ", window.CURRENT_PAGE);

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveProgressionTab(targetPageID);

    renderSideBar(targetPageID);
    const allParentTabs = document.querySelectorAll(".guided--parent-tab");
    allParentTabs.forEach((tab) => {
      if (tab.id !== targetPageParentTab.id) {
        tab.classList.add("hidden");
      } else {
        tab.classList.remove("hidden");
      }
    });

    window.CURRENT_PAGE.classList.add("hidden");
    window.CURRENT_PAGE = targetPage;
    window.CURRENT_PAGE.classList.remove("hidden");
    //smooth scroll to top of guidedBody
    document.getElementById("guided-body").scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Start any animations that need to be started
    startOrStopAnimationsInContainer(targetPageID, "start");

    hideAndShowElementsDependingOnStartType(targetPage);

    // Set the last opened page and save it
    window.sodaJSONObj["page-before-exit"] = targetPageID;
    await guidedSaveProgress();
  } catch (error) {
    console.error("Error opening page:", targetPageID);
    console.error("Error: ", error);
    guidedSetNavLoadingState(false);

    // Check if user should be redirected to first page due to file purging
    if (window.sodaJSONObj?.["redirect-to-first-page-after-error"]) {
      // Clear the flag
      delete window.sodaJSONObj["redirect-to-first-page-after-error"];
      await returnUserToFirstPage();
      guidedSetNavLoadingState(false);
      return;
    }

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

    throw error;
  }

  guidedSetNavLoadingState(false);
};
