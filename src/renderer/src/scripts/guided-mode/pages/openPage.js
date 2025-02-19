import { openPageCurationPreparation } from "./curationPreparation/openPage.js";
import { openPagePrepareMetadata } from "./prepareMetadata/openPage.js";
import {
  resetGuidedRadioButtons,
  updateGuidedRadioButtonsFromJSON,
} from "../buttons/radioButtons.js";
import { externallySetSearchFilterValue } from "../../../stores/slices/datasetTreeViewSlice.js";
import {
  addEntityToEntityList,
  setActiveEntity,
} from "../../../stores/slices/datasetEntitySelectorSlice.js";
import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading.js";
import Swal from "sweetalert2";
import { userErrorMessage } from "../../others/http-error-handler/error-handler.js";
import { getNonSkippedGuidedModePages } from "./navigationUtils/pageSkipping.js";
import { startOrStopAnimationsInContainer } from "../lotties/lottie.js";
import { renderSideBar } from "./sidebar.js";

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

//Main function that prepares individual pages based on the state of the window.sodaJSONObj
//The general flow is to check if there is values for the keys relevant to the page
//If the keys exist, extract the data from the window.sodaJSONObj and populate the page
//If the keys do not exist, reset the page (inputs, tables etc.) to the default state
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

    await openPageCurationPreparation(targetPageID);
    await openPagePrepareMetadata(targetPageID);

    if (targetPageID === "supporting-data-tab") {
      addEntityToEntityList("supporting-data", "Source data");
      addEntityToEntityList("supporting-data", "Derivative data");
      addEntityToEntityList("supporting-data", "Code");
      addEntityToEntityList("supporting-data", "Protocol data");
      addEntityToEntityList("supporting-data", "Documentation");
      addEntityToEntityList("supporting-data", "Auxiliary");
      setActiveEntity(null);
      // console.log("datasetEntityObj", useGlobalStore.getState().datasetEntityObj);
    }

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
