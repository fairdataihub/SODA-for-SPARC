import { openPageCurationPreparation } from "./curationPreparation/openPage.js";
import {
  resetGuidedRadioButtons,
  updateGuidedRadioButtonsFromJSON,
} from "./buttons/radioButtons.js";
import { externallySetSearchFilterValue } from "../../stores/slices/datasetTreeViewSlice.js";
import { guidedSetNavLoadingState } from "./pageNavigation/pageLoading";
import Swal from "sweetalert2";
import { userErrorMessage } from "../others/http-error-handler/error-handler.js";
import { setSelectedEntities } from "../../stores/slices/datasetContentSelectorSlice.js";

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

export const getNonSkippedGuidedModePages = (parentElementToGetChildrenPagesFrom) => {
  let allChildPages = Array.from(
    parentElementToGetChildrenPagesFrom.querySelectorAll(".guided--page")
  );
  const nonSkippedChildPages = allChildPages.filter((page) => {
    return page.dataset.skipPage != "true";
  });

  return nonSkippedChildPages;
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

const guidedLockSideBar = (boolShowNavBar) => {
  const sidebar = document.getElementById("sidebarCollapse");
  const guidedModeSection = document.getElementById("guided_mode-section");
  const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
  const guidedNav = document.getElementById("guided-nav");

  if (!sidebar.classList.contains("active")) {
    sidebar.click();
  }

  sidebar.disabled = true;
  guidedModeSection.style.marginLeft = "-70px";

  if (boolShowNavBar) {
    guidedDatsetTab.style.marginLeft = "215px";
    guidedNav.style.display = "flex";
  } else {
    guidedDatsetTab.style.marginLeft = "0px";
    guidedNav.style.display = "none";
  }
};

const hideAndShowElementsDependingOnStartType = (pageElement) => {
  const startingFromPennsieve = window.sodaJSONObj?.["starting-point"]?.["type"] === "bf";
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

// const renderSideBar = (activePage) => {
//   const guidedNavItemsContainer = document.getElementById("guided-nav-items");
//   const guidedPageNavigationHeader = document.getElementById("guided-page-navigation-header");

//   if (activePage === "guided-dataset-dissemination-tab") {
//     //Hide the side bar navigawtion and navigation header
//     guidedPageNavigationHeader.classList.add("hidden");
//     guidedNavItemsContainer.innerHTML = ``;
//     return;
//   }
//   //Show the page navigation header if it had been previously hidden
//   guidedPageNavigationHeader.classList.remove("hidden");

//   const completedTabs = window.sodaJSONObj["completed-tabs"];

//   const pageStructureObject = {};

//   const highLevelStepElements = Array.from(document.querySelectorAll(".guided--parent-tab"));

//   for (const element of highLevelStepElements) {
//     const highLevelStepName = element.getAttribute("data-parent-tab-name");
//     pageStructureObject[highLevelStepName] = {};

//     const notSkippedPages = getNonSkippedGuidedModePages(element);

//     for (const page of notSkippedPages) {
//       const pageName = page.getAttribute("data-page-name");
//       const pageID = page.getAttribute("id");
//       pageStructureObject[highLevelStepName][pageID] = {
//         pageName: pageName,
//         completed: completedTabs.includes(pageID),
//       };
//     }
//   }
//   let navBarHTML = "";
//   for (const [highLevelStepName, highLevelStepObject] of Object.entries(pageStructureObject)) {
//     // Add the high level drop down to the nav bar
//     const dropdDown = `
//         <div class="guided--nav-bar-dropdown">
//           <p class="help-text mb-0">
//             ${highLevelStepName}
//           </p>
//           <i class="fas fa-chevron-right"></i>
//         </div>
//       `;

//     // Add the high level drop down's children links to the nav bar
//     let dropDownContent = ``;
//     for (const [pageID, pageObject] of Object.entries(highLevelStepObject)) {
//       //add but keep hidden for now!!!!!!!!!!!!!!!!!!
//       dropDownContent += `
//           <div
//             class="
//               guided--nav-bar-section-page
//               hidden
//               ${pageObject.completed ? " completed" : " not-completed"}
//               ${pageID === activePage ? "active" : ""}"
//             data-target-page="${pageID}"
//           >
//             <div class="guided--nav-bar-section-page-title">
//               ${pageObject.pageName}
//             </div>
//           </div>
//         `;
//     }

//     // Add each section to the nav bar element
//     const dropDownContainer = `
//           <div class="guided--nav-bar-section">
//             ${dropdDown}
//             ${dropDownContent}
//           </div>
//         `;
//     navBarHTML += dropDownContainer;
//   }
//   guidedNavItemsContainer.innerHTML = navBarHTML;

//   const guidedNavBarDropdowns = Array.from(document.querySelectorAll(".guided--nav-bar-dropdown"));
//   for (const guidedNavBarDropdown of guidedNavBarDropdowns) {
//     guidedNavBarDropdown.addEventListener("click", () => {
//       //remove hidden from child elements with guided--nav-bar-section-page class
//       const guidedNavBarSectionPage = guidedNavBarDropdown.parentElement.querySelectorAll(
//         ".guided--nav-bar-section-page"
//       );
//       for (const guidedNavBarSectionPageElement of guidedNavBarSectionPage) {
//         guidedNavBarSectionPageElement.classList.toggle("hidden");
//       }
//       //toggle the chevron
//       const chevron = guidedNavBarDropdown.querySelector("i");
//       chevron.classList.toggle("fa-chevron-right");
//       chevron.classList.toggle("fa-chevron-down");
//     });

//     //click the dropdown if it has a child element with data-target-page that matches the active page
//     if (guidedNavBarDropdown.parentElement.querySelector(`[data-target-page="${activePage}"]`)) {
//       guidedNavBarDropdown.click();
//     }
//   }

//   const guidedNavBarSectionPages = Array.from(
//     document.querySelectorAll(".guided--nav-bar-section-page")
//   );
//   for (const guidedNavBarSectionPage of guidedNavBarSectionPages) {
//     guidedNavBarSectionPage.addEventListener("click", async () => {
//       const currentPageUserIsLeaving = window.CURRENT_PAGE.id;
//       const pageToNavigateTo = guidedNavBarSectionPage.getAttribute("data-target-page");
//       const pageToNaviatetoName = document
//         .getElementById(pageToNavigateTo)
//         .getAttribute("data-page-name");

//       // Do nothing if the user clicks the tab of the page they are currently on
//       if (currentPageUserIsLeaving === pageToNavigateTo) {
//         return;
//       }

//       try {
//         await savePageChanges(currentPageUserIsLeaving);
//         const allNonSkippedPages = getNonSkippedGuidedModePages(document).map(
//           (element) => element.id
//         );
//         // Get the pages in the allNonSkippedPages array that cone after the page the user is leaving
//         // and before the page the user is going to
//         const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
//           allNonSkippedPages.indexOf(currentPageUserIsLeaving),
//           allNonSkippedPages.indexOf(pageToNavigateTo)
//         );

//         //If the user is skipping forward with the nav bar, pages between current page and target page
//         //Need to be validated. If they're going backwards, the for loop below will not be ran.
//         for (const page of pagesBetweenCurrentAndTargetPage) {
//           try {
//             await checkIfPageIsValid(page);
//           } catch (error) {
//             const pageWithErrorName = document.getElementById(page).getAttribute("data-page-name");
//             await window.openPage(page);
//             await Swal.fire({
//               title: `An error occured on an intermediate page: ${pageWithErrorName}`,
//               html: `Please address the issues before continuing to ${pageToNaviatetoName}:
//                     <br />
//                     <br />
//                     <ul>
//                       ${error
//                         .map((error) => `<li class="text-left">${error.message}</li>`)
//                         .join("")}
//                     </ul>
//                   `,
//               icon: "info",
//               confirmButtonText: "Fix the errors on this page",
//               focusConfirm: true,
//               heightAuto: false,
//               backdrop: "rgba(0,0,0, 0.4)",
//               width: 700,
//             });
//             return;
//           }
//         }

//         //All pages have been validated. Open the target page.
//         await window.openPage(pageToNavigateTo);
//       } catch (error) {
//         const pageWithErrorName = window.CURRENT_PAGE.dataset.pageName;
//         const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
//           title: "The current page was not able to be saved",
//           html: `The following error${
//             error.length > 1 ? "s" : ""
//           } occurred when attempting to save the ${pageWithErrorName} page:
//                 <br />
//                 <br />
//                 <ul>
//                   ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
//                 </ul>
//                 <br />
//                 Would you like to continue without saving the changes to the current page?`,
//           icon: "info",
//           showCancelButton: true,
//           confirmButtonText: "Yes, continue without saving",
//           cancelButtonText: "No, I would like to address the errors",
//           confirmButtonWidth: 255,
//           cancelButtonWidth: 255,
//           focusCancel: true,
//           heightAuto: false,
//           backdrop: "rgba(0,0,0, 0.4)",
//           width: 700,
//         });
//         if (continueWithoutSavingCurrPageChanges) {
//           await window.openPage(pageToNavigateTo);
//         }
//       }
//     });
//   }

//   const nextPagetoComplete = guidedNavItemsContainer.querySelector(
//     ".guided--nav-bar-section-page.not-completed"
//   );
//   if (nextPagetoComplete) {
//     nextPagetoComplete.classList.remove("not-completed");
//     //Add pulse blue animation for 3 seconds
//     nextPagetoComplete.style.borderLeft = "3px solid #007bff";
//     nextPagetoComplete.style.animation = "pulse-blue 3s Infinity";
//   }
// };

// //Main function that prepares individual pages based on the state of the window.sodaJSONObj
// //The general flow is to check if there is values for the keys relevant to the page
// //If the keys exist, extract the data from the window.sodaJSONObj and populate the page
// //If the keys do not exist, reset the page (inputs, tables etc.) to the default state
export const openPage = async (targetPageID) => {
  console.log("Opening page high level", targetPageID);
  //NOTE: 2 Bottom back buttons (one handles sub pages, and the other handles main pages)
  //Back buttons should be disabled and the function setLoading should be (set as false?)

  // This function is used by both the navigation bar and the side buttons,
  // and whenever it is being called, we know that the user is trying to navigate to a new page
  // this function is async because we sometimes need to fetch data before the page is ready to be opened

  let itemsContainer = document.getElementById("items-guided-container");
  if (itemsContainer.classList.contains("border-styling")) {
    itemsContainer.classList.remove("border-styling");
  }
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

    if (
      targetPageID === "guided-dataset-generation-tab" ||
      targetPageID === "guided-dataset-dissemination-tab"
    ) {
      $("#guided-next-button").css("visibility", "hidden");
    } else {
      $("#guided-next-button").css("visibility", "visible");
    }

    if (
      targetPageID === "guided-dataset-dissemination-tab" ||
      targetPageID === "guided-dataset-generation-tab"
    ) {
      $("#guided-back-button").css("visibility", "hidden");
    } else {
      $("#guided-back-button").css("visibility", "visible");
    }

    handleNextButtonVisibility(targetPageID);
    handleBackButtonVisibility(targetPageID);
    handleGuidedValidationState(targetPageID);

    // Hide the Header div on the resume existing dataset page
    const guidedProgressContainer = document.getElementById("guided-header-div");

    if (targetPageID === "guided-select-starting-point-tab") {
      guidedProgressContainer.classList.add("hidden");
    } else {
      guidedProgressContainer.classList.remove("hidden");
    }

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

    // if (targetPageDataset.componentType) {
    //     const targetPageComponentType = targetPageDataset.componentType;
    //     console.log("targetPageDataset", targetPageDataset);
    //     if (targetPageComponentType === "entity-management-page") {
    //         // Set the dataset entity object to the saved dataset entity object from the JSON
    //         const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
    //         setDatasetEntityObj(savedDatasetEntityObj);
    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
    //     }
    //     if (targetPageComponentType === "entity-selection-page") {
    //         const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
    //         setDatasetEntityObj(savedDatasetEntityObj);

    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
    //         /*
    //         if (!window.sodaJSONObj["completed-tabs"].includes(targetPageID)) {
    //           console.log("Calling autoSelectDatasetFoldersAndFilesForEnteredEntityIds");
    //           autoSelectDatasetFoldersAndFilesForEnteredEntityIds(
    //             window.datasetStructureJSONObj["folders"]["primary"],
    //             targetPageDataset.entityType,
    //             targetPageDataset.entityTypeStringSingular
    //           );
    //         }
    //         */
    //     }
    // }

    if (targetPageID === "guided-select-starting-point-tab") {
      // Hide the pennsieve dataset import progress circle
      const importProgressCircle = document.querySelector(
        "#guided_loading_pennsieve_dataset-organize"
      );
      importProgressCircle.classList.add("hidden");
    }

    if (targetPageID === "guided-prepare-dataset-structure-tab") {
      setSelectedEntities(window.sodaJSONObj["selected-entities"] || []);
      /*
        // If the user has already added subjects, disallow them from selecting no (they have to go to the subject
        // page to delete subjects but this would be a very strange case anyways)
        const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
        const subjects = [...subjectsInPools, ...subjectsOutsidePools];
        const subjectQuerySectioin = document.getElementById("guided-section-subject-yes-no");
        const infoText = document.getElementById("subject-deletion-block-text");
        if (subjects.length > 0) {
          subjectQuerySectioin.classList.add("section-disabled");
          infoText.classList.remove("hidden");
        } else {
          subjectQuerySectioin.classList.remove("section-disabled");
          infoText.classList.add("hidden");
        }*/
    }

    await openPageCurationPreparation(targetPageID);

    // if (targetPageID === "guided-prepare-helpers-tab") {
    //   const sparcFundedHelperSections = document
    //     .getElementById("guided-prepare-helpers-tab")
    //     .querySelectorAll(".sparc-funded-only");

    //   if (datasetIsSparcFunded()) {
    //     // If the dataset is SPARC funded, then show the SPARC funded helper sections
    //     sparcFundedHelperSections.forEach((element) => {
    //       element.classList.remove("hidden");
    //     });
    //   } else {
    //     // If the dataset is not SPARC funded, then hide the SPARC funded helper sections
    //     sparcFundedHelperSections.forEach((element) => {
    //       element.classList.add("hidden");
    //     });
    //   }
    // }

    //     if (targetPageID === "guided-dataset-structure-intro-tab") {
    //         // Handle whether or not the spreadsheet importation page should be skipped
    //         // Note: this is done here to centralize the logic for skipping the page
    //         // The page is unskipped only if the user has not added any subjects,
    //         // indicated that they will be adding subjects, and the user is not starting from Pennsieve
    //         if (
    //             window.getExistingSubjectNames().length === 0 &&
    //             window.sodaJSONObj["starting-point"]["type"] != "bf" &&
    //             window.sodaJSONObj["button-config"]["dataset-contains-subjects"] === "yes"
    //         ) {
    //             guidedUnSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    //         } else {
    //             guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    //         }
    //     }

    //     if (targetPageID === "guided-subject-structure-spreadsheet-importation-tab") {
    //         const savedSpreadSheetPath = window.sodaJSONObj["dataset-structure-spreadsheet-path"];
    //         setUiBasedOnSavedDatasetStructurePath(savedSpreadSheetPath);
    //     }

    //     if (targetPageID === "guided-subjects-addition-tab") {
    //         // skip the spreadsheet importation page so the user can't go back to it
    //         guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
    //         renderSubjectsTable();
    //     }

    //     if (targetPageID === "guided-samples-addition-tab") {
    //         renderSamplesTable();
    //     }

    //     if (targetPageID === "guided-unstructured-data-import-tab") {
    //         guidedUpdateFolderStructureUI("data/");
    //     }

    //     if (targetPageID === "guided-denote-derivative-data-tab") {
    //         // Set the folder structure as the primary folder since the user is
    //         // denoting data as derivative which will be moved to the derivative folder
    //         guidedUpdateFolderStructureUI("data/");
    //     }

    //     if (targetPageID === "guided-code-folder-tab") {
    //         guidedUpdateFolderStructureUI("code/");
    //     }

    //     if (targetPageID === "guided-protocol-folder-tab") {
    //         guidedUpdateFolderStructureUI("protocol/");
    //     }

    //     if (targetPageID === "guided-docs-folder-tab") {
    //         guidedUpdateFolderStructureUI("docs/");
    //     }
    //     if (targetPageID === "guided-aux-folder-tab") {
    //         guidedUpdateFolderStructureUI("aux/");
    //     }

    //     if (targetPageID === "guided-dataset-structure-review-tab") {
    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, []);
    //         /*
    //         // Remove empty guided high-level folders (primary, source, derivative)
    //         guidedHighLevelFolders.forEach((folder) => {
    //           const rootFolderPath = window.datasetStructureJSONObj?.folders?.[folder];
    //           if (rootFolderPath && folderIsEmpty(rootFolderPath)) {
    //             delete window.datasetStructureJSONObj?.folders?.[folder];
    //           }
    //         });

    //         guidedShowTreePreview(
    //           window.sodaJSONObj?.["digital-metadata"]?.name,
    //           "guided-folder-structure-review"
    //         );*/
    //     }

    //     if (targetPageID === "guided-manifest-file-generation-tab") {
    //         // Delete existing manifest files in the dataset structure
    //         Object.values(window.datasetStructureJSONObj.folders).forEach((folder) => {
    //             delete folder.files["manifest.xlsx"];
    //         });

    //         /**
    //          * Purge non-existent files from the dataset structure.
    //          */
    //         const purgeNonExistentFiles = async (datasetStructure) => {
    //             const nonExistentFiles = [];

    //             const collectNonExistentFiles = async (currentStructure, currentPath = "") => {
    //                 for (const [fileName, fileData] of Object.entries(currentStructure.files || {})) {
    //                     if (fileData.type === "local" && !(await window.fs.existsSync(fileData.path))) {
    //                         nonExistentFiles.push(`${currentPath}${fileName}`);
    //                     }
    //                 }
    //                 await Promise.all(
    //                     Object.entries(currentStructure.folders || {}).map(([folderName, folder]) =>
    //                         collectNonExistentFiles(folder, `${currentPath}${folderName}/`)
    //                     )
    //                 );
    //             };

    //             /**
    //              * Recursively deletes references to non-existent files from the dataset structure.
    //              * @param {Object} currentStructure - The current level of the dataset structure.
    //              * @param {string} currentPath - The relative path to the current structure.
    //              */
    //             const deleteNonExistentFiles = (currentStructure, currentPath = "") => {
    //                 const files = currentStructure?.files || {};
    //                 for (const fileName in files) {
    //                     const fileData = files[fileName];
    //                     if (fileData.type === "local") {
    //                         const filePath = fileData.path;
    //                         const isNonExistent = !window.fs.existsSync(filePath);

    //                         if (isNonExistent) {
    //                             window.log.info(
    //                                 `Deleting reference to non-existent file: ${currentPath}${fileName}`
    //                             );
    //                             delete files[fileName];
    //                         }
    //                     }
    //                 }
    //                 Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) =>
    //                     deleteNonExistentFiles(folder)
    //                 );
    //             };

    //             await collectNonExistentFiles(datasetStructure);
    //             if (nonExistentFiles.length > 0) {
    //                 await swalFileListSingleAction(
    //                     nonExistentFiles,
    //                     "Files imported into SODA that are no longer on your computer were detected",
    //                     "These files will be disregarded and not uploaded to Pennsieve.",
    //                     ""
    //                 );
    //                 deleteNonExistentFiles(datasetStructure);
    //             }
    //         };

    //         await purgeNonExistentFiles(window.datasetStructureJSONObj);

    //         /**
    //          * Recursively delete empty folders from the dataset structure.
    //          */
    //         const deleteEmptyFolders = (currentStructure) => {
    //             Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) => {
    //                 deleteEmptyFolders(folder);
    //                 if (
    //                     !Object.keys(folder.files || {}).length &&
    //                     !Object.keys(folder.folders || {}).length
    //                 ) {
    //                     delete currentStructure.folders[folderName];
    //                 }
    //             });
    //         };

    //         deleteEmptyFolders(window.datasetStructureJSONObj);

    //         if (!Object.keys(window.datasetStructureJSONObj.folders).length) {
    //             await swalShowInfo(
    //                 "No files or folders are currently imported into SODA",
    //                 "You will be returned to the beginning of the dataset structuring section to import your data."
    //             );
    //             await window.openPage("guided-dataset-structure-intro-tab");
    //             return;
    //         }

    //         document.getElementById("guided-container-manifest-file-cards").innerHTML = `
    //   <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    //   Updating your dataset's manifest files...
    // `;

    //         const sodaCopy = {
    //             ...window.sodaJSONObj,
    //             "metadata-files": {},
    //             "dataset-structure": window.datasetStructureJSONObj,
    //         };
    //         delete sodaCopy["generate-dataset"];

    //         const response = (
    //             await client.post(
    //                 "/curate_datasets/clean-dataset",
    //                 { soda_json_structure: sodaCopy },
    //                 { timeout: 0 }
    //             )
    //         ).data.soda_json_structure;
    //         const manifestRes = (
    //             await client.post(
    //                 "/curate_datasets/generate_manifest_file_data",
    //                 { dataset_structure_obj: response["dataset-structure"] },
    //                 { timeout: 0 }
    //             )
    //         ).data;

    //         const newManifestData = { headers: manifestRes.shift(), data: manifestRes };
    //         const entityColumnIndex = newManifestData.headers.indexOf("entity");

    //         /**
    //          * Sort manifest data rows based on predefined folder order.
    //          */
    //         const sortManifestDataRows = (rows) => {
    //             const folderOrder = {
    //                 data: 0,
    //                 primary: 1,
    //                 source: 2,
    //                 derivative: 3,
    //                 code: 4,
    //                 protocol: 5,
    //                 docs: 6,
    //             };

    //             return rows.sort((rowA, rowB) => {
    //                 const pathA = rowA[0] || "";
    //                 const pathB = rowB[0] || "";

    //                 const getTopLevelFolder = (path) => (path.includes("/") ? path.split("/")[0] : path);

    //                 const folderA = getTopLevelFolder(pathA);
    //                 const folderB = getTopLevelFolder(pathB);

    //                 const priorityA = folderOrder[folderA] ?? Infinity;
    //                 const priorityB = folderOrder[folderB] ?? Infinity;

    //                 if (priorityA !== priorityB) {
    //                     return priorityA - priorityB;
    //                 }

    //                 // Ensure 'data' always comes before lexicographical sorting
    //                 if (folderA === "data" && folderB !== "data") return -1;
    //                 if (folderB === "data" && folderA !== "data") return 1;

    //                 return pathA.localeCompare(pathB);
    //             });
    //         };

    //         console.log("Before sort: ", newManifestData.data);

    //         newManifestData.data = sortManifestDataRows(newManifestData.data);

    //         const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

    //         const updateEntityColumn = (manifestDataRows, datasetEntityObj) => {
    //             manifestDataRows.forEach((row) => {
    //                 const path = row[0]; // Path is in the first column
    //                 let entityList = [];

    //                 // Check for subjects
    //                 for (const [entity, paths] of Object.entries(datasetEntityObj.subjects || {})) {
    //                     if (paths.includes(path)) {
    //                         console.log("Subject found: ", entity);
    //                         entityList.push(entity);
    //                         break; // Stop checking subjects after the first match
    //                     }
    //                 }

    //                 // Check for samples
    //                 for (const [entity, paths] of Object.entries(datasetEntityObj.samples || {})) {
    //                     if (paths.includes(path)) {
    //                         entityList.push(entity);
    //                         break; // Stop checking samples after the first match
    //                     }
    //                 }

    //                 // Check for performances
    //                 for (const [entity, paths] of Object.entries(datasetEntityObj.performances || {})) {
    //                     if (paths.includes(path)) {
    //                         entityList.push(entity);
    //                         break; // Stop checking performances after the first match
    //                     }
    //                 }

    //                 // Update the entity column (index from headers)
    //                 row[entityColumnIndex] = entityList.join(" ");
    //             });

    //             return manifestDataRows; // Return updated data
    //         };

    //         const updateModalitiesColumn = (manifestDataRows, datasetEntityObj) => {
    //             const modalitiesColumnIndex = newManifestData.headers.indexOf("data modality");
    //             console.log("modalitiesColumnIndex", modalitiesColumnIndex);

    //             manifestDataRows.forEach((row) => {
    //                 const path = row[0]; // Path is in the first column
    //                 let modalitiesList = [];

    //                 // Check for modalities
    //                 for (const [modality, paths] of Object.entries(datasetEntityObj.modalities || {})) {
    //                     if (paths.includes(path)) {
    //                         modalitiesList.push(modality);
    //                     }
    //                 }

    //                 // Update the modalities column (index from headers)
    //                 row[modalitiesColumnIndex] = modalitiesList.join(" ");
    //             });

    //             return manifestDataRows; // Return updated data
    //         };

    //         // Apply the function
    //         updateEntityColumn(newManifestData.data, datasetEntityObj);
    //         updateModalitiesColumn(newManifestData.data, datasetEntityObj);

    //         console.log("After sort: ", newManifestData.data);
    //         window.sodaJSONObj["guided-manifest-file-data"] = window.sodaJSONObj[
    //             "guided-manifest-file-data"
    //         ]
    //             ? window.diffCheckManifestFiles(
    //                 newManifestData,
    //                 window.sodaJSONObj["guided-manifest-file-data"]
    //             )
    //             : newManifestData;

    //         renderManifestCards();
    //     }

    //     if (targetPageID === "guided-manifest-subject-entity-selector-tab") {
    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    //         setEntityType("subject-related-folders-and-files");
    //         setEntityListForEntityType(
    //             "subject-related-folders-and-files",
    //             window.sodaJSONObj["subject-related-folders-and-files"] || {}
    //         );
    //         setActiveEntity(null);
    //     }
    //     if (targetPageID === "guided-manifest-sample-entity-selector-tab") {
    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    //         setEntityType("sample-related-folders-and-files");
    //         setEntityListForEntityType(
    //             "sample-related-folders-and-files",
    //             window.sodaJSONObj["sample-related-folders-and-files"] || {}
    //         );
    //         setActiveEntity(null);
    //     }
    //     if (targetPageID === "guided-manifest-performance-entity-selector-tab") {
    //         setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
    //         setEntityType("performance-related-folders-and-files");
    //         setEntityListForEntityType(
    //             "performance-related-folders-and-files",
    //             window.sodaJSONObj["performance-related-folders-and-files"] || {}
    //         );
    //         setActiveEntity(null);
    //     }
    //     if (targetPageID === "guided-source-derivative-folders-and-files-selector-tab") {
    //         addEntityToEntityList("source-derivative-folders-and-files", "source");
    //         addEntityToEntityList("source-derivative-folders-and-files", "derivative");
    //         setActiveEntity(null);
    //         console.log("datasetEntityObj", useGlobalStore.getState().datasetEntityObj);
    //     }
    //     if (targetPageID === "guided-modalities-selection-tab") {
    //         addEntityToEntityList("modalities", "microscopy");
    //         addEntityToEntityList("modalities", "electrophysiology");
    //         setActiveEntity(null);
    //         console.log("datasetEntityObj", useGlobalStore.getState().datasetEntityObj);
    //     }

    //     if (targetPageID === "guided-create-submission-metadata-tab") {
    //         if (pageNeedsUpdateFromPennsieve(targetPageID)) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 const submissionMetadataRes = await client.get(`/prepare_metadata/import_metadata_file`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                         file_type: "submission.xlsx",
    //                     },
    //                 });

    //                 const submissionData = submissionMetadataRes.data;

    //                 window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
    //                     submissionData["Award number"];
    //                 window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] =
    //                     submissionData["Milestone achieved"];
    //                 window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
    //                     submissionData["Milestone completion date"];

    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, targetPageID);
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
    //             }
    //         }

    //         //Reset the manual submission metadata UI
    //         const sparcAwardInputManual = document.getElementById("guided-submission-sparc-award-manual");
    //         sparcAwardInputManual.value = "";
    //         window.guidedSubmissionTagsTagifyManual.removeAllTags();
    //         const completionDateInputManual = document.getElementById(
    //             "guided-submission-completion-date-manual"
    //         );
    //         completionDateInputManual.innerHTML = `
    //         <option value="">Select a completion date</option>
    //         <option value="Enter my own date">Enter my own date</option>
    //         <option value="N/A">N/A</option>
    //       `;
    //         completionDateInputManual.value = "";

    //         const sectionThatAsksIfDataDeliverablesReady = document.getElementById(
    //             "guided-section-user-has-data-deliverables-question"
    //         );
    //         const sectionSubmissionMetadataInputs = document.getElementById(
    //             "guided-section-submission-metadata-inputs"
    //         );

    //         //Update the UI if their respective keys exist in the window.sodaJSONObj
    //         const sparcAward = window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    //         if (sparcAward) {
    //             sparcAwardInputManual.value = sparcAward;
    //         }
    //         const milestones =
    //             window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
    //         if (milestones) {
    //             window.guidedSubmissionTagsTagifyManual.addTags(milestones);
    //         }
    //         const completionDate =
    //             window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];

    //         if (completionDate && completionDate != "") {
    //             completionDateInputManual.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
    //             //select the completion date that was added
    //             completionDateInputManual.value = completionDate;
    //         }

    //         const setFundingConsortium =
    //             window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];

    //         const topLevelDDDInstructionsText = document.getElementById(
    //             "guided-submission-metadata-ddd-import-instructions"
    //         );
    //         if (setFundingConsortium != "SPARC") {
    //             topLevelDDDInstructionsText.classList.add("hidden");
    //             // Hide the ddd import section since the submission is not SPARC funded
    //             sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
    //             // Show the submission metadata inputs section so the user can enter the metadata manually
    //             sectionSubmissionMetadataInputs.classList.remove("hidden");

    //             // Show the instructions for non-SPARC funded submissions
    //             window.showElementsWithClass("guided-non-sparc-funding-consortium-instructions");
    //         } else {
    //             topLevelDDDInstructionsText.classList.remove("hidden");

    //             // If the submission is SPARC, but they have already added their sparc award and milestones
    //             // then hide the section that asks if they have data deliverables ready and show the
    //             // submission metadata inputs section
    //             if (sparcAward && milestones) {
    //                 sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
    //                 sectionSubmissionMetadataInputs.classList.remove("hidden");
    //             } else {
    //                 // If the submission is SPARC and they have not added their sparc award and milestones
    //                 // then show the section that asks if they have data deliverables ready and hide the
    //                 // submission metadata inputs section
    //                 sectionThatAsksIfDataDeliverablesReady.classList.remove("hidden");
    //                 sectionSubmissionMetadataInputs.classList.add("hidden");
    //                 // Load the lottie animation where the user can drag and drop the data deliverable document
    //                 const dataDeliverableLottieContainer = document.getElementById(
    //                     "data-deliverable-lottie-container"
    //                 );
    //                 dataDeliverableLottieContainer.innerHTML = "";
    //                 lottie.loadAnimation({
    //                     container: dataDeliverableLottieContainer,
    //                     animationData: dragDrop,
    //                     renderer: "svg",
    //                     loop: true,
    //                     autoplay: true,
    //                 });
    //             }

    //             // Hide the instructions for non-SPARC funded submissions
    //             window.hideElementsWithClass("guided-non-sparc-funding-consortium-instructions");
    //         }
    //     }

    //     if (targetPageID === "guided-contributors-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-contributors-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                         file_type: "dataset_description.xlsx",
    //                     },
    //                 });
    //                 let contributorData = metadata_import.data["Contributor information"];
    //                 //Filter out returned rows that only contain empty srings (first name is checked)
    //                 const currentContributorFullNames = getContributorFullNames();
    //                 contributorData = contributorData = contributorData.filter((row) => {
    //                     return row[0] !== "" && !currentContributorFullNames.includes(row[0]);
    //                 });

    //                 // Loop through the contributorData array besides the first row (which is the header)
    //                 for (let i = 1; i < contributorData.length; i++) {
    //                     const contributors = contributorData[i];
    //                     // split the name into first and last name with the first name being the first element and last name being the rest of the elements
    //                     const contributorFullName = contributors[0];
    //                     const contributorID = contributors[1];
    //                     const contributorAffiliation = contributors[2].split(", ");
    //                     const contributorRoles = contributors[3].split(", ");
    //                     try {
    //                         addContributor(
    //                             contributorFullName,
    //                             contributorID,
    //                             contributorAffiliation,
    //                             contributorRoles
    //                         );
    //                     } catch (error) {
    //                         console.log(error);
    //                     }
    //                 }
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-contributors-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
    //             }
    //         }

    //         renderDatasetDescriptionContributorsTable();
    //     }

    //     if (targetPageID === "guided-protocols-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-protocols-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                         file_type: "dataset_description.xlsx",
    //                     },
    //                 });
    //                 let relatedInformationData = metadata_import.data["Related information"];
    //                 const protocolsFromPennsieve = relatedInformationData.filter(
    //                     (relatedInformationArray) => {
    //                         return (
    //                             relatedInformationArray[1] === "IsProtocolFor" && relatedInformationArray[2] !== ""
    //                         );
    //                     }
    //                 );

    //                 for (const protocol of protocolsFromPennsieve) {
    //                     const protocolLink = protocol[2];
    //                     const protocolDescription = protocol[0];
    //                     const protocolType = protocol[3];
    //                     try {
    //                         addGuidedProtocol(protocolLink, protocolDescription, protocolType);
    //                     } catch (error) {
    //                         console.log(error);
    //                     }
    //                 }
    //                 // Click the yes protocol button if protocols were imported
    //                 if (protocolsFromPennsieve.length > 0) {
    //                     document.getElementById("guided-button-user-has-protocols").click();
    //                 }
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-protocols-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
    //             }
    //         }
    //         renderProtocolsTable();
    //     }

    //     if (targetPageID === "guided-create-description-metadata-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-create-description-metadata-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["bf-dataset-selected"]["dataset-name"],
    //                         file_type: "dataset_description.xlsx",
    //                     },
    //                 });
    //                 // guidedLoadDescriptionDatasetInformation
    //                 let basicInformation = metadata_import.data["Basic information"];

    //                 // First try to get the keywords from the imported dataset description metadata
    //                 if (basicInformation[3][0] === "Keywords") {
    //                     const studyKeywords = basicInformation[3].slice(1).filter((keyword) => keyword !== "");

    //                     // If more than 1 keyword is found, add store them to be loaded into the UI
    //                     // Otherwise, use the tags on Pennsieve
    //                     if (studyKeywords.length != 0) {
    //                         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"][
    //                             "keywords"
    //                         ] = studyKeywords;
    //                     }
    //                 }

    //                 // guidedLoadDescriptionStudyInformation
    //                 let studyInformation = metadata_import.data["Study information"];

    //                 // Declare an object and add all of the study information to it
    //                 const studyInformationObject = {};
    //                 for (let i = 0; i < studyInformation.length; i++) {
    //                     const studyInformationArray = studyInformation[i];
    //                     // Lowercase the key (e.g. Study approach -> study approach)
    //                     const studyInformationKey = studyInformationArray[0].toLowerCase();
    //                     // The value is the second element in the array
    //                     const studyInformationValue = studyInformationArray[1];

    //                     studyInformationObject[studyInformationKey] = studyInformationValue;
    //                 }

    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] =
    //                     studyInformationObject;

    //                 // guidedLoadDescriptionStudyDesign
    //                 let awardInformation = metadata_import.data["Award information"];
    //                 if (
    //                     awardInformation[0][0] === "Funding" &&
    //                     awardInformation[1][0] === "Acknowledgments"
    //                 ) {
    //                     const studyFunding = awardInformation[1].slice(1).filter((funding) => funding !== "");
    //                     const studyAcknowledgements = awardInformation[1]
    //                         .slice(1)
    //                         .filter((acknowledgement) => acknowledgement !== "");

    //                     window.sodaJSONObj["dataset-metadata"]["description-metadata"][
    //                         "contributor-information"
    //                     ] = {
    //                         funding: studyFunding,
    //                         acknowledgment: studyAcknowledgements,
    //                     };
    //                 }
    //                 // Add  the related Links
    //                 let relatedInformationData = metadata_import.data["Related information"];

    //                 // Filter out invalid Links and protocol links
    //                 const additionalLinksFromPennsieve = relatedInformationData
    //                     .slice(1)
    //                     .filter((relatedInformationArray) => {
    //                         return (
    //                             relatedInformationArray[0] !== "" &&
    //                             relatedInformationArray[1] != "IsProtocolFor" &&
    //                             relatedInformationArray[2] !== "" &&
    //                             relatedInformationArray[3] !== ""
    //                         );
    //                     });
    //                 const currentAddtionalLinks = getGuidedAdditionalLinks();
    //                 for (const link of additionalLinksFromPennsieve) {
    //                     const additionalLinkDescription = link[0];
    //                     const additionalLinkRelation = link[1];
    //                     const additionalLinkLink = link[2];
    //                     const additionalLinkType = link[3];
    //                     // If the ink has already been added, delete it and add the updated data
    //                     // from Pennsieve
    //                     if (currentAddtionalLinks.includes(additionalLinkLink)) {
    //                         window.deleteAdditionalLink(additionalLinkLink);
    //                     }
    //                     window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].push(
    //                         {
    //                             link: additionalLinkLink,
    //                             relation: additionalLinkRelation,
    //                             description: additionalLinkDescription,
    //                             type: additionalLinkType,
    //                             isFair: true,
    //                         }
    //                     );
    //                 }
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-create-description-metadata-tab"
    //                 );
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-create-description-metadata-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-create-description-metadata-tab"
    //                 );
    //             }
    //             // If the dataset keywords were not set from the imported metadata, try to get them from the Pennsieve tags
    //             const keywordsDerivedFromDescriptionMetadata =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]?.[
    //                 "keywords"
    //                 ];
    //             if (!keywordsDerivedFromDescriptionMetadata) {
    //                 try {
    //                     const currentDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
    //                     const tagsReq = await client.get(`/manage_datasets/datasets/${currentDatasetID}/tags`, {
    //                         params: { selected_account: window.defaultBfAccount },
    //                     });
    //                     const { tags } = tagsReq.data;
    //                     if (tags.length > 0) {
    //                         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"][
    //                             "keywords"
    //                         ] = tags;
    //                     }
    //                 } catch (error) {
    //                     // We don't need to do anything if this fails, but the user will have to enter the new tags before continuing
    //                     clientError(error);
    //                 }
    //             }

    //             // If the study information was not set from the imported metadata, try to extract it from the Pennsieve dataset description
    //             const studyPurpose =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study purpose"
    //                 ];
    //             const studyDataCollection =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study data collection"
    //                 ];
    //             const studyPrimaryConclusion =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study primary conclusion"
    //                 ];

    //             if (!studyPurpose && !studyDataCollection && !studyPrimaryConclusion) {
    //                 try {
    //                     const pennsieveDatasetDescription = await api.getDatasetReadme(
    //                         window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
    //                     );
    //                     const parsedDescription = createParsedReadme(pennsieveDatasetDescription);
    //                     if (parsedDescription["Study Purpose"]) {
    //                         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
    //                             "study purpose"
    //                         ] = parsedDescription["Study Purpose"].replace(/\r?\n|\r/g, "").trim();
    //                     }
    //                     if (parsedDescription["Data Collection"]) {
    //                         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
    //                             "study data collection"
    //                         ] = parsedDescription["Data Collection"].replace(/\r?\n|\r/g, "").trim();
    //                     }
    //                     if (parsedDescription["Primary Conclusion"]) {
    //                         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
    //                             "study primary conclusion"
    //                         ] = parsedDescription["Primary Conclusion"].replace(/\r?\n|\r/g, "").trim();
    //                     }
    //                 } catch (error) {
    //                     // We don't need to do anything if this fails, but the user will have to enter the study information before continuing
    //                     clientError(error);
    //                 }
    //             }
    //         }

    //         const guidedLoadDescriptionDatasetInformation = () => {
    //             // Reset the keywords tags and add the stored ones if they exist in the JSON
    //             guidedDatasetKeywordsTagify.removeAllTags();
    //             const datasetKeyWords =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]?.[
    //                 "keywords"
    //                 ];
    //             if (datasetKeyWords) {
    //                 guidedDatasetKeywordsTagify.addTags(datasetKeyWords);
    //             }
    //         };
    //         guidedLoadDescriptionDatasetInformation();

    //         const guidedLoadDescriptionStudyInformation = () => {
    //             const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
    //             const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
    //             const studyPrimaryConclusionInput = document.getElementById(
    //                 "guided-ds-study-primary-conclusion"
    //             );
    //             const studyCollectionTitleInput = document.getElementById(
    //                 "guided-ds-study-collection-title"
    //             );

    //             //reset the inputs
    //             studyPurposeInput.value = "";
    //             studyDataCollectionInput.value = "";
    //             studyPrimaryConclusionInput.value = "";
    //             studyCollectionTitleInput.value = "";
    //             guidedStudyOrganSystemsTagify.removeAllTags();
    //             guidedStudyApproachTagify.removeAllTags();
    //             guidedStudyTechniquesTagify.removeAllTags();

    //             // Set the inputs if their respective keys exist in the JSON
    //             // (if not, the input will remain blank)
    //             const studyPurpose =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study purpose"
    //                 ];
    //             if (studyPurpose) {
    //                 studyPurposeInput.value = studyPurpose;
    //             }

    //             const studyDataCollection =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study data collection"
    //                 ];
    //             if (studyDataCollection) {
    //                 studyDataCollectionInput.value = studyDataCollection;
    //             }

    //             const studyPrimaryConclusion =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study primary conclusion"
    //                 ];
    //             if (studyPrimaryConclusion) {
    //                 studyPrimaryConclusionInput.value = studyPrimaryConclusion;
    //             }

    //             const studyCollectionTitle =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study collection title"
    //                 ];
    //             if (studyCollectionTitle) {
    //                 studyCollectionTitleInput.value = studyCollectionTitle;
    //             }

    //             const studyOrganSystems =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study organ system"
    //                 ];
    //             if (studyOrganSystems) {
    //                 guidedStudyOrganSystemsTagify.addTags(studyOrganSystems);
    //             }

    //             const studyApproach =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study approach"
    //                 ];
    //             if (studyApproach) {
    //                 guidedStudyApproachTagify.addTags(studyApproach);
    //             }

    //             const studyTechniques =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
    //                 "study technique"
    //                 ];
    //             if (studyTechniques) {
    //                 guidedStudyTechniquesTagify.addTags(studyTechniques);
    //             }
    //         };
    //         guidedLoadDescriptionStudyInformation();

    //         const guidedLoadDescriptionContributorInformation = () => {
    //             const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
    //             const contributorInformationMetadata =
    //                 window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"];

    //             guidedOtherFundingsourcesTagify.removeAllTags();

    //             if (contributorInformationMetadata) {
    //                 acknowledgementsInput.value = contributorInformationMetadata["acknowledgment"];
    //                 guidedOtherFundingsourcesTagify.addTags(contributorInformationMetadata["funding"]);
    //             } else {
    //                 acknowledgementsInput.value = "";
    //                 guidedOtherFundingsourcesTagify.removeAllTags();
    //             }
    //         };
    //         guidedLoadDescriptionContributorInformation();

    //         renderAdditionalLinksTable();

    //         const otherFundingLabel = document.getElementById("SPARC-award-other-funding-label");

    //         if (datasetIsSparcFunded()) {
    //             otherFundingLabel.innerHTML = ` besides the SPARC Award: ${window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"]}`;
    //         } else {
    //             otherFundingLabel.innerHTML = "";
    //         }
    //     }

    //     if (targetPageID === "guided-samples-folder-tab") {
    //         renderSamplesTable();
    //     }

    //     if (targetPageID === "guided-pennsieve-intro-tab") {
    //         const elementsToShowWhenLoggedInToPennsieve =
    //             document.querySelectorAll(".show-when-logged-in");
    //         const elementsToShowWhenNotLoggedInToPennsieve =
    //             document.querySelectorAll(".show-when-logged-out");
    //         if (!window.defaultBfAccount) {
    //             elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
    //                 element.classList.add("hidden");
    //             });
    //             elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
    //                 element.classList.remove("hidden");
    //             });
    //         } else {
    //             elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
    //                 element.classList.remove("hidden");
    //             });
    //             elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
    //                 element.classList.add("hidden");
    //             });

    //             const pennsieveIntroText = document.getElementById("guided-pennsive-intro-bf-account");
    //             // fetch the user's email and set that as the account field's value
    //             const userInformation = await api.getUserInformation();
    //             const userEmail = userInformation.email;
    //             pennsieveIntroText.innerHTML = userEmail;

    //             try {
    //                 if (window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"]) {
    //                     if (
    //                         window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] ===
    //                         guidedGetCurrentUserWorkSpace()
    //                     ) {
    //                         document.getElementById("guided-confirm-pennsieve-organization-button").click();
    //                     }
    //                 }
    //             } catch (error) {
    //                 pennsieveIntroAccountDetailsText.innerHTML = "Error loading account details";
    //             }
    //         }
    //     }

    //     if (targetPageID === "guided-banner-image-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-banner-image-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             // If the fetch fails, (they don't have a banner image yet)
    //             const datasetName = window.sodaJSONObj["digital-metadata"]["name"];
    //             const datasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

    //             try {
    //                 // pass in the id in case the name of the dataset has been
    //                 // changed from the original Pennsieve dataset name
    //                 let res = await api.getDatasetBannerImageURL(datasetID);
    //                 if (res != "No banner image") {
    //                     //Banner is returned as an s3 bucket url but image needs to be converted as
    //                     //base64 to save and write to users local system

    //                     let img_base64 = await window.getBase64(res); // encode image to base64
    //                     let guided_img_url = res;
    //                     let imageType = "";
    //                     let fullBase64Image = "";
    //                     let position = guided_img_url.search("X-Amz-Security-Token");

    //                     if (position != -1) {
    //                         // The image url will be before the security token
    //                         let new_img_src = guided_img_url.substring(0, position - 1);
    //                         let new_position = new_img_src.lastIndexOf("."); //

    //                         if (new_position != -1) {
    //                             window.imageExtension = new_img_src.substring(new_position + 1);

    //                             if (window.imageExtension.toLowerCase() == "png") {
    //                                 fullBase64Image = "data:image/png;base64," + img_base64;
    //                                 imageType = "png";
    //                             } else if (
    //                                 window.imageExtension.toLowerCase() == "jpeg" ||
    //                                 window.imageExtension.toLowerCase() == "jpg"
    //                             ) {
    //                                 fullBase64Image = "data:image/jpg;base64," + img_base64;
    //                                 imageType = "jpg";
    //                             } else {
    //                                 window.log.error(`An error happened: ${guided_img_url}`);
    //                                 Swal.fire({
    //                                     icon: "error",
    //                                     text: "An error occurred when importing the image. Please try again later.",
    //                                     showConfirmButton: "OK",
    //                                     backdrop: "rgba(0,0,0, 0.4)",
    //                                     heightAuto: false,
    //                                 });

    //                                 window.logGeneralOperationsForAnalytics(
    //                                     "Error",
    //                                     window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
    //                                     window.AnalyticsGranularity.ALL_LEVELS,
    //                                     ["Importing Banner Image"]
    //                                 );
    //                             }
    //                         }
    //                     }

    //                     let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
    //                     if (!window.fs.existsSync(imageFolder)) {
    //                         //create SODA/guided-banner-images if it doesn't exist
    //                         window.fs.mkdirSync(imageFolder, { recursive: true });
    //                     }
    //                     let imagePath = window.path.join(imageFolder, `${datasetName}.` + imageType);
    //                     //store file at imagePath destination

    //                     await window.electron.ipcRenderer.invoke("write-banner-image", img_base64, imagePath);

    //                     //save imagePath to sodaJson
    //                     window.sodaJSONObj["digital-metadata"]["banner-image-path"] = imagePath;

    //                     //add image to modal and display image on main banner import page
    //                     $("#guided-image-banner").attr("src", fullBase64Image);
    //                     $("#guided-para-path-image").html(imagePath);
    //                     document.getElementById("guided-div-img-container-holder").style.display = "none";
    //                     document.getElementById("guided-div-img-container").style.display = "block";

    //                     //set new cropper for imported image
    //                     window.myCropper.destroy();
    //                     window.myCropper = new Cropper(
    //                         window.guidedBfViewImportedImage,
    //                         window.guidedCropOptions
    //                     );

    //                     $("#guided-save-banner-image").css("visibility", "visible");
    //                 }
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = userErrorMessage(error);
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-banner-image-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
    //             }
    //         }
    //         if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
    //             //added extra param to function to prevent modification of URL
    //             guidedShowBannerImagePreview(
    //                 window.sodaJSONObj["digital-metadata"]["banner-image-path"],
    //                 true
    //             );
    //             document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
    //         } else {
    //             //reset the banner image page
    //             $("#guided-button-add-banner-image").html("Add banner image");
    //             $("#guided-banner-image-preview-container").hide();
    //         }
    //     }

    //     if (targetPageID === "guided-designate-permissions-tab") {
    //         // Get the users that can be granted permissions
    //         const usersReq = await client.get(
    //             `manage_datasets/ps_get_users?selected_account=${window.defaultBfAccount}`
    //         );
    //         const usersThatCanBeGrantedPermissions = usersReq.data.users;

    //         // Get the teams that can be granted permissions
    //         // Note: This is in a try catch because guest accounts do not have access to the teams endpoint
    //         // so the request will fail and teamsThatCanBeGrantedPermissions will remain an empty array
    //         let teamsThatCanBeGrantedPermissions = [];
    //         try {
    //             const teamsReq = await client.get(
    //                 `manage_datasets/ps_get_teams?selected_account=${window.defaultBfAccount}`
    //             );
    //             teamsThatCanBeGrantedPermissions = window.getSortedTeamStrings(teamsReq.data.teams);
    //         } catch (error) {
    //             clientError(error);
    //         }

    //         // Reset the dropdown with the new users and teams
    //         guidedAddUsersAndTeamsToDropdown(
    //             usersThatCanBeGrantedPermissions,
    //             teamsThatCanBeGrantedPermissions
    //         );

    //         if (pageNeedsUpdateFromPennsieve("guided-designate-permissions-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 let sparcUsersDivided = [];

    //                 //sparc users results needs to be formatted
    //                 usersThatCanBeGrantedPermissions.forEach((element) => {
    //                     //first two elements of this array will just be an email with no name
    //                     sparcUsersDivided.push(element.split(" !|**|!"));
    //                 });

    //                 const permissions = await api.getDatasetPermissions(
    //                     window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                     false
    //                 );

    //                 //Filter out the integration user
    //                 const filteredPermissions = permissions.filter((permission) => {
    //                     return !permission.includes("Integration User");
    //                 });

    //                 let partialUserDetails = [];
    //                 let finalTeamPermissions = [];
    //                 let piOwner = [];

    //                 //so check for PI owner as well
    //                 for (const userPermission of filteredPermissions) {
    //                     // Will include teams and users
    //                     let userRoleSplit = userPermission.split(",");
    //                     // Will look like:
    //                     // ['User: John Doe ', ' role: owner']
    //                     // need to split above
    //                     let nameSplit = userRoleSplit[0].split(":"); // will appear as ['Team', ' DRC Team']
    //                     let roleSplit = userRoleSplit[1].split(":"); // will appear as [' role', ' Viewer']
    //                     let userName = nameSplit[1].trim();
    //                     let userPermiss = roleSplit[1].trim();
    //                     let teamOrUser = nameSplit[0].trim().toLowerCase();

    //                     if (teamOrUser === "team") {
    //                         finalTeamPermissions.push({
    //                             UUID: userName,
    //                             permission: userPermiss,
    //                             teamString: userName,
    //                             permissionSource: "Pennsieve",
    //                             deleteFromPennsieve: false,
    //                         });
    //                     } else {
    //                         partialUserDetails.push({
    //                             permission: userPermiss,
    //                             userName: userName,
    //                         });
    //                     }
    //                 }
    //                 // After loop use the array of objects to find the UUID and email
    //                 let finalUserPermissions = [];

    //                 partialUserDetails.map((object) => {
    //                     sparcUsersDivided.forEach((element) => {
    //                         if (element[0].includes(object["userName"])) {
    //                             // name was found now get UUID
    //                             let userEmailSplit = element[0].split(" (");
    //                             if (object["permission"] === "owner") {
    //                                 //set for pi owner
    //                                 piOwner.push({
    //                                     UUID: object.permission,
    //                                     name: userEmailSplit[0],
    //                                     userString: element[0],
    //                                     permissionSource: "Pennsieve",
    //                                     deleteFromPennsieve: false,
    //                                 });
    //                                 //update PI owner key
    //                             } else {
    //                                 finalUserPermissions.push({
    //                                     UUID: element[1],
    //                                     permission: object.permission,
    //                                     userName: userEmailSplit[0],
    //                                     userString: element[0],
    //                                     permissonSource: "Pennsieve",
    //                                     deleteFromPennsieve: false,
    //                                 });
    //                             }
    //                         }
    //                     });
    //                 });

    //                 window.sodaJSONObj["digital-metadata"]["team-permissions"] = finalTeamPermissions;
    //                 window.sodaJSONObj["digital-metadata"]["user-permissions"] = finalUserPermissions;
    //                 window.sodaJSONObj["digital-metadata"]["pi-owner"] = piOwner[0];

    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-designate-permissions-tab"
    //                 );
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-designate-permissions-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-designate-permissions-tab"
    //                 );
    //             }
    //         }

    //         //If the PI owner is empty, set the PI owner to the user that is currently curating
    //         if (Object.keys(window.sodaJSONObj["digital-metadata"]["pi-owner"]).length === 0) {
    //             //Get the user information of the user that is currently curating
    //             const user = await api.getUserInformation();

    //             const loggedInUserString = `${user["firstName"]} ${user["lastName"]} (${user["email"]})`;
    //             const loggedInUserUUID = user["id"];
    //             const loggedInUserName = `${user["firstName"]} ${user["lastName"]}`;
    //             const loggedInUserPiObj = {
    //                 userString: loggedInUserString,
    //                 UUID: loggedInUserUUID,
    //                 name: loggedInUserName,
    //             };
    //             setGuidedDatasetPiOwner(loggedInUserPiObj);
    //         }

    //         renderPermissionsTable();
    //         guidedResetUserTeamPermissionsDropdowns();
    //     }

    //     if (targetPageID === "guided-assign-license-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-assign-license-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 const licenseReq = await client.get(`/manage_datasets/bf_license`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                     },
    //                 });
    //                 const { license } = licenseReq.data;
    //                 window.sodaJSONObj["digital-metadata"]["license"] = license;
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-assign-license-tab");
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-assign-license-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-assign-license-tab");
    //             }
    //         }
    //         // Get the selected dataset type ("computational" or "experimental")
    //         const datasetType = guidedGetDatasetType();

    //         // Update the license select instructions based on the selected dataset type
    //         const licenseSelectInstructions = document.getElementById("license-select-text");
    //         if (datasetType === "computational") {
    //             licenseSelectInstructions.innerHTML = `
    //         Select a license for your computational dataset from the options below.
    //       `;
    //         }
    //         if (datasetType === "experimental") {
    //             licenseSelectInstructions.innerHTML = `
    //         As per SPARC policy, all experimental datasets must be shared under the
    //         <b>Creative Commons Attribution (CC-BY)</b> license.
    //         <br />
    //         <br />
    //         Select the button below to consent to sharing your dataset under the Creative Commons Attribution license.
    //       `;
    //         }

    //         // Get the license options that are applicable for the selected dataset type
    //         const selectableLicenses = guidedLicenseOptions.filter((license) => {
    //             return license.datasetTypes.includes(datasetType);
    //         });

    //         // Render the license radio buttons into their container
    //         const licenseRadioButtonContainer = document.getElementById(
    //             "guided-license-radio-button-container"
    //         );
    //         const licenseRadioButtonElements = selectableLicenses
    //             .map((license) => {
    //                 return `
    //         <button class="guided--simple-radio-button" data-value="${license.licenseName}">
    //           <input type="radio" name="license" value="${license.licenseName}" style="margin-right: 5px; cursor: pointer; margin-top: 5px;" />
    //           <div style=" display: flex; flex-direction: column; align-items: flex-start; flex-grow: 1;">
    //             <p class="help-text mb-0"><b>${license.licenseName}</b></p>
    //             <p class="guided--text-input-instructions text-left">${license.licenseDescription}</p>
    //           </div>
    //         </button>
    //       `;
    //             })
    //             .join("\n");
    //         licenseRadioButtonContainer.innerHTML = licenseRadioButtonElements;

    //         // Add event listeners to the license radio buttons that add the selected class to the clicked button
    //         // and deselects all other buttons
    //         document.querySelectorAll(".guided--simple-radio-button").forEach((button) => {
    //             button.addEventListener("click", () => {
    //                 // Remove selected class from all radio buttons
    //                 licenseRadioButtonContainer
    //                     .querySelectorAll(".guided--simple-radio-button")
    //                     .forEach((button) => {
    //                         button.classList.remove("selected");
    //                     });

    //                 // Add selected class to the clicked radio button
    //                 button.classList.add("selected");
    //                 // Click the radio button input
    //                 button.querySelector("input").click();
    //             });
    //         });

    //         // If a license has already been selected, select the corresponding radio button (Only if the license is still selectable)
    //         const selectedLicense = window.sodaJSONObj["digital-metadata"]["license"];
    //         if (selectedLicense) {
    //             const selectedLicenseRadioButton = licenseRadioButtonContainer.querySelector(
    //                 `[data-value="${selectedLicense}"]`
    //             );
    //             if (selectedLicenseRadioButton) {
    //                 selectedLicenseRadioButton.click();
    //             }
    //         }
    //     }

    //     if (targetPageID === "guided-create-subjects-metadata-tab") {
    //         //remove custom fields that may have existed from a previous session
    //         document.getElementById("guided-accordian-custom-fields").innerHTML = "";
    //         document.getElementById("guided-bootbox-subject-id").value = "";

    //         //Add protocol titles to the protocol dropdown
    //         const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

    //         // Hide the subjects protocol section if no protocols have been attached to the dataset
    //         const subjectsProtocolContainer = document.getElementById(
    //             "guided-container-subjects-protocol"
    //         );
    //         protocols.length > 0
    //             ? subjectsProtocolContainer.classList.remove("hidden")
    //             : subjectsProtocolContainer.classList.add("hidden");

    //         document.getElementById("guided-bootbox-subject-protocol-title").innerHTML = `
    //         <option value="">No protocols associated with this sample</option>
    //         ${protocols
    //                 .map((protocol) => {
    //                     return `
    //               <option
    //                 value="${protocol.description}"
    //                 data-protocol-link="${protocol.link}"
    //               >
    //                 ${protocol.description}
    //               </option>
    //             `;
    //                 })
    //                 .join("\n")}))
    //       `;

    //         document.getElementById("guided-bootbox-subject-protocol-location").innerHTML = `
    //       <option value="">No protocols associated with this sample</option>
    //       ${protocols
    //                 .map((protocol) => {
    //                     return `
    //             <option
    //               value="${protocol.link}"
    //               data-protocol-description="${protocol.description}"
    //             >
    //               ${protocol.link}
    //             </option>
    //           `;
    //                 })
    //                 .join("\n")}))
    //     `;
    //         await renderSubjectsMetadataAsideItems();
    //         const subjectsMetadataBlackArrowLottieContainer = document.getElementById(
    //             "subjects-metadata-black-arrow-lottie-container"
    //         );
    //         subjectsMetadataBlackArrowLottieContainer.innerHTML = "";
    //         lottie.loadAnimation({
    //             container: subjectsMetadataBlackArrowLottieContainer,
    //             animationData: blackArrow,
    //             renderer: "svg",
    //             loop: true,
    //             autoplay: true,
    //         });
    //         hideEleShowEle("guided-form-add-a-subject", "guided-form-add-a-subject-intro");
    //     }

    //     if (targetPageID === "guided-create-samples-metadata-tab") {
    //         //remove custom fields that may have existed from a previous session
    //         document.getElementById("guided-accordian-custom-fields-samples").innerHTML = "";
    //         document.getElementById("guided-bootbox-subject-id-samples").value = "";
    //         document.getElementById("guided-bootbox-sample-id").value = "";
    //         await renderSamplesMetadataAsideItems();
    //         const samplesMetadataBlackArrowLottieContainer = document.getElementById(
    //             "samples-metadata-black-arrow-lottie-container"
    //         );
    //         samplesMetadataBlackArrowLottieContainer.innerHTML = "";
    //         lottie.loadAnimation({
    //             container: samplesMetadataBlackArrowLottieContainer,
    //             animationData: blackArrow,
    //             renderer: "svg",
    //             loop: true,
    //             autoplay: true,
    //         });
    //         hideEleShowEle("guided-form-add-a-sample", "guided-form-add-a-sample-intro");

    //         // Hide the samples protocol section if no protocols have been attached to the dataset
    //         const samplesProtocolContainer = document.getElementById("guided-container-samples-protocol");
    //         window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"].length > 0
    //             ? samplesProtocolContainer.classList.remove("hidden")
    //             : samplesProtocolContainer.classList.add("hidden");
    //     }

    //     if (targetPageID === "guided-add-code-metadata-tab") {
    //         const startNewCodeDescYesNoContainer = document.getElementById(
    //             "guided-section-start-new-code-metadata-query"
    //         );
    //         const startPennsieveCodeDescYesNoContainer = document.getElementById(
    //             "guided-section-start-from-pennsieve-code-metadata-query"
    //         );
    //         if (pageNeedsUpdateFromPennsieve("guided-add-code-metadata-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 await client.get(`/prepare_metadata/import_metadata_file`, {
    //                     params: {
    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                         file_type: "code_description.xlsx",
    //                     },
    //                 });
    //                 window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] = "yes";
    //             } catch (error) {
    //                 console.error("code_description file does not exist");
    //             }
    //         }
    //         // If the code_description file has been detected on the dataset on Pennsieve, show the
    //         // "Start from Pennsieve" option, otherwise show the "Start new" option
    //         if (window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] === "yes") {
    //             startNewCodeDescYesNoContainer.classList.add("hidden");
    //             startPennsieveCodeDescYesNoContainer.classList.remove("hidden");
    //         } else {
    //             startNewCodeDescYesNoContainer.classList.remove("hidden");
    //             startPennsieveCodeDescYesNoContainer.classList.add("hidden");
    //         }

    //         const codeDescriptionPath =
    //             window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];

    //         const codeDescriptionLottieContainer = document.getElementById(
    //             "code-description-lottie-container"
    //         );
    //         const codeDescriptionParaText = document.getElementById("guided-code-description-para-text");

    //         if (codeDescriptionPath) {
    //             codeDescriptionLottieContainer.innerHTML = "";
    //             lottie.loadAnimation({
    //                 container: codeDescriptionLottieContainer,
    //                 animationData: successCheck,
    //                 renderer: "svg",
    //                 loop: false,
    //                 autoplay: true,
    //             });
    //             codeDescriptionParaText.innerHTML = codeDescriptionPath;
    //         } else {
    //             //reset the code metadata lotties and para text
    //             codeDescriptionLottieContainer.innerHTML = "";
    //             lottie.loadAnimation({
    //                 container: codeDescriptionLottieContainer,
    //                 animationData: dragDrop,
    //                 renderer: "svg",
    //                 loop: true,
    //                 autoplay: true,
    //             });
    //             codeDescriptionParaText.innerHTML = "";
    //         }
    //     }

    //     if (targetPageID === "guided-create-readme-metadata-tab") {
    //         if (pageNeedsUpdateFromPennsieve("guided-create-readme-metadata-tab")) {
    //             // Show the loading page while the page's data is being fetched from Pennsieve
    //             setPageLoadingState(true);
    //             try {
    //                 let readme_import = await client.get(`/prepare_metadata/readme_changes_file`, {
    //                     params: {
    //                         file_type: "README",

    //                         selected_account: window.defaultBfAccount,
    //                         selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
    //                     },
    //                 });
    //                 let readme_text = readme_import.data.text;
    //                 window.sodaJSONObj["dataset-metadata"]["README"] = readme_text;
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-create-readme-metadata-tab"
    //                 );
    //             } catch (error) {
    //                 clientError(error);
    //                 const emessage = error.response.data.message;
    //                 await guidedShowOptionalRetrySwal(emessage, "guided-create-readme-metadata-tab");
    //                 // If the user chooses not to retry re-fetching the page data, mark the page as fetched
    //                 // so the the fetch does not occur again
    //                 window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
    //                     "guided-create-readme-metadata-tab"
    //                 );
    //             }
    //         }
    //         const readMeTextArea = document.getElementById("guided-textarea-create-readme");

    //         const readMe = window.sodaJSONObj["dataset-metadata"]["README"];

    //         if (readMe) {
    //             readMeTextArea.value = readMe;
    //         } else {
    //             readMeTextArea.value = "";
    //         }
    //     }

    //     if (targetPageID === "guided-create-changes-metadata-tab") {
    //         const changesTextArea = document.getElementById("guided-textarea-create-changes");

    //         const changes = window.sodaJSONObj["dataset-metadata"]["CHANGES"];

    //         if (changes) {
    //             changesTextArea.value = changes;
    //         } else {
    //             changesTextArea.value = "";
    //         }
    //     }

    //     if (targetPageID === "guided-create-local-copy-tab") {
    //         // Show the dataset structure preview using jsTree
    //         guidedShowTreePreview(
    //             window.sodaJSONObj["digital-metadata"]["name"],
    //             "guided-folder-and-metadata-structure-review"
    //         );

    //         // If the dataset was not started from Pennsieve, show the "Copy dataset" section
    //         // (We don't display this feature when starting from Pennsieve because we don't currently have the ability
    //         // to copy a dataset from Pennsieve to the user's local system)
    //         const createCopySection = document.getElementById("guided-section-create-local-dataset-copy");
    //         if (window.sodaJSONObj["starting-point"]["type"] === "new") {
    //             createCopySection.classList.remove("hidden");
    //         } else {
    //             createCopySection.classList.add("hidden");
    //         }

    //         guidedResetLocalGenerationUI();
    //     }

    //     if (targetPageID === "guided-dataset-generation-confirmation-tab") {
    //         //Set the inner text of the generate/retry pennsieve dataset button depending on
    //         //whether a dataset has bee uploaded from this progress file
    //         const generateOrRetryDatasetUploadButton = document.getElementById(
    //             "guided-generate-dataset-button"
    //         );
    //         const reviewGenerateButtionTextElement = document.getElementById(
    //             "review-generate-button-text"
    //         );
    //         if (
    //             window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] &&
    //             !window.sodaJSONObj["starting-point"]["type"] === "bf"
    //         ) {
    //             const generateButtonText = "Resume Pennsieve upload in progress";
    //             generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
    //             reviewGenerateButtionTextElement.innerHTML = generateButtonText;
    //         } else {
    //             const generateButtonText = "Generate dataset on Pennsieve";
    //             generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
    //             reviewGenerateButtionTextElement.innerHTML = generateButtonText;
    //         }

    //         const datsetName = window.sodaJSONObj["digital-metadata"]["name"];
    //         const datsetSubtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
    //         const datasetUserPermissions = window.sodaJSONObj["digital-metadata"]["user-permissions"];
    //         const datasetTeamPermissions = window.sodaJSONObj["digital-metadata"]["team-permissions"];
    //         const datasetTags = window.sodaJSONObj["digital-metadata"]["dataset-tags"];
    //         const datasetLicense = window.sodaJSONObj["digital-metadata"]["license"];

    //         const datasetNameReviewText = document.getElementById("guided-review-dataset-name");

    //         const datasetSubtitleReviewText = document.getElementById("guided-review-dataset-subtitle");
    //         const datasetDescriptionReviewText = document.getElementById(
    //             "guided-review-dataset-description"
    //         );
    //         const datasetUserPermissionsReviewText = document.getElementById(
    //             "guided-review-dataset-user-permissions"
    //         );
    //         const datasetTeamPermissionsReviewText = document.getElementById(
    //             "guided-review-dataset-team-permissions"
    //         );
    //         const datasetTagsReviewText = document.getElementById("guided-review-dataset-tags");
    //         const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

    //         datasetNameReviewText.innerHTML = datsetName;
    //         datasetSubtitleReviewText.innerHTML = datsetSubtitle;

    //         datasetDescriptionReviewText.innerHTML = Object.keys(
    //             window.sodaJSONObj["digital-metadata"]["description"]
    //         )
    //             .map((key) => {
    //                 //change - to spaces in description and then capitalize
    //                 const descriptionTitle = key
    //                     .split("-")
    //                     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    //                     .join(" ");
    //                 return `<b>${descriptionTitle}</b>: ${window.sodaJSONObj["digital-metadata"]["description"][key]}<br /><br />`;
    //             })
    //             .join("\n");

    //         if (datasetUserPermissions.length > 0) {
    //             const datasetUserPermissionsString = datasetUserPermissions
    //                 .map((permission) => permission.userString)
    //                 .join("<br>");
    //             datasetUserPermissionsReviewText.innerHTML = datasetUserPermissionsString;
    //         } else {
    //             datasetUserPermissionsReviewText.innerHTML = "No additional user permissions added";
    //         }

    //         if (datasetTeamPermissions.length > 0) {
    //             const datasetTeamPermissionsString = datasetTeamPermissions
    //                 .map((permission) => permission.teamString)
    //                 .join("<br>");
    //             datasetTeamPermissionsReviewText.innerHTML = datasetTeamPermissionsString;
    //         } else {
    //             datasetTeamPermissionsReviewText.innerHTML = "No additional team permissions added";
    //         }

    //         datasetTagsReviewText.innerHTML = datasetTags.join(", ");
    //         datasetLicenseReviewText.innerHTML = datasetLicense;

    //         guidedShowTreePreview(
    //             window.sodaJSONObj["digital-metadata"]["name"],
    //             "guided-folder-structure-review-generate"
    //         );

    //         // Hide the Pennsieve agent check section (unhidden if it requires user action)
    //         document
    //             .getElementById("guided-mode-pre-generate-pennsieve-agent-check")
    //             .classList.add("hidden");
    //     }

    //     if (targetPageID === "guided-dataset-generation-tab") {
    //         document.getElementById("guided--verify-files").classList.add("hidden");
    //     }

    //     if (targetPageID === "guided-dataset-dissemination-tab") {
    //         // Show the loading page while the page's data is being fetched from Pennsieve
    //         setPageLoadingState(true);

    //         const currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
    //         const currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];

    //         const pennsieveDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

    //         const pennsieveDatasetLink = document.getElementById("guided-pennsieve-dataset-link");

    //         const pennsieveCopy = document.getElementById("guided-pennsieve-copy-dataset-link");

    //         const pennsieveDatasetCopyIcon = document.getElementById("guided-pennsieve-copy-icon");

    //         pennsieveDatasetCopyIcon.classList.add("fa-copy");

    //         let datasetLink = `https://app.pennsieve.io/N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0/datasets/${pennsieveDatasetID}/overview`;
    //         let linkIcon = `<i class="fas fa-link" style="margin-right: 0.4rem; margin-left: 0.4rem"></i>`;

    //         pennsieveDatasetLink.innerHTML = linkIcon + datasetLink;
    //         pennsieveDatasetLink.href = datasetLink;

    //         if (removeEventListener) {
    //             pennsieveCopy.removeEventListener(
    //                 "click",
    //                 () => {
    //                     copyLink(datasetLink);
    //                 },
    //                 true
    //             );
    //         }
    //         if (addListener) {
    //             pennsieveCopy.addEventListener("click", () => {
    //                 copyLink(datasetLink);
    //             });
    //             /*
    //             TODO: FIX COPY TO CLIPBOARD POST-BUNDLE
    //             pennsieveDOICopy.addEventListener("click", () => {
    //               let doiInfo = document.getElementById("guided--para-doi-info").innerText;
    //               copyLink(doiInfo);
    //             });*/
    //             addListener = false;
    //             removeEventListener = true;
    //         }

    //         let pennsieveDOICheck = await api.getDatasetDOI(currentDataset);

    //         //Set the ui for curation team and DOI information
    //         await window.showPublishingStatus("", "guided");
    //         window.guidedSetCurationTeamUI();
    //         guidedSetDOIUI(pennsieveDOICheck);
    //     }

    let currentParentTab = window.CURRENT_PAGE.closest(".guided--parent-tab");

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveProgressionTab(targetPageID);
    // renderSideBar(targetPageID);

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

    //     // Start any animations that need to be started
    //     startOrStopAnimationsInContainer(targetPageID, "start");

    hideAndShowElementsDependingOnStartType(targetPage);

    // Set the last opened page and save it
    window.sodaJSONObj["page-before-exit"] = targetPageID;
    //     await guidedSaveProgress();
  } catch (error) {
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
    console.log(error);
    throw error;
  }

  guidedSetNavLoadingState(false);
};
