import { openPageCurationPreparation } from "./curationPreparation/openPage.js";
import { openPageDatasetStructure } from "./datasetStructure/openPage.js";
import { openPagePrepareMetadata } from "./prepareMetadata/openPage.js";
import { openGenerateDatasetPage } from "./generateDataset/openPage.js";
import {
  resetGuidedRadioButtons,
  updateGuidedRadioButtonsFromJSON,
} from "../buttons/radioButtons.js";
import {
  externallySetSearchFilterValue,
  setTreeViewDatasetStructure,
  clearEntityFilter, // Add this import
  setEntityFilter, // Add this import
} from "../../../stores/slices/datasetTreeViewSlice.js";
import {
  addEntityToEntityList,
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
import { setDatasetEntityObj } from "../../../stores/slices/datasetEntitySelectorSlice.js";
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
export const openPage = async (targetPageID) => {
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

    // clear the entity filter when navigating to a new page
    clearEntityFilter();

    setSelectedHierarchyEntity(null);
    setActiveEntity(null);

    // Synchronize state between the SODA JSON object and the zustand store
    setSelectedEntities(window.sodaJSONObj["selected-entities"] || []);
    setDeSelectedEntities(window.sodaJSONObj["deSelected-entities"] || []);
    setPerformanceList(window.sodaJSONObj["performance-list"] || []);

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

    if (targetPageDataset.componentType) {
      const targetPageComponentType = targetPageDataset.componentType;

      console.log("targetPageDataset", targetPageDataset);

      if (targetPageComponentType === "modality-selection-page") {
        const modalities = window.sodaJSONObj["selected-modalities"] || [];
        setSelectedModalities(modalities);
      }

      if (targetPageComponentType === "data-categorization-page") {
        const pageEntityType = targetPageDataset.entityType;
        const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
        const selectedEntities = window.sodaJSONObj["selected-entities"] || [];

        setDatasetEntityObj(savedDatasetEntityObj);

        // Make any adjustments to the dataset entity object before setting it in the zustand store
        if (pageEntityType === "categorized-data") {
          const bucketTypes = ["Experimental data", "Other"];
          if (selectedEntities.includes("code")) {
            bucketTypes.push("Code");
          }

          for (const bucketType of bucketTypes) {
            addEntityToEntityList("categorized-data", bucketType);
          }
        }

        if (pageEntityType === "other-data") {
          const otherBucketTypes = ["Protocol data", "Documentation"];
          for (const otherBucketType of otherBucketTypes) {
            addEntityToEntityList("other-data", otherBucketType);
          }
          setEntityFilter([{ type: "categorized-data", names: ["Other"] }], []);
        }

        if (pageEntityType === "sites") {
          const sites = getExistingSites().map((site) => site.id);
          console.log("Found sites", sites);
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
          const performanceList = window.sodaJSONObj["performance-list"] || [];
          for (const performance of performanceList) {
            addEntityToEntityList("performances", performance.performanceId);
          }
          setEntityFilter([{ type: "categorized-data", names: ["Experimental data"] }], []);
        }

        if (pageEntityType === "modalities") {
          const modalities = window.sodaJSONObj["selected-modalities"] || [];
          for (const modality of modalities) {
            addEntityToEntityList("modalities", modality);
          }
        }

        console.log("savedDatasetEntityObj", savedDatasetEntityObj);
        console.log("pageEntityType", pageEntityType);

        setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
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
          !!savedDatasetEntityObj?.["categorized-data"]?.["Experimental data"] &&
          Object.keys(savedDatasetEntityObj["categorized-data"]["Experimental data"]).length > 0;

        // If experimental data exists, apply the filter
        if (hasExperimentalData) {
          console.log("Auto-filtering for Experimental data");
          // Apply the filter for experimental data
          setEntityFilter([{ type: "categorized-data", names: ["Experimental data"] }], []);
        } else {
          console.log("No experimental data found to filter");
        }

        setDatasetEntityArray(datasetEntityArray);
        setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
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
    await openGenerateDatasetPage(targetPageID);

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

    //     if (targetPageID === "guided-samples-folder-tab") {
    //         renderSamplesTable();
    //     }

    //

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
    //         window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"].length > 0
    //             ? samplesProtocolContainer.classList.remove("hidden")
    //             : samplesProtocolContainer.classList.add("hidden");
    //     }

    //     if (targetPageID === "guided-create-changes-metadata-tab") {
    //         const changesTextArea = document.getElementById("guided-textarea-create-changes");

    //         const changes = window.sodaJSONObj["dataset_metadata"]["CHANGES"];

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
    //         if (window.sodaJSONObj["starting-point"]["origin"] === "new") {
    //             createCopySection.classList.remove("hidden");
    //         } else {
    //             createCopySection.classList.add("hidden");
    //         }

    //         guidedResetLocalGenerationUI();
    //     }

    //     if (targetPageID === "guided-dataset-dissemination-tab") {
    //         // Show the loading page while the page's data is being fetched from Pennsieve
    //         setPageLoadingState(true);

    //         const currentAccount = window.sodaJSONObj["ps-account-selected"]["account-name"];
    //         const currentDataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];

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
    await guidedSaveProgress();
  } catch (error) {
    const eMessage = userErrorMessage(error);
    console.error(error);
    console.error(eMessage);
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
