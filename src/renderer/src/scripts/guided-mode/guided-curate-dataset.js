// // sourcery skip: merge-nested-ifs

import {
  existingDataset,
  modifyDataset,
  blackArrow,
  questionList,
  datasetMetadataIntroLottie,
  addScienceData,
  startNew,
  resumeExisting,
} from "../../assets/lotties/lotties";
import { resetLazyLoading, guidedUnLockSideBar } from "../../assets/nav";
import determineDatasetLocation from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import datasetUploadSession from "../analytics/upload-session-tracker";
import api from "../others/api/api";
import lottie from "lottie-web";
import { dragDrop, successCheck, errorMark } from "../../assets/lotties/lotties";
import kombuchaEnums from "../analytics/analytics-enums";
import Swal from "sweetalert2";
import Tagify from "@yaireo/tagify/dist/tagify.esm.js";
import tippy from "tippy.js";
import { v4 as uuid } from "uuid";
import doiRegex from "doi-regex";
import validator from "validator";
import client from "../client";

import {
  swalConfirmAction,
  swalShowError,
  swalFileListSingleAction,
  swalFileListDoubleAction,
  swalShowInfo,
} from "../utils/swal-utils";

// Import state management stores
import useGlobalStore from "../../stores/globalStore";
import { setDropdownState } from "../../stores/slices/dropDownSlice";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../stores/slices/guidedModeSlice";
import {
  setEntityType,
  getEntityObjForEntityType,
  setEntityListForEntityType,
  setActiveEntity,
  getDatasetEntityObj,
  setDatasetEntityObj,
  addEntityToEntityList,
} from "../../stores/slices/datasetEntitySelectorSlice";
import {
  setTreeViewDatasetStructure,
  externallySetSearchFilterValue,
} from "../../stores/slices/datasetTreeViewSlice";
import { setSelectedEntities } from "../../stores/slices/datasetContentSelectorSlice";

import "bootstrap-select";
import Cropper from "cropperjs";

import "jstree";

import fileTxt from "/img/txt-file.png";
import filePng from "/img/png-file.png";
import filePdf from "/img/pdf-file.png";
import fileCsv from "/img/csv-file.png";
import fileDoc from "/img/doc-file.png";
import fileXlsx from "/img/excel-file.png";
import fileJpeg from "/img/jpeg-file.png";
import fileOther from "/img/other-file.png";
import hasConnectedAccountWithPennsieve from "../others/authentication/auth";
import { data } from "jquery";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

window.returnToGuided = () => {
  document.getElementById("guided_mode_view").click();
};

const guidedGetDatasetId = (sodaJSON) => {
  let datasetId = sodaJSON?.["digital-metadata"]?.["pennsieve-dataset-id"];
  if (datasetId != undefined) {
    return datasetId;
  }

  return "None";
};

const guidedGetDatasetName = (sodaJSON) => {
  let datasetName = sodaJSON?.["digital-metadata"]?.["name"];
  if (datasetName != undefined) {
    return datasetName;
  }

  return "None";
};

const guidedGetDatasetType = () => {
  // Returns the dataset type (e.g. "computational" or "experimental")
  return window.sodaJSONObj?.["dataset-type"];
};

const guidedGetDatasetOrigin = (sodaJSON) => {
  let datasetOrigin = sodaJSON?.["generate-dataset"]?.["generate-option"];
  if (datasetOrigin === "existing-bf") {
    // Dataset origin is from Pennsieve
    return "Pennsieve";
  }

  // Otherwise origin is new dataset
  return "New";
};

const guidedCreateEventDataPrepareMetadata = (destination, value) => {
  if (destination === "Pennsieve") {
    return {
      value,
      destination: "Pennsieve",
      dataset_name: guidedGetDatasetName(window.sodaJSONObj),
      dataset_id: guidedGetDatasetId(window.sodaJSONObj),
      dataset_int_id: window.defaultBfDatasetIntId,
    };
  }

  return {
    value,
    destination,
  };
};

document
  .getElementById("guided-button-resume-pennsieve-dataset")
  .addEventListener("click", async () => {
    renderGuidedResumePennsieveDatasetSelectionDropdown();
  });

window.handleGuidedModeOrgSwitch = async (buttonClicked) => {
  const clickedButtonId = buttonClicked.id;
  if (clickedButtonId === "guided-button-change-workspace-dataset-import") {
    renderGuidedResumePennsieveDatasetSelectionDropdown();
  }
  if (buttonClicked.classList.contains("guided--progress-button-switch-workspace")) {
    await guidedRenderProgressCards();
  }
};

const guidedGetCurrentUserWorkSpace = () => {
  // Returns null if the user has not selected a workspace
  const workSpaceFromUI = document.getElementById(
    "guided-pennsive-selected-organization"
  ).innerHTML;
  if (
    workSpaceFromUI.includes("Click here to select workspace") ||
    workSpaceFromUI.includes("None")
  ) {
    return null;
  }
  return workSpaceFromUI;
};

window.verifyProfile = async () => {
  const accountValid = await window.check_api_key();

  if (!accountValid) {
    await window.addBfAccount(null, false);
    return;
  }
};

const lottieAnimationManager = {
  animationData: {
    "guided-curation-preparation-intro-lottie": {
      animationData: questionList,
      loop: true,
      autoplay: true,
    },
    "guided-lottie-import-subjects-pools-samples-excel-file": {
      animationData: dragDrop,
      loop: true,
      autoplay: true,
    },
    "guided-lottie-import-subjects-folder-structure": {
      animationData: dragDrop,
      loop: true,
      autoplay: true,
    },
    "guided-dataset-metadata-intro-lottie": {
      animationData: datasetMetadataIntroLottie,
      loop: true,
      autoplay: true,
    },
    "guided-dataset-structure-intro-lottie": {
      animationData: addScienceData,
      loop: true,
      autoplay: true,
    },
    "guided-start-new-lottie": {
      animationData: startNew,
      loop: true,
      autoplay: true,
    },
    "guided-resume-exiting-lottie": {
      animationData: resumeExisting,
      loop: true,
      autoplay: true,
    },
  },

  animations: {},

  startAnimation: function (containerElementId) {
    const { animationData, loop, autoplay } = this.animationData[containerElementId];

    const container = document.getElementById(containerElementId);
    container.innerHTML = "";

    const anim = lottie.loadAnimation({
      container: container,
      animationData: animationData,
      renderer: "svg",
      loop: loop,
      autoplay: autoplay,
    });
    this.animations[containerElementId] = anim;
  },

  stopAnimation: function (containerElementId) {
    const runningAnimation = this.animations[containerElementId];
    if (runningAnimation) {
      runningAnimation.stop();
    }
  },
};

/**
 * @description Starts or stops all animations inside of a container
 * @param {string} containerId
 * @param {string} startOrStop
 * @returns {void}
 * @example
 * startOrStopAnimationsInContainer("container-with-lottie-containers", "start");
 * startOrStopAnimationsInContainer("container-with-lottie-containers", "stop");
 */
const startOrStopAnimationsInContainer = (containerId, startOrStop) => {
  const container = document.getElementById(containerId);
  const animationContainers = container.getElementsByClassName("lottieAnimationContainer");
  for (const animationContainer of animationContainers) {
    const animationContainerId = animationContainer.id;

    if (startOrStop === "start") {
      lottieAnimationManager.startAnimation(animationContainerId);
    }
    if (startOrStop === "stop") {
      lottieAnimationManager.stopAnimation(animationContainerId);
    }
  }
};

const guidedLicenseOptions = [
  {
    licenseName: "Creative Commons Attribution",
    licenseDescription:
      "A permissive license commonly used for open data collections that allows others to use, modify, and distribute your work provided appropriate credit is given.",
    datasetTypes: ["experimental"],
  },
  {
    licenseName: "MIT",
    licenseDescription:
      "A permissive license that allows others to use, modify, and distribute your work provided they grant you credit.",
    datasetTypes: ["computational"],
  },
  {
    licenseName: "GNU General Public License v3.0",
    licenseDescription:
      "A copyleft license that allows others to use, modify, and distribute your work provided they grant you credit and distribute their modifications under the GNU GPL license as well.",
    datasetTypes: ["computational"],
  },
];

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

const guidedResetLocalGenerationUI = () => {
  // Hide the local dataset copy generation section that containst the table/generation progress
  document.getElementById("guided-section-local-generation-status-table").classList.add("hidden");
  // Hide the local dataset generation success section
  document.getElementById("guided-section-post-local-generation-success").classList.add("hidden");
  // Hide the local dataset generation retry section
  document.getElementById("guided-section-retry-local-generation").classList.add("hidden");
};

const folderImportedFromPennsieve = (folderJSONPath) => {
  return folderJSONPath.type === "bf";
};

const guidedModifyPennsieveFolder = (folderJSONPath, action) => {
  //Actions can be "delete"  or "restore"

  if (!folderJSONPath) {
    return;
  }
  if (action === "delete") {
    if (!folderJSONPath["action"].includes("deleted")) {
      folderJSONPath["action"].push("deleted");
    }

    window.recursive_mark_sub_files_deleted(folderJSONPath, "delete");
  }
  if (action === "restore") {
    folderJSONPath["action"] = folderJSONPath["action"].filter(
      (action) => action !== "recursive_deleted" || action !== "deleted"
    );
    window.recursive_mark_sub_files_deleted(folderJSONPath, "restore");
  }
};

const guidedMovePennsieveFolder = (movedFolderName, folderJSONPath, newFolderJSONPath) => {
  if (!folderJSONPath) {
    return;
  }
  if (!newFolderJSONPath) {
    return;
  }

  folderJSONPath["action"] = ["existing", "moved"];
  window.addMovedRecursively(folderJSONPath);
  newFolderJSONPath["folders"][movedFolderName] = folderJSONPath;
};

// Returns a boolean that indicates whether or not the user selected that the dataset is SPARC funded
const datasetIsSparcFunded = () => {
  return (
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] === "SPARC"
  );
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

/* 
document.getElementById("guided-button-dataset-contains-code").addEventListener("click", () => {
  const codeFolder = window.datasetStructureJSONObj["folders"]["code"];
  if (codeFolder) {
    if (folderImportedFromPennsieve(codeFolder)) {
      // If the code folder is imported from Pennsieve, unmark it as deleted
      guidedModifyPennsieveFolder(codeFolder, "restore");
      // NOTE: We do not need to update the UI since this button is not on the ui structuring page
    }
  }
});
*/

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
    const datasetInfo = await api.getDatasetInformation(
      pennsieveDatasetID
    );
    const isPublished = datasetInfo?.publication?.status === "completed";

    if (isPublished) {
      return { shouldShow: true, changesMetadata: "" };
    } else {
      return { shouldShow: false };
    }
  }
};

const setPageLoadingState = (boolLoadingState) => {
  const pageParentContainers = document.querySelectorAll(".guided--parent-tab");

  if (boolLoadingState === true) {
    // Add the loading div if it does not exist
    if (!document.getElementById("guided-loading-div")) {
      const loadingDivHtml = `
      <div class="guided--main-tab" id="guided-loading-div">
        <div class="guided--loading-div">
          <div class="lds-roller">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          Fetching data from Pennsieve...
        </div>
      </div>
    `;
      // Add the loading div as the last child of the guided-body div
      document.getElementById("guided-body").insertAdjacentHTML("beforeend", loadingDivHtml);
    }

    // Hide the page parent containers
    // Note: this class is added so we can easily show and hide the page parent containers without effecting the hidden status on the parent pages
    pageParentContainers.forEach((container) => {
      container.classList.add("temporary-hide");
    });
  }
  if (boolLoadingState === false) {
    // Remove the loading div from the dom if it exists
    const loadingDiv = document.getElementById("guided-loading-div");
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // Show the page parent containers
    // Note: this class is added so we can easily show and hide the page parent containers without effecting the hidden status on the parent pages
    pageParentContainers.forEach((container) => {
      container.classList.remove("temporary-hide");
    });
  }
};

const guidedSetNavLoadingState = (loadingState) => {
  //depending on the boolean loading state will determine whether or not
  //to disable the primary and sub buttons along with the nav menu
  const mainBackButton = document.getElementById("guided-back-button");
  const mainContinueButton = document.getElementById("guided-next-button");
  const saveAndExitButton = document.getElementById("guided-button-save-and-exit");

  const navItems = document.querySelectorAll(".guided--nav-bar-section-page");

  if (loadingState === true) {
    mainBackButton.disabled = true;
    mainContinueButton.disabled = true;
    saveAndExitButton.disabled = true;
    mainBackButton.classList.add("loading");
    mainContinueButton.classList.add("loading");

    navItems.forEach((nav) => {
      nav.classList.add("disabled-nav");
    });
  }

  if (loadingState === false) {
    mainBackButton.disabled = false;
    mainContinueButton.disabled = false;
    mainBackButton.classList.remove("loading");
    mainContinueButton.classList.remove("loading");
    saveAndExitButton.disabled = false;

    navItems.forEach((nav) => {
      nav.classList.remove("disabled-nav");
    });
    // Hide the lading div if the loading div was showing
    setPageLoadingState(false);
  }
};

const objectsHaveSameKeys = (...objects) => {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every((object) => union.size === Object.keys(object).length);
};

const getGuidedProgressFileNames = () => {
  return window.fs
    .readdirSync(guidedProgressFilePath)
    .map((progressFileName) => progressFileName.replace(".json", ""));
};

const updateGuidedDatasetName = (newDatasetName) => {
  const previousDatasetName = window.sodaJSONObj["digital-metadata"]["name"];

  //update old progress file with new dataset name
  const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
  const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
  window.fs.renameSync(oldProgressFilePath, newProgressFilePath);

  const bannerImagePathToUpdate = window.sodaJSONObj["digital-metadata"]["banner-image-path"];
  if (bannerImagePathToUpdate) {
    const newBannerImagePath = bannerImagePathToUpdate.replace(previousDatasetName, newDatasetName);
    //Rename the old banner image folder to the new dataset name
    window.fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
    //change the banner image path in the JSON obj
    window.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
  }
  window.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
};

window.getDatasetEntityObj = getDatasetEntityObj;

const savePageChanges = async (pageBeingLeftID) => {
  // This function is used by both the navigation bar and the side buttons,
  // and whenever it is being called, we know that the user is trying to save the changes on the current page.
  // this function is async because we sometimes need to make calls to validate data before the page is ready to be left.
  guidedSetNavLoadingState(true);

  const errorArray = [];
  try {
    //save changes to the current page

    // Check if the page being left is part of a page set
    const pageBeingLeftElement = document.getElementById(pageBeingLeftID);
    const pageBeingLeftDataSet = pageBeingLeftElement.dataset;
    console.log("pageBeingLeftDataSet", pageBeingLeftDataSet);

    // Handle page exit logic for pages that are controlled by React components
    if (pageBeingLeftDataSet.componentType) {
      const pageBeingLeftComponentType = pageBeingLeftDataSet.componentType;
      if (pageBeingLeftComponentType === "entity-management-page") {
        const entityType = pageBeingLeftDataSet.entityType;
        const entityTypeSingular = pageBeingLeftDataSet.entityTypeStringSingular;
        const datasetEntityObj = getDatasetEntityObj();
        console.log("datasetEntityObj when leaving" + pageBeingLeftID, datasetEntityObj);
        console.log("pageBeingLeftDataSet.entityType", entityType);
        if (!datasetEntityObj?.[entityType]) {
          errorArray.push({
            type: "notyf",
            message: `Please add at least one ${entityTypeSingular} to continue`,
          });
          throw errorArray;
        }
        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
      }
      if (pageBeingLeftComponentType === "entity-selection-page") {
        const entityType = pageBeingLeftDataSet.entityType;
        const entityTypeSingular = pageBeingLeftDataSet.entityTypeStringSingular;
        const datasetEntityObj = getDatasetEntityObj();
        console.log("datasetEntityObj when leaving" + pageBeingLeftID, datasetEntityObj);
        console.log("pageBeingLeftDataSet.entityType", entityType);
        const entityItems = Object.keys(datasetEntityObj?.[entityType] || {});
        console.log("entityItems", entityItems);

        let noDataAddedToEntities = false; // Changed from const to let

        for (const item of entityItems) {
          if (datasetEntityObj[entityType][item].length !== 0) {
            noDataAddedToEntities = true;
            break;
          }
        }
        /*
        if (!noDataAddedToEntities) {
          errorArray.push({
            type: "notyf",
            message: `Please add data to at least one ${entityTypeSingular} to continue`,
          });
          throw errorArray;
        }*/

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
      }
    }

    if (pageBeingLeftID === "guided-select-starting-point-tab") {
      const startingNewCuration = document
        .getElementById("guided-button-start-new-curation")
        .classList.contains("selected");
      const resumingExistingProgress = document
        .getElementById("guided-button-resume-progress-file")
        .classList.contains("selected");

      const resumingPennsieveDataset = document
        .getElementById("guided-button-resume-pennsieve-dataset")
        .classList.contains("selected");

      if (!startingNewCuration && !resumingExistingProgress && !resumingPennsieveDataset) {
        errorArray.push({
          type: "notyf",
          message: "Please select a dataset start location",
        });
        throw errorArray;
      }

      if (startingNewCuration) {
        window.sodaJSONObj["starting-point"]["type"] = "new";
        window.sodaJSONObj["generate-dataset"]["generate-option"] = "new";

        // Skip the changes metadata tab as new datasets do not have changes metadata
        guidedSkipPage("guided-create-changes-metadata-tab");

        // Open the first page
        const firstPage = getNonSkippedGuidedModePages(document)[0];
        await window.openPage(firstPage.id);
      }

      if (resumingExistingProgress) {
        errorArray.push({
          type: "notyf",
          message: "Please click the button of the dataset you would like to resume above",
        });
        throw errorArray;
      }
      // This is the case where the user is resuming a Pennsieve dataset
      if (resumingPennsieveDataset) {
        if (
          !document
            .getElementById("guided-panel-pennsieve-dataset-import-loading")
            .classList.contains("hidden")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please wait for your datasets on Pennsieve to load",
          });
          throw errorArray;
        }

        const selectedPennsieveDatasetToResume = $(
          "#guided-select-pennsieve-dataset-to-resume option:selected"
        );
        // Get the text currently in the dropdown
        const selectedPennsieveDataset = selectedPennsieveDatasetToResume[0].innerHTML;
        // Get the value of the dropdown (the dataset ID)
        const selectedPennsieveDatasetID = selectedPennsieveDatasetToResume.val().trim();

        if (!selectedPennsieveDatasetID) {
          errorArray.push({
            type: "notyf",
            message: "Please select a dataset on Pennsieve to resume from the dropdown above",
          });
          throw errorArray;
        }

        // Check if the user already has a progress file for this dataset
        const currentProgressFileNames = getGuidedProgressFileNames();
        if (currentProgressFileNames.includes(selectedPennsieveDataset)) {
          errorArray.push({
            type: "swal",
            title: "You already have a progress file for this dataset",
            message: `
              To resume progress saved in SODA for this dataset, please go back to the main page and click "continue curating" on the dataset you want to resume.
              <br />
              <br />
              If you would like to restart your progress and edit the dataset as it is on Pennsieve, go back to the main menu and click "delete progress file" on the dataset you want to restart.
            `,
          });
          throw errorArray;
        }

        const datasetIsLocked = await api.isDatasetLocked(
          selectedPennsieveDataset
        );
        if (datasetIsLocked) {
          errorArray.push({
            type: "swal",
            title: `${selectedPennsieveDataset} is locked from editing`,
            message: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a  target="_blank" href="mailto:curation@sparc.science">curation@sparc.science.</a>
            `,
          });
          throw errorArray;
        }

        //Pull the dataset folders and files from Pennsieve\
        window.sodaJSONObj["bf-dataset-selected"] = {};
        window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = selectedPennsieveDataset;
        window.sodaJSONObj["bf-account-selected"]["account-name"] = window.defaultBfAccount;
        const importProgressCircle = document.querySelector(
          "#guided_loading_pennsieve_dataset-organize"
        );
        importProgressCircle.classList.remove("hidden");

        try {
          let data = await window.bf_request_and_populate_dataset(
            window.sodaJSONObj,
            importProgressCircle,
            true
          );
          // Save a copy of the dataset structure used to make sure the user doesn't change it
          // on future progress continuations
          window.sodaJSONObj["initially-pulled-dataset-structure"] = JSON.parse(
            JSON.stringify(data["soda_object"]["dataset-structure"])
          );
          window.datasetStructureJSONObj = data["soda_object"]["dataset-structure"];
        } catch (error) {
          console.log(error);
          errorArray.push({
            type: "swal",
            title: "Error pulling dataset from Pennsieve",
            message: `Error message: ${userErrorMessage(error)}`,
          });
          throw errorArray;
        }

        // If there are folders and/or files in the dataset on Pennsieve, validate the structure and
        // extract various metadata from the dataset structure to prepare the guided workflow.
        if (
          Object.keys(window.datasetStructureJSONObj["folders"]).length > 0 ||
          Object.keys(window.datasetStructureJSONObj["files"]).length > 0
        ) {
          // Reject if any non-sparc folders are in the root of the dataset
          let invalidBaseFolders = [];
          for (const baseFolder of Object.keys(window.datasetStructureJSONObj["folders"])) {
            if (
              !guidedHighLevelFolders.includes(baseFolder) &&
              !nonGuidedHighLevelFolders.includes(baseFolder)
            ) {
              invalidBaseFolders.push(baseFolder);
            }
          }
          if (invalidBaseFolders.length > 0) {
            errorArray.push({
              type: "swal",
              title: "This dataset is not eligible to be edited via Guided Mode",
              message: `The following folders are not allowed in the root of your dataset: ${invalidBaseFolders.join(
                ", "
              )}`,
            });
            throw errorArray;
          }

          // Datasets pulled into Guided Mode should only have pool-folders or sub-folders inside of the primary, source,
          // and derivative high level folders. If this is not the case with the pulled dataset, reject it.
          const [invalidFolders, invalidFiles] = guidedCheckHighLevelFoldersForImproperFiles(
            window.datasetStructureJSONObj
          );
          if (invalidFolders.length > 0 || invalidFiles.length > 0) {
            errorArray.push({
              type: "swal",
              title: "This dataset is not eligible to be edited via Guided Mode",
              message: `
              Your primary, source, and derivative folders must only contain pool- folders or sub- folders when resuming a Pennsieve dataset via Guided Mode
              <br />
              <br />
              Please remove any folders or files that are not pool- folders or sub- folders from your primary, source, and derivative folders and try again.
            `,
            });
            throw errorArray;
          }

          // Extract the pool/subject/sample structure from the folders and files pulled from Pennsieve
          // Note: this Also adds the pool/subject/sample structure to the window.sodaJSONObj
          const datasetSubSamStructure = extractPoolSubSamStructureFromDataset(
            window.datasetStructureJSONObj
          );
          const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
          const subjects = [...subjectsInPools, ...subjectsOutsidePools];

          // If no subjects from the dataset structure are found and the dataset does have primary, source, or derivative folders,
          if (subjects.length === 0) {
            for (const highLevelFolder of guidedHighLevelFolders) {
              if (window.datasetStructureJSONObj["folders"][highLevelFolder]) {
                errorArray.push({
                  type: "swal",
                  title: "This dataset is not eligible to be edited via Guided Mode",
                  message: `
                  The dataset contains either the primary, source, or derivative folders, but no subjects were detected in the dataset structure.
                `,
                });
                throw errorArray;
              }
            }
            // Also throw an error if the dataset does not have a code folder (If the dataset does not contain subjects +prim/src/deriv, then it must have a code folder)
            if (!window.datasetStructureJSONObj["folders"]["code"]) {
              errorArray.push({
                type: "swal",
                title: "This dataset is not eligible to be edited via Guided Mode",
                message: `
                The dataset does not contain a code folder, which is required for datasets that do not contain primary, source, or derivative files.
              `,
              });
              throw errorArray;
            }
          }

          // If the dataset has subjects, then we need to fetch the subjects metadata from Pennsieve
          if (subjects.length > 0) {
            window.subjectsTableData = [];
            //Fetch subjects and sample metadata and set window.subjectsTableData and sampleTableData
            try {
              let fieldEntries = [];
              for (const field of $("#guided-form-add-a-subject")
                .children()
                .find(".subjects-form-entry")) {
                fieldEntries.push(field.name.toLowerCase());
              }
              const subjectsMetadataResponse = await client.get(
                `/prepare_metadata/import_metadata_file`,
                {
                  params: {
                    selected_account: window.defaultBfAccount,
                    selected_dataset: selectedPennsieveDatasetID,
                    file_type: "subjects.xlsx",
                    ui_fields: fieldEntries.toString(),
                  },
                }
              );
              // Set window.subjectsTableData as the res
              window.subjectsTableData = subjectsMetadataResponse.data.subject_file_rows;
            } catch (error) {
              const emessage = userErrorMessage(error);
              errorArray.push({
                type: "swal",
                title: "Unable to fetch subjects metadata to check dataset structure",
                message: `
                The following error occurred while trying to fetch subjects metadata from Pennsieve: ${emessage}
              `,
              });
              throw errorArray;
            }

            const [samplesInPools, samplesOutsidePools] =
              window.sodaJSONObj.getAllSamplesFromSubjects();
            const samples = [...samplesInPools, ...samplesOutsidePools];

            window.samplesTableData = [];

            if (samples.length > 0) {
              try {
                let fieldEntries = [];
                for (const field of $("#form-add-a-sample")
                  .children()
                  .find(".samples-form-entry")) {
                  fieldEntries.push(field.name.toLowerCase());
                }
                let samplesMetadataResponse = await client.get(
                  `/prepare_metadata/import_metadata_file`,
                  {
                    params: {
                      selected_account: window.defaultBfAccount,
                      selected_dataset: selectedPennsieveDatasetID,
                      file_type: "samples.xlsx",
                      ui_fields: fieldEntries.toString(),
                    },
                  }
                );
                // Set the window.samplesTableData as the samples metadata response
                window.samplesTableData = samplesMetadataResponse.data.sample_file_rows;
              } catch (error) {
                const emessage = userErrorMessage(error);
                errorArray.push({
                  type: "swal",
                  title: "Unable to fetch samples metadata to check dataset structure",
                  message: `
                The following error occurred while trying to fetch samples metadata from Pennsieve: ${emessage}
              `,
                });
                throw errorArray;
              }
            }

            // If window.subjectsTableData was found, check if the subject/sample metadata has the same structure as the
            // dataset structure. If subject and sample metadata were not found, reset it and we'll add the metadata later
            const metadataSubSamStructure = createGuidedStructureFromSubSamMetadata(
              window.subjectsTableData.slice(1),
              window.samplesTableData.slice(1)
            );

            if (!objectsHaveSameKeys(metadataSubSamStructure, datasetSubSamStructure)) {
              errorArray.push({
                type: "swal",
                title: "This dataset is not eligible to be edited via Guided Mode",
                message: `
                Your dataset's structure does not align with your dataset's subject and sample metadata.
                <br />
                <br />
                Please ensure your subject and sample metadata files match the structure of your dataset folders and try again.
              `,
              });
              throw errorArray;
            }
          }

          // Pre-select the buttons that ask if the dataset contains *hlf* data based on the imported dataset structure
          for (const hlf of nonGuidedHighLevelFolders) {
            if (window.datasetStructureJSONObj["folders"][hlf]) {
              window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-data`] = "yes";
            } else {
              window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-data`] = "no";
            }
          }
        }

        await Swal.fire({
          icon: "info",
          title: "Begining Pennsieve Dataset edit session",
          html: `
            Note: it is imperative that you do not manually make any changes to your dataset folders and files
            directly on Pennsieve while working on this dataset on SODA.
            <br />
            <br />
            If you do, all saved changes that you have made on SODA will be lost and you will have to start over.
          `,
          width: 500,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: `Got it!`,
          focusConfirm: true,
          allowOutsideClick: false,
        });

        // Set the json options for resuming a pennsieve dataset from Pennsieve
        window.sodaJSONObj["starting-point"]["type"] = "bf";
        window.sodaJSONObj["generate-dataset"]["generate-option"] = "existing-bf";
        window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = selectedPennsieveDatasetID;
        window.sodaJSONObj["digital-metadata"]["name"] = selectedPennsieveDataset;

        const changesCheckRes = await checkIfChangesMetadataPageShouldBeShown(
          selectedPennsieveDatasetID
        );
        if (changesCheckRes.shouldShow === true) {
          window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changesCheckRes.changesMetadata;
          guidedUnSkipPage("guided-create-changes-metadata-tab");
        } else {
          window.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
          guidedSkipPage("guided-create-changes-metadata-tab");
        }

        // Skip the page where they confirm their log in and workspace because we should already have it
        window.sodaJSONObj["digital-metadata"]["dataset-workspace"] =
          guidedGetCurrentUserWorkSpace();
        guidedSkipPage("guided-pennsieve-intro-tab");
      }

      //Skip this page becausae we should not come back to it
      guidedSkipPage("guided-select-starting-point-tab");
    }

    if (pageBeingLeftID === "guided-ask-if-submission-is-sparc-funded-tab") {
      // NOTE: We use the button config generated by this page to determine if the dataset is SPARC funded
      // See the function: datasetIsSparcFunded()
      const userSelectedDatasetIsSparcFunded = document
        .getElementById("guided-button-dataset-is-sparc-funded")
        .classList.contains("selected");
      const userSelectedDatasetIsReJoinFunded = document
        .getElementById("guided-button-dataset-is-re-join-funded")
        .classList.contains("selected");
      const userSelectedDatasetIsOtherFunded = document
        .getElementById("guided-button-dataset-is-not-sparc-funded")
        .classList.contains("selected");

      if (
        !userSelectedDatasetIsSparcFunded &&
        !userSelectedDatasetIsReJoinFunded &&
        !userSelectedDatasetIsOtherFunded
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate the funding source for this dataset.",
        });
        throw errorArray;
      }

      // If the user selected that the dataset is SPARC funded, unskip the submission metadata page
      if (userSelectedDatasetIsSparcFunded) {
        // Set the consortium data standard value in the JSON
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] =
          "SPARC";
        const selectedFuncingSourceFromDropdown =
          useGlobalStore.getState()["dropDownState"]["guided-select-sparc-funding-consortium"]
            .selectedValue;

        // Throw an error if the user did not select a funding source from the dropdown
        if (!selectedFuncingSourceFromDropdown) {
          errorArray.push({
            type: "notyf",
            message: "Please select a funding source from the dropdown.",
          });
          throw errorArray;
        } else {
          // Set the funding consortium value in the JSON
          window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
            selectedFuncingSourceFromDropdown;
        }
      }

      if (userSelectedDatasetIsReJoinFunded) {
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] =
          "HEAL";
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
          "REJOIN-HEAL";
      }

      if (userSelectedDatasetIsOtherFunded) {
        const userSelectedTheyHaveReachedOutToCurationTeam = document
          .getElementById("guided-button-non-sparc-user-has-contacted-sparc")
          .classList.contains("selected");
        const userSelectedTheyHaveNotReachedOutToCurationTeam = document
          .getElementById("guided-button-non-sparc-user-has-not-contacted-sparc")
          .classList.contains("selected");

        if (
          !userSelectedTheyHaveReachedOutToCurationTeam &&
          !userSelectedTheyHaveNotReachedOutToCurationTeam
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if you have reached out to the curation team",
          });
          throw errorArray;
        }
        if (userSelectedTheyHaveNotReachedOutToCurationTeam) {
          errorArray.push({
            type: "notyf",
            message: "Please reach out to the curation team before continuing the curation process",
          });
          throw errorArray;
        }

        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] =
          "";
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
          "EXTERNAL";
      }

      const setConsortiumDataStandard =
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"];
      // If the set consortium data standard is SPARC, unskip the SPARC specific metadata pages
      if (setConsortiumDataStandard === "SPARC") {
        const setFundingConsortium =
          window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];
        if (setFundingConsortium === "SPARC") {
          // If the funding consortium is SPARC, unskip the protocols page
          guidedUnSkipPage("guided-protocols-tab");
        } else {
          // If the funding consortium is not SPARC, skip the protocols page
          guidedSkipPage("guided-protocols-tab");
        }
        guidedUnSkipPage("guided-create-submission-metadata-tab");
      } else {
        // If the set consortium data standard is not SPARC, skip the SPARC specific metadata pages
        guidedSkipPage("guided-create-submission-metadata-tab");
        guidedSkipPage("guided-protocols-tab");
        // Manually set the SPARC award number to "EXTERNAL" for non-SPARC funded datasets (case for all non-SPARC funded datasets)
        window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = "";
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = [""];
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] = "";
      }
    }

    if (pageBeingLeftID === "guided-name-subtitle-tab") {
      const datasetNameInput = useGlobalStore.getState().guidedDatasetName.trim();
      const datasetSubtitleInput = useGlobalStore.getState().guidedDatasetSubtitle.trim();

      //Throw error if no dataset name or subtitle were added
      if (!datasetNameInput) {
        errorArray.push({
          type: "notyf",
          message: "Please enter a dataset name.",
        });
      }

      const datasetNameContainsForbiddenCharacters = window.evaluateStringAgainstSdsRequirements(
        datasetNameInput,
        "string-contains-forbidden-characters"
      );
      if (datasetNameContainsForbiddenCharacters) {
        errorArray.push({
          type: "notyf",
          message: `A Pennsieve dataset name cannot contain any of the following characters: @#$%^&*()+=/\|"'~;:<>{}[]?`,
        });
      }
      if (!datasetSubtitleInput) {
        errorArray.push({
          type: "notyf",
          message: "Please enter a dataset subtitle.",
        });
      }

      if (errorArray.length > 0) {
        throw errorArray;
      }

      const currentDatasetName = window.sodaJSONObj["digital-metadata"]["name"];
      if (currentDatasetName) {
        // Update the progress file path name and banner image path if needed
        if (datasetNameInput !== currentDatasetName) {
          const currentProgressFileNames = getGuidedProgressFileNames();
          if (currentProgressFileNames.includes(datasetNameInput)) {
            errorArray.push({
              type: "notyf",
              message: `Unable to change dataset name to: ${datasetNameInput}. A dataset with that name already exists.`,
            });
            throw errorArray;
          }
          updateGuidedDatasetName(datasetNameInput);
          window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
        } else {
          window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
        }
      } else {
        const currentProgressFileNames = getGuidedProgressFileNames();
        if (currentProgressFileNames.includes(datasetNameInput)) {
          errorArray.push({
            type: "notyf",
            message: `A progress file already exists for the dataset: ${datasetNameInput}. Please enter a different dataset name.`,
          });
          throw errorArray;
        }
        window.sodaJSONObj["digital-metadata"]["name"] = datasetNameInput;
        window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitleInput;
      }
    }

    if (pageBeingLeftID === "guided-prepare-dataset-structure-tab") {
      const selectedEntities = useGlobalStore.getState()["selectedEntities"];
      console.log("selectedEntities", selectedEntities);
      if (selectedEntities.length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please select at least one option that applies to your dataset",
        });
        throw errorArray;
      }
      console.log("selectedEntities", selectedEntities);
      window.sodaJSONObj["selected-entities"] = selectedEntities;
      console.log("selectedEntities", selectedEntities);

      if (!selectedEntities.includes("subjects") && !selectedEntities.includes("code")) {
        errorArray.push({
          type: "notyf",
          message: "You must indicate that your dataset contains subjects and/or code",
        });
        throw errorArray;
      }

      if (selectedEntities.includes("subjects")) {
        guidedUnSkipPage("guided-subjects-entity-addition-tab");
        guidedUnSkipPage("guided-subjects-entity-selection-tab");
        guidedUnSkipPage("guided-unstructured-data-import-tab");
        guidedUnSkipPage("guided-create-subjects-metadata-tab");
      } else {
        guidedSkipPage("guided-subjects-entity-addition-tab");
        guidedSkipPage("guided-subjects-entity-selection-tab");
        guidedSkipPage("guided-unstructured-data-import-tab");
        guidedSkipPage("guided-create-subjects-metadata-tab");
      }

      if (selectedEntities.includes("samples")) {
        guidedUnSkipPage("guided-samples-entity-addition-tab");
        guidedUnSkipPage("guided-samples-entity-selection-tab");
        guidedUnSkipPage("guided-create-samples-metadata-tab");
      } else {
        guidedSkipPage("guided-samples-entity-addition-tab");
        guidedSkipPage("guided-samples-entity-selection-tab");
        guidedSkipPage("guided-create-samples-metadata-tab");
      }

      if (selectedEntities.includes("sites")) {
        guidedUnSkipPage("guided-sites-entity-addition-tab");
        guidedUnSkipPage("guided-sites-entity-selection-tab");
        guidedUnSkipPage("guided-create-sites-metadata-tab");
      } else {
        guidedSkipPage("guided-sites-entity-addition-tab");
        guidedSkipPage("guided-sites-entity-selection-tab");
        guidedSkipPage("guided-create-sites-metadata-tab");
      }

      if (selectedEntities.includes("performances")) {
        guidedUnSkipPage("guided-performances-entity-addition-tab");
        guidedUnSkipPage("guided-performances-entity-selection-tab");
        guidedUnSkipPage("guided-create-performances-metadata-tab");
      } else {
        guidedSkipPage("guided-performances-entity-addition-tab");
        guidedSkipPage("guided-performances-entity-selection-tab");
        guidedSkipPage("guided-create-performances-metadata-tab");
      }

      if (selectedEntities.includes("code")) {
        guidedUnSkipPage("guided-code-folder-tab");
      } else {
        guidedSkipPage("guided-code-folder-tab");
      }
    }

    if (pageBeingLeftID === "guided-subjects-addition-tab") {
      if (window.getExistingSubjectNames().length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please add at least one subject",
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-samples-addition-tab") {
      const userSelectedDatasetHasSamples = document
        .getElementById("guided-button-samples-page-subjects-have-samples")
        .classList.contains("selected");
      const userSelectedDatasetDoesNotHaveSamples = document
        .getElementById("guided-button-samples-page-subjects-do-not-have-samples")
        .classList.contains("selected");

      if (!userSelectedDatasetHasSamples && !userSelectedDatasetDoesNotHaveSamples) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate whether or not the dataset contains samples",
        });
        throw errorArray;
      }

      const samples = getExistingSampleNames();

      if (userSelectedDatasetHasSamples) {
        if (samples.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please add at least one sample to a subject",
          });
          throw errorArray;
        }
        //Unskip the sample file annotation page
        guidedUnSkipPage(`guided-manifest-sample-entity-selector-tab`);

        //Unskip the samples metadata page
        guidedUnSkipPage(`guided-create-samples-metadata-tab`);
      }
      if (userSelectedDatasetDoesNotHaveSamples) {
        if (samples.length > 0) {
          document.getElementById("guided-button-samples-page-subjects-have-samples").click();
          errorArray.push({
            type: "notyf",
            message:
              "Please indicate that your dataset contains samples or delete the samples you have added.",
          });
          throw errorArray;
        }

        //Skip the sample data organization pages
        guidedSkipPage(`guided-manifest-sample-entity-selector-tab`);
        //Skip the samples metadata page
        guidedSkipPage(`guided-create-samples-metadata-tab`);
      }

      const userSelectedDatasetIsReJoinFunded = document
        .getElementById("guided-button-dataset-is-re-join-funded")
        .classList.contains("selected");

      if (userSelectedDatasetIsReJoinFunded) {
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] =
          "HEAL";
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
          "REJOIN-HEAL";
      }
    }

    if (pageBeingLeftID === "guided-manifest-subject-entity-selector-tab") {
      window.sodaJSONObj["subject-related-folders-and-files"] = getEntityObjForEntityType(
        "subject-related-folders-and-files"
      );
      console.log(
        "subject-related-folders-and-files",
        window.sodaJSONObj["subject-related-folders-and-files"]
      );
    }
    if (pageBeingLeftID === "guided-manifest-sample-entity-selector-tab") {
      window.sodaJSONObj["sample-related-folders-and-files"] = getEntityObjForEntityType(
        "sample-related-folders-and-files"
      );
      console.log(
        "sample-related-folders-and-files",
        window.sodaJSONObj["sample-related-folders-and-files"]
      );
    }
    if (pageBeingLeftID === "guided-manifest-performance-entity-selector-tab") {
      window.sodaJSONObj["performance-related-folders-and-files"] = getEntityObjForEntityType(
        "performance-related-folders-and-files"
      );
      console.log(
        "performance-related-folders-and-files",
        window.sodaJSONObj["performance-related-folders-and-files"]
      );
    }

    if (pageBeingLeftID === "guided-subject-structure-spreadsheet-importation-tab") {
      const userChoseToImportSubsSamsPoolsViaSpreadsheet = document
        .getElementById("guided-button-import-subject-structure-from-spreadsheet")
        .classList.contains("selected");
      const userChoseToEnterSubsSamsPoolsManually = document
        .getElementById("guided-button-add-subject-structure-manually")
        .classList.contains("selected");

      if (!userChoseToImportSubsSamsPoolsViaSpreadsheet && !userChoseToEnterSubsSamsPoolsManually) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate how you would like to add your subject structure",
        });
        throw errorArray;
      }

      if (userChoseToImportSubsSamsPoolsViaSpreadsheet) {
        const userSelectedDatasetHasPools = document
          .getElementById("guided-button-spreadsheet-subjects-are-pooled")
          .classList.contains("selected");
        const userSelectedDatasetDoesNotHavePools = document
          .getElementById("guided-button-spreadsheet-subjects-are-not-pooled")
          .classList.contains("selected");
        if (!userSelectedDatasetHasPools && !userSelectedDatasetDoesNotHavePools) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate whether or not the dataset contains pools",
          });
          throw errorArray;
        }

        const userSelectedSubjectsHaveSamples = document
          .getElementById("guided-button-spreadsheet-subjects-have-samples")
          .classList.contains("selected");
        const userSelectedSubjectsDoNotHaveSamples = document
          .getElementById("guided-button-spreadsheet-subjects-do-not-have-samples")
          .classList.contains("selected");
        if (!userSelectedSubjectsHaveSamples && !userSelectedSubjectsDoNotHaveSamples) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate whether or not the dataset contains samples",
          });
          throw errorArray;
        }

        const subjects = window.getExistingSubjectNames();
        if (subjects.length === 0) {
          errorArray.push({
            type: "swal",
            message: `
              You indicated that you would like to import your subject structure from a spreadsheet, however,
              you have not added any subjects.
              <br/><br/>
              Please fill out and import the spreadsheet or select that you would not like to add your subject structure via a spreadsheet.
            `,
          });
          throw errorArray;
        }
      }
    }

    if (pageBeingLeftID === "guided-primary-data-organization-tab") {
      cleanUpEmptyFoldersFromGeneratedGuidedStructure("primary");
    }

    if (pageBeingLeftID === "guided-source-data-organization-tab") {
      cleanUpEmptyFoldersFromGeneratedGuidedStructure("source");
    }

    if (pageBeingLeftID === "guided-derivative-data-selection-tab") {
      cleanUpEmptyFoldersFromGeneratedGuidedStructure("derivative");
    }

    if (pageBeingLeftID === "guided-code-folder-tab") {
    }

    if (pageBeingLeftID === "guided-protocol-folder-tab") {
    }

    if (pageBeingLeftID === "guided-docs-folder-tab") {
    }

    if (pageBeingLeftID === "guided-create-subjects-metadata-tab") {
      //Save the subject metadata from the subject currently being modified
      window.addSubject("guided");

      const subjectsAsideItemsCount = document.querySelectorAll(
        ".subjects-metadata-aside-item"
      ).length;
      const subjectsInTableDataCount = window.subjectsTableData.length - 1;
      if (subjectsAsideItemsCount !== subjectsInTableDataCount) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          title: "Continue without adding subject metadata to all subjects?",
          text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add subject metadata for all subjects.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Finish adding metadata to all subjects",
          cancelButtonText: "Continue without adding metadata to all subjects",
        });
        if (result.isConfirmed) {
          throw new Error("Returning to subject metadata addition page to complete all fields");
        }
      }
    }

    if (pageBeingLeftID === "guided-create-samples-metadata-tab") {
      //Save the sample metadata from the sample currently being modified
      window.addSample("guided");

      const samplesAsideItemsCount = document.querySelectorAll(
        ".samples-metadata-aside-item"
      ).length;
      const samplesInTableDataCount = window.samplesTableData.length - 1;
      if (samplesAsideItemsCount !== samplesInTableDataCount) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          title: "Continue without adding sample metadata to all samples?",
          text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add sample metadata for all samples.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Finish adding metadata to all samples",
          cancelButtonText: "Continue without adding metadata to all samples",
        });
        if (result.isConfirmed) {
          throw new Error("Returning to sample metadata addition page to complete all fields");
        }
      }
    }

    if (pageBeingLeftID === "guided-add-code-metadata-tab") {
      const startNewCodeDescYesNoContainer = document.getElementById(
        "guided-section-start-new-code-metadata-query"
      );
      const startPennsieveCodeDescYesNoContainer = document.getElementById(
        "guided-section-start-from-pennsieve-code-metadata-query"
      );

      if (!startNewCodeDescYesNoContainer.classList.contains("hidden")) {
        const buttonYesComputationalModelingData = document.getElementById(
          "guided-button-has-computational-modeling-data"
        );
        const buttonNoComputationalModelingData = document.getElementById(
          "guided-button-no-computational-modeling-data"
        );

        if (
          !buttonYesComputationalModelingData.classList.contains("selected") &&
          !buttonNoComputationalModelingData.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please specify if your dataset contains computational modeling data",
          });
          throw errorArray;
        }

        if (buttonYesComputationalModelingData.classList.contains("selected")) {
          const codeDescriptionPathElement = document.getElementById(
            "guided-code-description-para-text"
          );
          //check if the innerhtml of the code description path element is a valid path
          if (codeDescriptionPathElement.innerHTML === "") {
            errorArray.push({
              type: "notyf",
              message: "Please import your code description file",
            });
            throw errorArray;
          }

          const codeDescriptionPath = codeDescriptionPathElement.innerHTML;
          //Check if the code description file is valid
          if (!window.fs.existsSync(codeDescriptionPath)) {
            errorArray.push({
              type: "notyf",
              message: "The imported code_description file does not exist at the selected path",
            });
            throw errorArray;
          }
        }

        if (buttonNoComputationalModelingData.classList.contains("selected")) {
          //If the user had imported a code description file, remove it
          if (window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
            delete window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
          }
        }
      }
      if (!startPennsieveCodeDescYesNoContainer.classList.contains("hidden")) {
        const buttonUpdateCodeDescription = document.getElementById(
          "guided-button-update-code-description-on-pennsieve"
        );
        const buttonKeepCodeDescription = document.getElementById(
          "guided-button-keep-code-description-on-pennsieve"
        );

        if (
          !buttonUpdateCodeDescription.classList.contains("selected") &&
          !buttonKeepCodeDescription.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message:
              "Please specify if you would like to update your code_description file on Pennsieve",
          });
          throw errorArray;
        }

        if (buttonUpdateCodeDescription.classList.contains("selected")) {
          const codeDescriptionPathElement = document.getElementById(
            "guided-code-description-para-text"
          );
          //check if the innerhtml of the code description path element is a valid path
          if (codeDescriptionPathElement.innerHTML === "") {
            errorArray.push({
              type: "notyf",
              message: "Please import your code description file",
            });
            throw errorArray;
          }

          const codeDescriptionPath = codeDescriptionPathElement.innerHTML;
          //Check if the code description file is valid
          if (!window.fs.existsSync(codeDescriptionPath)) {
            errorArray.push({
              type: "notyf",
              message: "The imported code_description file does not exist at the selected path",
            });
            throw errorArray;
          }
        }

        if (buttonKeepCodeDescription.classList.contains("selected")) {
          //If the user had imported a code description file, remove it
          if (window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
            delete window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
          }
        }
      }
    }

    if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
      const confirmAccountbutton = document.getElementById(
        "guided-confirm-pennsieve-account-button"
      );
      if (!confirmAccountbutton.classList.contains("selected")) {
        if (!window.defaultBfAccount) {
          // If the user has not logged in, throw an error
          errorArray.push({
            type: "notyf",
            message: "Please sign in to Pennsieve before continuing",
          });
          throw errorArray;
        } else {
          // If the user has not confirmed their account, throw an error
          errorArray.push({
            type: "notyf",
            message: "Please confirm your account before continuing",
          });
          throw errorArray;
        }
      }

      const confirmOrganizationButton = document.getElementById(
        "guided-confirm-pennsieve-organization-button"
      );
      const userSelectedWorkSpace = guidedGetCurrentUserWorkSpace();

      if (!userSelectedWorkSpace) {
        // If the user has not selected an organization, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please select an organization before continuing",
        });
        throw errorArray;
      } else {
        window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = userSelectedWorkSpace;
      }

      if (!confirmOrganizationButton.classList.contains("selected")) {
        // If the user has not confirmed their organization, throw an error
        errorArray.push({
          type: "notyf",
          message: "Please confirm your organization before continuing",
        });
        throw errorArray;
      }

      const pennsieveAgentChecksPassed = await window.getPennsieveAgentStatus();
      if (!pennsieveAgentChecksPassed) {
        window.unHideAndSmoothScrollToElement("guided-mode-post-log-in-pennsieve-agent-check");
        errorArray.push({
          type: "notyf",
          message: "The Pennsieve Agent must be installed and running to continue.",
        });
        throw errorArray;
      }

      window.sodaJSONObj["last-confirmed-bf-account-details"] = window.defaultBfAccount;
      window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] = userSelectedWorkSpace;
    }

    if (pageBeingLeftID === "guided-assign-license-tab") {
      const licenseRadioButtonContainer = document.getElementById(
        "guided-license-radio-button-container"
      );
      // Get the button that contains the class selected
      const selectedLicenseButton =
        licenseRadioButtonContainer.getElementsByClassName("selected")[0];
      if (!selectedLicenseButton) {
        errorArray.push({
          type: "notyf",
          message: "Please select a license",
        });
        throw errorArray;
      }
      const selectedLicense = selectedLicenseButton.dataset.value;
      window.sodaJSONObj["digital-metadata"]["license"] = selectedLicense;
    }

    if (pageBeingLeftID === "guided-dataset-structure-review-tab") {
      //if folders and files in datasetStruture json obj are empty, warn the user
      if (
        Object.keys(window.datasetStructureJSONObj["folders"]).length === 0 &&
        Object.keys(window.datasetStructureJSONObj["files"]).length === 0
      ) {
        errorArray.push({
          type: "swal",
          message: `
            You have not added any files or folders to your dataset structure.
            <br/><br/>
            Please add files and folders to your dataset structure before continuing.
          `,
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-create-submission-metadata-tab") {
      const award = document.getElementById("guided-submission-sparc-award-manual").value;
      const milestones = window.getTagsFromTagifyElement(window.guidedSubmissionTagsTagifyManual);
      const completionDate = document.getElementById(
        "guided-submission-completion-date-manual"
      ).value;

      const fundingConsortiumIsSparc = datasetIsSparcFunded();

      if (fundingConsortiumIsSparc && award === "") {
        errorArray.push({
          type: "notyf",
          message: "Please add a SPARC award number to your submission metadata",
        });
        throw errorArray;
      }

      // save the award string to JSONObj to be shared with other award inputs
      window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
      //Save the data and milestones to the window.sodaJSONObj
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
        completionDate;
    }

    if (pageBeingLeftID === "guided-contributors-tab") {
      // Make sure the user has added at least one contributor
      const contributors =
        window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
      if (contributors.length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please add at least one contributor to your dataset",
        });
        throw errorArray;
      }

      // Make sure that all contributors have a valid fields
      for (const contributor of contributors) {
        if (!window.contributorDataIsValid(contributor)) {
          errorArray.push({
            type: "notyf",
            message: "Please make sure all contributors have valid metadata",
          });
          throw errorArray;
        }
      }
    }

    if (pageBeingLeftID === "guided-protocols-tab") {
      const buttonYesUserHasProtocols = document.getElementById("guided-button-user-has-protocols");
      const buttonNoDelayProtocolEntry = document.getElementById(
        "guided-button-delay-protocol-entry"
      );
      if (
        !buttonYesUserHasProtocols.classList.contains("selected") &&
        !buttonNoDelayProtocolEntry.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if protocols are ready to be added to your dataset",
        });
        throw errorArray;
      }

      if (buttonYesUserHasProtocols.classList.contains("selected")) {
        const protocols =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

        if (protocols.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please add at least one protocol",
          });
          throw errorArray;
        }

        const unFairProtocols = protocols.filter((protocol) => protocol["isFair"] === false);
        if (unFairProtocols.length > 0) {
          errorArray.push({
            type: "notyf",
            message:
              "Some of your protocols are missing data. Please edit all invalid rows in the table.",
          });
          throw errorArray;
        }
      }

      if (buttonNoDelayProtocolEntry.classList.contains("selected")) {
        window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
      }
    }

    if (pageBeingLeftID === "guided-create-description-metadata-tab") {
      try {
        guidedSaveDescriptionDatasetInformation();
        guidedSaveDescriptionStudyInformation();
        guidedSaveDescriptionContributorInformation();
      } catch (error) {
        console.log(error);
        errorArray.push({
          type: "notyf",
          message: error,
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
      const readMeTextArea = document.getElementById("guided-textarea-create-readme");
      if (readMeTextArea.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please enter a README for your dataset",
        });
        throw errorArray;
      } else {
        const readMe = readMeTextArea.value.trim();
        window.sodaJSONObj["dataset-metadata"]["README"] = readMe;
      }
    }

    if (pageBeingLeftID === "guided-create-changes-metadata-tab") {
      const changesTextArea = document.getElementById("guided-textarea-create-changes");
      if (changesTextArea.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please enter CHANGES for your dataset",
        });
        throw errorArray;
      } else {
        const changes = changesTextArea.value.trim();
        window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changes;
      }
    }
    if (pageBeingLeftID === "guided-create-local-copy-tab") {
      // If the user generated a local copy of the dataset, ask them if they would like to delete it
      if (window.fs.existsSync(window.sodaJSONObj["path-to-local-dataset-copy"])) {
        if (!window.sodaJSONObj["user-confirmed-to-keep-local-copy"]) {
          const deleteLocalCopy = await swalConfirmAction(
            null,
            "Would you like SODA to delete your local dataset copy?",
            "Deleting your local dataset copy will free up space on your computer.",
            "Yes",
            "No"
          );
          if (deleteLocalCopy) {
            // User chose to delete the local copy
            window.fs.rmdirSync(window.sodaJSONObj["path-to-local-dataset-copy"], {
              recursive: true,
            });
            delete window.sodaJSONObj["path-to-local-dataset-copy"];
            delete window.sodaJSONObj["user-confirmed-to-keep-local-copy"];
          } else {
            // User chose to keep the local copy so set the user-confirmed-to-keep-local-copy to true
            // So they don't get asked again
            window.sodaJSONObj["user-confirmed-to-keep-local-copy"] = true;
          }
        }
      }
      window.sodaJSONObj["path-to-local-dataset-copy"];
    }

    if (pageBeingLeftID === "guided-dataset-dissemination-tab") {
      //Save the DOI information of the dataset
      window.sodaJSONObj["digital-metadata"]["doi"] = $("#guided--para-doi-info").text();
      // Reset the share with curation UI and DOI UI
      $("#guided--prepublishing-checklist-container").addClass("hidden");
      $("#guided--para-doi-info").text("");
      $("#guided-button-unshare-dataset-with-curation-team");
    }

    if (pageBeingLeftID === "guided-dataset-validation-tab") {
      const guidedButtonRunValidation = document.getElementById(
        "guided-button-run-dataset-validation"
      );
      const guidedButtonSkipValidation = document.getElementById(
        "guided-button-skip-dataset-validation"
      );
      if (
        !guidedButtonRunValidation.classList.contains("selected") &&
        !guidedButtonSkipValidation.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if you would like to run validation on your dataset",
        });
        throw errorArray;
      }

      if (guidedButtonRunValidation.classList.contains("selected")) {
        if (!window.sodaJSONObj["dataset-validated"] === "true") {
          errorArray.push({
            type: "notyf",
            message: "This check can be removed to make validation unnecessary",
          });
          throw errorArray;
        }
      }
      if (guidedButtonSkipValidation.classList.contains("selected")) {
        // We don't have to do anything here.
      }
    }

    // Stop any animations that need to be stopped
    startOrStopAnimationsInContainer(pageBeingLeftID, "stop");

    try {
      await guidedSaveProgress();
    } catch (error) {
      window.log.error(error);
    }
  } catch (error) {
    guidedSetNavLoadingState(false);
    console.log(error);
    throw error;
  }

  guidedSetNavLoadingState(false);
};

const getNonSkippedGuidedModePages = (parentElementToGetChildrenPagesFrom) => {
  let allChildPages = Array.from(
    parentElementToGetChildrenPagesFrom.querySelectorAll(".guided--page")
  );
  const nonSkippedChildPages = allChildPages.filter((page) => {
    return page.dataset.skipPage != "true";
  });

  return nonSkippedChildPages;
};

const renderSideBar = (activePage) => {
  const guidedNavItemsContainer = document.getElementById("guided-nav-items");
  const guidedPageNavigationHeader = document.getElementById("guided-page-navigation-header");

  if (activePage === "guided-dataset-dissemination-tab") {
    //Hide the side bar navigawtion and navigation header
    guidedPageNavigationHeader.classList.add("hidden");
    guidedNavItemsContainer.innerHTML = ``;
    return;
  }
  //Show the page navigation header if it had been previously hidden
  guidedPageNavigationHeader.classList.remove("hidden");

  const completedTabs = window.sodaJSONObj["completed-tabs"];

  const pageStructureObject = {};

  const highLevelStepElements = Array.from(document.querySelectorAll(".guided--parent-tab"));

  for (const element of highLevelStepElements) {
    const highLevelStepName = element.getAttribute("data-parent-tab-name");
    pageStructureObject[highLevelStepName] = {};

    const notSkippedPages = getNonSkippedGuidedModePages(element);

    for (const page of notSkippedPages) {
      const pageName = page.getAttribute("data-page-name");
      const pageID = page.getAttribute("id");
      pageStructureObject[highLevelStepName][pageID] = {
        pageName: pageName,
        completed: completedTabs.includes(pageID),
      };
    }
  }
  let navBarHTML = "";
  for (const [highLevelStepName, highLevelStepObject] of Object.entries(pageStructureObject)) {
    // Add the high level drop down to the nav bar
    const dropdDown = `
    <div class="guided--nav-bar-dropdown">
      <p class="help-text mb-0">
        ${highLevelStepName}
      </p>
      <i class="fas fa-chevron-right"></i>
    </div>
  `;

    // Add the high level drop down's children links to the nav bar
    let dropDownContent = ``;
    for (const [pageID, pageObject] of Object.entries(highLevelStepObject)) {
      //add but keep hidden for now!!!!!!!!!!!!!!!!!!
      dropDownContent += `
      <div
        class="
          guided--nav-bar-section-page
          hidden
          ${pageObject.completed ? " completed" : " not-completed"}
          ${pageID === activePage ? "active" : ""}"
        data-target-page="${pageID}"
      >
        <div class="guided--nav-bar-section-page-title">
          ${pageObject.pageName}
        </div>
      </div>
    `;
    }

    // Add each section to the nav bar element
    const dropDownContainer = `
      <div class="guided--nav-bar-section">
        ${dropdDown}
        ${dropDownContent}  
      </div>
    `;
    navBarHTML += dropDownContainer;
  }
  guidedNavItemsContainer.innerHTML = navBarHTML;

  const guidedNavBarDropdowns = Array.from(document.querySelectorAll(".guided--nav-bar-dropdown"));
  for (const guidedNavBarDropdown of guidedNavBarDropdowns) {
    guidedNavBarDropdown.addEventListener("click", () => {
      //remove hidden from child elements with guided--nav-bar-section-page class
      const guidedNavBarSectionPage = guidedNavBarDropdown.parentElement.querySelectorAll(
        ".guided--nav-bar-section-page"
      );
      for (const guidedNavBarSectionPageElement of guidedNavBarSectionPage) {
        guidedNavBarSectionPageElement.classList.toggle("hidden");
      }
      //toggle the chevron
      const chevron = guidedNavBarDropdown.querySelector("i");
      chevron.classList.toggle("fa-chevron-right");
      chevron.classList.toggle("fa-chevron-down");
    });

    //click the dropdown if it has a child element with data-target-page that matches the active page
    if (guidedNavBarDropdown.parentElement.querySelector(`[data-target-page="${activePage}"]`)) {
      guidedNavBarDropdown.click();
    }
  }

  const guidedNavBarSectionPages = Array.from(
    document.querySelectorAll(".guided--nav-bar-section-page")
  );
  for (const guidedNavBarSectionPage of guidedNavBarSectionPages) {
    guidedNavBarSectionPage.addEventListener("click", async () => {
      const currentPageUserIsLeaving = window.CURRENT_PAGE.id;
      const pageToNavigateTo = guidedNavBarSectionPage.getAttribute("data-target-page");
      const pageToNaviatetoName = document
        .getElementById(pageToNavigateTo)
        .getAttribute("data-page-name");

      // Do nothing if the user clicks the tab of the page they are currently on
      if (currentPageUserIsLeaving === pageToNavigateTo) {
        return;
      }

      try {
        await savePageChanges(currentPageUserIsLeaving);
        const allNonSkippedPages = getNonSkippedGuidedModePages(document).map(
          (element) => element.id
        );
        // Get the pages in the allNonSkippedPages array that cone after the page the user is leaving
        // and before the page the user is going to
        const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
          allNonSkippedPages.indexOf(currentPageUserIsLeaving),
          allNonSkippedPages.indexOf(pageToNavigateTo)
        );

        //If the user is skipping forward with the nav bar, pages between current page and target page
        //Need to be validated. If they're going backwards, the for loop below will not be ran.
        for (const page of pagesBetweenCurrentAndTargetPage) {
          try {
            await checkIfPageIsValid(page);
          } catch (error) {
            const pageWithErrorName = document.getElementById(page).getAttribute("data-page-name");
            await window.openPage(page);
            await Swal.fire({
              title: `An error occured on an intermediate page: ${pageWithErrorName}`,
              html: `Please address the issues before continuing to ${pageToNaviatetoName}:
                <br />
                <br />
                <ul>
                  ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
                </ul>
              `,
              icon: "info",
              confirmButtonText: "Fix the errors on this page",
              focusConfirm: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              width: 700,
            });
            return;
          }
        }

        //All pages have been validated. Open the target page.
        await window.openPage(pageToNavigateTo);
      } catch (error) {
        const pageWithErrorName = window.CURRENT_PAGE.dataset.pageName;
        const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
          title: "The current page was not able to be saved",
          html: `The following error${
            error.length > 1 ? "s" : ""
          } occurred when attempting to save the ${pageWithErrorName} page:
            <br />
            <br />
            <ul>
              ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
            </ul>
            <br />
            Would you like to continue without saving the changes to the current page?`,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Yes, continue without saving",
          cancelButtonText: "No, I would like to address the errors",
          confirmButtonWidth: 255,
          cancelButtonWidth: 255,
          focusCancel: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          width: 700,
        });
        if (continueWithoutSavingCurrPageChanges) {
          await window.openPage(pageToNavigateTo);
        }
      }
    });
  }

  const nextPagetoComplete = guidedNavItemsContainer.querySelector(
    ".guided--nav-bar-section-page.not-completed"
  );
  if (nextPagetoComplete) {
    nextPagetoComplete.classList.remove("not-completed");
    //Add pulse blue animation for 3 seconds
    nextPagetoComplete.style.borderLeft = "3px solid #007bff";
    nextPagetoComplete.style.animation = "pulse-blue 3s Infinity";
  }
};

const updateDatasetUploadProgressTable = (destination, progressObject) => {
  const datasetUploadTableBody = document.getElementById(
    `guided-tbody-${destination}-generation-status`
  );
  //delete datasetUPloadTableBody children with class "generation-status-tr"
  const uploadStatusTRs = datasetUploadTableBody.querySelectorAll(".generation-status-tr");
  for (const uploadStatusTR of uploadStatusTRs) {
    datasetUploadTableBody.removeChild(uploadStatusTR);
  }
  //remove dtasetUploadTableBody children that don't have the id guided-tr-progress-bar
  for (const child of datasetUploadTableBody.children) {
    if (!child.classList.contains("guided-tr-progress-bar")) {
      datasetUploadTableBody.removeChild(child);
    }
  }
  let uploadStatusElement = "";
  for (const [uploadStatusKey, uploadStatusValue] of Object.entries(progressObject))
    uploadStatusElement += `
      <tr class="generation-status-tr">
        <td class="middle aligned progress-bar-table-left">
          <b>${uploadStatusKey}:</b>
        </td>
        <td
          class="middle aligned remove-left-border" style="max-width: 500px; word-wrap: break-word;">${uploadStatusValue}</td>
      </tr>
    `;

  //insert adjustStatusElement at the end of datasetUploadTablebody
  datasetUploadTableBody.insertAdjacentHTML("beforeend", uploadStatusElement);
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

// This function extracts the pool, subject, and sample structure from an imported dataset
// and adds the pools, subjects, and samples to the guided mode structure if they exist.
// This function also handles setting the button config options, for example, if the function
// detects that there's primary subject data in the dataset, the yes button will be selected.
const extractPoolSubSamStructureFromDataset = (datasetStructure) => {
  const guidedFoldersInDataset = guidedHighLevelFolders.filter((folder) =>
    Object.keys(datasetStructure["folders"]).includes(folder)
  );

  const addedSubjects = [];
  const subjectsMovedIntoPools = [];
  const addedPools = [];
  const addedSamples = [];

  // Loop through prim, src, and deriv if they exist in the datasetStructure
  for (const hlf of guidedFoldersInDataset) {
    //Get the names of the subfolders directly in the hlf
    const hlfFolderNames = Object.keys(datasetStructure["folders"][hlf]["folders"]);
    const subjectFoldersInBase = hlfFolderNames.filter((folder) => folder.startsWith("sub-"));
    const poolFoldersInBase = hlfFolderNames.filter((folder) => folder.startsWith("pool-"));

    // Loop through any folders starting with sub- in the hlf
    for (const subjectFolder of subjectFoldersInBase) {
      if (!addedSubjects.includes(subjectFolder)) {
        try {
          window.sodaJSONObj.addSubject(subjectFolder);
          addedSubjects.push(subjectFolder);
        } catch (error) {
          console.log(error);
        }
      }
      // Get the names of the subfolders directly in the subject folder
      const potentialSampleFolderNames = Object.keys(
        datasetStructure["folders"][hlf]["folders"][subjectFolder]["folders"]
      );
      const sampleFoldersInSubject = potentialSampleFolderNames.filter((folder) =>
        folder.startsWith("sam-")
      );
      if (sampleFoldersInSubject.length > 0) {
        window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-sample-data`] = "yes";
      }
      // Loop through any folders starting with sam- in the subject folder
      for (const sampleFolder of sampleFoldersInSubject) {
        if (!addedSamples.includes(sampleFolder)) {
          try {
            window.sodaJSONObj.addSampleToSubject(sampleFolder, null, subjectFolder);
            addedSamples.push(sampleFolder);
          } catch (error) {
            console.log(error);
          }
        }
      }
    }

    if (subjectFoldersInBase.length > 0) {
      window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-subject-data`] = "yes";
    }

    // Loop through any folders starting with pool- in the hlf
    for (const poolFolder of poolFoldersInBase) {
      if (!addedPools.includes(poolFolder)) {
        try {
          window.sodaJSONObj.addPool(poolFolder);
          addedPools.push(poolFolder);
        } catch (error) {
          console.log(error);
        }
      }
      // Get the names of the subfolders directly in the pool folder
      const potentialSubjectFolderNames = Object.keys(
        datasetStructure["folders"][hlf]["folders"][poolFolder]["folders"]
      );
      const subjectFoldersInPool = potentialSubjectFolderNames.filter((folder) =>
        folder.startsWith("sub-")
      );

      if (subjectFoldersInPool.length > 0) {
        window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-subject-data`] = "yes";
      }
      // Loop through any folders starting with sub- in the pool folder
      for (const subjectFolder of subjectFoldersInPool) {
        if (!addedSubjects.includes(subjectFolder)) {
          try {
            window.sodaJSONObj.addSubject(subjectFolder);
            addedSubjects.push(subjectFolder);
          } catch (error) {
            console.log(error);
          }
        }

        if (!subjectsMovedIntoPools.includes(subjectFolder)) {
          try {
            window.sodaJSONObj.moveSubjectIntoPool(subjectFolder, poolFolder);
            subjectsMovedIntoPools.push(subjectFolder);
          } catch (error) {
            console.log(error);
          }
        }

        const potentialSampleFolderNames = Object.keys(
          datasetStructure["folders"][hlf]["folders"][poolFolder]["folders"][subjectFolder][
            "folders"
          ]
        );
        const sampleFoldersInSubject = potentialSampleFolderNames.filter((folder) =>
          folder.startsWith("sam-")
        );
        if (sampleFoldersInSubject.length > 0) {
          window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-sample-data`] = "yes";
        }
        // Loop through any folders starting with sam- in the subject folder
        for (const sampleFolder of sampleFoldersInSubject) {
          if (!addedSamples.includes(sampleFolder)) {
            try {
              window.sodaJSONObj.addSampleToSubject(sampleFolder, poolFolder, subjectFolder);
              addedSamples.push(sampleFolder);
            } catch (error) {
              console.log(error);
            }
          }
        }
      }
    }

    if (poolFoldersInBase.length > 0) {
      window.sodaJSONObj["button-config"][`dataset-contains-${hlf}-pool-data`] = "yes";
    }
  }

  if (addedSubjects.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-subjects"] = "yes";
  }
  if (addedPools.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-pools"] = "yes";
  } else {
    window.sodaJSONObj["button-config"]["dataset-contains-pools"] = "no";
  }
  if (addedSamples.length > 0) {
    window.sodaJSONObj["button-config"]["dataset-contains-samples"] = "yes";
  }

  return window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"];
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

// This function reads the innerText of the textSharedWithCurationTeamStatus element
// and hides or shows the share and unshare buttons accordingly
window.guidedSetCurationTeamUI = () => {
  const textSharedWithCurationTeamStatus = document.getElementById(
    "guided--para-review-dataset-info-disseminate"
  );
  if (textSharedWithCurationTeamStatus.innerText != "Dataset is not under review currently") {
    $("#guided-button-share-dataset-with-curation-team").addClass("hidden");
    $("#guided-button-unshare-dataset-with-curation-team").addClass("hidden");
    $("#guided-unshare-dataset-with-curation-team-message").removeClass("hidden");
  } else {
    $("#guided--prepublishing-checklist-container").addClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").addClass("hidden");
    $("#guided-button-share-dataset-with-curation-team").removeClass("hidden");
    $("#guided-button-unshare-dataset-with-curation-team").addClass("hidden");
    $("#guided-unshare-dataset-with-curation-team-message").addClass("hidden");
  }
};

// Function used to reserve a DOI for the current dataset and account
window.guidedReserveAndSaveDOI = async () => {
  let dataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  $("#curate-button-reserve-doi").addClass("loading");
  $("#curate-button-reserve-doi").disabled = true;

  let doiInformation = await api.reserveDOI(dataset);
  window.electron.ipcRenderer.send(
    "track-kombucha",
    kombuchaEnums.Category.DISSEMINATE_DATASETS,
    kombuchaEnums.Action.GUIDED_MODE,
    kombuchaEnums.Label.RESERVE_DOI,
    kombuchaEnums.Status.SUCCESS,
    { value: 1 }
  );
  guidedSetDOIUI(doiInformation);
};

// Function is for displaying DOI information on the Guided UI
const guidedSetDOIUI = (doiInformation) => {
  $("#curate-button-reserve-doi").removeClass("loading");
  $("#curate-button-reserve-doi").disabled = false;
  if (doiInformation === "locked") {
    // Show reserve DOI button and hide copy button
    // $("#guided-pennsieve-copy-doi").addClass("hidden");
    $("#curate-button-reserve-doi").addClass("hidden");

    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot reserve DOI",
      text: "Your dataset is locked, so modification is not allowed.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    return;
  }

  $("#guided--para-doi-info").text(doiInformation);

  if (doiInformation === "No DOI found for this dataset" || doiInformation === false) {
    // Hide the reserve DOI button and show copy button
    //  $("#guided-pennsieve-copy-doi").addClass("hidden");
    $("#curate-button-reserve-doi").removeClass("hidden");
  } else {
    // Show reserve DOI button and hide copy button
    // $("#guided-pennsieve-copy-doi").removeClass("hidden");
    $("#curate-button-reserve-doi").addClass("hidden");
  }
};

// This function is for when a user clicks the share/unshare with curation team (requires Dataset to be published and locked)
window.guidedModifyCurationTeamAccess = async (action) => {
  const guidedShareWithCurationTeamButton = document.getElementById(
    "guided-button-share-dataset-with-curation-team"
  );
  const guidedUnshareWithCurationTeamButton = document.getElementById(
    "guided-button-unshare-dataset-with-curation-team"
  );
  const guidedUnshareMessage = document.getElementById(
    "guided-unshare-dataset-with-curation-team-message"
  );
  const curationMode = "guided";

  if (action === "share") {
    guidedShareWithCurationTeamButton.disabled = true;
    guidedShareWithCurationTeamButton.classList.add("loading");

    let publishPreCheckStatus = await window.beginPrepublishingFlow(curationMode);
    let embargoDetails = publishPreCheckStatus[1];

    // Will return false if there are issues running the precheck flow
    if (publishPreCheckStatus[0]) {
      guidedShareWithCurationTeamButton.classList.add("hidden");
      await window.submitReviewDataset(embargoDetails[1], curationMode);
      guidedUnshareMessage.classList.remove("hidden");
    }
    guidedShareWithCurationTeamButton.classList.remove("loading");
    guidedShareWithCurationTeamButton.disabled = false;
  }
  if (action === "unshare") {
    // Add your dataset has been shared, to withdraw please do so from Pennsieve
    guidedUnshareWithCurationTeamButton.disabled = true;
    guidedUnshareWithCurationTeamButton.classList.add("loading");

    const { value: withdraw } = await Swal.fire({
      title: "Unshare this dataset from Curation Team?",
      icon: "warning",
      showDenyButton: true,
      confirmButtonText: "Yes",
      denyButtonText: "No",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    if (!withdraw) {
      guidedUnshareWithCurationTeamButton.disabled = false;
      guidedUnshareWithCurationTeamButton.classList.remove("loading");
      return;
    }

    let removeStatus = await withdrawDatasetSubmission("guided");

    if (removeStatus) {
      guidedUnshareWithCurationTeamButton.classList.add("hidden");
      guidedShareWithCurationTeamButton.classList.remove("hidden");
    }

    guidedUnshareWithCurationTeamButton.disabled = false;
    guidedUnshareWithCurationTeamButton.classList.remove("loading");
  }
};

const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  let datasetName = null;
  const datasetList = await api.getDatasetsForAccount();
  for (const dataset of datasetList) {
    if (dataset.name === datasetNameOrID || dataset.id === datasetNameOrID) {
      datasetName = dataset.name;
      break;
    }
  }
  return datasetName;
};

// Adds the click handlers to the info drop downs in Guided Mode
// The selectors also append the info icon before the label depending on data attributes
// passed in the HTML
const infoDropdowns = document.getElementsByClassName("info-dropdown");
for (const infoDropdown of Array.from(infoDropdowns)) {
  const infoTextElement = infoDropdown.querySelector(".info-dropdown-text");
  const dropdownType = infoTextElement.dataset.dropdownType;
  if (dropdownType === "info") {
    //insert the info icon before the text
    infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-info-circle"></i>`);
  }
  if (dropdownType === "warning") {
    //insert the warning icon before the text
    infoTextElement.insertAdjacentHTML(
      "beforebegin",
      ` <i class="fas fa-exclamation-triangle"></i>`
    );
  }

  infoDropdown.addEventListener("click", () => {
    const infoContainer = infoDropdown.nextElementSibling;
    const infoContainerChevron = infoDropdown.querySelector(".fa-chevron-right");

    const infoContainerIsopen = infoContainer.classList.contains("container-open");

    if (infoContainerIsopen) {
      infoContainerChevron.style.transform = "rotate(0deg)";
      infoContainer.classList.remove("container-open");
    } else {
      infoContainerChevron.style.transform = "rotate(90deg)";
      infoContainer.classList.add("container-open");
    }
  });
}

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

//Initialize description tagify variables as null
//to make them accessible to functions outside of $(document).ready
let guidedDatasetKeywordsTagify = null;
let guidedStudyTechniquesTagify = null;
let guidedStudyApproachTagify = null;
let guidedStudyOrganSystemsTagify = null;
let guidedOtherFundingsourcesTagify = null;

//main nav variables initialized to first page of guided mode
window.CURRENT_PAGE;

/////////////////////////////////////////////////////////
/////////////       Util functions      /////////////////
/////////////////////////////////////////////////////////
const pulseNextButton = () => {
  $("#guided-next-button").addClass("pulse-blue");
};
const unPulseNextButton = () => {
  $("#guided-next-button").removeClass("pulse-blue");
};
const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};

const hideEleShowEle = (elementIdToHide, elementIdToShow) => {
  let elementToHide = document.getElementById(elementIdToHide);
  let elementToShow = document.getElementById(elementIdToShow);
  elementToHide.classList.add("hidden");
  elementToShow.classList.remove("hidden");
};

document.querySelectorAll(".pass-button-click-to-next-button").forEach((element) => {
  element.addEventListener("click", () => {
    document.getElementById("guided-next-button").click();
  });
});

const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};

const guidedTransitionFromHome = async () => {
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

const guidedTransitionToHome = () => {
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

const guidedSaveProgress = async () => {
  const guidedProgressFileName = window.sodaJSONObj?.["digital-metadata"]?.["name"];
  //return if guidedProgressFileName is not a strnig greater than 0
  if (
    !guidedProgressFileName ||
    typeof guidedProgressFileName !== "string" ||
    guidedProgressFileName.length === 0
  ) {
    return;
  }
  //Destination: HOMEDIR/SODA/Guided-Progress
  window.sodaJSONObj["last-modified"] = new Date();

  try {
    //create Guided-Progress folder if one does not exist
    window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  } catch (error) {
    window.log.error(error);
  }
  var guidedFilePath = window.path.join(guidedProgressFilePath, guidedProgressFileName + ".json");

  // Store global variable values to the progress file before saving
  window.sodaJSONObj["dataset-structure"] = window.datasetStructureJSONObj;
  window.sodaJSONObj["subjects-table-data"] = window.subjectsTableData;
  window.sodaJSONObj["samples-table-data"] = window.samplesTableData;

  // Save the current version of SODA as the user should be taken back to the first page when the app is updated
  const currentAppVersion = document.getElementById("version").innerHTML;
  window.sodaJSONObj["last-version-of-soda-used"] = currentAppVersion;

  window.fs.writeFileSync(guidedFilePath, JSON.stringify(window.sodaJSONObj, null, 2));
};

const readDirAsync = async (path) => {
  let result = await window.fs.readdir(path);
  return result;
};

const readFileAsync = async (path) => {
  let result = await window.fs.readFile(path, "utf-8");
  return result;
};

const getAllProgressFileData = async (progressFiles) => {
  return Promise.all(
    progressFiles.map((progressFile) => {
      let progressFilePath = window.path.join(guidedProgressFilePath, progressFile);
      return readFileAsync(progressFilePath);
    })
  );
};

const getProgressFileData = async (progressFile) => {
  let progressFilePath = window.path.join(guidedProgressFilePath, progressFile + ".json");
  return readFileAsync(progressFilePath);
};

const deleteProgresFile = async (progressFileName) => {
  //Get the path of the progress file to delete
  const progressFilePathToDelete = window.path.join(
    guidedProgressFilePath,
    progressFileName + ".json"
  );
  //delete the progress file
  window.fs.unlinkSync(progressFilePathToDelete, (err) => {
    console.log(err);
  });
};

window.deleteProgressCard = async (progressCardDeleteButton) => {
  const progressCard = progressCardDeleteButton.parentElement.parentElement;
  const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent;

  const result = await Swal.fire({
    title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
    text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
    icon: "warning",
    heightAuto: false,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Delete progress file",
    cancelButtonText: "Cancel",
    focusCancel: true,
  });
  if (result.isConfirmed) {
    //delete the progress file
    deleteProgresFile(progressCardNameToDelete);

    //remove the progress card from the DOM
    progressCard.remove();
  }
};

const generateProgressCardElement = (progressFileJSONObj) => {
  let progressFileImage = progressFileJSONObj["digital-metadata"]["banner-image-path"] || "";

  if (progressFileImage === "") {
    progressFileImage = `
      <img
        src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
        alt="Dataset banner image placeholder"
        style="height: 80px; width: 80px"
      />
    `;
  } else {
    progressFileImage = `
      <img
        src='file://${progressFileImage}'
        alt="Dataset banner image"
        style="height: 80px; width: 80px"
      />
    `;
  }
  const progressFileName = progressFileJSONObj["digital-metadata"]["name"] || "";
  const progressFileSubtitle =
    progressFileJSONObj["digital-metadata"]["subtitle"] || "No designated subtitle";
  const progressFileLastModified = new Date(progressFileJSONObj["last-modified"]).toLocaleString(
    [],
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  );
  const savedUploadDataProgress =
    progressFileJSONObj["previously-uploaded-data"] &&
    Object.keys(progressFileJSONObj["previously-uploaded-data"]).length > 0;

  const datasetStartingPoint = progressFileJSONObj?.["starting-point"]?.["type"];

  let workspaceUserNeedsToSwitchTo = false;
  const datasetWorkspace = progressFileJSONObj?.["digital-metadata"]?.["dataset-workspace"];
  const currentWorkspace = guidedGetCurrentUserWorkSpace();
  if (datasetWorkspace && datasetWorkspace !== currentWorkspace) {
    workspaceUserNeedsToSwitchTo = datasetWorkspace;
  }

  // True if the progress file has already been uploaded to Pennsieve
  const alreadyUploadedToPennsieve = !!progressFileJSONObj["previous-guided-upload-dataset-name"];

  // Function to generate the button used to resume progress
  const generateProgressResumptionButton = (
    datasetStartingPoint,
    boolAlreadyUploadedToPennsieve,
    progressFileName,
    workspaceUserNeedsToSwitchTo
  ) => {
    if (workspaceUserNeedsToSwitchTo) {
      // If the progress file has an organization set but the user is no longer logged in,
      // prompt the user to log in
      if (!window.defaultBfAccount) {
        return `
          <button
            class="ui positive button guided--progress-button-login-to-pennsieve"
            data-reset-guided-mode-page="true"
            onclick="window.openDropdownPrompt(this, 'bf')"
          >
            Log in to Pennsieve to resume curation
          </button>
        `;
      }
      // If the user is logged in but the user needs to switch to a different workspace,
      // prompt the user to switch to the correct workspace
      return `
        <button
          class="ui positive button guided-change-workspace guided--progress-button-switch-workspace"
          onClick="window.openDropdownPrompt(this, 'organization')"
        >
          Switch to ${workspaceUserNeedsToSwitchTo} workspace to resume curation
        </button>
      `;
    }

    let buttonText;
    let buttonClass;

    if (boolAlreadyUploadedToPennsieve) {
      buttonText = "Share with the curation team";
      buttonClass = "guided--progress-button-share";
    } else if (datasetStartingPoint === "new") {
      buttonText = "Resume curation";
      buttonClass = "guided--progress-button-resume-curation";
    } else {
      buttonText = "Continue updating Pennsieve dataset";
      buttonClass = "guided--progress-button-resume-pennsieve";
    }

    return `
    <button
      class="ui positive button ${buttonClass}"
      onClick="window.guidedResumeProgress('${progressFileName}')"
    >
      ${buttonText}
    </button>
  `;
  };

  return `
    <div class="dataset-card">
      ${progressFileImage /* banner image */}     

      <div class="dataset-card-body">
        <div class="dataset-card-row">
          <h1
            class="dataset-card-title-text progress-file-name progress-card-popover"
            data-tippy-content="Dataset name: ${progressFileName}"
            rel="popover"
            placement="bottom"
            data-trigger="hover"
          >${progressFileName}</h1>
        </div>
        <div class="dataset-card-row">
          <h1 
            class="dataset-card-subtitle-text progress-card-popover"
            data-tippy-content="Dataset subtitle: ${progressFileSubtitle}"
            rel="popover"
            data-placement="bottom"
            data-trigger="hover"
            style="font-weight: 400;"
          >
              ${
                progressFileSubtitle.length > 70
                  ? `${progressFileSubtitle.substring(0, 70)}...`
                  : progressFileSubtitle
              }
          </h1>
        </div>
        <div class="dataset-card-row">
          <h2 class="dataset-card-clock-icon">
            <i
              class="fas fa-clock-o progress-card-popover"
              data-tippy-content="Last modified: ${progressFileLastModified}"
              rel="popover"
              data-placement="bottom"
              data-trigger="hover"
            ></i>
          </h2>
          <h1 class="dataset-card-date-text">${progressFileLastModified}</h1>
          ${
            savedUploadDataProgress
              ? `
                <span class="badge badge-warning mx-2">Incomplete upload</span>
              `
              : ``
          }
        </div>
      </div>
      <div class="dataset-card-button-container align-right">
        ${generateProgressResumptionButton(
          datasetStartingPoint,
          alreadyUploadedToPennsieve,
          progressFileName,
          workspaceUserNeedsToSwitchTo
        )}
        <h2 class="dataset-card-button-delete" onclick="window.deleteProgressCard(this)">
          <i
            class="fas fa-trash mr-sm-1"
          ></i>
          Delete progress file
        </h2>
      </div>
    </div>
  `;
};

const guidedRenderProgressCards = async () => {
  const progressCardsContainer = document.getElementById("guided-container-progress-cards");
  const progressCardLoadingDiv = document.getElementById("guided-section-loading-progress-cards");
  const progressCardLoadingDivText = document.getElementById(
    "guided-section-loading-progress-cards-para"
  );

  // Show the loading div and hide the progress cards container
  progressCardsContainer.classList.add("hidden");
  progressCardLoadingDiv.classList.remove("hidden");

  // if the user has an account connected with Pennsieve then verify the profile and workspace
  if (
    window.defaultBfAccount !== undefined ||
    (window.defaultBfAccount === undefined && hasConnectedAccountWithPennsieve())
  ) {
    try {
      progressCardLoadingDivText.textContent = "Verifying account information";
      await window.verifyProfile();
      progressCardLoadingDivText.textContent = "Verifying workspace information";
      await window.synchronizePennsieveWorkspace();
    } catch (e) {
      clientError(e);
      await swalShowInfo(
        "Something went wrong while verifying your profile",
        "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
      );
      loadingDiv.classList.add("hidden");
      return;
    }
  }

  //Check if Guided-Progress folder exists. If not, create it.
  if (!window.fs.existsSync(guidedProgressFilePath)) {
    window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  }

  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);

  // Filter out non .json files
  const jsonProgressFiles = guidedSavedProgressFiles.filter((file) => {
    return file.endsWith(".json");
  });

  const progressFileData = await getAllProgressFileData(jsonProgressFiles);

  // Sort by last modified date
  progressFileData.sort((a, b) => {
    return new Date(b["last-modified"]) - new Date(a["last-modified"]);
  });

  // If the workspace hasn't loaded yet, wait for it to load
  // This will stop after 6 seconds
  if (!guidedGetCurrentUserWorkSpace()) {
    for (let i = 0; i < 60; i++) {
      // If the workspace loaded, break out of the loop
      if (guidedGetCurrentUserWorkSpace()) {
        break;
      }
      // If the workspace didn't load, wait 100ms and try again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // If there are progress cards to display, display them
  if (progressFileData.length > 0) {
    // Add the title to the container
    progressCardsContainer.innerHTML = `
      <h2 class="text-sub-step-title">
        Select the dataset that you would like to continue working with and click "Continue"
      </h2>
    `;
    //Add the progress cards that have already been uploaded to Pennsieve
    //to their container (datasets that have the window.sodaJSONObj["previous-guided-upload-dataset-name"] property)
    progressCardsContainer.innerHTML += progressFileData
      .map((progressFile) => generateProgressCardElement(progressFile))
      .join("\n");

    tippy(".progress-card-popover", {
      allowHTML: true,
      interactive: true,
    });
  } else {
    progressCardsContainer.innerHTML = `
      <h2 class="guided--text-user-directions" style="color: var(--color-bg-plum) !important">
        No datasets in progress found.
      </h2>
    `;
  }

  // Hide the loading div and show the progress cards container
  progressCardsContainer.classList.remove("hidden");
  progressCardLoadingDiv.classList.add("hidden");
};

document
  .getElementById("guided-button-resume-progress-file")
  .addEventListener("click", async () => {
    await guidedRenderProgressCards();
  });

const renderManifestCards = () => {
  const manifestCard = `
    <div class="dataset-card">        
      <div class="dataset-card-body shrink">
        <div class="dataset-card-row">
          <h1 class="dataset-card-title-text">
            <span class="manifest-folder-name">View Manifest</span>
          </h1>
        </div>
      </div>
      <div class="dataset-card-button-container">
        <button
          class="ui primary button dataset-card-button-confirm"
          style="
            width: 302px !important;
            height: 40px;
          "
          onClick="window.guidedOpenManifestEditSwal()"
        >
          Preview/Edit manifest file
        </button>
      </div>
    </div>
  `;

  const manifestFilesCardsContainer = document.getElementById(
    "guided-container-manifest-file-cards"
  );

  manifestFilesCardsContainer.innerHTML = manifestCard;

  window.smoothScrollToElement(manifestFilesCardsContainer);
};

const guidedCreateManifestFilesAndAddToDatasetStructure = async () => {
  // First, empty the guided_manifest_files so we can add the new manifest files
  window.fs.emptyDirSync(window.guidedManifestFilePath);

  const guidedManifestData = window.sodaJSONObj["guided-manifest-file-data"];
  for (const [highLevelFolder, _] of Object.entries(guidedManifestData)) {
    let manifestJSON = window.processManifestInfo(
      guidedManifestData[highLevelFolder]["headers"],
      guidedManifestData[highLevelFolder]["data"]
    );

    let jsonManifest = JSON.stringify(manifestJSON);

    const manifestPath = window.path.join(
      window.guidedManifestFilePath,
      highLevelFolder,
      "manifest.xlsx"
    );

    window.fs.mkdirSync(window.path.join(window.guidedManifestFilePath, highLevelFolder), {
      recursive: true,
    });

    await window.convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);
    window.datasetStructureJSONObj["folders"][highLevelFolder]["files"]["manifest.xlsx"] = {
      action: ["new"],
      path: manifestPath,
      type: "local",
    };
  }

  // wait for the manifest files to be created before continuing
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

window.guidedOpenManifestEditSwal = async () => {
  const existingManifestData = window.sodaJSONObj["guided-manifest-file-data"];
  //send manifest data to main.js to then send to child window
  window.electron.ipcRenderer.invoke("spreadsheet", existingManifestData);

  //upon receiving a reply of the spreadsheet, handle accordingly
  window.electron.ipcRenderer.on("spreadsheet-reply", async (event, result) => {
    if (!result || result === "") {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");
      return;
    } else {
      window.electron.ipcRenderer.removeAllListeners("spreadsheet-reply");

      window.sodaJSONObj["guided-manifest-file-data"] = {
        headers: result[0],
        data: result[1],
      };
      await guidedSaveProgress();
      renderManifestCards();
    }
  });
};

window.diffCheckManifestFiles = (newManifestData, existingManifestData) => {
  // If the new manifest data is identical to the existing, return the new manifest data
  if (JSON.stringify(existingManifestData) === JSON.stringify(newManifestData)) {
    return newManifestData;
  }

  // If the existing manifest data is empty (or missing crucial keys), return the new manifest data
  if (!existingManifestData["headers"] || !existingManifestData["data"]) {
    return newManifestData;
  }

  console.log("newManifestData", newManifestData);
  console.log("existingManifestData", existingManifestData);

  const columnValuesNotToUseOldValuesFor = new Set(["filename", "timestamp", "file type"]);

  const newManifestDataHeaders = newManifestData["headers"];
  const newManifestDataData = newManifestData["data"];
  const existingManifestDataHeaders = existingManifestData["headers"];
  const existingManifestDataData = existingManifestData["data"];

  // Initialize combined manifest headers and data
  const combinedManifestDataHeaders = [...newManifestDataHeaders];
  const combinedManifestDataData = [...newManifestDataData];

  // Add headers from the existing manifest that are not present in the new manifest
  for (const header of existingManifestDataHeaders) {
    if (!newManifestDataHeaders.includes(header)) {
      console.log(`Adding header "${header}" to combined manifest data headers`);
      combinedManifestDataHeaders.push(header);
      // Add empty values for the new column in each row of the combined data
      for (const row of combinedManifestDataData) {
        row.push("");
      }
    }
  }

  // Build a hash table for the existing manifest data
  const existingManifestDataHashTable = {};
  for (const row of existingManifestDataData) {
    const relativePath = row[0];
    const fileObj = {};
    for (const header of existingManifestDataHeaders) {
      if (columnValuesNotToUseOldValuesFor.has(header)) continue;
      const headerIndex = existingManifestDataHeaders.indexOf(header);
      fileObj[header] = row[headerIndex];
    }
    existingManifestDataHashTable[relativePath] = fileObj;
  }

  console.log("existingManifestDataHashTable", existingManifestDataHashTable);

  // Update rows in the combined data by looping over the new manifest data
  for (const row of combinedManifestDataData) {
    const relativePath = row[0];
    if (existingManifestDataHashTable[relativePath]) {
      for (const header of combinedManifestDataHeaders) {
        if (columnValuesNotToUseOldValuesFor.has(header)) continue;
        const headerIndex = combinedManifestDataHeaders.indexOf(header);
        row[headerIndex] = existingManifestDataHashTable[relativePath][header] || row[headerIndex];
      }
    }
  }

  return {
    headers: combinedManifestDataHeaders,
    data: combinedManifestDataData,
  };
};

document
  .getElementById("guided-button-run-dataset-validation")
  .addEventListener("click", async () => {
    //Wait for current call stack to finish so page navigation happens before this function is run
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Reset the UI for the page
    const validationLoadingDiv = document.getElementById("guided-section-validation-loading");
    const validationResultsDiv = document.getElementById("guided-section-validation-errors-table");
    const validationSucessNoErrorsDiv = document.getElementById(
      "guided-section-validation-success-no-errors"
    );
    const errorDuringValidationDiv = document.getElementById("guided-section-validation-failed");

    validationLoadingDiv.classList.add("hidden");
    validationResultsDiv.classList.add("hidden");
    validationSucessNoErrorsDiv.classList.add("hidden");
    errorDuringValidationDiv.classList.add("hidden");

    if (window.sodaJSONObj["dataset-validated"] === "true") {
      const errorsFromLastValidation = window.sodaJSONObj["dataset-validation-errors"];
      if (errorsFromLastValidation) {
        handleValidationTableUi(errorsFromLastValidation);
        return;
      }
    }

    let validationReportStatusIncomplete = false;
    const validationReportPath = window.path.join(window.homeDirectory, "SODA", "validation.txt");

    let file_counter = 0;
    let folder_counter = 0;

    try {
      // Lock the navigation buttons while the validation is in process
      guidedSetNavLoadingState(true);

      // Show the Loading div
      validationLoadingDiv.classList.remove("hidden");

      let sodaJSONObjCopy = JSON.parse(JSON.stringify(window.sodaJSONObj));
      // formatForDatasetGeneration(window.sodaJSONObjCopy);

      // if the user performed move, rename, delete on files in an imported dataset we need to perform those actions before creating the validation report;
      // rationale for this can be found in the function definition
      if (sodaJSONObjCopy["starting-point"]["type"] === "bf") {
        await api.performUserActions(sodaJSONObjCopy);
      }

      // count the amount of files in the dataset
      file_counter = 0;
      window.get_num_files_and_folders(sodaJSONObjCopy["dataset-structure"]);

      if (file_counter >= 50000) {
        await Swal.fire({
          title: `Dataset Too Large`,
          text: "At the moment we cannot validate a dataset with 50,000 or more files.",
          allowEscapeKey: true,
          allowOutsideClick: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
          showConfirmButton: true,
          icon: "error",
        });
        throw new Error("Dataset is too large for validation");
      }

      // create the manifest files if the user auto generated manifest files at any point
      await guidedCreateManifestFilesAndAddToDatasetStructure();

      // get the manifest files
      let manifestJSONResponse;
      try {
        manifestJSONResponse = await client.post(
          "/skeleton_dataset/manifest_json",
          {
            sodajsonobject: window.sodaJSONObj,
          },
          {
            timeout: 0,
          }
        );
      } catch (error) {
        throw new Error("Failed to generate manifest files");
      }

      let manifests = manifestJSONResponse.data;
      // If the manifest files are not generated, throw an error
      if (!manifests) {
        throw new Error("Failed to generate manifest files2");
      }

      let clientUUID = uuid();
      try {
        await client.post(`https://validation.sodaforsparc.io/validator/validate`, {
          clientUUID: clientUUID,
          dataset_structure: window.sodaJSONObj,
          metadata_files: {},
          manifests: manifests,
        });
      } catch (error) {
        clientError(error);

        file_counter = 0;
        folder_counter = 0;
        window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);
        // log successful validation run to analytics
        const kombuchaEventData = {
          value: file_counter,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Validation - Number of Files",
          "Number of Files",
          file_counter
        );

        if (error.response && (error.response.status == 503 || error.response.status == 502)) {
          await Swal.fire({
            title: "Validation Service Unavailable",
            text: "The validation service is currently too busy to validate your dataset. Please try again shortly.",
            icon: "error",
            confirmButtonText: "Ok",
            backdrop: "rgba(0,0,0, 0.4)",
            reverseButtons: window.reverseSwalButtons,
            heightAuto: false,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          });
        } else if (error.response && error.response.status == 400) {
          let msg = error.response.data.message;
          if (msg.includes("Missing required metadata files")) {
            msg = "Please add the required metadata files then re-run validation.";
          }
          await Swal.fire({
            title: "Validation Error",
            text: msg,
            icon: "error",
            confirmButtonText: "Ok",
            backdrop: "rgba(0,0,0, 0.4)",
            reverseButtons: window.reverseSwalButtons,
            heightAuto: false,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          });
        } else {
          await Swal.fire({
            title: "Failed to Validate Your Dataset",
            text: "Please try again. If this issue persists contect the SODA for SPARC team at help@fairdataihub.org",
            allowEscapeKey: true,
            allowOutsideClick: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            showConfirmButton: true,
            icon: "error",
          });
        }

        // Hide the loading div
        validationLoadingDiv.classList.add("hidden");
        // Show the error div
        errorDuringValidationDiv.classList.remove("hidden");
        guidedSetNavLoadingState(false);

        return;
      }

      let validationReport = undefined;
      while (validationReport === undefined) {
        await window.wait(15000);
        validationReport = await window.pollForValidationResults(clientUUID);
      }

      if (validationReport.status === "Error") {
        file_counter = 0;
        folder_counter = 0;
        window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);
        // log successful validation run to analytics
        const kombuchaEventData = {
          value: file_counter,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          dataset_int_id: window.defaultBfDatasetIntId,
        };

        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.FAIL,
          kombuchaEventData
        );

        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Validation - Number of Files",
          "Number of Files",
          file_counter
        );
        throw new Error("Could not validate your dataset");
      }

      // write the full report to the ~/SODA/validation.txt file
      const fullReport = validationReport.full_report;
      window.fs.writeFileSync(validationReportPath, fullReport);

      file_counter = 0;
      folder_counter = 0;
      window.get_num_files_and_folders(window.sodaJSONObj["dataset-structure"]);

      // log successful validation run to analytics
      if (file_counter > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.VALIDATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: file_counter,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Validation - Number of Files",
        "Number of Files",
        file_counter
      );

      if (validationReport.status === "Incomplete") {
        // An incomplete validation report happens when the validator is unable to generate
        // a path_error_report upon validating the selected dataset.
        validationReportStatusIncomplete = true;
        throw new Error("Could Not Generate a Sanitized Validation Report");
      }

      // get the parsed error report since the validation has been completed
      const errors = validationReport.parsed_report;

      let hasValidationErrors = Object.getOwnPropertyNames(validationReport).length >= 1;

      Swal.fire({
        title: hasValidationErrors ? "Validator detected potential issues" : `Dataset is Valid`,
        text: hasValidationErrors
          ? `Note that the validator is currently in beta and may contain false positives. Review the validation report and continue to the next page.`
          : `Your dataset conforms to the SPARC Dataset Structure.`,
        allowEscapeKey: true,
        allowOutsideClick: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        showConfirmButton: true,
        icon: hasValidationErrors ? "error" : "success",
      });

      // Hide the loading div
      validationLoadingDiv.classList.add("hidden");

      // Displays the table with validation errors if the errors object is not empty
      // Otherwise displays a success message
      handleValidationTableUi(errors);

      window.sodaJSONObj["dataset-validated"] = "true";
      window.sodaJSONObj["dataset-validation-errors"] = errors;
    } catch (error) {
      clientError(error);
      // Hide the loading div
      validationLoadingDiv.classList.add("hidden");
      // Show the error div
      errorDuringValidationDiv.classList.remove("hidden");
      // Validation failed. Show a swal and have the user go back to fix stuff (or retry)
      window.sodaJSONObj["dataset-validated"] = "false";
      delete window.sodaJSONObj["dataset-validation-errors"];
      if (validationReportStatusIncomplete) {
        let viewReportResult = await Swal.fire({
          title: error,
          html: `If you repeatedly have this issue please contact the SODA for SPARC team at help@fairdataihub.org. Would you like to view your raw validation report?`,
          allowEscapeKey: true,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "error",
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        });

        if (viewReportResult.isConfirmed) {
          // open a shell to the raw validation report
          window.electron.ipcRenderer.invoke("shell-open-path", validationReportPath);
        }
      } else {
        await Swal.fire({
          icon: "warning",
          title: "An Error occured while validating your dataset",
          html: `${error}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      }
    }
    guidedSetNavLoadingState(false);
  });

$("#guided-select-pennsieve-dataset-to-resume").selectpicker();
const renderGuidedResumePennsieveDatasetSelectionDropdown = async () => {
  // First hide the error div if it is showing
  const errorDiv = document.getElementById("guided-panel-pennsieve-dataset-import-error");
  const logInDiv = document.getElementById("guided-panel-log-in-before-resuming-pennsieve-dataset");
  const loadingDiv = document.getElementById("guided-panel-pennsieve-dataset-import-loading");
  const loadingDivText = document.getElementById(
    "guided-panel-pennsieve-dataset-import-loading-para"
  );
  const pennsieveDatasetSelectDiv = document.getElementById(
    "guided-panel-pennsieve-dataset-select"
  );
  // Hide all of the divs incase they were previously shown
  errorDiv.classList.add("hidden");
  logInDiv.classList.add("hidden");
  loadingDiv.classList.add("hidden");
  pennsieveDatasetSelectDiv.classList.add("hidden");

  // If the user is not logged in, show the log in div and return
  if (!window.defaultBfAccount) {
    logInDiv.classList.remove("hidden");
    return;
  }

  //Show the loading Div and hide the dropdown div while the datasets the user has access to are being retrieved
  loadingDiv.classList.remove("hidden");

  try {
    loadingDivText.textContent = "Verifying account information";
    await window.verifyProfile();
    loadingDivText.textContent = "Verifying workspace information";
    await window.synchronizePennsieveWorkspace();
    loadingDivText.textContent = "Importing datasets from Pennsieve";
  } catch (e) {
    clientError(e);
    await swalShowInfo(
      "Something went wrong while verifying your profile",
      "Please try again by clicking the 'Yes' button. If this issue persists please use our `Contact Us` page to report the issue."
    );
    loadingDiv.classList.add("hidden");
    return;
  }

  const datasetSelectionSelectPicker = $("#guided-select-pennsieve-dataset-to-resume");
  datasetSelectionSelectPicker.empty();
  try {
    let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
      params: {
        selected_account: window.defaultBfAccount,
      },
    });
    const datasets = responseObject.data.datasets;
    //Add the datasets to the select picker
    datasetSelectionSelectPicker.append(
      `<option value="" selected>Select a dataset on Pennsieve to resume</option>`
    );
    for (const dataset of datasets) {
      datasetSelectionSelectPicker.append(`<option value="${dataset.id}">${dataset.name}</option>`);
    }
    datasetSelectionSelectPicker.selectpicker("refresh");

    //Hide the loading div and show the dropdown div
    loadingDiv.classList.add("hidden");
    pennsieveDatasetSelectDiv.classList.remove("hidden");
  } catch (error) {
    // Show the error div and hide the dropdown and loading divs
    errorDiv.classList.remove("hidden");
    loadingDiv.classList.add("hidden");
    pennsieveDatasetSelectDiv.classList.add("hidden");
    clientError(error);
    document.getElementById("guided-pennsieve-dataset-import-error-message").innerHTML =
      userErrorMessage(error);
  }
};

const setActiveProgressionTab = (targetPageID) => {
  $(".guided--progression-tab").removeClass("selected-tab");
  let targetPageParentID = $(`#${targetPageID}`).parent().attr("id");
  let targetProgressionTabID = targetPageParentID.replace("parent-tab", "progression-tab");
  let targetProgressionTab = $(`#${targetProgressionTabID}`);
  targetProgressionTab.addClass("selected-tab");
};
let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

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

const guidedShowTreePreview = (new_dataset_name, targetElementId) => {
  const folderStructurePreview = document.getElementById(targetElementId);
  $(folderStructurePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types", "sort"],
    sort: function (a, b) {
      let a1 = this.get_node(a);
      let b1 = this.get_node(b);

      if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
        //if the word assets is included in the icon then we can assume it is a file
        //folder icons are under font awesome meanwhile files come from the assets folder
        return a1.text > b1.text ? 1 : -1;
      } else {
        return a1.icon < b1.icon ? 1 : -1;
      }
    },
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: fileXlsx,
      },
      "file xls": {
        icon: fileXlsx,
      },
      "file png": {
        icon: filePng,
      },
      "file PNG": {
        icon: filePng,
      },
      "file pdf": {
        icon: filePdf,
      },
      "file txt": {
        icon: fileTxt,
      },
      "file csv": {
        icon: fileCsv,
      },
      "file CSV": {
        icon: fileCsv,
      },
      "file DOC": {
        icon: fileDoc,
      },
      "file DOCX": {
        icon: fileDoc,
      },
      "file docx": {
        icon: fileDoc,
      },
      "file doc": {
        icon: fileDoc,
      },
      "file jpeg": {
        icon: fileJpeg,
      },
      "file JPEG": {
        icon: fileJpeg,
      },
      "file other": {
        icon: fileOther,
      },
    },
  });
  $(folderStructurePreview).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });
  $(folderStructurePreview).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });
  const dsJsonObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));

  //Add the code_description metadata file to the preview if the code_description path has been declared
  if (window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
    dsJsonObjCopy["files"]["code_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the dataset_description metadata file to the preview if the dataset_description page has been completed
  if (window.sodaJSONObj["completed-tabs"].includes("guided-create-description-metadata-tab")) {
    dsJsonObjCopy["files"]["dataset_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the manifest files that have been created to the preview
  for (const manifestFileKey of Object.keys(window.sodaJSONObj["guided-manifest-file-data"])) {
    const hlfStillExistsForManifestFile = Object.keys(dsJsonObjCopy["folders"]).includes(
      manifestFileKey
    );
    if (hlfStillExistsForManifestFile) {
      dsJsonObjCopy["folders"][manifestFileKey]["files"]["manifest.xlsx"] = {
        action: ["new"],
        path: "",
        type: "local",
      };
    }
  }

  //Add the Readme file to the preview if it exists in JSON
  if (window.sodaJSONObj["dataset-metadata"]["README"]) {
    dsJsonObjCopy["files"]["README.txt"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Samples metadata file to the preview if at least one sample has been added
  if (window.samplesTableData.length > 0) {
    dsJsonObjCopy["files"]["samples.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Subjects metadata file to the preview if at least one subject has been added
  if (window.subjectsTableData.length > 0) {
    dsJsonObjCopy["files"]["subjects.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the submission metadata file to the preview if the submission metadata page has been completed
  if (window.sodaJSONObj["completed-tabs"].includes("guided-create-submission-metadata-tab")) {
    dsJsonObjCopy["files"]["submission.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  const guidedJsTreePreviewData = window.create_child_node(
    dsJsonObjCopy,
    new_dataset_name,
    "folder",
    "",
    new_dataset_name,
    false,
    false,
    "",
    "preview"
  );
  $(folderStructurePreview).jstree(true).settings.core.data = guidedJsTreePreviewData;
  $(folderStructurePreview).jstree(true).refresh();
};

const guidedUpdateFolderStructure = (highLevelFolder, subjectsOrSamples) => {
  //add high level folder if it does not exist
  /*
  if (!window.datasetStructureJSONObj["folders"][highLevelFolder]) {
    window.datasetStructureJSONObj["folders"][highLevelFolder] = newEmptyFolderObj();
  }*/

  if (subjectsOrSamples === "subjects") {
    //Add subjects to datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
    for (const subject of subjectsInPools) {
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
          "folders"
        ][subject.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
          "folders"
        ][subject.subjectName] = newEmptyFolderObj();
      }
    }
    for (const subject of subjectsOutsidePools) {
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName] =
          newEmptyFolderObj();
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Add samples to datsetStructuresJSONObj if they don't exist
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    for (const sample of samplesInPools) {
      /**
       * Check to see if the sample's pool is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (!window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName] =
          newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's subject is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName] = newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's folder is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]["folders"][sample.sampleName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]["folders"][sample.sampleName] = newEmptyFolderObj();
      }
    }
    for (const sample of samplesOutsidePools) {
      /**
       * Check to see if the sample's subject is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName] =
          newEmptyFolderObj();
      }
      /**
       * Check to see if the sample's folder is in the window.datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName]
      ) {
        window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName] = newEmptyFolderObj();
      }
    }
  }
};

const guidedResetSkippedPages = () => {
  const pagesThatShouldAlwaysBeskipped = [
    "guided-dataset-generation-tab",
    "guided-structure-folder-tab",
    "guided-dataset-dissemination-tab",
    "guided-select-starting-point-tab",
  ];
  for (const page of pagesThatShouldAlwaysBeskipped) {
    guidedSkipPage(page);
  }

  // Reset parent pages
  const parentPagesToResetSkip = Array.from(document.querySelectorAll(".guided--page"))
    .map((page) => page.id)
    .filter((pageID) => !pagesThatShouldAlwaysBeskipped.includes(pageID));

  for (const pageID of parentPagesToResetSkip) {
    guidedUnSkipPage(pageID);
  }
};

const guidedSkipPage = (pageId) => {
  const page = document.getElementById(pageId);

  // If the page no longer exists, return
  if (!page) {
    return;
  }

  page.dataset.skipPage = "true";

  // add the page to window.sodaJSONObj array if it isn't there already
  if (!window.sodaJSONObj["skipped-pages"].includes(pageId)) {
    window.sodaJSONObj["skipped-pages"].push(pageId);
  }
};

const guidedUnSkipPage = (pageId) => {
  const page = document.getElementById(pageId);

  // If the page no longer exists, return
  if (!page) {
    return;
  }

  page.dataset.skipPage = "false";

  // remove the page from window.sodaJSONObj array if it is there
  if (window.sodaJSONObj["skipped-pages"].includes(pageId)) {
    window.sodaJSONObj["skipped-pages"].splice(
      window.sodaJSONObj["skipped-pages"].indexOf(pageId),
      1
    );
  }
};

const pageIsSkipped = (pageId) => {
  return window.sodaJSONObj["skipped-pages"].includes(pageId);
};

const folderIsEmpty = (folder) => {
  if (!folder) {
    return true;
  }

  return Object.keys(folder.folders).length === 0 && Object.keys(folder.files).length === 0;
};

const cleanUpEmptyFoldersFromGeneratedGuidedStructure = (highLevelFolder) => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  for (const subject of subjectsInPools) {
    const poolName = subject["poolName"];
    const subjectName = subject["subjectName"];
    const subjectsSamplesArray = subject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName]?.["folders"]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName]["folders"][sample];
        }
      }

      // Then delete the subject folder if it is empty
      const subjectFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolder) {
        if (folderIsEmpty(subjectFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName];
        }
      }

      // Then delete the pool folder if it is empty
      const poolFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];
      if (poolFolder) {
        if (folderIsEmpty(poolFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    // If the sample folder exists and is empty, delete it
  }
  for (const subjectObject of subjectsOutsidePools) {
    const subjectName = subjectObject["subjectName"];
    const subjectsSamplesArray = subjectObject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName]?.[
          "folders"
        ]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName][
            "folders"
          ][sample];
        }
      }
    }
    // Then delete the subject folder if it is empty
    const subjectFolder =
      window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName];
    if (subjectFolder) {
      if (folderIsEmpty(subjectFolder)) {
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
      }
    }
  }
  for (const subject of subjectsInPools) {
    const poolName = subject["poolName"];
    const subjectName = subject["subjectName"];
    const subjectsSamplesArray = subject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName]?.["folders"]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName]["folders"][sample];
        }
      }

      // Then delete the subject folder if it is empty
      const subjectFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolder) {
        if (folderIsEmpty(subjectFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName];
        }
      }

      // Then delete the pool folder if it is empty
      const poolFolder =
        window.datasetStructureJSONObj["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];
      if (poolFolder) {
        if (folderIsEmpty(poolFolder)) {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    // If the sample folder exists and is empty, delete it
  }
  for (const subjectObject of subjectsOutsidePools) {
    const subjectName = subjectObject["subjectName"];
    const subjectsSamplesArray = subjectObject["samples"];
    // First delete the sample folders if they are empty
    for (const sample of subjectsSamplesArray) {
      const sampleFolder =
        window.datasetStructureJSONObj["folders"]?.["primary"]?.["folders"]?.[subjectName]?.[
          "folders"
        ]?.[sample];
      // If the sample folder exists and is empty, delete it
      if (sampleFolder) {
        if (folderIsEmpty(sampleFolder)) {
          delete window.datasetStructureJSONObj["folders"]["primary"]["folders"][subjectName][
            "folders"
          ][sample];
        }
      }
    }
    // Then delete the subject folder if it is empty
    const subjectFolder =
      window.datasetStructureJSONObj["folders"]?.["primary"]?.["folders"]?.[subjectName];
    if (subjectFolder) {
      if (folderIsEmpty(subjectFolder)) {
        delete window.datasetStructureJSONObj["folders"]["primary"]["folders"][subjectName];
      }
    }
  }
};

const resetGuidedRadioButtons = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
  for (const guidedRadioButton of guidedRadioButtons) {
    guidedRadioButton.classList.remove("selected");
    guidedRadioButton.classList.remove("not-selected");
    guidedRadioButton.classList.add("basic");

    //get the data-next-element attribute
    const elementButtonControls = guidedRadioButton.getAttribute("data-next-element");
    if (elementButtonControls) {
      const elementToHide = document.getElementById(elementButtonControls);
      if (!elementToHide) {
        console.error(`Element with id ${elementButtonControls} does not exist`);
      }
      elementToHide.classList.add("hidden");
    }
  }
};

const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
  for (const guidedRadioButton of guidedRadioButtons) {
    //Get the button config value from the UI
    const buttonConfigValue = guidedRadioButton.getAttribute("data-button-config-value");
    if (buttonConfigValue) {
      const buttonConfigValueState = guidedRadioButton.getAttribute(
        "data-button-config-value-state"
      );
      if (window.sodaJSONObj["button-config"][buttonConfigValue] === buttonConfigValueState) {
        //click the button
        guidedRadioButton.click();
      }
    }
  }
};

const guidedAddUsersAndTeamsToDropdown = (usersArray, teamsArray) => {
  const guidedUsersAndTeamsDropdown = document.getElementById("guided_bf_list_users_and_teams");
  // Reset the dropdown
  guidedUsersAndTeamsDropdown.innerHTML =
    "<option>Select individuals or teams to grant permissions to</option>";

  // Loop through the users and add them to the dropdown
  for (const userString of usersArray) {
    const userNameAndEmail = userString.split("!|**|!")[0].trim();
    const userID = userString.split("!|**|!")[1].trim();
    const userOption = `
          <option
            permission-type="user"
            value="${userID}"
          >
            ${userNameAndEmail}
          </option>
        `;
    guidedUsersAndTeamsDropdown.insertAdjacentHTML("beforeend", userOption);
  }

  // Loop through the teams and add them to the dropdown
  for (const team of teamsArray) {
    const trimmedTeam = team.trim();
    const teamOption = `
          <option
            permission-type="team"
            value="${trimmedTeam}"
          >
            ${trimmedTeam}
          </option>
        `;
    guidedUsersAndTeamsDropdown.insertAdjacentHTML("beforeend", teamOption);
  }
};

const guidedResetUserTeamPermissionsDropdowns = () => {
  $("#guided_bf_list_users_and_teams").val("Select individuals or teams to grant permissions to");
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
  $("#select-permission-list-users-and-teams").val("Select role");
};

let addListener = true;
let removeEventListener = false;
const copyLink = (link) => {
  Clipboard.writeText(link);

  window.notyf.open({
    duration: "2000",
    type: "success",
    message: "Link copied!",
  });
};

const checkIfPageIsValid = async (pageID) => {
  try {
    await window.openPage(pageID);
    await savePageChanges(pageID);
  } catch (error) {
    throw error;
  }
};

// Function that checks if the page needs to be updated from Pennsieve
// This function will be return true if the user is updating a dataset from Pennsieve and
// the page has not yet been saved
const pageNeedsUpdateFromPennsieve = (pageID) => {
  // Add the pages-fetched-from-pennsieve array to the window.sodaJSONObj if it does not exist
  if (!window.sodaJSONObj["pages-fetched-from-pennsieve"]) {
    window.sodaJSONObj["pages-fetched-from-pennsieve"] = [];
  }

  // The following conditions must be met for the page to be updated from Pennsieve:
  // 1. The user is updating a dataset from Pennsieve
  // 2. window.sodaJSONObj["pages-fetched-from-pennsieve"] does not include the pageID
  // Note: window.sodaJSONObj["pages-fetched-from-pennsieve"] gets the page id added to it when the page is fetched from Pennsieve to prevent duplicate page fetches
  // 3. window.sodaJSONObj["completed-tabs"] does not include the pageID (The page has not been saved yet)
  return (
    window.sodaJSONObj["starting-point"]["type"] === "bf" &&
    !window.sodaJSONObj["pages-fetched-from-pennsieve"].includes(pageID) &&
    !window.sodaJSONObj["completed-tabs"].includes(pageID)
  );
};

// Function that allows the user to retry fetching the page if any errors occur
// while pulling from Pennsieve. Ultimately, this function just tries to re-open the page
const guidedShowOptionalRetrySwal = async (errorMessage, pageIdToRetryOpening) => {
  const { value: addDataManually } = await Swal.fire({
    icon: "info",
    title: "Your dataset is missing a required component",
    html: `
      ${errorMessage}
      <br />
      <br />
      You may either add the data in SODA or retry fetching the data from Pennsieve
    `,
    width: 700,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    confirmButtonText: "Add data in SODA",
    cancelButtonText: "Retry",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  if (!addDataManually) {
    await window.openPage(pageIdToRetryOpening);
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

const handleValidationTableUi = (errors) => {
  const validationResultsDiv = document.getElementById("guided-section-validation-errors-table");
  const validationSucessNoErrorsDiv = document.getElementById(
    "guided-section-validation-success-no-errors"
  );
  validationResultsDiv.classList.add("hidden");
  validationSucessNoErrorsDiv.classList.add("hidden");

  if (!window.validationErrorsOccurred(errors)) {
    // Dataset successfully validated without errors
    validationSucessNoErrorsDiv.classList.remove("hidden");
  } else {
    // get validation table body
    let validationErrorsTable = document.querySelector(
      "#guided-section-dataset-validation-table tbody"
    );
    // clear the table
    window.clearValidationResults(validationErrorsTable);
    // display errors onto the page
    window.displayValidationErrors(
      errors,
      document.querySelector("#guided-section-dataset-validation-table tbody")
    );

    // Unhide the validation errors section
    validationResultsDiv.classList.remove("hidden");
  }
};

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

// //Main function that prepares individual pages based on the state of the window.sodaJSONObj
// //The general flow is to check if there is values for the keys relevant to the page
// //If the keys exist, extract the data from the window.sodaJSONObj and populate the page
// //If the keys do not exist, reset the page (inputs, tables etc.) to the default state
window.openPage = async (targetPageID) => {
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

    if (targetPageDataset.componentType) {
      const targetPageComponentType = targetPageDataset.componentType;
      console.log("targetPageDataset", targetPageDataset);
      if (targetPageComponentType === "entity-management-page") {
        // Set the dataset entity object to the saved dataset entity object from the JSON
        const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
        setDatasetEntityObj(savedDatasetEntityObj);
        setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
      }
      if (targetPageComponentType === "entity-selection-page") {
        const savedDatasetEntityObj = window.sodaJSONObj["dataset-entity-obj"] || {};
        setDatasetEntityObj(savedDatasetEntityObj);

        setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["data"]);
        /*
        if (!window.sodaJSONObj["completed-tabs"].includes(targetPageID)) {
          console.log("Calling autoSelectDatasetFoldersAndFilesForEnteredEntityIds");
          autoSelectDatasetFoldersAndFilesForEnteredEntityIds(
            window.datasetStructureJSONObj["folders"]["primary"],
            targetPageDataset.entityType,
            targetPageDataset.entityTypeStringSingular
          );
        }
        */
      }
    }

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

    if (targetPageID === "guided-prepare-helpers-tab") {
      const sparcFundedHelperSections = document
        .getElementById("guided-prepare-helpers-tab")
        .querySelectorAll(".sparc-funded-only");

      if (datasetIsSparcFunded()) {
        // If the dataset is SPARC funded, then show the SPARC funded helper sections
        sparcFundedHelperSections.forEach((element) => {
          element.classList.remove("hidden");
        });
      } else {
        // If the dataset is not SPARC funded, then hide the SPARC funded helper sections
        sparcFundedHelperSections.forEach((element) => {
          element.classList.add("hidden");
        });
      }
    }

    if (targetPageID === "guided-name-subtitle-tab") {
      // Get the dataset name and subtitle from the JSON obj
      const datasetName = getGuidedDatasetName() || "";

      // Set the zustand datasetName state value to the dataset name
      setGuidedDatasetName(datasetName);

      if (pageNeedsUpdateFromPennsieve("guided-name-subtitle-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          //Try to get the dataset name from Pennsieve
          //If the request fails, the subtitle input will remain blank
          const datasetSubtitle = await api.getDatasetSubtitle(
            window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
          );

          // Save the subtitle to the JSON and add it to the input
          window.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitle;
          setGuidedDatasetSubtitle(datasetSubtitle);

          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-name-subtitle-tab");
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-name-subtitle-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-name-subtitle-tab");
        }
      } else {
        //Update subtitle from JSON
        const datasetSubtitle = getGuidedDatasetSubtitle();
        setGuidedDatasetSubtitle(datasetSubtitle);
      }
    }

    if (targetPageID === "guided-ask-if-submission-is-sparc-funded-tab") {
      if (pageNeedsUpdateFromPennsieve(targetPageID)) {
        setPageLoadingState(true);
        try {
          // Get the submission metadata from Pennsieve
          const submissionMetadataRes = await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
              file_type: "submission.xlsx",
            },
          });
          const submissionData = submissionMetadataRes.data;

          const pennsieveConsortiumDataStandard = submissionData["Consortium data standard"]
            .trim()
            .toUpperCase();

          if (pennsieveConsortiumDataStandard === "SPARC") {
            document.getElementById("guided-button-dataset-is-sparc-funded").click();
          } else if (pennsieveConsortiumDataStandard === "HEAL") {
            document.getElementById("guided-button-dataset-is-re-join-funded").click();
          } else {
            document.getElementById("guided-button-dataset-is-not-sparc-funded").click();
            document.getElementById("guided-button-non-sparc-user-has-contacted-sparc").click();
          }

          // Set the funding consortium
          const pennsieveFundingConsortium = submissionData["Funding consortium"]
            .trim()
            .toUpperCase();

          if (window.sparcFundingConsortiums.includes(pennsieveFundingConsortium)) {
            // Pre-set the funding consortium so it is set in the dropdown
            window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
              pennsieveFundingConsortium;
          }
        } catch (error) {
          const emessage = userErrorMessage(error);
          console.error(emessage);
        }
      }

      // Set the funding consortium dropdown to the saved value (deafult is empty string before a user selects a value)
      const savedFundingConsortium =
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];
      setDropdownState("guided-select-sparc-funding-consortium", savedFundingConsortium);
    }

    if (targetPageID === "guided-dataset-structure-intro-tab") {
      // Handle whether or not the spreadsheet importation page should be skipped
      // Note: this is done here to centralize the logic for skipping the page
      // The page is unskipped only if the user has not added any subjects,
      // indicated that they will be adding subjects, and the user is not starting from Pennsieve
      if (
        window.getExistingSubjectNames().length === 0 &&
        window.sodaJSONObj["starting-point"]["type"] != "bf" &&
        window.sodaJSONObj["button-config"]["dataset-contains-subjects"] === "yes"
      ) {
        guidedUnSkipPage("guided-subject-structure-spreadsheet-importation-tab");
      } else {
        guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
      }
    }

    if (targetPageID === "guided-subject-structure-spreadsheet-importation-tab") {
      const savedSpreadSheetPath = window.sodaJSONObj["dataset-structure-spreadsheet-path"];
      setUiBasedOnSavedDatasetStructurePath(savedSpreadSheetPath);
    }

    if (targetPageID === "guided-subjects-addition-tab") {
      // skip the spreadsheet importation page so the user can't go back to it
      guidedSkipPage("guided-subject-structure-spreadsheet-importation-tab");
      renderSubjectsTable();
    }

    if (targetPageID === "guided-samples-addition-tab") {
      renderSamplesTable();
    }

    if (targetPageID === "guided-unstructured-data-import-tab") {
      guidedUpdateFolderStructureUI("data/");
    }

    if (targetPageID === "guided-denote-derivative-data-tab") {
      // Set the folder structure as the primary folder since the user is
      // denoting data as derivative which will be moved to the derivative folder
      guidedUpdateFolderStructureUI("data/");
    }

    if (targetPageID === "guided-code-folder-tab") {
      guidedUpdateFolderStructureUI("code/");
    }

    if (targetPageID === "guided-protocol-folder-tab") {
      guidedUpdateFolderStructureUI("protocol/");
    }

    if (targetPageID === "guided-docs-folder-tab") {
      guidedUpdateFolderStructureUI("docs/");
    }
    if (targetPageID === "guided-aux-folder-tab") {
      guidedUpdateFolderStructureUI("aux/");
    }

    if (targetPageID === "guided-dataset-structure-review-tab") {
      setTreeViewDatasetStructure(window.datasetStructureJSONObj, []);
      /*
      // Remove empty guided high-level folders (primary, source, derivative)
      guidedHighLevelFolders.forEach((folder) => {
        const rootFolderPath = window.datasetStructureJSONObj?.folders?.[folder];
        if (rootFolderPath && folderIsEmpty(rootFolderPath)) {
          delete window.datasetStructureJSONObj?.folders?.[folder];
        }
      });

      guidedShowTreePreview(
        window.sodaJSONObj?.["digital-metadata"]?.name,
        "guided-folder-structure-review"
      );*/
    }

    if (targetPageID === "guided-manifest-file-generation-tab") {
      // Delete existing manifest files in the dataset structure
      Object.values(window.datasetStructureJSONObj.folders).forEach((folder) => {
        delete folder.files["manifest.xlsx"];
      });

      /**
       * Purge non-existent files from the dataset structure.
       */
      const purgeNonExistentFiles = async (datasetStructure) => {
        const nonExistentFiles = [];

        const collectNonExistentFiles = async (currentStructure, currentPath = "") => {
          for (const [fileName, fileData] of Object.entries(currentStructure.files || {})) {
            if (fileData.type === "local" && !(await window.fs.existsSync(fileData.path))) {
              nonExistentFiles.push(`${currentPath}${fileName}`);
            }
          }
          await Promise.all(
            Object.entries(currentStructure.folders || {}).map(([folderName, folder]) =>
              collectNonExistentFiles(folder, `${currentPath}${folderName}/`)
            )
          );
        };

        /**
         * Recursively deletes references to non-existent files from the dataset structure.
         * @param {Object} currentStructure - The current level of the dataset structure.
         * @param {string} currentPath - The relative path to the current structure.
         */
        const deleteNonExistentFiles = (currentStructure, currentPath = "") => {
          const files = currentStructure?.files || {};
          for (const fileName in files) {
            const fileData = files[fileName];
            if (fileData.type === "local") {
              const filePath = fileData.path;
              const isNonExistent = !window.fs.existsSync(filePath);

              if (isNonExistent) {
                window.log.info(
                  `Deleting reference to non-existent file: ${currentPath}${fileName}`
                );
                delete files[fileName];
              }
            }
          }
          Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) =>
            deleteNonExistentFiles(folder)
          );
        };

        await collectNonExistentFiles(datasetStructure);
        if (nonExistentFiles.length > 0) {
          await swalFileListSingleAction(
            nonExistentFiles,
            "Files imported into SODA that are no longer on your computer were detected",
            "These files will be disregarded and not uploaded to Pennsieve.",
            ""
          );
          deleteNonExistentFiles(datasetStructure);
        }
      };

      await purgeNonExistentFiles(window.datasetStructureJSONObj);

      /**
       * Recursively delete empty folders from the dataset structure.
       */
      const deleteEmptyFolders = (currentStructure) => {
        Object.entries(currentStructure.folders || {}).forEach(([folderName, folder]) => {
          deleteEmptyFolders(folder);
          if (
            !Object.keys(folder.files || {}).length &&
            !Object.keys(folder.folders || {}).length
          ) {
            delete currentStructure.folders[folderName];
          }
        });
      };

      deleteEmptyFolders(window.datasetStructureJSONObj);

      if (!Object.keys(window.datasetStructureJSONObj.folders).length) {
        await swalShowInfo(
          "No files or folders are currently imported into SODA",
          "You will be returned to the beginning of the dataset structuring section to import your data."
        );
        await window.openPage("guided-dataset-structure-intro-tab");
        return;
      }

      document.getElementById("guided-container-manifest-file-cards").innerHTML = `
    <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    Updating your dataset's manifest files...
  `;

      const sodaCopy = {
        ...window.sodaJSONObj,
        "metadata-files": {},
        "dataset-structure": window.datasetStructureJSONObj,
      };
      delete sodaCopy["generate-dataset"];

      const response = (
        await client.post(
          "/curate_datasets/clean-dataset",
          { soda_json_structure: sodaCopy },
          { timeout: 0 }
        )
      ).data.soda_json_structure;
      const manifestRes = (
        await client.post(
          "/curate_datasets/generate_manifest_file_data",
          { dataset_structure_obj: response["dataset-structure"] },
          { timeout: 0 }
        )
      ).data;

      const newManifestData = { headers: manifestRes.shift(), data: manifestRes };
      const entityColumnIndex = newManifestData.headers.indexOf("entity");

      /**
       * Sort manifest data rows based on predefined folder order.
       */
      const sortManifestDataRows = (rows) => {
        const folderOrder = {
          data: 0,
          primary: 1,
          source: 2,
          derivative: 3,
          code: 4,
          protocol: 5,
          docs: 6,
        };

        return rows.sort((rowA, rowB) => {
          const pathA = rowA[0] || "";
          const pathB = rowB[0] || "";

          const getTopLevelFolder = (path) => (path.includes("/") ? path.split("/")[0] : path);

          const folderA = getTopLevelFolder(pathA);
          const folderB = getTopLevelFolder(pathB);

          const priorityA = folderOrder[folderA] ?? Infinity;
          const priorityB = folderOrder[folderB] ?? Infinity;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // Ensure 'data' always comes before lexicographical sorting
          if (folderA === "data" && folderB !== "data") return -1;
          if (folderB === "data" && folderA !== "data") return 1;

          return pathA.localeCompare(pathB);
        });
      };

      console.log("Before sort: ", newManifestData.data);

      newManifestData.data = sortManifestDataRows(newManifestData.data);

      const datasetEntityObj = window.sodaJSONObj["dataset-entity-obj"];

      const updateEntityColumn = (manifestDataRows, datasetEntityObj) => {
        manifestDataRows.forEach((row) => {
          const path = row[0]; // Path is in the first column
          let entityList = [];

          // Check for subjects
          for (const [entity, paths] of Object.entries(datasetEntityObj.subjects || {})) {
            if (paths.includes(path)) {
              console.log("Subject found: ", entity);
              entityList.push(entity);
              break; // Stop checking subjects after the first match
            }
          }

          // Check for samples
          for (const [entity, paths] of Object.entries(datasetEntityObj.samples || {})) {
            if (paths.includes(path)) {
              entityList.push(entity);
              break; // Stop checking samples after the first match
            }
          }

          // Check for performances
          for (const [entity, paths] of Object.entries(datasetEntityObj.performances || {})) {
            if (paths.includes(path)) {
              entityList.push(entity);
              break; // Stop checking performances after the first match
            }
          }

          // Update the entity column (index from headers)
          row[entityColumnIndex] = entityList.join(" ");
        });

        return manifestDataRows; // Return updated data
      };

      const updateModalitiesColumn = (manifestDataRows, datasetEntityObj) => {
        const modalitiesColumnIndex = newManifestData.headers.indexOf("data modality");
        console.log("modalitiesColumnIndex", modalitiesColumnIndex);

        manifestDataRows.forEach((row) => {
          const path = row[0]; // Path is in the first column
          let modalitiesList = [];

          // Check for modalities
          for (const [modality, paths] of Object.entries(datasetEntityObj.modalities || {})) {
            if (paths.includes(path)) {
              modalitiesList.push(modality);
            }
          }

          // Update the modalities column (index from headers)
          row[modalitiesColumnIndex] = modalitiesList.join(" ");
        });

        return manifestDataRows; // Return updated data
      };

      // Apply the function
      updateEntityColumn(newManifestData.data, datasetEntityObj);
      updateModalitiesColumn(newManifestData.data, datasetEntityObj);

      console.log("After sort: ", newManifestData.data);
      window.sodaJSONObj["guided-manifest-file-data"] = window.sodaJSONObj[
        "guided-manifest-file-data"
      ]
        ? window.diffCheckManifestFiles(
            newManifestData,
            window.sodaJSONObj["guided-manifest-file-data"]
          )
        : newManifestData;

      renderManifestCards();
    }

    if (targetPageID === "guided-manifest-subject-entity-selector-tab") {
      setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
      setEntityType("subject-related-folders-and-files");
      setEntityListForEntityType(
        "subject-related-folders-and-files",
        window.sodaJSONObj["subject-related-folders-and-files"] || {}
      );
      setActiveEntity(null);
    }
    if (targetPageID === "guided-manifest-sample-entity-selector-tab") {
      setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
      setEntityType("sample-related-folders-and-files");
      setEntityListForEntityType(
        "sample-related-folders-and-files",
        window.sodaJSONObj["sample-related-folders-and-files"] || {}
      );
      setActiveEntity(null);
    }
    if (targetPageID === "guided-manifest-performance-entity-selector-tab") {
      setTreeViewDatasetStructure(window.datasetStructureJSONObj, ["primary"]);
      setEntityType("performance-related-folders-and-files");
      setEntityListForEntityType(
        "performance-related-folders-and-files",
        window.sodaJSONObj["performance-related-folders-and-files"] || {}
      );
      setActiveEntity(null);
    }
    if (targetPageID === "guided-source-derivative-folders-and-files-selector-tab") {
      addEntityToEntityList("source-derivative-folders-and-files", "source");
      addEntityToEntityList("source-derivative-folders-and-files", "derivative");
      setActiveEntity(null);
      console.log("datasetEntityObj", useGlobalStore.getState().datasetEntityObj);
    }
    if (targetPageID === "guided-modalities-selection-tab") {
      addEntityToEntityList("modalities", "microscopy");
      addEntityToEntityList("modalities", "electrophysiology");
      setActiveEntity(null);
      console.log("datasetEntityObj", useGlobalStore.getState().datasetEntityObj);
    }

    if (targetPageID === "guided-create-submission-metadata-tab") {
      if (pageNeedsUpdateFromPennsieve(targetPageID)) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          const submissionMetadataRes = await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
              file_type: "submission.xlsx",
            },
          });

          const submissionData = submissionMetadataRes.data;

          window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
            submissionData["Award number"];
          window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] =
            submissionData["Milestone achieved"];
          window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
            submissionData["Milestone completion date"];

          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, targetPageID);
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(targetPageID);
        }
      }

      //Reset the manual submission metadata UI
      const sparcAwardInputManual = document.getElementById("guided-submission-sparc-award-manual");
      sparcAwardInputManual.value = "";
      window.guidedSubmissionTagsTagifyManual.removeAllTags();
      const completionDateInputManual = document.getElementById(
        "guided-submission-completion-date-manual"
      );
      completionDateInputManual.innerHTML = `
          <option value="">Select a completion date</option>
          <option value="Enter my own date">Enter my own date</option>
          <option value="N/A">N/A</option>
        `;
      completionDateInputManual.value = "";

      const sectionThatAsksIfDataDeliverablesReady = document.getElementById(
        "guided-section-user-has-data-deliverables-question"
      );
      const sectionSubmissionMetadataInputs = document.getElementById(
        "guided-section-submission-metadata-inputs"
      );

      //Update the UI if their respective keys exist in the window.sodaJSONObj
      const sparcAward = window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      if (sparcAward) {
        sparcAwardInputManual.value = sparcAward;
      }
      const milestones =
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
      if (milestones) {
        window.guidedSubmissionTagsTagifyManual.addTags(milestones);
      }
      const completionDate =
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];

      if (completionDate && completionDate != "") {
        completionDateInputManual.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
        //select the completion date that was added
        completionDateInputManual.value = completionDate;
      }

      const setFundingConsortium =
        window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"];

      const topLevelDDDInstructionsText = document.getElementById(
        "guided-submission-metadata-ddd-import-instructions"
      );
      if (setFundingConsortium != "SPARC") {
        topLevelDDDInstructionsText.classList.add("hidden");
        // Hide the ddd import section since the submission is not SPARC funded
        sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
        // Show the submission metadata inputs section so the user can enter the metadata manually
        sectionSubmissionMetadataInputs.classList.remove("hidden");

        // Show the instructions for non-SPARC funded submissions
        window.showElementsWithClass("guided-non-sparc-funding-consortium-instructions");
      } else {
        topLevelDDDInstructionsText.classList.remove("hidden");

        // If the submission is SPARC, but they have already added their sparc award and milestones
        // then hide the section that asks if they have data deliverables ready and show the
        // submission metadata inputs section
        if (sparcAward && milestones) {
          sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
          sectionSubmissionMetadataInputs.classList.remove("hidden");
        } else {
          // If the submission is SPARC and they have not added their sparc award and milestones
          // then show the section that asks if they have data deliverables ready and hide the
          // submission metadata inputs section
          sectionThatAsksIfDataDeliverablesReady.classList.remove("hidden");
          sectionSubmissionMetadataInputs.classList.add("hidden");
          // Load the lottie animation where the user can drag and drop the data deliverable document
          const dataDeliverableLottieContainer = document.getElementById(
            "data-deliverable-lottie-container"
          );
          dataDeliverableLottieContainer.innerHTML = "";
          lottie.loadAnimation({
            container: dataDeliverableLottieContainer,
            animationData: dragDrop,
            renderer: "svg",
            loop: true,
            autoplay: true,
          });
        }

        // Hide the instructions for non-SPARC funded submissions
        window.hideElementsWithClass("guided-non-sparc-funding-consortium-instructions");
      }
    }

    if (targetPageID === "guided-contributors-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-contributors-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
              file_type: "dataset_description.xlsx",
            },
          });
          let contributorData = metadata_import.data["Contributor information"];
          //Filter out returned rows that only contain empty srings (first name is checked)
          const currentContributorFullNames = getContributorFullNames();
          contributorData = contributorData = contributorData.filter((row) => {
            return row[0] !== "" && !currentContributorFullNames.includes(row[0]);
          });

          // Loop through the contributorData array besides the first row (which is the header)
          for (let i = 1; i < contributorData.length; i++) {
            const contributors = contributorData[i];
            // split the name into first and last name with the first name being the first element and last name being the rest of the elements
            const contributorFullName = contributors[0];
            const contributorID = contributors[1];
            const contributorAffiliation = contributors[2].split(", ");
            const contributorRoles = contributors[3].split(", ");
            try {
              addContributor(
                contributorFullName,
                contributorID,
                contributorAffiliation,
                contributorRoles
              );
            } catch (error) {
              console.log(error);
            }
          }
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-contributors-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-contributors-tab");
        }
      }

      renderDatasetDescriptionContributorsTable();
    }

    if (targetPageID === "guided-protocols-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-protocols-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
              file_type: "dataset_description.xlsx",
            },
          });
          let relatedInformationData = metadata_import.data["Related information"];
          const protocolsFromPennsieve = relatedInformationData.filter(
            (relatedInformationArray) => {
              return (
                relatedInformationArray[1] === "IsProtocolFor" && relatedInformationArray[2] !== ""
              );
            }
          );

          for (const protocol of protocolsFromPennsieve) {
            const protocolLink = protocol[2];
            const protocolDescription = protocol[0];
            const protocolType = protocol[3];
            try {
              addGuidedProtocol(protocolLink, protocolDescription, protocolType);
            } catch (error) {
              console.log(error);
            }
          }
          // Click the yes protocol button if protocols were imported
          if (protocolsFromPennsieve.length > 0) {
            document.getElementById("guided-button-user-has-protocols").click();
          }
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-protocols-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-protocols-tab");
        }
      }
      renderProtocolsTable();
    }

    if (targetPageID === "guided-create-description-metadata-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-create-description-metadata-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["bf-dataset-selected"]["dataset-name"],
              file_type: "dataset_description.xlsx",
            },
          });
          // guidedLoadDescriptionDatasetInformation
          let basicInformation = metadata_import.data["Basic information"];

          // First try to get the keywords from the imported dataset description metadata
          if (basicInformation[3][0] === "Keywords") {
            const studyKeywords = basicInformation[3].slice(1).filter((keyword) => keyword !== "");

            // If more than 1 keyword is found, add store them to be loaded into the UI
            // Otherwise, use the tags on Pennsieve
            if (studyKeywords.length != 0) {
              window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"][
                "keywords"
              ] = studyKeywords;
            }
          }

          // guidedLoadDescriptionStudyInformation
          let studyInformation = metadata_import.data["Study information"];

          // Declare an object and add all of the study information to it
          const studyInformationObject = {};
          for (let i = 0; i < studyInformation.length; i++) {
            const studyInformationArray = studyInformation[i];
            // Lowercase the key (e.g. Study approach -> study approach)
            const studyInformationKey = studyInformationArray[0].toLowerCase();
            // The value is the second element in the array
            const studyInformationValue = studyInformationArray[1];

            studyInformationObject[studyInformationKey] = studyInformationValue;
          }

          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] =
            studyInformationObject;

          // guidedLoadDescriptionStudyDesign
          let awardInformation = metadata_import.data["Award information"];
          if (
            awardInformation[0][0] === "Funding" &&
            awardInformation[1][0] === "Acknowledgments"
          ) {
            const studyFunding = awardInformation[1].slice(1).filter((funding) => funding !== "");
            const studyAcknowledgements = awardInformation[1]
              .slice(1)
              .filter((acknowledgement) => acknowledgement !== "");

            window.sodaJSONObj["dataset-metadata"]["description-metadata"][
              "contributor-information"
            ] = {
              funding: studyFunding,
              acknowledgment: studyAcknowledgements,
            };
          }
          // Add  the related Links
          let relatedInformationData = metadata_import.data["Related information"];

          // Filter out invalid Links and protocol links
          const additionalLinksFromPennsieve = relatedInformationData
            .slice(1)
            .filter((relatedInformationArray) => {
              return (
                relatedInformationArray[0] !== "" &&
                relatedInformationArray[1] != "IsProtocolFor" &&
                relatedInformationArray[2] !== "" &&
                relatedInformationArray[3] !== ""
              );
            });
          const currentAddtionalLinks = getGuidedAdditionalLinks();
          for (const link of additionalLinksFromPennsieve) {
            const additionalLinkDescription = link[0];
            const additionalLinkRelation = link[1];
            const additionalLinkLink = link[2];
            const additionalLinkType = link[3];
            // If the ink has already been added, delete it and add the updated data
            // from Pennsieve
            if (currentAddtionalLinks.includes(additionalLinkLink)) {
              window.deleteAdditionalLink(additionalLinkLink);
            }
            window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].push(
              {
                link: additionalLinkLink,
                relation: additionalLinkRelation,
                description: additionalLinkDescription,
                type: additionalLinkType,
                isFair: true,
              }
            );
          }
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-create-description-metadata-tab"
          );
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-create-description-metadata-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-create-description-metadata-tab"
          );
        }
        // If the dataset keywords were not set from the imported metadata, try to get them from the Pennsieve tags
        const keywordsDerivedFromDescriptionMetadata =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]?.[
            "keywords"
          ];
        if (!keywordsDerivedFromDescriptionMetadata) {
          try {
            const currentDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
            const tagsReq = await client.get(`/manage_datasets/datasets/${currentDatasetID}/tags`, {
              params: { selected_account: window.defaultBfAccount },
            });
            const { tags } = tagsReq.data;
            if (tags.length > 0) {
              window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"][
                "keywords"
              ] = tags;
            }
          } catch (error) {
            // We don't need to do anything if this fails, but the user will have to enter the new tags before continuing
            clientError(error);
          }
        }

        // If the study information was not set from the imported metadata, try to extract it from the Pennsieve dataset description
        const studyPurpose =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study purpose"
          ];
        const studyDataCollection =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study data collection"
          ];
        const studyPrimaryConclusion =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study primary conclusion"
          ];

        if (!studyPurpose && !studyDataCollection && !studyPrimaryConclusion) {
          try {
            const pennsieveDatasetDescription = await api.getDatasetReadme(
              window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
            );
            const parsedDescription = createParsedReadme(pennsieveDatasetDescription);
            if (parsedDescription["Study Purpose"]) {
              window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
                "study purpose"
              ] = parsedDescription["Study Purpose"].replace(/\r?\n|\r/g, "").trim();
            }
            if (parsedDescription["Data Collection"]) {
              window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
                "study data collection"
              ] = parsedDescription["Data Collection"].replace(/\r?\n|\r/g, "").trim();
            }
            if (parsedDescription["Primary Conclusion"]) {
              window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"][
                "study primary conclusion"
              ] = parsedDescription["Primary Conclusion"].replace(/\r?\n|\r/g, "").trim();
            }
          } catch (error) {
            // We don't need to do anything if this fails, but the user will have to enter the study information before continuing
            clientError(error);
          }
        }
      }

      const guidedLoadDescriptionDatasetInformation = () => {
        // Reset the keywords tags and add the stored ones if they exist in the JSON
        guidedDatasetKeywordsTagify.removeAllTags();
        const datasetKeyWords =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]?.[
            "keywords"
          ];
        if (datasetKeyWords) {
          guidedDatasetKeywordsTagify.addTags(datasetKeyWords);
        }
      };
      guidedLoadDescriptionDatasetInformation();

      const guidedLoadDescriptionStudyInformation = () => {
        const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
        const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
        const studyPrimaryConclusionInput = document.getElementById(
          "guided-ds-study-primary-conclusion"
        );
        const studyCollectionTitleInput = document.getElementById(
          "guided-ds-study-collection-title"
        );

        //reset the inputs
        studyPurposeInput.value = "";
        studyDataCollectionInput.value = "";
        studyPrimaryConclusionInput.value = "";
        studyCollectionTitleInput.value = "";
        guidedStudyOrganSystemsTagify.removeAllTags();
        guidedStudyApproachTagify.removeAllTags();
        guidedStudyTechniquesTagify.removeAllTags();

        // Set the inputs if their respective keys exist in the JSON
        // (if not, the input will remain blank)
        const studyPurpose =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study purpose"
          ];
        if (studyPurpose) {
          studyPurposeInput.value = studyPurpose;
        }

        const studyDataCollection =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study data collection"
          ];
        if (studyDataCollection) {
          studyDataCollectionInput.value = studyDataCollection;
        }

        const studyPrimaryConclusion =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study primary conclusion"
          ];
        if (studyPrimaryConclusion) {
          studyPrimaryConclusionInput.value = studyPrimaryConclusion;
        }

        const studyCollectionTitle =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study collection title"
          ];
        if (studyCollectionTitle) {
          studyCollectionTitleInput.value = studyCollectionTitle;
        }

        const studyOrganSystems =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study organ system"
          ];
        if (studyOrganSystems) {
          guidedStudyOrganSystemsTagify.addTags(studyOrganSystems);
        }

        const studyApproach =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study approach"
          ];
        if (studyApproach) {
          guidedStudyApproachTagify.addTags(studyApproach);
        }

        const studyTechniques =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]?.[
            "study technique"
          ];
        if (studyTechniques) {
          guidedStudyTechniquesTagify.addTags(studyTechniques);
        }
      };
      guidedLoadDescriptionStudyInformation();

      const guidedLoadDescriptionContributorInformation = () => {
        const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
        const contributorInformationMetadata =
          window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"];

        guidedOtherFundingsourcesTagify.removeAllTags();

        if (contributorInformationMetadata) {
          acknowledgementsInput.value = contributorInformationMetadata["acknowledgment"];
          guidedOtherFundingsourcesTagify.addTags(contributorInformationMetadata["funding"]);
        } else {
          acknowledgementsInput.value = "";
          guidedOtherFundingsourcesTagify.removeAllTags();
        }
      };
      guidedLoadDescriptionContributorInformation();

      renderAdditionalLinksTable();

      const otherFundingLabel = document.getElementById("SPARC-award-other-funding-label");

      if (datasetIsSparcFunded()) {
        otherFundingLabel.innerHTML = ` besides the SPARC Award: ${window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"]}`;
      } else {
        otherFundingLabel.innerHTML = "";
      }
    }

    if (targetPageID === "guided-samples-folder-tab") {
      renderSamplesTable();
    }

    if (targetPageID === "guided-pennsieve-intro-tab") {
      const elementsToShowWhenLoggedInToPennsieve =
        document.querySelectorAll(".show-when-logged-in");
      const elementsToShowWhenNotLoggedInToPennsieve =
        document.querySelectorAll(".show-when-logged-out");
      if (!window.defaultBfAccount) {
        elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
          element.classList.add("hidden");
        });
        elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
          element.classList.remove("hidden");
        });
      } else {
        elementsToShowWhenLoggedInToPennsieve.forEach((element) => {
          element.classList.remove("hidden");
        });
        elementsToShowWhenNotLoggedInToPennsieve.forEach((element) => {
          element.classList.add("hidden");
        });

        const pennsieveIntroText = document.getElementById("guided-pennsive-intro-bf-account");
        // fetch the user's email and set that as the account field's value
        const userInformation = await api.getUserInformation();
        const userEmail = userInformation.email;
        pennsieveIntroText.innerHTML = userEmail;

        try {
          if (window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"]) {
            if (
              window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] ===
              guidedGetCurrentUserWorkSpace()
            ) {
              document.getElementById("guided-confirm-pennsieve-organization-button").click();
            }
          }
        } catch (error) {
          pennsieveIntroAccountDetailsText.innerHTML = "Error loading account details";
        }
      }
    }

    if (targetPageID === "guided-banner-image-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-banner-image-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        // If the fetch fails, (they don't have a banner image yet)
        const datasetName = window.sodaJSONObj["digital-metadata"]["name"];
        const datasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

        try {
          // pass in the id in case the name of the dataset has been
          // changed from the original Pennsieve dataset name
          let res = await api.getDatasetBannerImageURL( datasetID);
          if (res != "No banner image") {
            //Banner is returned as an s3 bucket url but image needs to be converted as
            //base64 to save and write to users local system

            let img_base64 = await window.getBase64(res); // encode image to base64
            let guided_img_url = res;
            let imageType = "";
            let fullBase64Image = "";
            let position = guided_img_url.search("X-Amz-Security-Token");

            if (position != -1) {
              // The image url will be before the security token
              let new_img_src = guided_img_url.substring(0, position - 1);
              let new_position = new_img_src.lastIndexOf("."); //

              if (new_position != -1) {
                window.imageExtension = new_img_src.substring(new_position + 1);

                if (window.imageExtension.toLowerCase() == "png") {
                  fullBase64Image = "data:image/png;base64," + img_base64;
                  imageType = "png";
                } else if (
                  window.imageExtension.toLowerCase() == "jpeg" ||
                  window.imageExtension.toLowerCase() == "jpg"
                ) {
                  fullBase64Image = "data:image/jpg;base64," + img_base64;
                  imageType = "jpg";
                } else {
                  window.log.error(`An error happened: ${guided_img_url}`);
                  Swal.fire({
                    icon: "error",
                    text: "An error occurred when importing the image. Please try again later.",
                    showConfirmButton: "OK",
                    backdrop: "rgba(0,0,0, 0.4)",
                    heightAuto: false,
                  });

                  window.logGeneralOperationsForAnalytics(
                    "Error",
                    window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
                    window.AnalyticsGranularity.ALL_LEVELS,
                    ["Importing Banner Image"]
                  );
                }
              }
            }

            let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
            if (!window.fs.existsSync(imageFolder)) {
              //create SODA/guided-banner-images if it doesn't exist
              window.fs.mkdirSync(imageFolder, { recursive: true });
            }
            let imagePath = window.path.join(imageFolder, `${datasetName}.` + imageType);
            //store file at imagePath destination

            await window.electron.ipcRenderer.invoke("write-banner-image", img_base64, imagePath);

            //save imagePath to sodaJson
            window.sodaJSONObj["digital-metadata"]["banner-image-path"] = imagePath;

            //add image to modal and display image on main banner import page
            $("#guided-image-banner").attr("src", fullBase64Image);
            $("#guided-para-path-image").html(imagePath);
            document.getElementById("guided-div-img-container-holder").style.display = "none";
            document.getElementById("guided-div-img-container").style.display = "block";

            //set new cropper for imported image
            window.myCropper.destroy();
            window.myCropper = new Cropper(
              window.guidedBfViewImportedImage,
              window.guidedCropOptions
            );

            $("#guided-save-banner-image").css("visibility", "visible");
          }
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
        } catch (error) {
          clientError(error);
          const emessage = userErrorMessage(error);
          await guidedShowOptionalRetrySwal(emessage, "guided-banner-image-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
        }
      }
      if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
        //added extra param to function to prevent modification of URL
        guidedShowBannerImagePreview(
          window.sodaJSONObj["digital-metadata"]["banner-image-path"],
          true
        );
        document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
      } else {
        //reset the banner image page
        $("#guided-button-add-banner-image").html("Add banner image");
        $("#guided-banner-image-preview-container").hide();
      }
    }

    if (targetPageID === "guided-designate-permissions-tab") {
      // Get the users that can be granted permissions
      const usersReq = await client.get(
        `manage_datasets/ps_get_users?selected_account=${window.defaultBfAccount}`
      );
      const usersThatCanBeGrantedPermissions = usersReq.data.users;

      // Get the teams that can be granted permissions
      // Note: This is in a try catch because guest accounts do not have access to the teams endpoint
      // so the request will fail and teamsThatCanBeGrantedPermissions will remain an empty array
      let teamsThatCanBeGrantedPermissions = [];
      try {
        const teamsReq = await client.get(
          `manage_datasets/ps_get_teams?selected_account=${window.defaultBfAccount}`
        );
        teamsThatCanBeGrantedPermissions = window.getSortedTeamStrings(teamsReq.data.teams);
      } catch (error) {
        clientError(error);
      }

      // Reset the dropdown with the new users and teams
      guidedAddUsersAndTeamsToDropdown(
        usersThatCanBeGrantedPermissions,
        teamsThatCanBeGrantedPermissions
      );

      if (pageNeedsUpdateFromPennsieve("guided-designate-permissions-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          let sparcUsersDivided = [];

          //sparc users results needs to be formatted
          usersThatCanBeGrantedPermissions.forEach((element) => {
            //first two elements of this array will just be an email with no name
            sparcUsersDivided.push(element.split(" !|**|!"));
          });

          const permissions = await api.getDatasetPermissions(
            window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            false
          );

          //Filter out the integration user
          const filteredPermissions = permissions.filter((permission) => {
            return !permission.includes("Integration User");
          });

          let partialUserDetails = [];
          let finalTeamPermissions = [];
          let piOwner = [];

          //so check for PI owner as well
          for (const userPermission of filteredPermissions) {
            // Will include teams and users
            let userRoleSplit = userPermission.split(",");
            // Will look like:
            // ['User: John Doe ', ' role: owner']
            // need to split above
            let nameSplit = userRoleSplit[0].split(":"); // will appear as ['Team', ' DRC Team']
            let roleSplit = userRoleSplit[1].split(":"); // will appear as [' role', ' Viewer']
            let userName = nameSplit[1].trim();
            let userPermiss = roleSplit[1].trim();
            let teamOrUser = nameSplit[0].trim().toLowerCase();

            if (teamOrUser === "team") {
              finalTeamPermissions.push({
                UUID: userName,
                permission: userPermiss,
                teamString: userName,
                permissionSource: "Pennsieve",
                deleteFromPennsieve: false,
              });
            } else {
              partialUserDetails.push({
                permission: userPermiss,
                userName: userName,
              });
            }
          }
          // After loop use the array of objects to find the UUID and email
          let finalUserPermissions = [];

          partialUserDetails.map((object) => {
            sparcUsersDivided.forEach((element) => {
              if (element[0].includes(object["userName"])) {
                // name was found now get UUID
                let userEmailSplit = element[0].split(" (");
                if (object["permission"] === "owner") {
                  //set for pi owner
                  piOwner.push({
                    UUID: object.permission,
                    name: userEmailSplit[0],
                    userString: element[0],
                    permissionSource: "Pennsieve",
                    deleteFromPennsieve: false,
                  });
                  //update PI owner key
                } else {
                  finalUserPermissions.push({
                    UUID: element[1],
                    permission: object.permission,
                    userName: userEmailSplit[0],
                    userString: element[0],
                    permissonSource: "Pennsieve",
                    deleteFromPennsieve: false,
                  });
                }
              }
            });
          });

          window.sodaJSONObj["digital-metadata"]["team-permissions"] = finalTeamPermissions;
          window.sodaJSONObj["digital-metadata"]["user-permissions"] = finalUserPermissions;
          window.sodaJSONObj["digital-metadata"]["pi-owner"] = piOwner[0];

          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-designate-permissions-tab"
          );
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-designate-permissions-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-designate-permissions-tab"
          );
        }
      }

      //If the PI owner is empty, set the PI owner to the user that is currently curating
      if (Object.keys(window.sodaJSONObj["digital-metadata"]["pi-owner"]).length === 0) {
        //Get the user information of the user that is currently curating
        const user = await api.getUserInformation();

        const loggedInUserString = `${user["firstName"]} ${user["lastName"]} (${user["email"]})`;
        const loggedInUserUUID = user["id"];
        const loggedInUserName = `${user["firstName"]} ${user["lastName"]}`;
        const loggedInUserPiObj = {
          userString: loggedInUserString,
          UUID: loggedInUserUUID,
          name: loggedInUserName,
        };
        setGuidedDatasetPiOwner(loggedInUserPiObj);
      }

      renderPermissionsTable();
      guidedResetUserTeamPermissionsDropdowns();
    }

    if (targetPageID === "guided-assign-license-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-assign-license-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          const licenseReq = await client.get(`/manage_datasets/bf_license`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            },
          });
          const { license } = licenseReq.data;
          window.sodaJSONObj["digital-metadata"]["license"] = license;
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-assign-license-tab");
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-assign-license-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-assign-license-tab");
        }
      }
      // Get the selected dataset type ("computational" or "experimental")
      const datasetType = guidedGetDatasetType();

      // Update the license select instructions based on the selected dataset type
      const licenseSelectInstructions = document.getElementById("license-select-text");
      if (datasetType === "computational") {
        licenseSelectInstructions.innerHTML = `
          Select a license for your computational dataset from the options below.
        `;
      }
      if (datasetType === "experimental") {
        licenseSelectInstructions.innerHTML = `
          As per SPARC policy, all experimental datasets must be shared under the
          <b>Creative Commons Attribution (CC-BY)</b> license.
          <br />
          <br />
          Select the button below to consent to sharing your dataset under the Creative Commons Attribution license.
        `;
      }

      // Get the license options that are applicable for the selected dataset type
      const selectableLicenses = guidedLicenseOptions.filter((license) => {
        return license.datasetTypes.includes(datasetType);
      });

      // Render the license radio buttons into their container
      const licenseRadioButtonContainer = document.getElementById(
        "guided-license-radio-button-container"
      );
      const licenseRadioButtonElements = selectableLicenses
        .map((license) => {
          return `
          <button class="guided--simple-radio-button" data-value="${license.licenseName}">
            <input type="radio" name="license" value="${license.licenseName}" style="margin-right: 5px; cursor: pointer; margin-top: 5px;" />
            <div style=" display: flex; flex-direction: column; align-items: flex-start; flex-grow: 1;">
              <p class="help-text mb-0"><b>${license.licenseName}</b></p>
              <p class="guided--text-input-instructions text-left">${license.licenseDescription}</p>
            </div>
          </button>
        `;
        })
        .join("\n");
      licenseRadioButtonContainer.innerHTML = licenseRadioButtonElements;

      // Add event listeners to the license radio buttons that add the selected class to the clicked button
      // and deselects all other buttons
      document.querySelectorAll(".guided--simple-radio-button").forEach((button) => {
        button.addEventListener("click", () => {
          // Remove selected class from all radio buttons
          licenseRadioButtonContainer
            .querySelectorAll(".guided--simple-radio-button")
            .forEach((button) => {
              button.classList.remove("selected");
            });

          // Add selected class to the clicked radio button
          button.classList.add("selected");
          // Click the radio button input
          button.querySelector("input").click();
        });
      });

      // If a license has already been selected, select the corresponding radio button (Only if the license is still selectable)
      const selectedLicense = window.sodaJSONObj["digital-metadata"]["license"];
      if (selectedLicense) {
        const selectedLicenseRadioButton = licenseRadioButtonContainer.querySelector(
          `[data-value="${selectedLicense}"]`
        );
        if (selectedLicenseRadioButton) {
          selectedLicenseRadioButton.click();
        }
      }
    }

    if (targetPageID === "guided-create-subjects-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById("guided-accordian-custom-fields").innerHTML = "";
      document.getElementById("guided-bootbox-subject-id").value = "";

      //Add protocol titles to the protocol dropdown
      const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

      // Hide the subjects protocol section if no protocols have been attached to the dataset
      const subjectsProtocolContainer = document.getElementById(
        "guided-container-subjects-protocol"
      );
      protocols.length > 0
        ? subjectsProtocolContainer.classList.remove("hidden")
        : subjectsProtocolContainer.classList.add("hidden");

      document.getElementById("guided-bootbox-subject-protocol-title").innerHTML = `
          <option value="">No protocols associated with this sample</option>
          ${protocols
            .map((protocol) => {
              return `
                <option
                  value="${protocol.description}"
                  data-protocol-link="${protocol.link}"
                >
                  ${protocol.description}
                </option>
              `;
            })
            .join("\n")}))
        `;

      document.getElementById("guided-bootbox-subject-protocol-location").innerHTML = `
        <option value="">No protocols associated with this sample</option>
        ${protocols
          .map((protocol) => {
            return `
              <option
                value="${protocol.link}"
                data-protocol-description="${protocol.description}"
              >
                ${protocol.link}
              </option>
            `;
          })
          .join("\n")}))
      `;
      await renderSubjectsMetadataAsideItems();
      const subjectsMetadataBlackArrowLottieContainer = document.getElementById(
        "subjects-metadata-black-arrow-lottie-container"
      );
      subjectsMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: subjectsMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      hideEleShowEle("guided-form-add-a-subject", "guided-form-add-a-subject-intro");
    }

    if (targetPageID === "guided-create-samples-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById("guided-accordian-custom-fields-samples").innerHTML = "";
      document.getElementById("guided-bootbox-subject-id-samples").value = "";
      document.getElementById("guided-bootbox-sample-id").value = "";
      await renderSamplesMetadataAsideItems();
      const samplesMetadataBlackArrowLottieContainer = document.getElementById(
        "samples-metadata-black-arrow-lottie-container"
      );
      samplesMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: samplesMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      hideEleShowEle("guided-form-add-a-sample", "guided-form-add-a-sample-intro");

      // Hide the samples protocol section if no protocols have been attached to the dataset
      const samplesProtocolContainer = document.getElementById("guided-container-samples-protocol");
      window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"].length > 0
        ? samplesProtocolContainer.classList.remove("hidden")
        : samplesProtocolContainer.classList.add("hidden");
    }

    if (targetPageID === "guided-add-code-metadata-tab") {
      const startNewCodeDescYesNoContainer = document.getElementById(
        "guided-section-start-new-code-metadata-query"
      );
      const startPennsieveCodeDescYesNoContainer = document.getElementById(
        "guided-section-start-from-pennsieve-code-metadata-query"
      );
      if (pageNeedsUpdateFromPennsieve("guided-add-code-metadata-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          await client.get(`/prepare_metadata/import_metadata_file`, {
            params: {
              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
              file_type: "code_description.xlsx",
            },
          });
          window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] = "yes";
        } catch (error) {
          console.error("code_description file does not exist");
        }
      }
      // If the code_description file has been detected on the dataset on Pennsieve, show the
      // "Start from Pennsieve" option, otherwise show the "Start new" option
      if (window.sodaJSONObj["pennsieve-dataset-has-code-metadata-file"] === "yes") {
        startNewCodeDescYesNoContainer.classList.add("hidden");
        startPennsieveCodeDescYesNoContainer.classList.remove("hidden");
      } else {
        startNewCodeDescYesNoContainer.classList.remove("hidden");
        startPennsieveCodeDescYesNoContainer.classList.add("hidden");
      }

      const codeDescriptionPath =
        window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];

      const codeDescriptionLottieContainer = document.getElementById(
        "code-description-lottie-container"
      );
      const codeDescriptionParaText = document.getElementById("guided-code-description-para-text");

      if (codeDescriptionPath) {
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: successCheck,
          renderer: "svg",
          loop: false,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = codeDescriptionPath;
      } else {
        //reset the code metadata lotties and para text
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = "";
      }
    }

    if (targetPageID === "guided-create-readme-metadata-tab") {
      if (pageNeedsUpdateFromPennsieve("guided-create-readme-metadata-tab")) {
        // Show the loading page while the page's data is being fetched from Pennsieve
        setPageLoadingState(true);
        try {
          let readme_import = await client.get(`/prepare_metadata/readme_changes_file`, {
            params: {
              file_type: "README",

              selected_account: window.defaultBfAccount,
              selected_dataset: window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"],
            },
          });
          let readme_text = readme_import.data.text;
          window.sodaJSONObj["dataset-metadata"]["README"] = readme_text;
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-create-readme-metadata-tab"
          );
        } catch (error) {
          clientError(error);
          const emessage = error.response.data.message;
          await guidedShowOptionalRetrySwal(emessage, "guided-create-readme-metadata-tab");
          // If the user chooses not to retry re-fetching the page data, mark the page as fetched
          // so the the fetch does not occur again
          window.sodaJSONObj["pages-fetched-from-pennsieve"].push(
            "guided-create-readme-metadata-tab"
          );
        }
      }
      const readMeTextArea = document.getElementById("guided-textarea-create-readme");

      const readMe = window.sodaJSONObj["dataset-metadata"]["README"];

      if (readMe) {
        readMeTextArea.value = readMe;
      } else {
        readMeTextArea.value = "";
      }
    }

    if (targetPageID === "guided-create-changes-metadata-tab") {
      const changesTextArea = document.getElementById("guided-textarea-create-changes");

      const changes = window.sodaJSONObj["dataset-metadata"]["CHANGES"];

      if (changes) {
        changesTextArea.value = changes;
      } else {
        changesTextArea.value = "";
      }
    }

    if (targetPageID === "guided-create-local-copy-tab") {
      // Show the dataset structure preview using jsTree
      guidedShowTreePreview(
        window.sodaJSONObj["digital-metadata"]["name"],
        "guided-folder-and-metadata-structure-review"
      );

      // If the dataset was not started from Pennsieve, show the "Copy dataset" section
      // (We don't display this feature when starting from Pennsieve because we don't currently have the ability
      // to copy a dataset from Pennsieve to the user's local system)
      const createCopySection = document.getElementById("guided-section-create-local-dataset-copy");
      if (window.sodaJSONObj["starting-point"]["type"] === "new") {
        createCopySection.classList.remove("hidden");
      } else {
        createCopySection.classList.add("hidden");
      }

      guidedResetLocalGenerationUI();
    }

    if (targetPageID === "guided-dataset-generation-confirmation-tab") {
      //Set the inner text of the generate/retry pennsieve dataset button depending on
      //whether a dataset has bee uploaded from this progress file
      const generateOrRetryDatasetUploadButton = document.getElementById(
        "guided-generate-dataset-button"
      );
      const reviewGenerateButtionTextElement = document.getElementById(
        "review-generate-button-text"
      );
      if (
        window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] &&
        !window.sodaJSONObj["starting-point"]["type"] === "bf"
      ) {
        const generateButtonText = "Resume Pennsieve upload in progress";
        generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
        reviewGenerateButtionTextElement.innerHTML = generateButtonText;
      } else {
        const generateButtonText = "Generate dataset on Pennsieve";
        generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
        reviewGenerateButtionTextElement.innerHTML = generateButtonText;
      }

      const datsetName = window.sodaJSONObj["digital-metadata"]["name"];
      const datsetSubtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
      const datasetUserPermissions = window.sodaJSONObj["digital-metadata"]["user-permissions"];
      const datasetTeamPermissions = window.sodaJSONObj["digital-metadata"]["team-permissions"];
      const datasetTags = window.sodaJSONObj["digital-metadata"]["dataset-tags"];
      const datasetLicense = window.sodaJSONObj["digital-metadata"]["license"];

      const datasetNameReviewText = document.getElementById("guided-review-dataset-name");

      const datasetSubtitleReviewText = document.getElementById("guided-review-dataset-subtitle");
      const datasetDescriptionReviewText = document.getElementById(
        "guided-review-dataset-description"
      );
      const datasetUserPermissionsReviewText = document.getElementById(
        "guided-review-dataset-user-permissions"
      );
      const datasetTeamPermissionsReviewText = document.getElementById(
        "guided-review-dataset-team-permissions"
      );
      const datasetTagsReviewText = document.getElementById("guided-review-dataset-tags");
      const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

      datasetNameReviewText.innerHTML = datsetName;
      datasetSubtitleReviewText.innerHTML = datsetSubtitle;

      datasetDescriptionReviewText.innerHTML = Object.keys(
        window.sodaJSONObj["digital-metadata"]["description"]
      )
        .map((key) => {
          //change - to spaces in description and then capitalize
          const descriptionTitle = key
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          return `<b>${descriptionTitle}</b>: ${window.sodaJSONObj["digital-metadata"]["description"][key]}<br /><br />`;
        })
        .join("\n");

      if (datasetUserPermissions.length > 0) {
        const datasetUserPermissionsString = datasetUserPermissions
          .map((permission) => permission.userString)
          .join("<br>");
        datasetUserPermissionsReviewText.innerHTML = datasetUserPermissionsString;
      } else {
        datasetUserPermissionsReviewText.innerHTML = "No additional user permissions added";
      }

      if (datasetTeamPermissions.length > 0) {
        const datasetTeamPermissionsString = datasetTeamPermissions
          .map((permission) => permission.teamString)
          .join("<br>");
        datasetTeamPermissionsReviewText.innerHTML = datasetTeamPermissionsString;
      } else {
        datasetTeamPermissionsReviewText.innerHTML = "No additional team permissions added";
      }

      datasetTagsReviewText.innerHTML = datasetTags.join(", ");
      datasetLicenseReviewText.innerHTML = datasetLicense;

      guidedShowTreePreview(
        window.sodaJSONObj["digital-metadata"]["name"],
        "guided-folder-structure-review-generate"
      );

      // Hide the Pennsieve agent check section (unhidden if it requires user action)
      document
        .getElementById("guided-mode-pre-generate-pennsieve-agent-check")
        .classList.add("hidden");
    }

    if (targetPageID === "guided-dataset-generation-tab") {
      document.getElementById("guided--verify-files").classList.add("hidden");
    }

    if (targetPageID === "guided-dataset-dissemination-tab") {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);

      const currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
      const currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];

      const pennsieveDatasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

      const pennsieveDatasetLink = document.getElementById("guided-pennsieve-dataset-link");

      const pennsieveCopy = document.getElementById("guided-pennsieve-copy-dataset-link");

      const pennsieveDatasetCopyIcon = document.getElementById("guided-pennsieve-copy-icon");

      pennsieveDatasetCopyIcon.classList.add("fa-copy");

      let datasetLink = `https://app.pennsieve.io/N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0/datasets/${pennsieveDatasetID}/overview`;
      let linkIcon = `<i class="fas fa-link" style="margin-right: 0.4rem; margin-left: 0.4rem"></i>`;

      pennsieveDatasetLink.innerHTML = linkIcon + datasetLink;
      pennsieveDatasetLink.href = datasetLink;

      if (removeEventListener) {
        pennsieveCopy.removeEventListener(
          "click",
          () => {
            copyLink(datasetLink);
          },
          true
        );
      }
      if (addListener) {
        pennsieveCopy.addEventListener("click", () => {
          copyLink(datasetLink);
        });
        /*
        TODO: FIX COPY TO CLIPBOARD POST-BUNDLE
        pennsieveDOICopy.addEventListener("click", () => {
          let doiInfo = document.getElementById("guided--para-doi-info").innerText;
          copyLink(doiInfo);
        });*/
        addListener = false;
        removeEventListener = true;
      }

      let pennsieveDOICheck = await api.getDatasetDOI(currentDataset);

      //Set the ui for curation team and DOI information
      await window.showPublishingStatus("", "guided");
      window.guidedSetCurationTeamUI();
      guidedSetDOIUI(pennsieveDOICheck);
    }

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
const guidedOpenEntityEditSwal = async (entityName) => {
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  if (entityName.startsWith("sub-")) {
    preExistingEntities = window.getExistingSubjectNames();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }
  if (entityName.startsWith("pool-")) {
    preExistingEntities = getExistingPoolNames();
    entityNameSingular = "pool";
    entityPrefix = "pool-";
  }
  if (entityName.startsWith("sam-")) {
    preExistingEntities = getExistingSampleNames();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  let newEntityName;

  const entityEditConfirmed = await Swal.fire({
    title: `Editing ${entityNameSingular} ${entityName}`,
    html: `
      <p class="help-text text-center">
        Enter the new name for the ${entityNameSingular} below and press edit.
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input value="${entityName.replace(
          entityPrefix,
          ""
        )}" id='input-new-entity-name' class='guided--input' type='text' placeholder='Enter new ${entityNameSingular} name and press edit'/>
      </div>
    `,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    confirmButtonText: `Edit`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Add event listener to the input to enable the confirm button when the input is changed
      document.getElementById("input-new-entity-name").addEventListener("keyup", () => {
        Swal.resetValidationMessage();
        Swal.enableButtons();
      });
    },
    preConfirm: () => {
      let newEntityInputValue = document.getElementById("input-new-entity-name").value;
      if (newEntityInputValue.length === 0) {
        Swal.showValidationMessage(`Please enter a new ${entityNameSingular} name`);
        return;
      }

      newEntityName = `${entityPrefix}${newEntityInputValue}`;
      if (newEntityName === entityName) {
        Swal.close();
      }
      const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
        newEntityName,
        "string-adheres-to-identifier-conventions"
      );
      if (!entityNameIsValid) {
        Swal.showValidationMessage(
          `${entityNameSingular} names can not contain spaces or special characters`
        );
        return;
      }
      if (preExistingEntities.includes(newEntityName)) {
        Swal.showValidationMessage(`A ${entityNameSingular} with that name already exists`);
        return;
      }
    },
  });

  if (entityEditConfirmed.isConfirmed) {
    if (entityName.startsWith("sub-")) {
      window.sodaJSONObj.renameSubject(entityName, newEntityName);
      renderSubjectsTable();
    }
    if (entityName.startsWith("pool-")) {
      window.sodaJSONObj.renamePool(entityName, newEntityName);
      renderPoolsTable();
    }
    if (entityName.startsWith("sam-")) {
      window.sodaJSONObj.renameSample(entityName, newEntityName);
      renderSamplesTable();
    }
  }
};

const renderSubjectsTable = () => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];

  // If there are no subjects, hide the subjects table
  const subjectsTableContainer = document.getElementById("guided-section-subjects-table");
  if (subjects.length === 0) {
    subjectsTableContainer.classList.add("hidden");
    return;
  } else {
    // If there are subjects, show the subjects table
    subjectsTableContainer.classList.remove("hidden");
  }

  // Map the subjects to HTML elements
  const subjectElementRows = subjects
    .map((subject) => {
      return generateSubjectRowElement(subject.subjectName);
    })
    .join("\n");
  document.getElementById("subject-specification-table-body").innerHTML = subjectElementRows;

  // Add event listeners to the subject edit buttons
  document.querySelectorAll(".guided-subject-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const subjectName = button.dataset.subjectName;
      await guidedOpenEntityEditSwal(subjectName);
    });
  });
};

const renderPoolsTable = () => {
  const pools = window.sodaJSONObj.getPools();
  const poolElementRows = Object.keys(pools)
    .map((pool) => {
      return generatePoolRowElement(pool);
    })
    .join("\n");
  document.getElementById("pools-specification-table-body").innerHTML = poolElementRows;

  // Add event listeners to the pool edit buttons
  document.querySelectorAll(".guided-pool-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const poolName = button.dataset.poolName;
      await guidedOpenEntityEditSwal(poolName);
    });
  });

  for (const poolName of Object.keys(pools)) {
    const newPoolSubjectsSelectElement = $(
      `select[name="${poolName}-subjects-selection-dropdown"]`
    );
    //create a select2 dropdown for the pool subjects
    $(newPoolSubjectsSelectElement).select2({
      placeholder: "Select subjects",
      tags: true,
      width: "100%",
      closeOnSelect: false,
      createTag: function () {
        // Disable tagging
        return null;
      },
    });
    //update the newPoolSubjectsElement with the subjects in the pool
    updatePoolDropdown($(newPoolSubjectsSelectElement), poolName);
    $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
      updatePoolDropdown($(e.currentTarget), poolName);
    });
    $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
      const subjectToRemove = e.params.data.id;
      window.sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
    });
    $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
      const selectedSubject = e.params.data.id;
      window.sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
    });
  }
};

const renderSamplesTable = () => {
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //Create the HTML for the subjects
  const subjectSampleAdditionTables = subjects
    .map((subject) => {
      return renderSubjectSampleAdditionTable(subject);
    })
    .join("\n");

  const subjectSampleAdditionTableContainer = document.getElementById(
    "guided-section-samples-tables"
  );
  subjectSampleAdditionTableContainer.innerHTML = subjectSampleAdditionTables;

  document.querySelectorAll(".button-subject-add-samples").forEach((button) => {
    button.addEventListener("click", async () => {
      const subjectName = button.dataset.samplesSubjectName;
      await guidedOpenEntityAdditionSwal(subjectName);
    });
  });

  // Add event listeners to the sample edit buttons
  document.querySelectorAll(".guided-sample-edit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const sampleName = button.dataset.sampleName;
      await guidedOpenEntityEditSwal(sampleName);
    });
  });
};

function setGuidedProgressBarValue(destination, value) {
  const progressBar = document.querySelector(`#guided-progress-bar-${destination}-generation`);
  if (progressBar) {
    progressBar.setAttribute("value", value);
  } else {
    console.error(`Could not find progress bar for ${destination}`);
  }
}

const generateAlertElement = (alertType, warningMessageText) => {
  return `
      <div class="alert alert-${alertType} guided--alert mr-2" role="alert">
        ${warningMessageText}
      </div>
    `;
};

const generateAlertMessage = (elementToWarn) => {
  const alertMessage = elementToWarn.data("alert-message");
  const alertType = elementToWarn.data("alert-type");
  if (!elementToWarn.next().hasClass("alert")) {
    elementToWarn.after(generateAlertElement(alertType, alertMessage));
  }
  enableProgressButton();
};

const removeAlertMessageIfExists = (elementToCheck) => {
  const alertMessageToRemove = elementToCheck.next();
  if (alertMessageToRemove.hasClass("alert")) {
    elementToCheck.next().remove();
  }
};

//function that creates a new folder object
const newEmptyFolderObj = () => {
  console.log("newEmptyFolderObj");
  return {
    folders: {},
    files: {},
    type: "virtual",
    action: ["new"],
  };
};

const getDatasetStructureJsonFolderContentsAtNestedArrayPath = (folderPathArray) => {
  let currentFolder = window.datasetStructureJSONObj;
  folderPathArray.forEach((folder) => {
    console.log("currentFolder[folders'][folder]", currentFolder["folders"][folder]);
    // Continue to recursively create folders if they don't exist
    if (!currentFolder["folders"][folder]) {
      currentFolder["folders"][folder] = newEmptyFolderObj();
    }
    currentFolder = currentFolder["folders"][folder];
  });
  return currentFolder;
};

const guidedCheckIfUserNeedsToReconfirmAccountDetails = () => {
  if (!window.sodaJSONObj["completed-tabs"].includes("guided-pennsieve-intro-tab")) {
    return false;
  }
  // If the user has changed their Pennsieve account, they need to confirm their new Pennsieve account and workspace
  if (window.sodaJSONObj?.["last-confirmed-bf-account-details"] !== window.defaultBfAccount) {
    if (window.sodaJSONObj["button-config"]?.["pennsieve-account-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["pennsieve-account-has-been-confirmed"];
    }
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }
  // If the user has changed their Pennsieve workspace, they need to confirm their new workspace
  if (
    guidedGetCurrentUserWorkSpace() !=
    window.sodaJSONObj?.["last-confirmed-pennsieve-workspace-details"]
  ) {
    if (window.sodaJSONObj["button-config"]?.["organization-has-been-confirmed"]) {
      delete window.sodaJSONObj["button-config"]["organization-has-been-confirmed"];
    }
    return true;
  }
  // Return false if the user does not need to reconfirm their account details
  return false;
};

const guidedGetPageToReturnTo = async () => {
  // Set by window.openPage function
  const usersPageBeforeExit = window.sodaJSONObj["page-before-exit"];

  //If the dataset was successfully uploaded, send the user to the share with curation team
  if (window.sodaJSONObj["previous-guided-upload-dataset-name"]) {
    return "guided-dataset-dissemination-tab";
  }

  // returns the id of the first page of guided mode
  const firstPageID = getNonSkippedGuidedModePages(document)[0].id;

  const currentSodaVersion = document.getElementById("version").innerHTML;
  const lastVersionOfSodaUsedOnProgressFile = window.sodaJSONObj["last-version-of-soda-used"];

  if (lastVersionOfSodaUsedOnProgressFile != currentSodaVersion) {
    // If the progress file was last edited in a previous SODA version, reset to the first page
    await swalShowInfo(
      "SODA has been updated since you last worked on this dataset.",
      "You'll be taken to the first page to ensure compatibility with the latest workflow. Your previous work is saved and accessible."
    );
    return firstPageID;
  }

  if (guidedCheckIfUserNeedsToReconfirmAccountDetails() === true) {
    return "guided-pennsieve-intro-tab";
  }

  // If the page the user was last on no longer exists, return them to the first page
  if (!document.getElementById(usersPageBeforeExit)) {
    return firstPageID;
  }

  // If the user left while the upload was in progress, send the user to the upload confirmation page
  if (usersPageBeforeExit === "guided-dataset-generation-tab") {
    return "guided-dataset-generation-confirmation-tab";
  }
  // If no special cases apply, return the user to the page they were on before they left
  return usersPageBeforeExit;
};

const patchPreviousGuidedModeVersions = async () => {
  //temp patch contributor affiliations if they are still a string (they were added in the previous version)

  //Add key to track status of Pennsieve uploads
  if (!window.sodaJSONObj["pennsieve-upload-status"]) {
    window.sodaJSONObj["pennsieve-upload-status"] = {
      "dataset-metadata-pennsieve-genration-status": "not-started",
    };
  }

  if (!window.sodaJSONObj["previously-uploaded-data"]) {
    window.sodaJSONObj["previously-uploaded-data"] = {};
  }

  if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"]) {
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = [];
  }

  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  if (contributors) {
    for (const contributor of window.sodaJSONObj["dataset-metadata"]["description-metadata"][
      "contributors"
    ]) {
      //if contributor is in old format (string), convert to new format (array)
      if (!Array.isArray(contributor.conAffliation)) {
        contributor.conAffliation = [contributor.conAffliation];
      }
      // Replace improperly named PrincipleInvestigator role with Principle Investigator
      if (contributor?.["conRole"].includes("PrincipleInvestigator")) {
        contributor["conRole"] = contributor["conRole"].filter(
          (role) => role !== "PrincipleInvestigator"
        );
        contributor["conRole"].unshift("PrincipalInvestigator");
      }
    }
  }

  if (!window.sodaJSONObj["button-config"]) {
    window.sodaJSONObj["button-config"] = {};
  }

  if (!window.sodaJSONObj["skipped-pages"]) {
    window.sodaJSONObj["skipped-pages"] = [];
  }

  if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"]) {
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {};
  }

  if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"]) {
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {};
  }

  if (!window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"]) {
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
  }

  // If the user was on the airtable award page (does not exist anymore), send them to the create submission metadata page
  if (window.sodaJSONObj["page-before-exit"] === "guided-airtable-award-tab") {
    window.sodaJSONObj["page-before-exit"] = "guided-create-submission-metadata-tab";
  }

  if (!window.sodaJSONObj["last-version-of-soda-used"]) {
    // This is the first time the user has used SODA since the "last-version-of-soda-used" key was added
    window.sodaJSONObj["last-version-of-soda-used"] = "10.0.4";
  }

  // If the user started a dataset after version 10.0.4, skip CHANGES metadata pages
  if (!window.sodaJSONObj["skipped-pages"].includes("guided-create-changes-metadata-tab")) {
    if (window.sodaJSONObj["starting-point"]["type"] === "new") {
      window.sodaJSONObj["skipped-pages"].push("guided-create-changes-metadata-tab");
    }
  }

  // If the the last time the user worked on the dataset was before v11.0.0, skip the changes page unless
  // the dataset has already been published.
  if (window.sodaJSONObj["last-version-of-soda-used"] <= "11.0.0") {
    if (window.sodaJSONObj["starting-point"]["type"] === "bf") {
      const datasetsPennsieveID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

      // Skip/unSkip the changes metadata page based on publishing status
      // (if the changes file already exists, then still show it)
      const changesCheckRes = await checkIfChangesMetadataPageShouldBeShown(datasetsPennsieveID);
      if (changesCheckRes.shouldShow === true) {
        window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changesCheckRes.changesMetadata;
        guidedUnSkipPage("guided-create-changes-metadata-tab");
      } else {
        window.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
        guidedSkipPage("guided-create-changes-metadata-tab");
      }

      // Delete the saved button config for the code metadata page (The flow was slightly updated)
      // The user will have to reselect their option If they do not have a code-description file, otherwise
      // the new prompt will be shown.
      if (window.sodaJSONObj?.["button-config"]?.["dataset-contains-code-data"]) {
        delete window.sodaJSONObj["button-config"]["dataset-contains-code-data"];
      }
    }
  }

  if (window.sodaJSONObj?.["starting-point"]?.["type"] === "bf") {
    if (!window.sodaJSONObj?.["digital-metadata"]?.["dataset-workspace"]) {
      // Skip the log in page since we no longer need it
      guidedSkipPage("guided-pennsieve-intro-tab");
      window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = guidedGetCurrentUserWorkSpace();
    }
  }

  // No longer skip validation page for non-sparc datasts ("page should always be unskipped")
  if (window.sodaJSONObj["skipped-pages"].includes("guided-dataset-validation-tab")) {
    window.sodaJSONObj["skipped-pages"] = window.sodaJSONObj["skipped-pages"].filter(
      (page) => page !== "guided-dataset-validation-tab"
    );
  }

  //If the dataset was successfully uploaded, send the user to the share with curation team
  if (window.sodaJSONObj["previous-guided-upload-dataset-name"]) {
    return "guided-dataset-dissemination-tab";
  }

  // Change the award number variable from sparc-award to award-number
  if (window.sodaJSONObj?.["dataset-metadata"]?.["shared-metadata"]?.["sparc-award"]) {
    window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["award-number"] =
      window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
  }
  // If the consortium data standard is not defined, set it to an empty string
  if (
    !window.sodaJSONObj["dataset-metadata"]["submission-metadata"]?.["consortium-data-standard"]
  ) {
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] = "";
  }
  // If the funding consortium is not defined, set it to an empty string
  if (!window.sodaJSONObj["dataset-metadata"]["submission-metadata"]?.["funding-consortium"]) {
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] = "";
  }

  if (!window.sodaJSONObj["digital-metadata"]?.["license"]) {
    window.sodaJSONObj["digital-metadata"]["license"] = "";
  }

  if (!window.sodaJSONObj["curation-mode"]) {
    window.sodaJSONObj["cuartion-mode"] = "guided";
  }

  // If no other conditions are met, return the page the user was last on
  return window.sodaJSONObj["page-before-exit"];
};

//Loads UI when continue curation button is pressed
window.guidedResumeProgress = async (datasetNameToResume) => {
  const loadingSwal = Swal.fire({
    title: "Resuming where you last left off",
    html: `
      <div class="guided--loading-div">
        <div class="lds-roller">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    `,
    width: 500,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: false,
  });

  // Wait for 2 seconds so that the loading icon can at least kind of be seen (This can be removed)
  await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    const datasetResumeJsonObj = await getProgressFileData(datasetNameToResume);

    // Datasets successfully uploaded will have the "previous-guided-upload-dataset-name" key
    const datasetHasAlreadyBeenSuccessfullyUploaded =
      datasetResumeJsonObj["previous-guided-upload-dataset-name"];

    // If the dataset had been previously successfully uploaded, check to make sure it exists on Pennsieve still.
    if (datasetHasAlreadyBeenSuccessfullyUploaded) {
      const previouslyUploadedDatasetId =
        datasetResumeJsonObj["digital-metadata"]["pennsieve-dataset-id"];
      const datasetToResumeExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
        previouslyUploadedDatasetId
      );
      if (!datasetToResumeExistsOnPennsieve) {
        throw new Error(`This dataset no longer exists on Pennsieve`);
      }
    }

    if (!datasetHasAlreadyBeenSuccessfullyUploaded) {
      // If the dataset is being edited on Pensieve, check to make sure the folders and files are still the same.
      if (datasetResumeJsonObj["starting-point"]?.["type"] === "bf") {
        // Check to make sure the dataset is not locked
        const datasetIsLocked = await api.isDatasetLocked(
          datasetResumeJsonObj["digital-metadata"]["pennsieve-dataset-id"]
        );
        if (datasetIsLocked) {
          throw new Error(`
            This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
            <br />
            <br />
            If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a  target="_blank" rel="noopener noreferrer" href="mailto:curation@sparc.science">curation@sparc.science.</a>
          `);
        }

        if (Object.keys(datasetResumeJsonObj["previously-uploaded-data"]).length > 0) {
          await Swal.fire({
            icon: "info",
            title: "Resuming a Pennsieve dataset upload that previously failed",
            html: `
            Please note that any changes made to your dataset on Pennsieve since your last dataset upload
            was interrupted may be overwritten.
          `,
            width: 500,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: `I understand`,
            focusConfirm: true,
            allowOutsideClick: false,
          });
        } else {
          // Check to make sure the dataset structure on Pennsieve is the same as when the user started editing this dataset
          let filesFoldersResponse = await client.post(
            `/organize_datasets/dataset_files_and_folders`,
            {
              sodajsonobject: datasetResumeJsonObj,
            },
            { timeout: 0 }
          );
          let data = filesFoldersResponse.data;
          const currentPennsieveDatasetStructure = data["soda_object"]["dataset-structure"];

          const intitiallyPulledDatasetStructure =
            datasetResumeJsonObj["initially-pulled-dataset-structure"];

          // check to make sure current and initially pulled dataset structures are the same
          if (
            JSON.stringify(currentPennsieveDatasetStructure) !==
            JSON.stringify(intitiallyPulledDatasetStructure)
          ) {
            throw new Error(
              `The folders and/or files on Pennsieve have changed since you last edited this dataset in SODA.
              <br />
              <br />
              If you would like to update this dataset, please delete this progress file and start over.
              `
            );
          }
        }
      }
    }
    window.sodaJSONObj = datasetResumeJsonObj;
    attachGuidedMethodsToSodaJSONObj();

    //patches the sodajsonobj if it was created in a previous version of guided mode
    await patchPreviousGuidedModeVersions();

    window.datasetStructureJSONObj = window.sodaJSONObj["dataset-structure"];
    window.subjectsTableData = window.sodaJSONObj["subjects-table-data"];
    window.samplesTableData = window.sodaJSONObj["samples-table-data"];

    // Save the skipped pages in a temp variable since guidedTransitionFromHome will remove them
    const prevSessionSkikppedPages = [...window.sodaJSONObj["skipped-pages"]];

    guidedTransitionFromHome();
    // Reskip the pages from a previous session
    for (const pageID of prevSessionSkikppedPages) {
      guidedSkipPage(pageID);
    }

    // Skip this page incase it was not skipped in a previous session
    guidedSkipPage("guided-select-starting-point-tab");

    // pageToReturnTo will be set to the page the user will return to
    const pageToReturnTo = await guidedGetPageToReturnTo(window.sodaJSONObj);

    await window.openPage(pageToReturnTo);

    // Close the loading screen, the user should be on the page they left off on now
    loadingSwal.close();
  } catch (error) {
    clientError(error);
    loadingSwal.close();
    await Swal.fire({
      icon: "info",
      title: "This dataset is not able to be resumed",
      html: `${error.message}`,
      width: 500,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `I understand`,
      focusConfirm: true,
      allowOutsideClick: false,
    });
  }
};

//Add  spinner to element
const guidedUploadStatusIcon = (elementID, status) => {
  let statusElement = document.getElementById(`${elementID}`);
  statusElement.innerHTML = ``;
  let spinner = `
    <div class="spinner-border" role="status" style="
      height: 24px;
      width: 24px;
    "></div>`;

  if (status === "loading") {
    statusElement.innerHTML = spinner;
  }
  if (status === "success") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: successCheck,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
  if (status === "error") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: errorMark,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
  if (status === "info") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: infoMark,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
};

//dataset description (first page) functions
const guidedCreateSodaJSONObj = () => {
  window.sodaJSONObj = {};

  window.sodaJSONObj["guided-options"] = {};
  window.sodaJSONObj["cuartion-mode"] = "guided";
  window.sodaJSONObj["bf-account-selected"] = {};
  window.sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  window.sodaJSONObj["generate-dataset"] = {};
  window.sodaJSONObj["generate-dataset"]["destination"] = "bf";
  window.sodaJSONObj["guided-manifest-file-data"] = {};
  window.sodaJSONObj["starting-point"] = {};
  window.sodaJSONObj["dataset-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["shared-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["protocol-data"] = [];
  window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"] = {};
  window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"] = {};
  window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["subjects"] = {};
  window.sodaJSONObj["dataset-metadata"]["subject-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["sample-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["submission-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] = "";
  window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] = "";
  window.sodaJSONObj["dataset-metadata"]["description-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["code-metadata"] = {};
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] = [];
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = [];
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {};
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {};
  window.sodaJSONObj["dataset-metadata"]["README"] = "";
  window.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
  window.sodaJSONObj["digital-metadata"] = {};
  window.sodaJSONObj["previously-uploaded-data"] = {};
  window.sodaJSONObj["digital-metadata"]["description"] = {};
  window.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  window.sodaJSONObj["digital-metadata"]["user-permissions"] = [];
  window.sodaJSONObj["digital-metadata"]["team-permissions"] = [];
  window.sodaJSONObj["digital-metadata"]["license"] = "";
  window.sodaJSONObj["completed-tabs"] = [];
  window.sodaJSONObj["skipped-pages"] = [];
  window.sodaJSONObj["last-modified"] = "";
  window.sodaJSONObj["button-config"] = {};
  window.sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = "false";
  window.datasetStructureJSONObj = { folders: {}, files: {} };
  window.sodaJSONObj["dataset-validated"] = "false";
};
const guidedHighLevelFolders = ["primary", "source", "derivative"];
const nonGuidedHighLevelFolders = ["code", "protocol", "docs"];

const guidedWarnBeforeDeletingEntity = async (entityType, entityName) => {
  let warningMessage;
  if (entityType === "pool") {
    warningMessage = `Are you sure you want to delete the pool '${entityName}'? After deleting this pool, all subject folders will be moved directly into their high level folders.`;
  }
  if (entityType === "subject") {
    warningMessage = `Are you sure you want to delete the subject '${entityName}'? ${entityName} has folders and files associated with it, and if you continue with the deletion, the folders and files will be deleted as well.`;
  }
  if (entityType === "sample") {
    warningMessage = `Are you sure you want to delete the sample '${entityName}'? ${entityName} has folders and files associated with it, and if you continue with the deletion, the folders and files will be deleted as well.`;
  }

  const continueWithDeletion = await Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    html: warningMessage,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: `Delete ${entityType}`,
    cancelButtonText: "Cancel deletion",
    reverseButtons: window.reverseSwalButtons,
  });

  return continueWithDeletion.isConfirmed;
};

const attachGuidedMethodsToSodaJSONObj = () => {
  window.sodaJSONObj.addPool = function (poolName, throwErrorIfPoolExists = true) {
    if (this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName]) {
      if (throwErrorIfPoolExists) {
        throw new Error("Pool names must be unique.");
      } else {
        return;
      }
    }

    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName] = {};
  };
  window.sodaJSONObj.addSubject = function (subjectName, throwErrorIfSubjectExists = true) {
    //check if subject with the same name already exists
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subjectName] ||
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName]
    ) {
      if (throwErrorIfSubjectExists) {
        throw new Error("Subject names must be unique.");
      } else {
        return;
      }
    }
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] = {};
  };
  window.sodaJSONObj.addSampleToSubject = function (
    sampleName,
    subjectPoolName,
    subjectName,
    throwErrorIfSubjectAlreadyHasSample = true
  ) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    //Check samples already added and throw an error if a sample with the sample name already exists.
    for (const sample of samples) {
      if (sample.sampleName === sampleName) {
        if (throwErrorIfSubjectAlreadyHasSample) {
          throw new Error(
            `Sample names must be unique. \n${sampleName} already exists in ${sample.subjectName}`
          );
        }
      }
    }

    if (subjectPoolName) {
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subjectPoolName][
        subjectName
      ][sampleName] = {};
    } else {
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName][
        sampleName
      ] = {};
    }
  };

  window.sodaJSONObj.renamePool = function (prevPoolName, newPoolName) {
    //check if name already exists
    if (prevPoolName != newPoolName) {
      if (this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][newPoolName]) {
        throw new Error("Pool names must be unique.");
      }

      //Rename the pool folder in the window.datasetStructureJSONObj
      for (const highLevelFolder of guidedHighLevelFolders) {
        const prevNamePoolInHighLevelFolder =
          window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
            prevPoolName
          ];

        if (prevNamePoolInHighLevelFolder) {
          if (folderImportedFromPennsieve(prevNamePoolInHighLevelFolder)) {
            if (!prevNamePoolInHighLevelFolder["action"].includes["renamed"]) {
              prevNamePoolInHighLevelFolder["action"].push("renamed");
            }
          }

          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][newPoolName] =
            prevNamePoolInHighLevelFolder;
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            prevPoolName
          ];
        }
      }

      //Rename the pool in the pool-subject-sample-structure
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][newPoolName] =
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];
      delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];

      //Rename the pool in the window.subjectsTableData
      for (const subjectDataArray of window.subjectsTableData.slice(1)) {
        if (subjectDataArray[1] === prevPoolName) {
          subjectDataArray[1] = newPoolName;
        }
      }

      //Rename the pool in the window.samplesTableData
      for (const sampleDataArray of window.samplesTableData.slice(1)) {
        if (sampleDataArray[3] === prevPoolName) {
          sampleDataArray[3] = newPoolName;
        }
      }
    }
  };
  window.sodaJSONObj.renameSubject = function (prevSubjectName, newSubjectName) {
    if (prevSubjectName === newSubjectName) {
      return;
    }

    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];

    //Throw an error if the subject name that the user is changing the old subject name
    //to already exists
    if (subjects.filter((subject) => subject.subjectName === newSubjectName).length > 0) {
      throw new Error("Subject names must be unique.");
    }

    for (const subject of subjects) {
      if (subject.subjectName === prevSubjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          //Rename the subjects folders in the datasetStructJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const prevNameSubjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[prevSubjectName];

            if (prevNameSubjectFolderInHighLevelFolder) {
              if (folderImportedFromPennsieve(prevNameSubjectFolderInHighLevelFolder)) {
                if (!prevNameSubjectFolderInHighLevelFolder["action"].includes["renamed"]) {
                  prevNameSubjectFolderInHighLevelFolder["action"].push("renamed");
                }
              }
              window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][newSubjectName] = prevNameSubjectFolderInHighLevelFolder;

              delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][prevSubjectName];
            }
          }
          //Update the pool-sub-sam structure to reflect the subject name change
          this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
            newSubjectName
          ] =
            this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
              prevSubjectName
            ];
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][prevSubjectName];
        } else {
          //Rename the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const prevNameSubjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                prevSubjectName
              ];

            if (prevNameSubjectFolderInHighLevelFolder) {
              if (folderImportedFromPennsieve(prevNameSubjectFolderInHighLevelFolder)) {
                if (!prevNameSubjectFolderInHighLevelFolder["action"].includes["renamed"]) {
                  prevNameSubjectFolderInHighLevelFolder["action"].push("renamed");
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  newSubjectName
                ] = prevNameSubjectFolderInHighLevelFolder;

                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  prevSubjectName
                ];
              }
            }
          }

          //Update the pool-sub-sam structure to reflect the subject name change
          this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][newSubjectName] =
            this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][prevSubjectName];
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            prevSubjectName
          ];
        }
        //Update the subjects name in the subjects metadata if it exists
        for (let i = 1; i < window.subjectsTableData.length; i++) {
          if (window.subjectsTableData[i][0] === prevSubjectName) {
            window.subjectsTableData[i][0] = newSubjectName;
          }
        }

        //Update the subjects name for all samples the subject had
        for (let i = 1; i < window.samplesTableData.length; i++) {
          if (window.samplesTableData[i][0] === prevSubjectName) {
            window.samplesTableData[i][0] = newSubjectName;
          }
        }
      }
    }
  };
  window.sodaJSONObj.renameSample = function (prevSampleName, newSampleName) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    if (prevSampleName != newSampleName) {
      //Check samples already added and throw an error if a sample with the sample name already exists.
      for (const sample of samples) {
        if (sample.sampleName === newSampleName) {
          throw new Error(
            `Sample names must be unique. \n${newSampleName} already exists in ${sample.subjectName}`
          );
        }
      }

      //find the sample and rename it
      for (const sample of samples) {
        if (sample.sampleName === prevSampleName) {
          if (sample.poolName) {
            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              const prevNameSampleFolderInHighLevelFolder =
                window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.poolName
                ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[prevSampleName];

              if (prevNameSampleFolderInHighLevelFolder) {
                if (folderImportedFromPennsieve(prevNameSampleFolderInHighLevelFolder)) {
                  if (!prevNameSampleFolderInHighLevelFolder["action"].includes["renamed"]) {
                    prevNameSampleFolderInHighLevelFolder["action"].push("renamed");
                  }
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][newSampleName] =
                  prevNameSampleFolderInHighLevelFolder;
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][prevSampleName];
              }
            }

            //Update the pool-sub-sam structure to reflect the sample name change
            this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
              sample.subjectName
            ][newSampleName] =
              this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
              sample.poolName
            ][sample.subjectName][prevSampleName];
          } else {
            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              const prevNameSampleFolderInHighLevelFolder =
                window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.subjectName
                ]?.["folders"]?.[prevSampleName];

              if (prevNameSampleFolderInHighLevelFolder) {
                if (folderImportedFromPennsieve(prevNameSampleFolderInHighLevelFolder)) {
                  if (!prevNameSampleFolderInHighLevelFolder["action"].includes["renamed"]) {
                    prevNameSampleFolderInHighLevelFolder["action"].push("renamed");
                  }
                }

                window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][newSampleName] = prevNameSampleFolderInHighLevelFolder;
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][prevSampleName];
              }
            }

            this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][newSampleName] =
              this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][prevSampleName];
          }

          //Update the samples name in the samples metadata if it exists
          for (let i = 1; i < window.samplesTableData.length; i++) {
            if (window.samplesTableData[i][1] === prevSampleName) {
              window.samplesTableData[i][1] = newSampleName;
            }
          }
        }
      }
    }
  };
  window.sodaJSONObj.deletePool = function (poolName) {
    //empty the subjects in the pool back into subjects
    let pool = this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName];

    //Loop through the subjects and remove their folders from the pool in the dataset structure
    //this handles moving the subject folders back to the root of the high level folder
    //and removes the pool from the subject/sample metadata arrays
    for (let subject in pool) {
      window.sodaJSONObj.moveSubjectOutOfPool(subject, poolName);
    }

    for (const highLevelFolder of guidedHighLevelFolders) {
      const poolInHighLevelFolder =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName];

      if (poolInHighLevelFolder) {
        if (folderImportedFromPennsieve(poolInHighLevelFolder)) {
          guidedModifyPennsieveFolder(poolInHighLevelFolder, "delete");
        } else {
          delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
        }
      }
    }

    //delete the pool after copying the subjects back into subjects
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName];
  };
  window.sodaJSONObj.deleteSubject = async function (subjectName) {
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];
    for (const subject of subjects) {
      // Variable to track if the user has been warned about deleting a subject with folders
      let warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = false;

      if (subject.subjectName === subjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const subjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[subjectName];

            if (subjectFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a subject with folders
                // If they cancel the deletion, we return and the subject or its folders are not deleted
                const continueWithSubjectDeletion = await guidedWarnBeforeDeletingEntity(
                  "subject",
                  subjectName
                );
                if (continueWithSubjectDeletion) {
                  warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(subjectFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(subjectFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  subject.poolName
                ]["folders"][subjectName];
              }
            }
          }

          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][subjectName];
        } else {
          //if the subject is not in a pool
          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const subjectFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subjectName
              ];

            if (subjectFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a subject with folders
                // If they cancel the deletion, we return and the subject or its folders are not deleted
                const continueWithSubjectDeletion = await guidedWarnBeforeDeletingEntity(
                  "subject",
                  subjectName
                );
                if (continueWithSubjectDeletion) {
                  warningBeforeDeletingSubjectWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(subjectFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(subjectFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  subjectName
                ];
              }
            }
          }
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
        }
        // delete the subject's samples
        for (const sample of subject.samples) {
          await window.sodaJSONObj.deleteSample(sample.sampleName, false);
        }
      }
    }
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (window.subjectsTableData[i][0] === subjectName) {
        window.subjectsTableData.splice(i, 1);
      }
    }
  };
  window.sodaJSONObj.deleteSample = async function (sampleName) {
    const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    for (const sample of samples) {
      // Variable to track if the user has been warned about deleting a subject with folders
      let warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = false;

      if (sample.sampleName === sampleName) {
        if (sample.poolName) {
          //Delete the samples folder in the window.datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const sampleFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.poolName
              ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[sampleName];

            if (sampleFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSampleWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a sample with folders
                // If they cancel the deletion, we return and the sample or its folders are not deleted
                const continueWithSampleDeletion = await guidedWarnBeforeDeletingEntity(
                  "sample",
                  sampleName
                );
                if (continueWithSampleDeletion) {
                  warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(sampleFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(sampleFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][sampleName];
              }
            }
          }

          // Remove the sample from the guided structure
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            sample.poolName
          ][sample.subjectName][sampleName];
        } else {
          //Delete the samples folder in the window.datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            const sampleFolderInHighLevelFolder =
              window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.subjectName
              ]?.["folders"]?.[sampleName];

            if (sampleFolderInHighLevelFolder) {
              if (!warningBeforeDeletingSampleWithFoldersSwalHasBeenShown) {
                // Warn the user if they are deleting a sample with folders
                // If they cancel the deletion, we return and the sample or its folders are not deleted
                const continueWithSampleDeletion = await guidedWarnBeforeDeletingEntity(
                  "sample",
                  sampleName
                );
                if (continueWithSampleDeletion) {
                  warningBeforeDeletingSampleWithFoldersSwalHasBeenShown = true;
                } else {
                  return;
                }
              }

              if (folderImportedFromPennsieve(sampleFolderInHighLevelFolder)) {
                guidedModifyPennsieveFolder(sampleFolderInHighLevelFolder, "delete");
              } else {
                delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][sampleName];
              }
            }
          }

          // Remove the sample from the guided structure
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            sample.subjectName
          ][sampleName];
        }
      }
    }

    // Remove the sample from the samples metadata
    for (let i = 1; i < window.samplesTableData.length; i++) {
      if (window.samplesTableData[i][1] === sampleName) {
        window.samplesTableData.splice(i, 1);
      }
    }
  };

  window.sodaJSONObj.moveSubjectIntoPool = function (subjectName, poolName) {
    //Move the subjects folders in the datasetStructeJSONObj
    for (const highLevelFolder of guidedHighLevelFolders) {
      const subjectFolderOutsidePool =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName];

      if (subjectFolderOutsidePool) {
        // If the target folder doesn't exist, create it
        if (!window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]) {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName] =
            newEmptyFolderObj();
        }

        if (folderImportedFromPennsieve(subjectFolderOutsidePool)) {
          guidedMovePennsieveFolder(
            subjectName,
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName],
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]
          );
        } else {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
            "folders"
          ][subjectName] = subjectFolderOutsidePool;
        }
        // Delete the subject folder outside the pool
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
      }
    }

    //Add the pool name to the window.subjectsTableData if if an entry exists
    for (const subjectDataArray of window.subjectsTableData.slice(1)) {
      if (subjectDataArray[0] === subjectName) {
        subjectDataArray[1] = poolName;
      }
    }

    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
  };
  window.sodaJSONObj.moveSubjectOutOfPool = function (subjectName, poolName) {
    //Copy the subject folders from the pool into the root of the high level folder
    for (const highLevelFolder of guidedHighLevelFolders) {
      const subjectFolderInPoolFolder =
        window.datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName];
      if (subjectFolderInPoolFolder) {
        if (folderImportedFromPennsieve(subjectFolderInPoolFolder)) {
          guidedMovePennsieveFolder(
            subjectName,
            window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
              "folders"
            ][subjectName],
            window.datasetStructureJSONObj["folders"][highLevelFolder]
          );
        } else {
          window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName] =
            subjectFolderInPoolFolder;
        }
        delete window.datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName][
          "folders"
        ][subjectName];
      }
    }

    //Remove the pool from the subject's entry in the window.subjectsTableData
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (window.subjectsTableData[i][0] === subjectName) {
        window.subjectsTableData[i][1] = "";
      }
    }

    //Remove the pool from the samples that belong to the subject
    for (let i = 1; i < window.samplesTableData.length; i++) {
      if (window.samplesTableData[i][0] === subjectName) {
        window.samplesTableData[i][3] = "";
      }
    }

    //Remove the subject from the pool in the guided structures
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName];
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][
      subjectName
    ];
  };
  window.sodaJSONObj.getPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
  window.sodaJSONObj.getPoolSubjects = function (poolName) {
    return Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName]
    );
  };
  window.sodaJSONObj.getAllSamplesFromSubjects = function () {
    let samplesInPools = [];
    let samplesOutsidePools = [];

    //get all the samples in subjects in pools
    for (const [poolName, poolData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(poolData)) {
        for (const sampleName of Object.keys(subjectData)) {
          samplesInPools.push({
            sampleName: sampleName,
            subjectName: subjectName,
            poolName: poolName,
          });
        }
      }
    }

    //get all the samples in subjects not in pools
    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      for (const sampleName of Object.keys(subjectData)) {
        samplesOutsidePools.push({
          sampleName: sampleName,
          subjectName: subjectName,
        });
      }
    }
    return [samplesInPools, samplesOutsidePools];
  };
  window.sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };
  window.sodaJSONObj.getSubjectsOutsidePools = function () {
    let subjectsNotInPools = Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    );
    return subjectsNotInPools;
  };
  window.sodaJSONObj.getSubjectsInPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
};
const guidedUpdateFolderStructureUI = (folderPathSeperatedBySlashes) => {
  console.log("Function called: guidedUpdateFolderStructureUI");
  console.log("Input - folder path (separated by slashes):", folderPathSeperatedBySlashes);

  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  console.log("File explorer element retrieved:", fileExplorer);

  // Remove transition class to reset animation or styles
  fileExplorer.classList.remove("file-explorer-transition");
  console.log("Removed 'file-explorer-transition' class from file explorer.");

  // Update the global path input value with the new path
  $("#guided-input-global-path").val(`dataset_root/${folderPathSeperatedBySlashes}`);
  console.log("Set global input path to:", `dataset_root/${folderPathSeperatedBySlashes}`);

  window.organizeDSglobalPath = $("#guided-input-global-path")[0];

  // Filter and format the path using the global path function
  const filtered = window.getGlobalPath(window.organizeDSglobalPath);
  console.log("Filtered path from getGlobalPath:", filtered);

  window.organizeDSglobalPath.value = `${filtered.join("/")}/`;
  console.log("Set window.organizeDSglobalPath.value to:", window.organizeDSglobalPath.value);

  // Prepare the path array for nested JSON retrieval
  const arrayPathToNestedJsonToRender = filtered.slice(1);
  console.log("Path array for JSON content retrieval:", arrayPathToNestedJsonToRender);

  // Retrieve content at the nested path in the dataset structure
  const datasetContent = getDatasetStructureJsonFolderContentsAtNestedArrayPath(
    arrayPathToNestedJsonToRender
  );
  console.log("Retrieved dataset content at nested path:", datasetContent);

  // Update the UI with the files and folders retrieved
  window.listItems(datasetContent, "#items", 500, true);
  console.log("Called window.listItems to update the UI.");

  // Set up click behavior for folder items in the list
  window.getInFolder(
    ".single-item",
    "#items",
    window.organizeDSglobalPath,
    window.datasetStructureJSONObj
  );
  console.log("arrayPathToNestedJsonToRender:", arrayPathToNestedJsonToRender);

  // Refresh the tree view to match the current folder structure
  setTreeViewDatasetStructure(window.datasetStructureJSONObj, arrayPathToNestedJsonToRender);
  console.log("Updated tree view structure based on current path.");
};

const getGuidedAdditionalLinks = () => {
  return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].map(
    (link) => link.link
  );
};
//Description metadata functions

window.deleteAdditionalLink = (linkName) => {
  const additionalLinks =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  //filter additional links to remove the one to be deleted
  const filteredAdditionalLinks = additionalLinks.filter((link) => {
    return link.link != linkName;
  });
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    filteredAdditionalLinks;
  //update the UI
  renderAdditionalLinksTable();
};

const generateadditionalLinkRowElement = (link, linkType, linkRelation) => {
  return `
    <tr>
      <td class="middle aligned collapsing link-name-cell">
        ${link}
      </td>
      <td class="middle aligned collapsing">
        ${linkType}
      </td>
      <td class="middle aligned collapsing">
        ${linkRelation}
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="window.deleteAdditionalLink('${link}')"
        >   
          Delete link
        </button>
      </td>
    </tr>
  `;
};

window.removeContributorField = (contributorDeleteButton) => {
  const contributorField = contributorDeleteButton.parentElement;
  const { contributorFirstName, contributorLastName } = contributorField.dataset;

  const contributorsBeforeDelete =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  //If the contributor has data-first-name and data-last-name, then it is a contributor that
  //already been added. Delete it from the contributors array.
  if (contributorFirstName && contributorLastName) {
    const filteredContributors = contributorsBeforeDelete.filter((contributor) => {
      //remove contributors with matching first and last name
      return !(
        contributor.contributorFirstName == contributorFirstName &&
        contributor.contributorLastName == contributorLastName
      );
    });

    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
      filteredContributors;
  }

  contributorField.remove();
};

const getContributorFullNames = () => {
  return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].map(
    (contributor) => {
      return contributor.conName;
    }
  );
};

const getExistingContributorORCiDs = () => {
  return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].map(
    (contributor) => {
      return contributor.conID;
    }
  );
};

const addContributor = (
  contributorFullName,
  contributorORCID,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  //Check if the contributor already exists

  if (getContributorByOrcid(contributorORCID)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }

  //If the contributorFullName has one comma, we can successfully split the name into first and last name
  //If not, they will remain as empty strings until they are edited
  let contributorFirstName = "";
  let contributorLastName = "";
  if (contributorFullName.split(",").length === 2) {
    [contributorLastName, contributorFirstName] = contributorFullName
      .split(",")
      .map((name) => name.trim());
  }

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].push({
    contributorFirstName: contributorFirstName,
    contributorLastName: contributorLastName,
    conName: contributorFullName,
    conID: contributorORCID,
    conAffliation: contributorAffiliationsArray,
    conRole: contributorRolesArray,
  });

  // Store the contributor locally so they can import the contributor's data in the future
  try {
    window.addOrUpdateStoredContributor(
      contributorFirstName,
      contributorLastName,
      contributorORCID,
      contributorAffiliationsArray,
      contributorRolesArray
    );
  } catch (error) {
    console.error("Failed to store contributor locally" + error);
  }
};

const editContributorByOrcid = (
  prevContributorOrcid,
  contributorFirstName,
  contributorLastName,
  newContributorOrcid,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  const contributor = getContributorByOrcid(prevContributorOrcid);
  if (!contributor) {
    throw new Error("No contributor with the entered ORCID exists");
  }

  if (prevContributorOrcid !== newContributorOrcid) {
    if (getContributorByOrcid(newContributorOrcid)) {
      throw new Error("A contributor with the entered ORCID already exists");
    }
  }

  contributor.contributorFirstName = contributorFirstName;
  contributor.contributorLastName = contributorLastName;
  contributor.conName = `${contributorLastName}, ${contributorFirstName}`;
  contributor.conID = newContributorOrcid;
  contributor.conAffliation = contributorAffiliationsArray;
  contributor.conRole = contributorRolesArray;

  // Update the contributor's locally stored data
  try {
    window.addOrUpdateStoredContributor(
      contributorFirstName,
      contributorLastName,
      newContributorOrcid,
      contributorAffiliationsArray,
      contributorRolesArray
    );
  } catch (error) {
    console.error("Failed to edit contributor data" + error);
  }
};

window.deleteContributor = (clickedDelContribuButton, contributorOrcid) => {
  const contributorField = clickedDelContribuButton.parentElement.parentElement;
  const contributorsBeforeDelete =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
    contributorsBeforeDelete.filter((contributor) => {
      return contributor.conID !== contributorOrcid;
    });
  contributorField.remove();
  //rerender the table after deleting a contributor
  renderDatasetDescriptionContributorsTable();
};

const getContributorByOrcid = (orcid) => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const contributor = contributors.find((contributor) => {
    return contributor.conID == orcid;
  });
  return contributor;
};

window.openGuidedEditContributorSwal = async (contibuttorOrcidToEdit) => {
  const contributorData = getContributorByOrcid(contibuttorOrcidToEdit);
  const contributorFirstName = contributorData.contributorFirstName;
  const contributorLastName = contributorData.contributorLastName;
  const contributorORCID = contributorData.conID;
  const contributorAffiliationsArray = contributorData.conAffliation;
  const contributorRolesArray = contributorData.conRole;
  const contributorFullName = contributorData.conName;

  let boolShowIncorrectFullName = false;

  if (contributorFirstName.length === 0 && contributorLastName.length === 0) {
    boolShowIncorrectFullName = true;
  }

  let affiliationTagify;
  let contributorRolesTagify;

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "800px",
    heightAuto: false,
    html: `
      <div class="guided--flex-center mt-sm">
        <label class="guided--form-label centered mb-md">
          Make changes to the contributor's information below.
        </label>
        ${
          boolShowIncorrectFullName
            ? `
              <div class="guided--container-warning-text">
                <p class="guided--help-text">
                  Contributor names should be in the format of "Last name, First name".
                  <br />
                  The name found on Pennsieve was: <b>${contributorFullName}</b>
                </p>
              </div>
              `
            : ``
        }
        <div class="space-between w-100">
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">First name: </label>
            <input
              class="guided--input"
              id="guided-contributor-first-name"
              type="text"
              placeholder="Contributor's first name"
              value=""
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">Last name: </label>
            <input
              class="guided--input"
              id="guided-contributor-last-name"
              type="text"
              placeholder="Contributor's Last name"
              value=""
            />
            </div>
          </div>
          <label class="guided--form-label mt-md required">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset. Visit <a target="_blank" href="https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf">DataCite</a> for a definition of the roles.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Edit contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, {
        duplicate: false,
      });
      window.createDragSort(affiliationTagify);
      affiliationTagify.addTags(contributorAffiliationsArray);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: {
          maxItems: Infinity,
          enabled: 0,
          closeOnSelect: true,
          position: "auto",
        },
      });
      window.createDragSort(contributorRolesTagify);
      contributorRolesTagify.addTags(contributorRolesArray);

      document.getElementById("guided-contributor-first-name").value = contributorFirstName;
      document.getElementById("guided-contributor-last-name").value = contributorLastName;
      document.getElementById("guided-contributor-orcid").value = contributorORCID;
    },

    preConfirm: async () => {
      const contributorFirstName = document.getElementById("guided-contributor-first-name").value;
      const contributorLastName = document.getElementById("guided-contributor-last-name").value;
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value;
      const contributorAffiliations = affiliationTagify.value.map((item) => item.value);
      const contributorRoles = contributorRolesTagify.value.map((item) => item.value);

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        contributorAffiliations.length === 0 ||
        contributorRoles.length === 0
      ) {
        return Swal.showValidationMessage("Please fill out all required fields");
      }

      if (contributorOrcid.length !== 37) {
        return Swal.showValidationMessage(
          "Please enter ORCID ID in the format: https://orcid.org/0000-0000-0000-0000"
        );
      }

      // If a contributor has already been marked as Principal Investigator, make sure that the
      // current contributor is the one marked as Principal Investigator
      // otherwise, show an error message
      if (contributorRoles.includes("PrincipalInvestigator")) {
        const currentPIsOrcid = getContributorMarkedAsPrincipalInvestigator();
        if (currentPIsOrcid && currentPIsOrcid !== contributorOrcid) {
          return Swal.showValidationMessage(
            "Only one contributor can be marked as Principal Investigator"
          );
        }
      }

      if (contributorFirstName.includes(",") || contributorLastName.includes(",")) {
        return Swal.showValidationMessage("Please remove commas from the name fields");
      }

      // Verify ORCID ID
      const orcidSite = contributorOrcid.substr(0, 18);
      if (orcidSite !== "https://orcid.org/") {
        return Swal.showValidationMessage(
          "Please enter your ORCID ID with https://orcid.org/ in the beginning"
        );
      }

      const orcidDigits = contributorOrcid.substr(18);
      let total = 0;
      for (let i = 0; i < orcidDigits.length - 1; i++) {
        const digit = parseInt(orcidDigits.substr(i, 1));
        if (isNaN(digit)) {
          continue;
        }
        total = (total + digit) * 2;
      }

      const remainder = total % 11;
      const result = (12 - remainder) % 11;
      const checkDigit = result === 10 ? "X" : String(result);

      if (checkDigit !== contributorOrcid.substr(-1)) {
        return Swal.showValidationMessage("ORCID iD does not exist");
      }

      try {
        await editContributorByOrcid(
          contibuttorOrcidToEdit,
          contributorFirstName,
          contributorLastName,
          contributorOrcid,
          contributorAffiliations,
          contributorRoles
        );
      } catch (error) {
        return Swal.showValidationMessage(error);
      }

      renderDatasetDescriptionContributorsTable();
    },
  });
};

const handleAddContributorHeaderUI = () => {
  const existingContributorORCiDs = getExistingContributorORCiDs();
  const locallyStoredContributorArray = window.loadStoredContributors().filter((contributor) => {
    return !existingContributorORCiDs.includes(contributor.ORCiD);
  });

  // If no stored contributors are found, use the default header
  if (locallyStoredContributorArray.length === 0) {
    return `
      <label class="guided--form-label centered mb-md" style="font-size: 1em !important;">
        Enter the contributor's information below.
      </label>
    `;
  }

  const contributorOptions = locallyStoredContributorArray
    .filter((contributor) => {
      // Filter out any contributors that have already been added by ORCID
      return !existingContributorORCiDs.includes(contributor.ORCiD);
    })
    .map((contributor) => {
      return `
        <option
          value="${contributor.lastName}, ${contributor.firstName}"
          data-first-name="${contributor.firstName ?? ""}"
          data-last-name="${contributor.lastName ?? ""}"
          data-orcid="${contributor.ORCiD ?? ""}"
          data-affiliation="${contributor.affiliations ?? contributor.affiliations.join(",") ?? ""}"
          data-roles="${contributor.roles ? contributor.roles.join(",") : ""}"
        >
          ${contributor.lastName}, ${contributor.firstName}
        </option>
      `;
    });

  return `
    <label class="guided--form-label centered mb-2" style="font-size: 1em !important;">
      If the contributor has been previously added, select them from the dropdown below.
    </label>
    <select
      class="w-100 SODA-select-picker"
      id="guided-stored-contributors-select"
      data-live-search="true"
      name="Dataset contributor"
    >
      <option
        value=""
        data-first-name=""
        data-last-name=""
        data-orcid=""
        data-affiliation=""
        data-roles=""
      >
        Select a saved contributor
      </option>
      ${contributorOptions}
    </select>
    <label class="guided--form-label centered mt-2" style="font-size: 1em !important;">
      Otherwise, enter the contributor's information below.
    </label>
  `;
};

window.openGuidedAddContributorSwal = async () => {
  let affiliationTagify;
  let contributorRolesTagify;

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "900px",
    heightAuto: false,
    // title: contributorSwalTitle,
    html: `
      <div class="guided--flex-center mb-1" style="font-size: 1em !important; height: 550px;">
        ${handleAddContributorHeaderUI()}
        <div class="space-between w-100">
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required" style="font-size: 1em !important;">First name: </label>
              <input
                class="guided--input"
                id="guided-contributor-first-name"
                type="text"
                placeholder="Contributor's first name"
                value=""
              />
            </div>
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required" style="font-size: 1em !important;">Last name: </label>
              <input
                class="guided--input"
                id="guided-contributor-last-name"
                type="text"
                placeholder="Contributor's Last name"
                value=""
              />
            </div>
          </div>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org/register"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required" style="font-size: 1em !important;">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset. Visit <a  target="_blank" rel="noopener noreferrer" href="https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf">DataCite</a> for a definition of the roles.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, {
        duplicate: false,
      });
      window.createDragSort(affiliationTagify);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: {
          maxItems: Infinity,
          enabled: 0,
          closeOnSelect: true,
          position: "auto",
        },
      });
      window.createDragSort(contributorRolesTagify);

      $("#guided-stored-contributors-select").selectpicker({
        style: "SODA-select-picker",
      });
      $("#guided-stored-contributors-select").selectpicker("refresh");
      $("#guided-stored-contributors-select").on("change", function () {
        const selectedFirstName = $("#guided-stored-contributors-select option:selected").data(
          "first-name"
        );
        const selectedLastName = $("#guided-stored-contributors-select option:selected").data(
          "last-name"
        );
        const selectedOrcid = $("#guided-stored-contributors-select option:selected").data("orcid");
        const selectedAffiliation = $("#guided-stored-contributors-select option:selected").data(
          "affiliation"
        );
        const selectedRoles = $("#guided-stored-contributors-select option:selected").data("roles");
        document.getElementById("guided-contributor-first-name").value = selectedFirstName;
        document.getElementById("guided-contributor-last-name").value = selectedLastName;
        document.getElementById("guided-contributor-orcid").value = selectedOrcid;
        affiliationTagify.removeAllTags();
        affiliationTagify.addTags(selectedAffiliation);
        contributorRolesTagify.removeAllTags();
        contributorRolesTagify.addTags(selectedRoles.split());
      });
    },

    preConfirm: () => {
      const contributorFirstName = document
        .getElementById("guided-contributor-first-name")
        .value.trim();
      const contributorLastName = document
        .getElementById("guided-contributor-last-name")
        .value.trim();
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value.trim();
      const contributorAffiliations = affiliationTagify.value.map((item) => item.value);
      const contributorRoles = contributorRolesTagify.value.map((item) => item.value);

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        contributorAffiliations.length === 0 ||
        contributorRoles.length === 0
      ) {
        return Swal.showValidationMessage("Please fill out all required fields");
      }

      if (contributorOrcid.length !== 37) {
        return Swal.showValidationMessage(
          "Please enter ORCID ID in the format: https://orcid.org/0000-0000-0000-0000"
        );
      }

      if (contributorRoles.includes("PrincipalInvestigator")) {
        if (getContributorMarkedAsPrincipalInvestigator()) {
          return Swal.showValidationMessage(
            "Only one contributor can be marked as Principal Investigator"
          );
        }
      }

      if (contributorFirstName.includes(",") || contributorLastName.includes(",")) {
        return Swal.showValidationMessage("Please remove commas from the name fields");
      }

      // Verify ORCID ID
      const orcidSite = contributorOrcid.substr(0, 18);
      if (orcidSite !== "https://orcid.org/") {
        return Swal.showValidationMessage(
          "Please enter your ORCID ID with https://orcid.org/ in the beginning"
        );
      }

      const orcidDigits = contributorOrcid.substr(18);
      let total = 0;
      for (let i = 0; i < orcidDigits.length - 1; i++) {
        const digit = parseInt(orcidDigits.substr(i, 1));
        if (isNaN(digit)) {
          continue;
        }
        total = (total + digit) * 2;
      }

      const remainder = total % 11;
      const result = (12 - remainder) % 11;
      const checkDigit = result === 10 ? "X" : String(result);

      if (checkDigit !== contributorOrcid.substr(-1)) {
        return Swal.showValidationMessage("ORCID iD does not exist");
      }

      // Combine first and last name into full name
      const contributorsFullName = `${contributorLastName}, ${contributorFirstName}`;

      try {
        addContributor(
          contributorsFullName,
          contributorOrcid,
          contributorAffiliations,
          contributorRoles
        );
      } catch (error) {
        return Swal.showValidationMessage(error);
      }

      //rerender the table after adding a contributor
      renderDatasetDescriptionContributorsTable();
    },
  });
};

window.contributorDataIsValid = (contributorObj) => {
  if (
    contributorObj.conAffliation.length > 0 &&
    contributorObj.conID &&
    contributorObj.conRole.length > 0 &&
    contributorObj.contributorFirstName.length > 0 &&
    contributorObj.contributorLastName.length > 0
  ) {
    return true;
  } else {
    return false;
  }
};

const getContributorMarkedAsPrincipalInvestigator = () => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const PrincipalInvestigator = contributors.find((contributor) =>
    contributor["conRole"].includes("PrincipalInvestigator")
  );
  // If there is no Principal Investigator, return null
  if (!PrincipalInvestigator) {
    return null;
  }
  // Otherwise, return their ORCID
  return PrincipalInvestigator["conID"];
};

const switchOrderOfContributors = (draggedOrcid, targetOrcid) => {
  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const draggedContributorIndex = contributors.findIndex(
    (contributor) => contributor["conID"] === draggedOrcid
  );
  const targetContributorIndex = contributors.findIndex(
    (contributor) => contributor["conID"] === targetOrcid
  );

  // If the dragged contributor is above the target contributor
  // then the dragged contributor should be inserted after the target contributor
  if (draggedContributorIndex < targetContributorIndex) {
    contributors.splice(targetContributorIndex + 1, 0, contributors[draggedContributorIndex]);
    contributors.splice(draggedContributorIndex, 1);
  } else {
    // If the dragged contributor is below the target contributor
    // then the dragged contributor should be inserted before the target contributor
    contributors.splice(targetContributorIndex, 0, contributors[draggedContributorIndex]);
    contributors.splice(draggedContributorIndex + 1, 1);
  }
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = contributors;
};

// Constants used for drag and drop functionality for contributors
let draggedRow;
let targetRow;
window.handleContributorDragStart = (event) => {
  draggedRow = event.target.closest("tr");
};
window.handleContributorDragOver = (event) => {
  event.preventDefault();
  targetRow = event.target.closest("tr");
};

window.handleContributorDrop = (event) => {
  event.preventDefault();
  if (targetRow === draggedRow) {
    return;
  }

  const draggedOrcid = draggedRow.dataset.contributorOrcid;
  const targetOrcid = targetRow.dataset.contributorOrcid;

  switchOrderOfContributors(draggedOrcid, targetOrcid);

  renderDatasetDescriptionContributorsTable();
};

const generateContributorTableRow = (contributorObj, contributorIndex) => {
  const contributorObjIsValid = window.contributorDataIsValid(contributorObj);
  const contributorFullName = contributorObj["conName"];
  const contributorOrcid = contributorObj["conID"];
  const contributorRoleString = contributorObj["conRole"].join(", ");

  return `
    <tr 
      data-contributor-orcid=${contributorOrcid}
      draggable="true"
      ondragstart="window.handleContributorDragStart(event)"
      ondragover="window.handleContributorDragOver(event)"
      ondragend="window.handleContributorDrop(event)"
      style="cursor: move;"
    >
      <td class="middle aligned collapsing text-center">
        ${contributorIndex}
      </td>
      <td class="middle aligned">
        ${contributorFullName}
      </td>
      <td class="middle aligned">
        ${contributorRoleString}
      </td>
      <td class="middle aligned collapsing text-center">
        ${
          contributorObjIsValid
            ? `<span class="badge badge-pill badge-success">Valid</span>`
            : `<span class="badge badge-pill badge-warning">Needs Modification</span>`
        }
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          onclick="window.openGuidedEditContributorSwal('${contributorOrcid}')"
        >
        View/Edit
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm" 
          onclick="window.deleteContributor(this, '${contributorOrcid}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};
const renderDatasetDescriptionContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");

  let contributorsTableHTML;

  const contributors =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  if (contributors.length === 0) {
    contributorsTableHTML = `
      <tr>
        <td colspan="6">
          <div style="margin-right:.5rem" class="alert alert-warning guided--alert" role="alert">
            No contributors have been added to your dataset. To add a contributor, click the "Add a new contributor" button below.
          </div>
        </td>
      </tr>
    `;
  } else {
    contributorsTableHTML = contributors
      .map((contributor, index) => {
        let contributorIndex = index + 1;
        return generateContributorTableRow(contributor, contributorIndex);
      })
      .join("\n");
  }
  contributorsTable.innerHTML = contributorsTableHTML;
};

const getGuidedProtocolLinks = () => {
  try {
    return window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"].map(
      (protocol) => protocol.link
    );
  } catch (error) {
    // return an empty array if the protocol array doesn't exist yet
    return [];
  }
};

const protocolObjIsFair = (protocolLink, protocoldescription) => {
  return protocolLink.length > 0 && protocoldescription.length > 0;
};

const addGuidedProtocol = (link, description, type) => {
  const currentProtocolLinks = getGuidedProtocolLinks();

  if (currentProtocolLinks.includes(link)) {
    throw new Error("Protocol link already exists");
  }

  const isFair = protocolObjIsFair(link, description);

  //add the new protocol to the JSONObj
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [
    ...window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"],
    {
      link: link,
      type: type,
      relation: "IsProtocolFor",
      description: description,
      isFair: isFair,
    },
  ];
};
const editGuidedProtocol = (oldLink, newLink, description, type) => {
  const currentProtocolLinks =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  //find the index of the protocol to be edited
  const protocolIndex = currentProtocolLinks.findIndex((protocol) => protocol.link === oldLink);

  const isFair = protocolObjIsFair(newLink, description);

  //replace the protocol at the index with the new protocol
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"][protocolIndex] = {
    link: newLink,
    type: type,
    relation: "IsProtocolFor",
    description: description,
    isFair: isFair,
  };
};

const determineIfLinkIsDOIorURL = (link) => {
  // returns either "DOI" or "URL" or "neither"
  if (doiRegex.declared({ exact: true }).test(link) === true) {
    return "DOI";
  }
  if (validator.isURL(link) != true) {
    return "neither";
  }
  if (link.includes("doi")) {
    return "DOI";
  } else {
    return "URL";
  }
};

window.openProtocolSwal = async (protocolElement) => {
  // True if adding a new protocol, false if editing an existing protocol
  let protocolURL = "";
  let protocolDescription = "";
  if (protocolElement) {
    protocolURL = protocolElement.dataset.protocolUrl;
    protocolDescription = protocolElement.dataset.protocolDescription;
  }
  await Swal.fire({
    title: "Add a protocol",
    html:
      `<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL" value="${protocolURL}">` +
      `<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">${protocolDescription}</textarea>`,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    width: "38rem",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#DD-protocol-link").val();
      const protocolDescription = $("#DD-protocol-description").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
        return;
      }
      if (protocolDescription === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
        return;
      }
      let protocolType = determineIfLinkIsDOIorURL(link);
      if (protocolType === "neither") {
        Swal.showValidationMessage(`Please enter a valid URL or DOI!`);
        return;
      }

      try {
        if (!protocolElement) {
          // Add the protocol
          addGuidedProtocol(link, protocolDescription, protocolType);
        } else {
          // Edit the existing protocol
          const protocolToEdit = protocolElement.dataset.protocolUrl;
          editGuidedProtocol(protocolToEdit, link, protocolDescription, protocolType);
        }
        renderProtocolsTable();
      } catch (error) {
        Swal.showValidationMessage(error);
      }
    },
  });
};

window.guidedDeleteProtocol = (protocolElement) => {
  const linkToDelete = protocolElement.dataset.protocolUrl;
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = window.sodaJSONObj[
    "dataset-metadata"
  ]["description-metadata"]["protocols"].filter((protocol) => protocol.link !== linkToDelete);
  renderProtocolsTable();
};

//TODO: handle new blank protocol fields (when parameter are blank)
const generateProtocolField = (protocolUrl, protocolType, protocolDescription, isFair) => {
  return `
    <tr 
      class="guided-protocol-field-container"
    >
      <td class="middle aligned link-name-cell" >
        ${protocolUrl}
      </td>
      <td class="middle aligned">
        ${protocolDescription}
      </td>
      <td class="middle aligned collapsing text-center">
        ${
          isFair
            ? `<span class="badge badge-pill badge-success">Valid</span>`
            : `<span class="badge badge-pill badge-warning">Needs modification</span>`
        }
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          data-protocol-url="${protocolUrl}"
          data-protocol-description="${protocolDescription}"
          onclick="window.openProtocolSwal(this)"
        >
        View/Edit
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          data-protocol-url="${protocolUrl}"
          data-protocol-description="${protocolDescription}"
          onclick="window.guidedDeleteProtocol(this)"
        >
        Delete
        </button>
      </td>
    </tr>
  `;
};

const renderProtocolsTable = () => {
  const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

  const protocolsContainer = document.getElementById("protocols-container");

  //protocols is either undefined when brand new dataset or 0 when returning from a saved dataset
  if (protocols === undefined || protocols.length === 0) {
    const emptyRowWarning = generateAlertElement(
      "warning",
      "You currently have no protocols for your dataset. To add, click the 'Add a new protocol' button"
    );
    let warningRowElement = `<tr id="protocolAlert"><td colspan="5">${emptyRowWarning}</td></tr>`;
    protocolsContainer.innerHTML = warningRowElement;
    return;
  }

  const protocolElements = protocols
    .map((protocol) => {
      return generateProtocolField(
        protocol["link"],
        protocol["type"],
        protocol["description"],
        protocol["isFair"]
      );
    })
    .join("\n");
  protocolsContainer.innerHTML = protocolElements;
};

const renderAdditionalLinksTable = () => {
  const additionalLinksTableBody = document.getElementById("additional-links-table-body");
  const additionalLinkData =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  if (additionalLinkData.length != 0) {
    const additionalLinkElements = additionalLinkData
      .map((link) => {
        return generateadditionalLinkRowElement(link.link, link.type, link.relation);
      })
      .join("\n");
    additionalLinksTableBody.innerHTML = additionalLinkElements;
  } else {
    const emptyRowWarning = generateAlertElement(
      "warning",
      `You currently have no additional links. To add a link, click the "Add additional link" button below.`
    );
    let warningRowElement = `<tr><td colspan="5">${emptyRowWarning}</td></tr>`;
    //add empty rowWarning to additionalLinksTableBody
    additionalLinksTableBody.innerHTML = warningRowElement;
  }
};
const openAddAdditionLinkSwal = async () => {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html: `
      <label>
        URL or DOI:
      </label>
      <input
        id="guided-other-link"
        class="swal2-input"
        placeholder="Enter a URL"
      />
      <label>
        Relation to the dataset:
      </label>
      <select id="guided-other-link-relation" class="swal2-input">
        <option value="Select">Select a relation</option>
        <option value="IsCitedBy">IsCitedBy</option>
        <option value="Cites">Cites</option>
        <option value="IsSupplementTo">IsSupplementTo</option>
        <option value="IsSupplementedBy">IsSupplementedBy</option>
        <option value="IsContinuedByContinues">IsContinuedByContinues</option>
        <option value="IsDescribedBy">IsDescribedBy</option>
        <option value="Describes">Describes</option>
        <option value="HasMetadata">HasMetadata</option>
        <option value="IsMetadataFor">IsMetadataFor</option>
        <option value="HasVersion">HasVersion</option>
        <option value="IsVersionOf">IsVersionOf</option>
        <option value="IsNewVersionOf">IsNewVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="HasPart">HasPart</option>
        <option value="IsPublishedIn">IsPublishedIn</option>
        <option value="IsReferencedBy">IsReferencedBy</option>
        <option value="References">References</option>
        <option value="IsDocumentedBy">IsDocumentedBy</option>
        <option value="Documents">Documents</option>
        <option value="IsCompiledBy">IsCompiledBy</option>
        <option value="Compiles">Compiles</option>
        <option value="IsVariantFormOf">IsVariantFormOf</option>
        <option value="IsOriginalFormOf">IsOriginalFormOf</option>
        <option value="IsIdenticalTo">IsIdenticalTo</option>
        <option value="IsReviewedBy">IsReviewedBy</option>
        <option value="Reviews">Reviews</option>
        <option value="IsDerivedFrom">IsDerivedFrom</option>
        <option value="IsSourceOf">IsSourceOf</option>
        <option value="IsRequiredBy">IsRequiredBy</option>
        <option value="Requires">Requires</option>
        <option value="IsObsoletedBy">IsObsoletedBy</option>
        <option value="Obsoletes">Obsoletes</option>
      </select>
      <label>
        Link description:
      </label>
      <textarea
        id="guided-other-description"
        class="swal2-textarea"
        placeholder="Enter a description"
      ></textarea>
    `,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#guided-other-link").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link.`);
        return;
      }
      if ($("#guided-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please select a link relation.`);
        return;
      }
      if ($("#guided-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
        return;
      }
      var duplicate = window.checkLinkDuplicate(
        link,
        document.getElementById("other-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage("Duplicate URL/DOI. The URL/DOI you entered is already added.");
      }
      return [
        $("#guided-other-link").val(),
        $("#guided-other-link-relation").val(),
        $("#guided-other-description").val(),
      ];
    },
  });
  if (values) {
    const link = values[0];
    const relation = values[1];
    let linkType;
    //check if link starts with "https://"
    if (link.startsWith("https://doi.org/")) {
      linkType = "DOI";
    } else {
      linkType = "URL";
    }
    const description = values[2];
    //add link to jsonObj
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].push({
      link: link,
      relation: relation,
      description: description,
      type: linkType,
      isFair: true,
    });
    renderAdditionalLinksTable();
  }
};

const renderSubjectSampleAdditionTable = (subject) => {
  return `
    <table
      class="ui celled striped table"
      style="margin-bottom: 10px; width: 800px"
    >
      <thead>
        <tr>
          <th class="text-center" colspan="2" style="position: relative">   
            Samples taken from ${subject.subjectName}
            <button
              type="button"
              class="btn btn-primary btn-sm button-subject-add-samples"
              style="position: absolute; top: 10px; right: 20px;"
              data-samples-subject-name="${subject.subjectName}"
            >
              Add samples
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${subject.samples
          .map((sample) => {
            return generateSampleRowElement(sample);
          })
          .join("\n")}
      </tbody>
    </table>
  `;
};

const openModifySampleMetadataPage = (sampleMetadataID, samplesSubjectID) => {
  //Get all samples from the dataset and add all other samples to the was derived from dropdown
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const samplesBesidesCurrSample = samples.filter(
    (sample) => sample.sampleName !== sampleMetadataID
  );
  document.getElementById("guided-bootbox-wasDerivedFromSample").innerHTML = `
 <option value="">Sample not derived from another sample</option>
 ${samplesBesidesCurrSample
   .map((sample) => {
     return `<option value="${sample.sampleName}">${sample.sampleName}</option>`;
   })
   .join("\n")}))
 `;

  //Add protocol titles to the protocol dropdown
  const protocols = window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  document.getElementById("guided-bootbox-sample-protocol-title").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.description}"
            data-protocol-link="${protocol.link}"
          >
            ${protocol.description}
          </option>
        `;
      })
      .join("\n")}))
  `;

  document.getElementById("guided-bootbox-sample-protocol-location").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.link}"
            data-protocol-description="${protocol.description}"
          >
            ${protocol.link}
          </option>
        `;
      })
      .join("\n")}))
  `;

  for (let i = 1; i < window.samplesTableData.length; i++) {
    if (
      window.samplesTableData[i][0] === samplesSubjectID &&
      window.samplesTableData[i][1] === sampleMetadataID
    ) {
      //if the id matches, load the metadata into the form
      window.populateFormsSamples(samplesSubjectID, sampleMetadataID, "", "guided");
      return;
    }
  }
};

window.openCopySubjectMetadataPopup = async () => {
  //save current subject metadata entered in the form
  window.addSubject("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < window.subjectsTableData.length; i++) {
    const subjectID = window.subjectsTableData[i][0];
    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between" style="max-height: 500px; overflow-y: auto;">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subject would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subjects would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;
  Swal.fire({
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: 950,
    html: copyMetadataElement,
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    confirmButtonColor: "Copy",
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      const selectedCopyFromSubject = $("input[name='copy-from']:checked").val();
      //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
      let selectedCopyToSubjects = [];
      $("input[name='copy-to']:checked").each(function () {
        selectedCopyToSubjects.push($(this).val());
      });
      let copyFromSubjectData = [];
      for (var i = 1; i < window.subjectsTableData.length; i++) {
        if (window.subjectsTableData[i][0] === selectedCopyFromSubject) {
          //copy all elements from matching array except the first two
          copyFromSubjectData = window.subjectsTableData[i].slice(2);
        }
      }
      for (const subject of selectedCopyToSubjects) {
        //loop through all window.subjectsTableData elements besides the first one
        for (let i = 1; i < window.subjectsTableData.length; i++) {
          //check through elements of tableData to find a subject ID match
          if (window.subjectsTableData[i][0] === subject) {
            window.subjectsTableData[i] = [
              window.subjectsTableData[i][0],
              window.subjectsTableData[i][1],
              ...copyFromSubjectData,
            ];
          }
        }
      }
      const currentSubjectOpenInView = document.getElementById("guided-bootbox-subject-id").value;
      if (currentSubjectOpenInView) {
        //If a subject was open in the UI, update it with the new metadata
        window.populateForms(currentSubjectOpenInView, "", "guided");
      }

      await guidedSaveProgress();
    }
  });
};

window.openCopySampleMetadataPopup = async () => {
  window.addSample("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < window.samplesTableData.length; i++) {
    const sampleID = window.samplesTableData[i][1];

    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${sampleID}">
          <label>${sampleID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
        <input type="checkbox" name="copy-to" value="${sampleID}">
        <label>${sampleID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which sample would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which samples would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: 950,
    html: copyMetadataElement,
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    confirmButtonText: "Copy",
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      const selectedCopyFromSample = $("input[name='copy-from']:checked").val();
      //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
      let selectedCopyToSamples = []; //["sam2","sam3"]
      $("input[name='copy-to']:checked").each(function () {
        selectedCopyToSamples.push($(this).val());
      });

      let copyFromSampleData = [];
      //Create a variable for the third entry ("was derived from") to make it easier to copy into the
      //middle of the array
      let wasDerivedFrom = "";

      //Add the data from the selected copy fro sample to cpoyFromSampleData array
      for (let i = 1; i < window.samplesTableData.length; i++) {
        if (window.samplesTableData[i][1] === selectedCopyFromSample) {
          //copy all elements from matching array except the first one
          wasDerivedFrom = window.samplesTableData[i][2];
          copyFromSampleData = window.samplesTableData[i].slice(4);
        }
      }
      for (const sample of selectedCopyToSamples) {
        window.samplesTableData.forEach((sampleData, index) => {
          if (sampleData[1] === sample) {
            sampleData = [sampleData[0], sampleData[1], wasDerivedFrom, sampleData[3]];
            sampleData = sampleData.concat(copyFromSampleData);
            window.samplesTableData[index] = sampleData;
          }
        });
      }
      const currentSampleOpenInView = document.getElementById("guided-bootbox-sample-id").value;
      const currentSampleSubjectOpenInView = document.getElementById(
        "guided-bootbox-subject-id-samples"
      ).value;

      //If a sample was open in the UI, update it with the new metadata
      if (currentSampleOpenInView) {
        openModifySampleMetadataPage(currentSampleOpenInView, currentSampleSubjectOpenInView);
      }
      await guidedSaveProgress();
    }
  });
};

const updatePoolDropdown = (poolDropDown, poolName) => {
  poolDropDown.empty().trigger("change");
  //add subjects in pool to dropdown and set as selected
  const poolsSubjects = window.sodaJSONObj.getPoolSubjects(poolName);
  for (const subject of poolsSubjects) {
    var newOption = new Option(subject, subject, true, true);
    poolDropDown.append(newOption).trigger("change");
  }

  //add subject options not in pool to dropdown and set as unselected
  const subjectsNotInPools = window.sodaJSONObj.getSubjectsOutsidePools();
  for (const subject of subjectsNotInPools) {
    var newOption = new Option(subject, subject, false, false);
    poolDropDown.append(newOption).trigger("change");
  }
};

//On edit button click, creates a new subject ID rename input box
window.openSubjectRenameInput = (subjectNameEditButton) => {
  const subjectIdCellToRename = subjectNameEditButton.closest("td");
  const prevSubjectName = subjectIdCellToRename.find(".subject-id").text();
  let prevSubjectInput = prevSubjectName.substr(prevSubjectName.search("-") + 1);
  const subjectRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sub-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-subject-id"
        value=${prevSubjectInput}
        placeholder="Enter subject ID and press enter"
        onkeyup="specifySubject(event, window.$(this))"
        data-alert-message="Subject IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSubjectName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
    </div>
  `;
  subjectIdCellToRename.html(subjectRenameElement);
};

const generateSubjectRowElement = (subjectName) => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <div class="space-between w-100">
            <span class="subject-id">${subjectName}</span>
            <i
              class="far fa-edit guided-subject-edit-button"
              style="cursor: pointer; margin-top: .2rem"
              data-subject-name="${subjectName}"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="window.deleteSubject($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSubjectSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sub-</span>
          <input
            id="guided--subject-input"
            class="guided--input"
            type="text"
            name="guided-subject-id"
            placeholder="Enter subject ID and press enter"
            onkeyup="specifySubject(event, window.$(this))"
            data-alert-message="Subject IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
        </div>
      </td>


      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer; display: none;"
          onclick="window.deleteSubject($(this))"
        ></i>
      </td>
      </tr>
  `;
};

const generatePoolRowElement = (poolName) => {
  return `
    <tr>
      <td class="middle aligned pool-cell collapsing">
        <div class="space-between" style="align-items: center; width: 250px">
          <div class="space-between" style="width: 250px">
            <span class="pool-id">${poolName}</span>
            <i
              class="far fa-edit guided-pool-edit-button"
              data-pool-name="${poolName}"
              style="cursor: pointer"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned pool-subjects">
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="window.deletePool(window.$(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSampleRowElement = (sampleName) => {
  return `
    <tr>
    <td class="middle aligned sample-id-cell">
      <div class="space-between w-100" style="align-items: center">
    <div class="space-between w-100">
      <span class="sample-id">${sampleName}</span>
      <i class="far fa-edit jump-back guided-sample-edit-button" data-sample-name="${sampleName}" style="cursor: pointer;" >
      </i>
    </div>
  </div>
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i class="far fa-trash-alt" style="color: red; cursor: pointer" onclick="window.deleteSample(window.$(this))"></i>
    </td>
  </tr>`;
};
const generateSampleSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned sample-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sam-</span>
          <input
            id="guided--sample-input"
            class="guided--input"
            type="text"
            name="guided-sample-id"
            placeholder="Enter sample ID and press enter"
            onkeyup="specifySample(event, window.$(this))"
            data-alert-message="Sample IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer; display: none;"
          onclick="window.deleteSample(window.$(this))"
        ></i>
      </td>
    </tr>
  `;
};

window.confirmEnter = (button) => {
  let input_id = button.previousElementSibling.id;
  let sampleTable = false;
  let addSampleButton = "";
  let sampleTableContainers = "";
  if (input_id === "guided--sample-input") {
    //confirming the sample input, manually create another one
    addSampleButton =
      button.parentElement.parentElement.parentElement.parentElement.previousElementSibling
        .children[0].children[0].children[1];
    sampleTableContainers = document.getElementById("guided-section-subjects-tables").children;
    sampleTable = true;
    // window.addSampleSpecificationTableRow();
  }
  const ke = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  });

  let input_field = button.previousElementSibling;
  if (input_field.tagName === "INPUT") {
    input_field.dispatchEvent(ke);
  } else {
    //alert message is the previousElement
    input_field.parentNode.children[1].dispatchEvent(ke);
  }
  if (sampleTable) {
    //for adding a new sample row
    let clickSampleButton = true;
    for (let i = 0; i < sampleTableContainers.length; i++) {
      let sampleEntries = sampleTableContainers[i].children[1];
      if (sampleEntries.children.length > 0) {
        //entries have been create so look at the last one if an input is there
        let lastEntryCount = sampleEntries.children.length - 1;
        let lastEntry = sampleEntries.children[lastEntryCount];
        let lastEntryTagType = lastEntry.children[0].children[0].children[1];
        if (lastEntryTagType === "INPUT") {
          //an input is already made (duplicates will have duplicate ids)
          clickSampleButton = false;
          break;
        }
      }
      if (clickSampleButton) {
        addSampleButton.click();
      }
    }
  }
};

const keydownListener = (event) => {
  if (event.key === "Enter") {
    enterKey = true;
  } else {
    enterKey = false;
  }
};

const onBlurEvent = () => {
  if (event.path[0].value.length > 0) {
    if (enterKey === false) {
      window.confirmEnter(event.path[1].children[2]);
    }
  }
};

var enterKey = false;
const confirmOnBlur = (element) => {
  window.addEventListener("keydown", keydownListener);
  document.getElementById(element).addEventListener("blur", onBlurEvent);
};

const addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById("subject-specification-table-body");
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput = subjectSpecificationTableBody.querySelector(
    "input[name='guided-subject-id']"
  );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    //create a new table row on
    subjectSpecificationTableBody.innerHTML += generateSubjectSpecificationRowElement();

    const newSubjectRow = subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector("input[name='guided-subject-id']");
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER FOR ON FOCUS
    confirmOnBlur("guided--subject-input");
  }
};

window.getExistingSubjectNames = () => {
  // Get all subjects in pools and outside of pools
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  // Combine the two arrays
  const subjects = [...subjectsInPools, ...subjectsOutsidePools];
  // Map each subject object to its name
  return subjects.map((subject) => subject["subjectName"]);
};

const getSubjectsPool = (subjectName) => {
  const [subjectsInPools, _] = window.sodaJSONObj.getAllSubjects();
  for (const subject of subjectsInPools) {
    if (subject["subjectName"] === subjectName) {
      return subject["poolName"];
    }
  }
  return "";
};

const getExistingPoolNames = () => {
  return Object.keys(
    window.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
  );
};

const getExistingSampleNames = () => {
  // Get all samples in pools and outside of pools
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  // Combine the two arrays
  return [...samplesInPools, ...samplesOutsidePools].map((sample) => sample["sampleName"]);
};

const setUiBasedOnSavedDatasetStructurePath = (pathToSpreadsheet) => {
  // If the dataset structure spreadsheet path is set, hide the button to create a new one
  // And show the required elements for the user to view/import the spreadsheet
  const stepOneElements = document.querySelectorAll(".step-before-spreadsheet-path-declared");
  const stepTwoElements = document.querySelectorAll(".step-after-spreadsheet-path-declared");

  if (!pathToSpreadsheet || !fs.existsSync(pathToSpreadsheet)) {
    stepOneElements.forEach((element) => {
      element.classList.remove("hidden");
    });
    stepTwoElements.forEach((element) => {
      element.classList.add("hidden");
    });
  } else {
    stepOneElements.forEach((element) => {
      element.classList.add("hidden");
    });
    stepTwoElements.forEach((element) => {
      element.classList.remove("hidden");
    });
  }
};

/*document
  .getElementById("guided-button-choose-dataset-structure-spreadsheet-path")
  .addEventListener("click", () => {
    // Create a new spreadsheet based on the dataset structure
    window.electron.ipcRenderer.send(
      "open-create-dataset-structure-spreadsheet-path-selection-dialog"
    );
  });*/

window.electron.ipcRenderer.on(
  "selected-create-dataset-structure-spreadsheet-path",
  async (event, path) => {
    try {
      // Set the column widths
      const datasetHasPools = document
        .getElementById("guided-button-spreadsheet-subjects-are-pooled")
        .classList.contains("selected");
      const datasetHasSamples = document
        .getElementById("guided-button-spreadsheet-subjects-have-samples")
        .classList.contains("selected");
      const filePath = path + "/dataset_structure.xlsx";

      await window.electron.ipcRenderer.invoke(
        "create-and-save-dataset-structure-spreadsheet",
        datasetHasPools,
        datasetHasSamples,
        filePath
      );

      window.sodaJSONObj["dataset-structure-spreadsheet-path"] = filePath;
      setUiBasedOnSavedDatasetStructurePath(filePath);
      const openTemplateForUser = await swalConfirmAction(
        null,
        "Template successfully generated",
        `
        Would you like to open the template now?
      `,
        "Yes",
        "No"
      );
      if (openTemplateForUser) {
        window.electron.ipcRenderer.send("open-file-at-path", filePath);
      }
    } catch (error) {
      clientError(error);
      notyf.error(`Error creating dataset structure spreadsheet: ${error}`);
    }
  }
);

const guidedAddListOfSubjects = async (subjectNameArray, showWarningForExistingSubjects) => {
  // Check to see if any of the subject names are invalid
  const validSubjecNames = [];
  const invalidSubjectNames = [];
  for (const subjectName of subjectNameArray) {
    if (subjectName.length === 0) {
      continue;
    }

    const subjectNameIsValid = window.evaluateStringAgainstSdsRequirements(
      subjectName,
      "string-adheres-to-identifier-conventions"
    );
    if (subjectNameIsValid) {
      validSubjecNames.push(subjectName);
    } else {
      invalidSubjectNames.push(subjectName);
    }
  }
  if (invalidSubjectNames.length > 0) {
    await swalFileListSingleAction(
      invalidSubjectNames,
      "Invalid subject names detected",
      "Subject names can not contain spaces or special characters. The following subjects will not be imported into SODA:",
      ""
    );
  }

  // append sub- to each subject name if it doesn't already start with sub-
  const formattedSubjectNameArray = validSubjecNames.map((subjectName) => {
    if (!subjectName.startsWith("sub-")) {
      subjectName = `sub-${subjectName}`;
    }
    return subjectName;
  });
  // Remove empty strings from the array
  formattedSubjectNameArray.filter((subjectName) => subjectName.length > 0);

  // Get an array of existing subjects to check for duplicates
  const existingSubjects = window.getExistingSubjectNames();

  // Array of the subjects that already exist in the dataset
  const duplicateSubjects = formattedSubjectNameArray.filter((subjectName) =>
    existingSubjects.includes(subjectName)
  );

  // Array of the subjects that do not already exist in the dataset
  const newSubjects = formattedSubjectNameArray.filter(
    (subjectName) => !existingSubjects.includes(subjectName)
  );

  if (showWarningForExistingSubjects && duplicateSubjects.length > 0) {
    // Let the user know that duplicate subjects will not be added
    await swalFileListSingleAction(
      duplicateSubjects,
      "Duplicate subjects detected",
      "The following subjects have already been specified and will not be added:",
      ""
    );
  }

  if (newSubjects.length > 0) {
    // Confirm that the user wants to add the subjects
    const subjectAdditionConfirmed = await swalFileListDoubleAction(
      newSubjects,
      `${newSubjects.length} subjects will be added to the dataset`,
      "Please review the list of subjects before proceeding:",
      "yes, import the subjects",
      "No, cancel the import",
      "Would you like to import the subjects into SODA?"
    );
    if (subjectAdditionConfirmed) {
      // Add the new subjects to the dataset
      for (const subjectName of newSubjects) {
        window.sodaJSONObj.addSubject(subjectName);
      }

      notyf.open({
        duration: "3000",
        type: "success",
        message: `${newSubjects.length} subjects added`,
      });

      // Refresh the UI
      renderSubjectsTable();
    }
  }
};

window.electron.ipcRenderer.on("selected-subject-names-from-dialog", async (event, folders) => {
  const subjectNames = folders.map((folder) => window.path.basename(folder));
  guidedAddListOfSubjects(subjectNames, true);
});

const convertArrayToCommaSeparatedString = (array) => {
  // Convert the array to a comma separated string with an "and" before the last element if there are more than 2 elements
  if (array.length === 0) {
    return "";
  }
  if (array.length === 1) {
    return array[0];
  }
  if (array.length === 2) {
    return `${array[0]} and ${array[1]}`;
  }
  if (array.length > 2) {
    const lastElement = array.pop();
    return `${array.join(", ")}, and ${lastElement}`;
  }
};

const guidedOpenEntityAdditionSwal = async (entityName) => {
  // Get a list of the existing entities so we can check for duplicates
  // const subjects = window.getExistingSubjectNames();
  let preExistingEntities;
  let entityNameSingular;
  let entityPrefix;

  // case when adding subjects
  if (entityName === "subjects") {
    preExistingEntities = window.getExistingSubjectNames();
    entityNameSingular = "subject";
    entityPrefix = "sub-";
  }

  // case when adding samples to a subject
  if (entityName.startsWith("sub-")) {
    preExistingEntities = getExistingSampleNames();
    entityNameSingular = "sample";
    entityPrefix = "sam-";
  }

  // case when adding pools
  if (entityName === "pools") {
    preExistingEntities = getExistingPoolNames();
    entityNameSingular = "pool";
    entityPrefix = "pool-";
  }

  let newEntities = [];

  const handleSwalEntityAddition = (entityName) => {
    if (entityName.length < 1) {
      throw new Error(`Please enter a ${entityNameSingular} name`);
    }
    // Check to see if the subjectName starts with sub- otherwise prepend sub- to it
    if (!entityName.startsWith(entityPrefix)) {
      entityName = `${entityPrefix}${entityName}`;
    }
    // Check to see if the subjectName already exists
    if (preExistingEntities.includes(entityName) || newEntities.includes(entityName)) {
      throw new Error(`${entityNameSingular} name has already been added`);
    }

    const entityNameIsValid = window.evaluateStringAgainstSdsRequirements(
      entityName,
      "string-adheres-to-identifier-conventions"
    );

    if (!entityNameIsValid) {
      throw new Error(`${entityNameSingular} names may not contain spaces or special characters`);
    }

    // Hide any validation messages that may exist in the sweet alert
    Swal.resetValidationMessage();

    // Add the subject to the beginning of the subjects array
    newEntities.unshift(entityName);
    // Re-render the subjects in the Swal
    renderEntitiesInSwal();
  };

  const deleteSwalEntity = (entityName) => {
    // Remove subject from subjects array
    const index = newEntities.indexOf(entityName);
    if (index > -1) {
      newEntities.splice(index, 1);
    }
    Swal.resetValidationMessage();
    renderEntitiesInSwal();
  };

  const renderEntitiesInSwal = () => {
    const entitiesList = document.getElementById("entities-list");
    if (newEntities.length === 0) {
      entitiesList.classList.add("hidden");
    } else {
      entitiesList.classList.remove("hidden");
      entitiesList.innerHTML = newEntities
        .map(
          (entity) => `
            <div class="swal-file-row px-2">
              <span class="swal-file-text">${entity}</span>
              <button class="delete-button btn btn-sm btn-outline-danger" data-entity-name="${entity}">Delete</button>
            </div>
          `
        )
        .join("");

      entitiesList.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => {
          deleteSwalEntity(button.dataset.entityName);
        });
      });
    }
  };
  `${entityNameSingular} addition`;
  const additionConfirmed = await Swal.fire({
    title: `${
      entityName.startsWith("sub-")
        ? `Add samples taken from ${entityName}`
        : `${entityNameSingular} addition`
    }`,
    html: `
      <p class="help-text">
        Enter a unique ${entityNameSingular} ID and press enter or the
        'Add ${entityNameSingular}' button for each ${entityNameSingular} in your dataset.
        <br />
      </p>
      <div class="space-between w-100 align-flex-center">
        <p class="help-text m-0 mr-1 no-text-wrap">${entityPrefix}</p>
        <input id='input-entity-addition' class='guided--input' type='text' name='guided-subject-id' placeholder='Enter ${entityNameSingular} ID and press enter'/>
        <button
          class="ui positive button soda-green-background ml-1"
          style="width: 180px;"
          id="guided-button-add-subject-in-swal"
        >
          Add ${entityNameSingular}
        </button>
      </div>
      <div id="entities-list" class="swal-file-list my-3"></div>
    `,
    width: 850,
    heightAuto: false,
    backdrop: "rgba(0,0,0,0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    showCloseButton: false,
    allowOutsideClick: false,
    confirmButtonText: `Confirm`,
    cancelButtonText: `Cancel`,
    didOpen: () => {
      // Render the initial subjects in the Swal
      renderEntitiesInSwal();
      const swalEntityNameInput = document.getElementById("input-entity-addition");

      // Add an event listener for the enter key so the user can press enter to add the subject
      swalEntityNameInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          try {
            handleSwalEntityAddition(swalEntityNameInput.value);
            swalEntityNameInput.value = "";
          } catch (error) {
            Swal.showValidationMessage(error);
          }
        }
      });

      const addEntityButton = document.getElementById("guided-button-add-subject-in-swal");
      addEntityButton.addEventListener("click", () => {
        try {
          handleSwalEntityAddition(swalEntityNameInput.value);
          swalEntityNameInput.value = "";
        } catch (error) {
          Swal.showValidationMessage(error);
        }
      });
    },
    preConfirm: () => {
      if (newEntities.length === 0) {
        Swal.showValidationMessage(`Please add at least one ${entityNameSingular} or click Cancel`);
      }
    },
  });

  // If the user confirmed the addition of the entities, add them to the sodaJSONObj
  // and re-render the table
  if (additionConfirmed.isConfirmed) {
    // reverse newEntities array
    newEntities.reverse();
    if (entityName === "subjects") {
      for (const subjectName of newEntities) {
        window.sodaJSONObj.addSubject(subjectName);
      }
      renderSubjectsTable();
    }
    if (entityName === "pools") {
      for (const poolName of newEntities) {
        window.sodaJSONObj.addPool(poolName);
      }
      renderPoolsTable();
    }
    if (entityName.startsWith("sub-")) {
      const subjectsPool = getSubjectsPool(entityName);
      for (const sampleName of newEntities) {
        window.sodaJSONObj.addSampleToSubject(sampleName, subjectsPool, entityName);
      }
      renderSamplesTable();
    }
  }
};

/*document.getElementById("guided-button-add-subjects").addEventListener("click", async () => {
  guidedOpenEntityAdditionSwal("subjects");
});*/

window.addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById("subject-specification-table-body");
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput = subjectSpecificationTableBody.querySelector(
    "input[name='guided-subject-id']"
  );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    //create a new table row on
    subjectSpecificationTableBody.innerHTML += generateSubjectSpecificationRowElement();

    const newSubjectRow = subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector("input[name='guided-subject-id']");
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER FOR ON FOCUS
    confirmOnBlur("guided--subject-input");
  }
};

window.addSampleSpecificationTableRow = (clickedSubjectAddSampleButton) => {
  const addSampleTable = clickedSubjectAddSampleButton.closest("table");
  const addSampleTableBody = addSampleTable.querySelector("tbody");

  //check if subject specification table body has an input with the name guided-subject-id
  const sampleSpecificationTableInput = addSampleTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  //check for any

  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    //No need to create a new row
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row Input element
    addSampleTableBody.innerHTML += generateSampleSpecificationRowElement();
    const newSamplerow = addSampleTableBody.querySelector("tr:last-child");
    //Focus the new sample row element
    const newSampleInput = newSamplerow.querySelector("input[name='guided-sample-id']");
    window.addEventListener("keydown", keydownListener);
    newSampleInput.addEventListener("blur", onBlurEvent);
    newSampleInput.focus();
  }
};

const generateNewSampleRowTd = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">sam-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-sample-id"
          placeholder="Enter sample ID"
          onkeyup="specifySample(event, window.$(this))"
          data-alert-message="Sample IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 250px"
        />
      </div>
    </td>
    <td
      class="middle aligned samples-subject-dropdown-cell remove-left-border"
    ></td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="window.deleteSample(window.$(this))"
      ></i>
    </td>
  `;
};
const addSampleTableRow = () => {
  const sampleSpecificationTableBody = document.getElementById("samples-specification-table-body");
  //check if sample specification table body has an input with the name guided-sample-id
  const sampleSpecificationTableInput = sampleSpecificationTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row on
    const newSamplesTableRow = sampleSpecificationTableBody.insertRow(-1);
    newSamplesTableRow.innerHTML = generateNewSampleRowTd();
    const newSampleRow = sampleSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSampleRow
    const newSampleInput = newSampleRow.querySelector("input[name='guided-sample-id']");
    window.smoothScrollToElement(newSampleRow);
    newSampleInput.focus();
  }
};

//deletes subject from jsonObj and UI
window.deleteSubject = async (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();

  //Check to see if a subject has been added to the element
  //if it has, delete the subject from the pool-sub-sam structure
  if (subjectIdToDelete) {
    await window.sodaJSONObj.deleteSubject(subjectIdToDelete);
  }

  //Rerender the subjects table
  renderSubjectsTable();
};

window.deletePool = (poolDeleteButton) => {
  const poolIdCellToDelete = poolDeleteButton.closest("tr");
  const poolIdToDelete = poolIdCellToDelete.find(".pool-id").text();
  //delete the table row element in the UI
  poolIdCellToDelete.remove();
  window.sodaJSONObj.deletePool(poolIdToDelete);
  removeAlertMessageIfExists($("#pools-table"));
};

window.deleteSample = async (sampleDeleteButton) => {
  const sampleIdCellToDelete = sampleDeleteButton.closest("tr");
  const sampleIdToDelete = sampleIdCellToDelete.find(".sample-id").text();

  //Check to see if a sample has been added to the element
  //if it has, delete the sample from the pool-sub-sam structure
  if (sampleIdToDelete) {
    await window.sodaJSONObj.deleteSample(sampleIdToDelete, true);
  }

  //Rerender the samples table
  renderSamplesTable();
};

//SAMPLE TABLE FUNCTIONS
window.openSampleRenameInput = (subjectNameEditButton) => {
  const sampleIdCellToRename = subjectNameEditButton.closest("td");
  const prevSampleName = sampleIdCellToRename.find(".sample-id").text();
  const prevSampleInput = prevSampleName.substr(prevSampleName.search("-") + 1);
  const sampleRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sam-</span>
      <input
        class="guided--input"
        type="text"
        value=${prevSampleInput}
        name="guided-sample-id"
        placeholder="Enter new sample ID"
        onkeyup="specifySample(event, window.$(this))"
        data-alert-message="Sample IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSampleName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="window.confirmEnter(this)"></i>
    </div>
  `;
  sampleIdCellToRename.html(sampleRenameElement);
};

window.removePennsievePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove.find(".permission-name-cell").text();

  if (permissionElementToRemove.prevObject[0].classList.contains("btn-danger")) {
    permissionElementToRemove.prevObject[0].style.display = "none";
    permissionElementToRemove.prevObject[0].nextElementSibling.style.display = "inline-block";
    // add removeFromPennsieve css
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].classList.add(
      "removeFromPennsieve"
    );
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].style.opacity =
      "0.5";
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[1].style.opacity =
      "0.5";

    if (permissionEntityType === "user") {
      const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
      for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i]["userString"] === permissionNameToRemove) {
          currentUsers[i]["deleteFromPennsieve"] = true;
        }
      }
    }
    if (permissionEntityType === "team") {
      const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
      for (let i = 0; i < currentTeams.length; i++) {
        if (currentTeams[i]["teamString"] === permissionNameToRemove) {
          currentTeams[i]["deleteFromPennsieve"] = true;
        }
      }
    }
  } else {
    //restore was triggered
    permissionElementToRemove.prevObject[0].style.display = "none";
    permissionElementToRemove.prevObject[0].previousElementSibling.style.display = "inline-block";
    // remove removeFromPennsieve css
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].classList.remove(
      "removeFromPennsieve"
    );
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[0].style.opacity =
      "1";
    permissionElementToRemove.prevObject[0].parentElement.parentElement.children[1].style.opacity =
      "1";
    if (permissionEntityType === "user") {
      const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
      for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i]["userString"] === permissionNameToRemove) {
          currentUsers[i]["deleteFromPennsieve"] = false;
        }
      }
    }
    if (permissionEntityType === "team") {
      const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
      for (let i = 0; i < currentTeams.length; i++) {
        if (currentTeams[i]["teamString"] === permissionNameToRemove) {
          currentTeams[i]["deleteFromPennsieve"] = false;
        }
      }
    }
  }
};

window.removePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove.find(".permission-name-cell").text();
  let permissionTypeToRemove = permissionElementToRemove.find(".permission-type-cell").text();

  if (permissionEntityType === "owner") {
    window.notyf.open({
      duration: "6000",
      type: "error",
      message: "You can not remove yourself as the owner of this dataset",
    });
    return;
  }
  if (permissionEntityType === "loggedInUser") {
    window.notyf.open({
      duration: "6000",
      type: "error",
      message:
        "You can not deselect yourself as a manager, as you need manager permissions to upload a dataset",
    });
    return;
  }
  if (permissionEntityType === "user") {
    const currentUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
    const filteredUsers = currentUsers.filter((user) => {
      return !(
        user.userString == permissionNameToRemove &&
        user.permission == permissionTypeToRemove &&
        !user.loggedInUser
      );
    });
    window.sodaJSONObj["digital-metadata"]["user-permissions"] = filteredUsers;
  }
  if (permissionEntityType === "team") {
    const currentTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
    const filteredTeams = currentTeams.filter((team) => {
      return !(
        team.teamString == permissionNameToRemove && team.permission == permissionTypeToRemove
      );
    });
    window.sodaJSONObj["digital-metadata"]["team-permissions"] = filteredTeams;
  }
  //rerender the permissions table to reflect changes to user/team permissions
  renderPermissionsTable();
};

const createPermissionsTableRowElement = (entityType, name, permission) => {
  return `
    <tr data-entity-type=${entityType}>
      <td class="middle aligned permission-name-cell">${name}</td>
      <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <button type="button" class="btn btn-danger btn-sm" onclick="window.removePermission($(this))">Delete</button>
      </td>
    </tr>
  `;
};

const createPennsievePermissionsTableRowElement = (entityType, name, permission, deleted) => {
  if (deleted) {
    return `
    <tr class="fromPennsieve" data-entity-type=${entityType}>
      <td style="opacity: 0.5" class="middle aligned permission-name-cell">${name}</td>
      <td style="opacity: 0.5" class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <button type="button" style="display: none" class="btn btn-danger btn-sm" onclick="window.removePennsievePermission($(this))">Delete</button>
        <button type="button" class="btn btn-sm" style="display: inline-block;color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);" onclick="window.removePennsievePermission($(this))">Restore</button>
      </td>
    </tr>
  `;
  } else {
    return `
      <tr class="fromPennsieve" data-entity-type=${entityType}>
        <td class="middle aligned permission-name-cell">${name}</td>
        <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
        <td class="middle aligned text-center remove-left-border" style="width: 20px">
          <button type="button" class="btn btn-danger btn-sm" onclick="window.removePennsievePermission($(this))">Delete</button>
          <button type="button" class="btn btn-sm" style="display: none;color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);" onclick="window.removePennsievePermission($(this))">Restore</button>
        </td>
      </tr>
    `;
  }
};
const renderPermissionsTable = () => {
  // when rendering permissions we will need to check if the permission was fetched from pennsieve
  // we will then create a different table element that will behave differently
  // visually showing user that the permission will be deleted upon upload
  // along with restore option and role modification
  let permissionsTableElements = [];
  const owner = window.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
  const users = window.sodaJSONObj["digital-metadata"]["user-permissions"];
  const teams = window.sodaJSONObj["digital-metadata"]["team-permissions"];
  permissionsTableElements.push(createPermissionsTableRowElement("owner", owner, "owner"));

  for (const user of users) {
    if (user?.["permissonSource"]) {
      // user was pull from pennsieve, create pennsieve element
      if (user?.["deleteFromPennsieve"] === true) {
        permissionsTableElements.push(
          createPennsievePermissionsTableRowElement(
            user.loggedInUser ? "loggedInUser" : "user",
            user.userString,
            user.permission,
            true
          )
        );
      } else {
        permissionsTableElements.push(
          createPennsievePermissionsTableRowElement(
            user.loggedInUser ? "loggedInUser" : "user",
            user.userString,
            user.permission,
            false
          )
        );
      }
    } else {
      permissionsTableElements.push(
        createPermissionsTableRowElement(
          user.loggedInUser ? "loggedInUser" : "user",
          user["userString"],
          user["permission"]
        )
      );
    }
  }
  for (const team of teams) {
    if (team?.["permissionSource"]) {
      //team was pulled from Pennsieve, create Pennsieve element
      permissionsTableElements.push(
        createPennsievePermissionsTableRowElement("team", team["teamString"], team["permission"])
      );
    } else {
      permissionsTableElements.push(
        createPermissionsTableRowElement("team", team["teamString"], team["permission"])
      );
    }
  }

  let permissionsTable = permissionsTableElements.join("\n");
  let permissionsTableBody = document.getElementById("permissions-table-body");
  permissionsTableBody.innerHTML = permissionsTable;
};

$("#guided-button-no-source-data").on("click", () => {
  //ask user to confirm they would like to delete source folder if it exists
  if (window.datasetStructureJSONObj["folders"]["source"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the source folder.",
      text: "Are you sure you would like to delete your source folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: window.reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete source folder
        delete window.datasetStructureJSONObj["folders"]["source"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no source files
        $("#guided-button-has-source-data").click();
      }
    });
  }
});

window.getTagsFromTagifyElement = (tagifyElement) => {
  return Array.from(tagifyElement.getTagElms()).map((tag) => {
    return tag.textContent;
  });
};

$("#guided-submission-completion-date").change(function () {
  const text = $("#guided-submission-completion-date").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#guided-submission-completion-date-manual").change(function () {
  const text = $("#guided-submission-completion-date-manual").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date-manual option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date-manual").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date-manual").children().last();
        $option.prop("selected", true);
      }
    });
  }
});
/////////////////////////////////////////////////////////
//////////       GUIDED OBJECT ACCESSORS       //////////
/////////////////////////////////////////////////////////

const getGuidedDatasetName = () => {
  return window.sodaJSONObj["digital-metadata"]["name"] || "";
};

const getGuidedDatasetSubtitle = () => {
  return window.sodaJSONObj["digital-metadata"]["subtitle"] || "";
};

const guidedShowBannerImagePreview = (imagePath, imported) => {
  const bannerImagePreviewelement = document.getElementById("guided-banner-image-preview");

  if (bannerImagePreviewelement.childElementCount > 0) {
    //remove old banner image
    bannerImagePreviewelement.removeChild(bannerImagePreviewelement.firstChild);
  }
  if (imported) {
    //if imported = true then add imagepath without cachebreaker
    let guidedbannerImageElem = document.createElement("img");

    // prepend file protocol prefix to imagePath
    // TODO: CHeck if this sjould be done in builds
    imagePath = "file://" + imagePath;

    guidedbannerImageElem.src = imagePath;
    guidedbannerImageElem.alt = "Preview of banner image";
    guidedbannerImageElem.style = "max-height: 300px";

    bannerImagePreviewelement.appendChild(guidedbannerImageElem);

    $("#guided-banner-image-preview-container").show();
    $("#guided-banner-image-preview-container").removeClass("hidden");
    $("#guided-button-add-banner-image").html("Edit banner image");
  } else {
    let date = new Date();
    let guidedbannerImageElem = document.createElement("img");

    //imagePath + cachebreakeer at the end to update image every time
    imagePath = "file://" + imagePath;
    guidedbannerImageElem.src = `${imagePath}?${date.getMilliseconds()}`;
    guidedbannerImageElem.alt = "Preview of banner image";
    guidedbannerImageElem.style = "max-height: 300px";

    bannerImagePreviewelement.appendChild(guidedbannerImageElem);

    $("#guided-banner-image-preview-container").show();
    $("#guided-banner-image-preview-container").removeClass("hidden");
    $("#guided-button-add-banner-image").html("Edit banner image");
  }
};
const setGuidedBannerImage = (croppedImagePath) => {
  window.sodaJSONObj["digital-metadata"]["banner-image-path"] = croppedImagePath;
  guidedShowBannerImagePreview(croppedImagePath);
};

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  window.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] = newPiOwnerObj.userString;
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  window.sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
  //If an existing user with the same ID already exists, update the existing user's position
  for (userPermission of window.sodaJSONObj["digital-metadata"]["user-permissions"]) {
    if (
      userPermission["userString"] == newUserPermissionObj.userString &&
      userPermission["UUID"] == newUserPermissionObj.UUID
    ) {
      userPermission["permission"] = newUserPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  window.sodaJSONObj["digital-metadata"]["user-permissions"].push(newUserPermissionObj);
  renderPermissionsTable();
};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
  //If an existing team with the same ID already exists, update the existing team's position
  for (teamPermission of window.sodaJSONObj["digital-metadata"]["team-permissions"]) {
    if (
      teamPermission["teamString"] == newTeamPermissionObj.teamString &&
      teamPermission["UUID"] == newTeamPermissionObj.UUID
    ) {
      teamPermission["permission"] = newTeamPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  window.sodaJSONObj["digital-metadata"]["team-permissions"].push(newTeamPermissionObj);
  renderPermissionsTable();
};

const renderSamplesHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-samples-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectsWithSamples = subjects.filter((subject) => {
    return subject.samples.length > 0;
  });

  let asideElementTemplateLiteral = ``;

  //create an array of objects that groups subjectsWithSamples by poolName property
  const subjectsWithSamplesInPools = subjectsWithSamples.reduce((acc, subject) => {
    if (subject.poolName) {
      if (acc[subject.poolName]) {
        acc[subject.poolName].push(subject);
      } else {
        acc[subject.poolName] = [subject];
      }
    }
    return acc;
  }, {});
  //loop through the pools and create an aside element for each sample in the pools subjects
  for (const [_, subjects] of Object.entries(subjectsWithSamplesInPools)) {
    asideElementTemplateLiteral += `
    ${subjects
      .map((subject) => {
        return `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
            <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
              <label class="guided--form-label centered" style="color: black;">
                ${subject.subjectName}
              </label>
              </div>
                ${subject.samples
                  .map((sample) => {
                    return `
                    <a 
                      class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                      data-path-suffix="${subject.poolName}/${subject.subjectName}/${sample}"
                      style="padding-left: 1rem; direction: ltr"
                    >${sample}</a>
                  `;
                  })
                  .join("\n")}
            </div>`;
      })
      .join("\n")}`;
  }

  //filter out subjects that are not in a pool
  const subjectsWithSamplesOutsidePools = subjectsWithSamples.filter((subject) => {
    return !subject.poolName;
  });
  //loop through the subjects and create an aside element for each
  for (const subject of subjectsWithSamplesOutsidePools) {
    asideElementTemplateLiteral += `
      <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
      <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
        <label class="guided--form-label centered" style="color: black;">
          ${subject.subjectName}
        </label>
      </div>
        ${subject.samples
          .map((sample) => {
            return `  
              <a
                class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                style="direction: ltr; padding-left: 1rem;"
                data-path-suffix="${subject.subjectName}/${sample}"
              >${sample}</a>
`;
          })
          .join("\n")}
    `;
  }

  //Add the samples to the DOM
  asideElement.innerHTML = asideElementTemplateLiteral;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );

  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-samples-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle(
          `guided-${highLevelFolderName}-samples-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      //render folder section in #items
      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-subjects-aside`);
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${subject.poolName ? subject.poolName + "/" : ""}${
              subject.subjectName
            }"
          >${subject.subjectName}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-subjects-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle(
          `guided-${highLevelFolderName}-subjects-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
  });
};

const renderPoolsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-pools-aside`);
  asideElement.innerHTML = "";
  const pools = Object.keys(window.sodaJSONObj.getPools());

  const poolItems = pools
    .map((pool) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${pool}"
          >${pool}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = poolItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      hideEleShowEle(
        `guided-${highLevelFolderName}-pools-file-explorer-intro`,
        "guided-file-explorer-elements"
      );

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const { pathSuffix } = e.target.dataset;

      guidedUpdateFolderStructureUI(`${highLevelFolderName}/${pathSuffix}`);
    });
  });
};

const renderSubjectsMetadataAsideItems = async () => {
  const asideElement = document.getElementById(`guided-subjects-metadata-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectMetadataCopyButton = document.getElementById("guided-button-subject-metadata-copy");
  const subjectMetadataCopyTip = document.getElementById("guided-copy-subjects-tip");

  if (subjects.length > 1) {
    subjectMetadataCopyButton.classList.remove("hidden");
    subjectMetadataCopyTip.classList.remove("hidden");
  } else {
    subjectMetadataCopyButton.classList.add("hidden");
    subjectMetadataCopyTip.classList.add("hidden");
  }

  const subjectsFormNames = [
    ...window.guidedSubjectsFormDiv.querySelectorAll(".subjects-form-entry"),
  ].map((entry) => {
    return entry.name;
  });

  if (window.subjectsTableData.length == 0) {
    window.subjectsTableData[0] = subjectsFormNames;
    for (const subject of subjects) {
      const subjectDataArray = [];
      subjectDataArray.push(subject.subjectName);
      subjectDataArray.push(subject.poolName ? subject.poolName : "");

      for (let i = 0; i < subjectsFormNames.length - 2; i++) {
        subjectDataArray.push("");
      }
      window.subjectsTableData.push(subjectDataArray);
    }
  } else {
    //Add subjects that have not yet been added to the table to the table
    for (const subject of subjects) {
      let subjectAlreadyInTable = false;
      for (let i = 0; i < window.subjectsTableData.length; i++) {
        if (window.subjectsTableData[i][0] == subject.subjectName) {
          subjectAlreadyInTable = true;
        }
      }
      if (!subjectAlreadyInTable) {
        const subjectDataArray = [];
        subjectDataArray.push(subject.subjectName);
        subjectDataArray.push(subject.poolName ? subject.poolName : "");
        for (let i = 0; i < window.subjectsTableData[0].length - 2; i++) {
          subjectDataArray.push("");
        }
        window.subjectsTableData.push(subjectDataArray);
      }
    }

    // If the subject is in the table but not in the subjects array, remove it
    const subjectNames = subjects.map((subject) => subject.subjectName);
    for (let i = 1; i < window.subjectsTableData.length; i++) {
      if (!subjectNames.includes(window.subjectsTableData[i][0])) {
        window.subjectsTableData.splice(i, 1);
      }
    }

    //If custom fields have been added to the window.subjectsTableData, create a field for each custom field
    //added
    // There are 27 standard fields for subjects so if there are more headers than that, there exists additional information
    if (window.subjectsTableData[0].length > 27) {
      for (let i = 27; i < window.subjectsTableData[0].length; i++) {
        if (
          !subjectsFormNames.includes(
            window.subjectsTableData[0][i].charAt(0).toUpperCase() +
              window.subjectsTableData[0][i].slice(1)
          ) ||
          !subjectsFormNames.includes(window.subjectsTableData[0][i])
        ) {
          window.addCustomHeader("subjects", window.subjectsTableData[0][i], "guided");
        }
      }
    }
  }

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <div 
            class="subjects-metadata-aside-item selection-aside-item"
          >
            ${subject.subjectName}
          </div>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each subject item
  const selectionAsideItems = document.querySelectorAll(`div.subjects-metadata-aside-item`);
  selectionAsideItems.forEach(async (item) => {
    item.addEventListener("click", async (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-subject-intro");
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle("guided-form-add-a-subject-intro", "guided-form-add-a-subject");
      }
      //Save the subject metadata from the previous subject being worked on
      let previousSubject = document.getElementById("guided-bootbox-subject-id").value;
      //check to see if previousSubject is empty
      if (previousSubject) {
        window.addSubject("guided");
        await guidedSaveProgress();
      }

      window.clearAllSubjectFormFields(window.guidedSubjectsFormDiv);

      window.populateForms(e.target.innerText, "", "guided");

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      document.getElementById("guided-bootbox-subject-id").value = e.target.innerText;

      await guidedSaveProgress();
    });
  });
};

const renderSamplesMetadataAsideItems = async () => {
  const asideElement = document.getElementById(`guided-samples-metadata-aside`);
  asideElement.innerHTML = "";

  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const sampleNames = samples.map((sample) => sample.sampleName);

  const sampleMetadataCopyButton = document.getElementById("guided-button-sample-metadata-copy");
  const sampleMetadataCopyTip = document.getElementById("guided-copy-samples-tip");

  if (samples.length > 1) {
    sampleMetadataCopyButton.classList.remove("hidden");
    sampleMetadataCopyTip.classList.remove("hidden");
  } else {
    sampleMetadataCopyButton.classList.add("hidden");
    sampleMetadataCopyTip.classList.add("hidden");
  }

  const samplesFormEntries = window.guidedSamplesFormDiv.querySelectorAll(".samples-form-entry");

  //Create an array of samplesFormEntries name attribute
  const samplesFormNames = [...samplesFormEntries].map((entry) => {
    return entry.name;
  });

  if (window.samplesTableData.length == 0) {
    //Get items with class "samples-form-entry" from samplesForDiv
    window.samplesTableData[0] = samplesFormNames;
    for (const sample of samples) {
      const sampleDataArray = [];
      sampleDataArray.push(sample.subjectName);
      sampleDataArray.push(sample.sampleName);
      //Push an empty string for was derived from
      sampleDataArray.push("");
      sampleDataArray.push(sample.poolName ? sample.poolName : "");
      for (let i = 0; i < samplesFormNames.length - 4; i++) {
        sampleDataArray.push("");
      }
      window.samplesTableData.push(sampleDataArray);
    }
  } else {
    //Add samples that have not yet been added to the table to the table
    for (const sample of samples) {
      let sampleAlreadyInTable = false;
      for (let i = 0; i < window.samplesTableData.length; i++) {
        if (window.samplesTableData[i][1] == sample.sampleName) {
          sampleAlreadyInTable = true;
        }
      }
      if (!sampleAlreadyInTable) {
        const sampleDataArray = [];
        sampleDataArray.push(sample.subjectName);
        sampleDataArray.push(sample.sampleName);
        //Push an empty string for was derived from
        sampleDataArray.push("");
        sampleDataArray.push(sample.poolName ? sample.poolName : "");
        for (let i = 0; i < window.samplesTableData[0].length - 4; i++) {
          sampleDataArray.push("");
        }
        window.samplesTableData.push(sampleDataArray);
      }
    }
  }

  // If the subject is in the table but not in the subjects array, remove it
  for (let i = 1; i < window.samplesTableData.length; i++) {
    if (!sampleNames.includes(window.samplesTableData[i][1])) {
      window.samplesTableData.splice(i, 1);
    }
  }

  //If custom fields have been added to the window.samplesTableData, create a field for each custom field
  //added
  // Samples metadata have 19 standard fields to fill, if the sample has more then additional fields are included
  if (window.samplesTableData[0].length > 19) {
    for (let i = 19; i < window.samplesTableData[0].length; i++) {
      if (
        !samplesFormNames.includes(window.samplesTableData[0][i]) ||
        !samplesFormNames.includes(
          window.samplesTableData[0][i].charAt(0).toUpperCase() +
            window.samplesTableData[0][i].slice(1)
        )
      ) {
        window.addCustomHeader("samples", window.samplesTableData[0][i], "guided");
      }
    }
  }

  //Create the HTML for the samples
  const sampleItems = samples
    .map((sample) => {
      return `
        <div
          class="samples-metadata-aside-item selection-aside-item"
          data-samples-subject-name="${sample.subjectName}"
        >
          ${sample.subjectName}/${sample.sampleName}
        </div>
      `;
    })
    .join("\n");

  //Add the samples to the DOM
  asideElement.innerHTML = sampleItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(`div.samples-metadata-aside-item`);
  selectionAsideItems.forEach(async (item) => {
    item.addEventListener("click", async (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-sample-intro");
      if (!introElement.classList.contains("hidden")) {
        hideEleShowEle("guided-form-add-a-sample-intro", "guided-form-add-a-sample");
      }

      let previousSample = document.getElementById("guided-bootbox-sample-id").value;

      //check to see if previousSample is empty
      if (previousSample) {
        window.addSample("guided");
        await guidedSaveProgress();
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      //clear all sample form fields
      window.clearAllSubjectFormFields(window.guidedSamplesFormDiv);

      openModifySampleMetadataPage(
        e.target.innerText.split("/")[1],
        e.target.innerText.split("/")[0]
      );

      await guidedSaveProgress();
    });
  });
};

const itemsContainer = document.getElementById("items");
const freeFormItemsContainer = document.getElementById("free-form-folder-structure-container");
const freeFormButtons = document.getElementById("organize-path-and-back-button-div");

// Guided mode event listener (from curate and share page)
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

  guidedCreateSodaJSONObj();
  attachGuidedMethodsToSodaJSONObj();
  guidedTransitionFromHome();

  guidedUnLockSideBar();

  guidedUnSkipPage("guided-select-starting-point-tab");
  await window.openPage("guided-select-starting-point-tab");
});

// Free form mode event listener (from curate and share page)
document.querySelector("#button-homepage-freeform-mode").addEventListener("click", async () => {
  //Free form mode will open through here
  window.guidedPrepareHomeScreen();

  // guidedResetSkippedPages();

  directToFreeFormMode();
  document.getElementById("guided_mode_view").classList.add("is-selected");
});

$("#guided-button-add-permission-user-or-team").on("click", function () {
  try {
    //get the selected permission element
    const newPermissionElement = $("#guided_bf_list_users_and_teams option:selected");
    const newPermissionRoleElement = $("#select-permission-list-users-and-teams");

    //throw error if no user/team or role is selected
    if (
      newPermissionElement.val().trim() === "Select individuals or teams to grant permissions to"
    ) {
      throw "Please select a user or team to designate a permission to";
    }
    if (newPermissionRoleElement.val().trim() === "Select role") {
      throw "Please select a role for the user or team";
    }

    if (
      newPermissionElement.val().trim() ===
      window.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"]
    ) {
      throw `${newPermissionElement.text().trim()} is designated as the PI owner.
        To designate them as a ${newPermissionRoleElement
          .val()
          .trim()}, go back and remove them as the PI owner.`;
    }

    if (newPermissionElement[0].getAttribute("permission-type") == "user") {
      //if the selected element is a user, add the user to the user permissions array
      let userString = newPermissionElement.text().trim();
      let userName = userString.split("(")[0].trim();
      let UUID = newPermissionElement.val().trim();
      let userPermission = newPermissionRoleElement.val().trim();
      const newUserPermissionObj = {
        userString: userString,
        userName: userName,
        UUID: UUID,
        permission: userPermission,
      };
      guidedAddUserPermission(newUserPermissionObj);
    }
    if (newPermissionElement[0].getAttribute("permission-type") == "team") {
      //if the selected element is a team, add the team to the team permissions array
      const newTeamPermissionObj = {
        teamString: newPermissionElement.text().trim(),
        UUID: newPermissionElement.val().trim(),
        permission: newPermissionRoleElement.val().trim(),
      };
      guidedAddTeamPermission(newTeamPermissionObj);
    }
    $(this)[0].scrollIntoView({
      behavior: "smooth",
    });
    guidedResetUserTeamPermissionsDropdowns();
  } catch (error) {
    window.notyf.open({
      duration: "4000",
      type: "error",
      message: error,
    });
  }
});

$("#guided-button-add-permission-user").on("click", function () {
  const newUserPermission = {
    userString: $("#guided_bf_list_users option:selected").text().trim(),
    UUID: $("#guided_bf_list_users").val().trim(),
    permission: $("#select-permission-list-users-and-teams").val(),
  };
  removeAlertMessageIfExists($("#guided-designated-user-permissions-info"));
  guidedAddUserPermission(newUserPermission);
});

$("#guided-button-add-permission-team").on("click", function () {
  const newTeamPermissionObj = {
    teamString: $("#guided_bf_list_teams").val().trim(),
    permission: $("#select-permission-list-4").val(),
  };
  removeAlertMessageIfExists($("#guided-designated-team-permissions-info"));
  guidedAddTeamPermission(newTeamPermissionObj);
});

const arraysHaveSameElements = (arr1, arr2) => {
  if (arr1.length != arr2.length) {
    return false;
  }
  for (const elementValue of arr1) {
    if (!arr2.includes(elementValue)) {
      return false;
    }
  }
  return true;
};

const showCorrectSpreadsheetInstructionSection = (datasetEntities) => {
  if (arraysHaveSameElements(datasetEntities, ["subjects"])) {
    // show the subjects only spreadsheet instructions
    document.getElementById("import-instructions-subjects").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "pools"])) {
    // show the subjects and pools spreadsheet instructions
    document.getElementById("import-instructions-subjects-pools").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "samples"])) {
    // show the subjects and samples spreadsheet instructions

    document.getElementById("import-instructions-subjects-samples").classList.remove("hidden");
  }
  if (arraysHaveSameElements(datasetEntities, ["subjects", "pools", "samples"])) {
    // show the subjects, pools, and samples spreadsheet instructions
    document
      .getElementById("import-instructions-subjects-pools-samples")
      .classList.remove("hidden");
  }
};

const handleMultipleSubSectionDisplay = async (controlledSectionID) => {
  const controlledElementContainer = document.getElementById(controlledSectionID);
  // Hide the children of the controlled element
  // (There should be logic below that shows the correct child)
  const controlledElementChildren = controlledElementContainer.querySelectorAll(".sub-section");
  controlledElementChildren.forEach((child) => {
    //console log the child id
    child.classList.add("hidden");
  });

  if (controlledSectionID === "guided-section-dataset-type") {
    const previouslySavedDatasetType = window.sodaJSONObj["saved-dataset-type"];

    const buttonDatasetContainsSubjects = document.getElementById(
      "guided-button-dataset-contains-subjects"
    );
    const buttonDatasetDoesNotContainSubjects = document.getElementById(
      "guided-button-dataset-does-not-contain-subjects"
    );
    const buttonDatasetContainsCode = document.getElementById(
      "guided-button-dataset-contains-code"
    );
    const buttonDatasetDoesNotContainCode = document.getElementById(
      "guided-button-dataset-does-not-contain-code"
    );

    // If neither button is selected, return
    if (
      (!buttonDatasetContainsSubjects.classList.contains("selected") &&
        !buttonDatasetDoesNotContainSubjects.classList.contains("selected")) ||
      (!buttonDatasetContainsCode.classList.contains("selected") &&
        !buttonDatasetDoesNotContainCode.classList.contains("selected"))
    ) {
      return;
    }

    let datasetHasSubjects = buttonDatasetContainsSubjects.classList.contains("selected");
    let datasetHasCode = buttonDatasetContainsCode.classList.contains("selected");

    window.sodaJSONObj["dataset-contains-subjects"] = datasetHasSubjects;
    window.sodaJSONObj["dataset-contains-code"] = datasetHasCode;

    let interpredDatasetType;

    if (datasetHasCode && datasetHasSubjects) {
      interpredDatasetType = "requires-manual-selection";
    } else if (datasetHasCode && !datasetHasSubjects) {
      interpredDatasetType = "computational";
    } else if (!datasetHasCode && datasetHasSubjects) {
      interpredDatasetType = "experimental";
    } else {
      interpredDatasetType = "selection-does-not-make-sense";
    }

    // set the dataset-type in the window.sodaJSONObj to be used by the page exit handler
    window.sodaJSONObj["dataset-type"] = interpredDatasetType;

    // If the determined dataset type is not computational or experimental, reset the buttons where the user selects it manually
    if (window.sodaJSONObj["dataset-type"] === "requires-manual-selection") {
      if (window.sodaJSONObj["button-config"]["dataset-type"]) {
        delete window.sodaJSONObj["button-config"]["dataset-type"];
      }
    }
    resetGuidedRadioButtons("guided-sub-section-manual-dataset-type-selection");

    if (interpredDatasetType === "selection-does-not-make-sense") {
      document.getElementById("guided-sub-section-configuration-error").classList.remove("hidden");
    }
    if (interpredDatasetType === "requires-manual-selection") {
      if (
        previouslySavedDatasetType === "computational" ||
        previouslySavedDatasetType === "experimental"
      ) {
        document.getElementById(`guided-button-dataset-type-${previouslySavedDatasetType}`).click();
      } else {
        // If the user is updating a dataset from Pennsieve, try to get the dataset type from the dataset description file
        // on Pennsieve and click the appropriate button
        if (window.sodaJSONObj?.["starting-point"]?.["type"] === "bf") {
          const pennsieveImportLoadingDiv = document.getElementById(
            "guided-sub-section-loading-dataset-type-import"
          );
          // Show the loading div while the dataset type is attempted to be pulled from Pennsieve
          pennsieveImportLoadingDiv.classList.remove("hidden");
          try {
            const descriptionMetadaRes = await client.get(
              `/prepare_metadata/import_metadata_file`,
              {
                params: {
                  selected_account: window.defaultBfAccount,
                  selected_dataset: window.sodaJSONObj["bf-dataset-selected"]["dataset-name"],
                  file_type: "dataset_description.xlsx",
                },
              }
            );
            const descriptionMetdataData = descriptionMetadaRes.data["Basic information"];
            if (descriptionMetdataData[0][0] === "Type") {
              const studyType = descriptionMetdataData[0][1];
              if (studyType === "computational" || studyType === "experimental") {
                document.getElementById(`guided-button-dataset-type-${studyType}`).click();
              }
            }
          } catch (error) {
            // Case where dataset type was not able to be found from Pennsieve so user must manually select
            console.log(error);
            clientError(error);
          }
          // Hide the loading div after the dataset type has been pulled from Pennsieve
          pennsieveImportLoadingDiv.classList.add("hidden");
        }
      }
      document
        .getElementById("guided-sub-section-manual-dataset-type-selection")
        .classList.remove("hidden");
    }
    if (interpredDatasetType === "computational") {
      document
        .getElementById("guided-sub-section-computational-confirmation")
        .classList.remove("hidden");
    }
    if (interpredDatasetType === "experimental") {
      document
        .getElementById("guided-sub-section-experimental-confirmation")
        .classList.remove("hidden");
    }
  }

  if (controlledSectionID === "guided-section-spreadsheet-import") {
    const datasetHasPools = document
      .getElementById("guided-button-spreadsheet-subjects-are-pooled")
      .classList.contains("selected");
    const datasetDoesNotHavePools = document
      .getElementById("guided-button-spreadsheet-subjects-are-not-pooled")
      .classList.contains("selected");
    if (!datasetHasPools && !datasetDoesNotHavePools) {
      return;
    }

    const datasetHasSamples = document
      .getElementById("guided-button-spreadsheet-subjects-have-samples")
      .classList.contains("selected");
    const datasetDoesNotHaveSamples = document
      .getElementById("guided-button-spreadsheet-subjects-do-not-have-samples")
      .classList.contains("selected");
    if (!datasetHasSamples && !datasetDoesNotHaveSamples) {
      return;
    }

    const datasetEntities = ["subjects"];
    if (datasetHasPools) {
      datasetEntities.push("pools");
    }
    if (datasetHasSamples) {
      datasetEntities.push("samples");
    }

    showCorrectSpreadsheetInstructionSection(datasetEntities);

    const textFormattedEntities = convertArrayToCommaSeparatedString(datasetEntities);

    // If a spreadsheet has already been generated, notify the user that they will need to
    // re-fill out the spreadsheet since the headers will be different.
    if (window.sodaJSONObj["dataset-structure-spreadsheet-path"]) {
      if (
        window.sodaJSONObj["dataset-structure-entities"] &&
        window.sodaJSONObj["dataset-structure-entities"] != textFormattedEntities
      ) {
        // Delete the spreadsheet path since it will need to be re-generated
        delete window.sodaJSONObj["dataset-structure-spreadsheet-path"];
        // Reset the UI to show that the dataset structure spreadsheet has not been generated
        setUiBasedOnSavedDatasetStructurePath(false);
      }
    }
    // Store the dataset entities in the sodaJSONObj to track if a new spreadsheet needs to be generated
    // when the user changes the dataset structure
    window.sodaJSONObj["dataset-structure-entities"] = textFormattedEntities;

    const spansToInsertTextInto = document.querySelectorAll(
      ".sub-pool-sample-structure-description-text"
    );
    spansToInsertTextInto.forEach((span) => {
      span.innerHTML = textFormattedEntities;
    });

    // If the user has already added subjects but has not chosen to enter them manually
    // (case for updating a dataset from Pennsieve or old progress files),
    // Select the option for them
    if (!sodaJSONObj["button-config"]["subject-addition-method"]) {
      if (window.getExistingSubjectNames().length > 0) {
        document.getElementById("guided-button-add-subject-structure-manually").click();
      }
    }
  }
};

$(".guided--radio-button").on("click", async function () {
  const selectedButton = $(this);
  const notSelectedButton = $(this).siblings(".guided--radio-button");

  if (selectedButton.data("warn-before-click") === true) {
    const buttonId = selectedButton.attr("id");
    if (buttonId === "guided-button-dataset-does-not-contain-code") {
      const dataInCodeFolder = window.datasetStructureJSONObj?.["folders"]?.["code"];
      if (dataInCodeFolder) {
        if (!folderIsEmpty(dataInCodeFolder)) {
          const folderIsFromPennsieve = folderImportedFromPennsieve(dataInCodeFolder);
          let warningText;
          if (folderIsFromPennsieve) {
            warningText = `You have code in your code folder that was imported from Pennsieve.
                <br><br>
                If you select "delete my code folder" below, your code folder will be deleted when you update your dataset
                on the last step of the guided process.`;
          } else {
            warningText = `
                You previously added code to your code folder.
                <br><br>
                If you select "delete my code folder" below, the code in your code folder will be permanently deleted.
              `;
          }

          const { value: confirmCodeFolderDeletion } = await Swal.fire({
            icon: "warning",
            title: "Are you sure?",
            html: warningText,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: `Delete my code folder`,
            showCancelButton: true,
            cancelButtonText: "Cancel",
            focusConfirm: true,
            allowOutsideClick: false,
          });
          if (confirmCodeFolderDeletion) {
            if (folderIsFromPennsieve) {
              guidedModifyPennsieveFolder(dataInCodeFolder, "delete");
            } else {
              delete window.datasetStructureJSONObj["folders"]["code"];
            }
          } else {
            // return and do nothing
            return;
          }
        }
      }
    }
  }

  notSelectedButton.removeClass("selected");
  notSelectedButton.addClass("not-selected basic");

  //Hide all child containers of non-selected buttons
  notSelectedButton.each(function () {
    if ($(this).data("next-element")) {
      window.nextQuestionID = $(this).data("next-element");
      $(`#${window.nextQuestionID}`).addClass("hidden");
    }
  });

  //If button has prevent-radio-handler data attribute, other buttons, will be deselected
  //but all other radio button functions will be halted
  if (selectedButton.data("prevent-radio-handler") === true) {
    return;
  }

  //Store the button's config value in window.sodaJSONObj
  if (selectedButton.data("button-config-value")) {
    let buttonConfigValue = selectedButton.data("button-config-value");
    let buttonConfigValueState = selectedButton.data("button-config-value-state");
    window.sodaJSONObj["button-config"][buttonConfigValue] = buttonConfigValueState;
  }

  selectedButton.removeClass("not-selected basic");
  selectedButton.addClass("selected");

  //Display and scroll to selected element container if data-next-element exists
  if (selectedButton.data("next-element")) {
    window.nextQuestionID = selectedButton.data("next-element");
    let nextQuestionElement = document.getElementById(window.nextQuestionID);
    nextQuestionElement.classList.remove("hidden");

    //Check to see if the button has the data attribute "controls-section"
    //If it does, hide all other sections
    if (selectedButton.data("controls-section")) {
      const controlledSectionID = selectedButton.data("controls-section");
      await handleMultipleSubSectionDisplay(controlledSectionID);
    }

    //slow scroll to the next question
    //temp fix to prevent scrolling error
    const elementsToNotScrollTo = [
      "guided-add-samples-table",
      "guided-add-pools-table",
      "guided-div-add-subjects-table",
      "guided-div-resume-progress-cards",
      "guided-div-update-uploaded-cards",
    ];
    if (!elementsToNotScrollTo.includes(nextQuestionID)) {
      nextQuestionElement.scrollIntoView({
        behavior: "smooth",
      });
    }
  }
});

$("#guided-button-samples-not-same").on("click", () => {
  $("#guided-button-generate-subjects-table").show();
});
$("#guided-button-samples-same").on("click", () => {
  $("#guided-button-generate-subjects-table").hide();
});

/////////////////////////////////////////////////////////
//////////       GUIDED jsTree FUNCTIONS       //////////
/////////////////////////////////////////////////////////

let guidedJstreePreview = document.getElementById("guided-div-dataset-tree-preview");

$(guidedJstreePreview).jstree({
  core: {
    check_callback: true,
    data: {},
  },
  plugins: ["types", "sort"],
  sort: function (a, b) {
    a1 = this.get_node(a);
    b1 = this.get_node(b);

    if (a1.icon == b1.icon || (a1.icon.includes("assets") && b1.icon.includes("assets"))) {
      //if the word assets is included in the icon then we can assume it is a file
      //folder icons are under font awesome meanwhile files come from the assets folder
      return a1.text > b1.text ? 1 : -1;
    } else {
      return a1.icon < b1.icon ? 1 : -1;
    }
  },
  types: {
    folder: {
      icon: "fas fa-folder fa-fw",
    },
    "folder open": {
      icon: "fas fa-folder-open fa-fw",
    },
    "folder closed": {
      icon: "fas fa-folder fa-fw",
    },
    "file xlsx": {
      icon: fileXlsx,
    },
    "file xls": {
      icon: fileXlsx,
    },
    "file png": {
      icon: filePng,
    },
    "file PNG": {
      icon: filePng,
    },
    "file pdf": {
      icon: filePdf,
    },
    "file txt": {
      icon: fileTxt,
    },
    "file csv": {
      icon: fileCsv,
    },
    "file CSV": {
      icon: fileCsv,
    },
    "file DOC": {
      icon: fileDoc,
    },
    "file DOCX": {
      icon: fileDoc,
    },
    "file docx": {
      icon: fileDoc,
    },
    "file doc": {
      icon: fileDoc,
    },
    "file jpeg": {
      icon: fileJpeg,
    },
    "file JPEG": {
      icon: fileJpeg,
    },
    "file other": {
      icon: fileOther,
    },
  },
});

$(guidedJstreePreview).on("open_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder open");
});
$(guidedJstreePreview).on("close_node.jstree", function (event, data) {
  data.instance.set_type(data.node, "folder closed");
});

/////////////////////////////////////////////////////////
/////////  PENNSIEVE METADATA BUTTON HANDLERS   /////////
/////////////////////////////////////////////////////////

$("#guided-dataset-subtitle-input").on("keyup", () => {
  const guidedDatasetSubtitleCharCount = document.getElementById("guided-subtitle-char-count");
  window.countCharacters(
    document.getElementById("guided-dataset-subtitle-input"),
    guidedDatasetSubtitleCharCount
  );
});

document
  .getElementById("guided-bootbox-sample-protocol-title")
  .addEventListener("change", function () {
    const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
    document.getElementById("guided-bootbox-sample-protocol-location").value =
      newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
  });
document
  .getElementById("guided-bootbox-sample-protocol-location")
  .addEventListener("change", function () {
    const newDescriptionAssociatedDescription = $(this)
      .find(":selected")
      .data("protocol-description");
    document.getElementById("guided-bootbox-sample-protocol-title").value =
      newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
  });

document
  .getElementById("guided-bootbox-subject-protocol-title")
  .addEventListener("change", function () {
    const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
    document.getElementById("guided-bootbox-subject-protocol-location").value =
      newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
  });
document
  .getElementById("guided-bootbox-subject-protocol-location")
  .addEventListener("change", function () {
    const newDescriptionAssociatedDescription = $(this)
      .find(":selected")
      .data("protocol-description");
    document.getElementById("guided-bootbox-subject-protocol-title").value =
      newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
  });

// function for importing a banner image if one already exists
$("#guided-button-add-banner-image").click(async () => {
  $("#guided-banner-image-modal").modal("show");
  $("#guided-banner-image-modal").parents()[0].style.zIndex = "1002";
  $("#guided-banner-image-modal").addClass("show");
  window.myCropper.destroy();
  window.myCropper = new Cropper(window.guidedBfViewImportedImage, window.guidedCropOptions);
});

// Action when user click on "Import image" button for banner image
$("#guided-button-import-banner-image").click(async () => {
  $("#guided-para-dataset-banner-image-status").html("");
  // add show class to modal
  let filePaths = await window.electron.ipcRenderer.invoke("open-file-dialog-import-banner-image");
  $("#guided-banner-image-modal").modal("show");
  window.handleSelectedBannerImage(filePaths, "guided-mode");
  $("#guided-banner-image-modal").addClass("show");
});

/////////////////////////////////////////////////////////
//////////    GUIDED IPC RENDERER LISTENERS    //////////
/////////////////////////////////////////////////////////

$("#guided-input-destination-getting-started-locally").on("click", () => {
  window.electron.ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
});

const guidedCreateOrRenameDataset = async (bfAccount, datasetName) => {
  document.getElementById("guided-dataset-name-upload-tr").classList.remove("hidden");
  const datasetNameUploadText = document.getElementById("guided-dataset-name-upload-text");

  datasetNameUploadText.innerHTML = "Creating dataset...";
  guidedUploadStatusIcon("guided-dataset-name-upload-status", "loading");

  //If the dataset has already been created in Guided Mode, we should have an ID for the
  //dataset. If a dataset with the ID still exists on Pennsieve, we will upload to that dataset.
  if (window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]) {
    const existingDatasetNameOnPennsieve = await checkIfDatasetExistsOnPennsieve(
      window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
    );
    if (existingDatasetNameOnPennsieve) {
      // If the name entered in the input matches the dataset name on Pennsieve, we will upload to that dataset
      if (existingDatasetNameOnPennsieve === datasetName) {
        datasetNameUploadText.innerHTML = "Dataset already exists on Pennsieve";
        guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
        return window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      } else {
        // If the name entered in the input does not match the dataset name on Pennsieve, we will change
        // the name of the dataset on Pennsieve to match the name entered in the input
        try {
          await client.put(
            `/manage_datasets/ps_rename_dataset`,
            {
              input_new_name: datasetName,
            },
            {
              params: {
                selected_account: bfAccount,
                selected_dataset: existingDatasetNameOnPennsieve,
              },
            }
          );
          datasetNameUploadText.innerHTML = `Changed dataset name from ${existingDatasetNameOnPennsieve} to ${datasetName}`;
          guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
          return window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
        } catch (error) {
          const emessage = userErrorMessage(error);
          datasetNameUploadText.innerHTML = emessage;
          guidedUploadStatusIcon("guided-dataset-name-upload-status", "error");
          throw new Error(emessage);
        }
      }
    } else {
      // if the previously uploaded dataset does not exist, wipe out the previously uploaded metadata
      // so new metadata can be uploaded to the newly created dataset
      // (This would happen if the user deleted the dataset on Pennsieve)
      window.sodaJSONObj["previously-uploaded-data"] = {};
      await guidedSaveProgress();
    }
  }

  try {
    let bf_new_dataset = await client.post(
      `/manage_datasets/datasets`,
      {
        input_dataset_name: datasetName,
      },
      {
        params: {
          selected_account: bfAccount,
        },
      }
    );
    let createdDatasetsID = bf_new_dataset.data.id;
    let createdDatasetIntId = bf_new_dataset.data.int_id;

    // set the global dataset id and dataset int id for reference in future events
    window.defaultBfDatasetId = createdDatasetsID;
    window.defaultBfDatasetIntId = createdDatasetIntId;

    datasetNameUploadText.innerHTML = `Successfully created dataset with name: ${datasetName}`;
    const kombuchaEventData = {
      value: 1,
      dataset_id: createdDatasetsID,
      dataset_name: datasetName,
      dataset_int_id: window.defaultBfDatasetIntId,
    };

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.CREATE_NEW_DATASET,
      datasetName,
      kombuchaEnums.Status.SUCCCESS,
      kombuchaEventData
    );

    window.electron.ipcRenderer.send(
      "track-event",
      "Dataset ID to Dataset Name Map",
      createdDatasetsID,
      datasetName
    );
    guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
    window.refreshDatasetList();
    window.addNewDatasetToList(datasetName);

    //Save the dataset ID generated by pennsieve so the dataset is not re-uploaded when the user
    //resumes progress after failing an upload
    window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = createdDatasetsID;
    await guidedSaveProgress();

    return createdDatasetsID;
  } catch (error) {
    console.error(error);
    let emessage = userErrorMessage(error);

    datasetNameUploadText.innerHTML = "Failed to create a new dataset.";

    if (emessage == "Dataset name already exists") {
      datasetNameUploadText.innerHTML = `A dataset with the name <b>${datasetName}</b> already exists on Pennsieve.<br />
          Please rename your dataset and try again.`;
      document.getElementById("guided-dataset-name-upload-status").innerHTML = `
          <button
            class="ui positive button guided--button"
            id="guided-button-rename-dataset"
            style="
              margin: 5px !important;
              background-color: var(--color-light-green) !important;
              width: 140px !important;
            "
          >
            Rename dataset
          </button>
        `;
      //add an on-click handler to the added button
      $("#guided-button-rename-dataset").on("click", () => {
        openGuidedDatasetRenameSwal();
      });
    }

    throw new Error(userErrorMessage(error));
  }
};

const guidedAddDatasetSubtitle = async (bfAccount, datasetName, datasetSubtitle) => {
  document.getElementById("guided-dataset-subtitle-upload-tr").classList.remove("hidden");
  const datasetSubtitleUploadText = document.getElementById("guided-dataset-subtitle-upload-text");
  datasetSubtitleUploadText.innerHTML = "Adding dataset subtitle...";
  guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "loading");

  const previousUploadSubtitle = window.sodaJSONObj["previously-uploaded-data"]["subtitle"];

  if (previousUploadSubtitle === datasetSubtitle) {
    datasetSubtitleUploadText.innerHTML = "Dataset subtitle already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "success");
    return;
  }

  try {
    await client.put(
      `/manage_datasets/bf_dataset_subtitle`,
      {
        input_subtitle: datasetSubtitle,
      },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
        },
      }
    );

    datasetSubtitleUploadText.innerHTML = `Successfully added dataset subtitle: ${datasetSubtitle}`;
    guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["subtitle"] = datasetSubtitle;
    await guidedSaveProgress();

    // Send successful dataset subtitle upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.SUBTITLE,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    // Send failed dataset subtitle upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.SUBTITLE,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
      guidedGetDatasetId(window.sodaJSONObj)
    );
    console.error(error);
    let emessage = userErrorMessage(error);
    datasetSubtitleUploadText.innerHTML = "Failed to add a dataset subtitle.";
    guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "error");
    throw new Error(emessage);
  }
};

const guidedAddDatasetDescription = async (
  bfAccount,
  datasetName,
  studyPurpose,
  dataCollection,
  dataConclusion
) => {
  document.getElementById("guided-dataset-description-upload-tr").classList.remove("hidden");
  const datasetDescriptionUploadText = document.getElementById(
    "guided-dataset-description-upload-text"
  );
  datasetDescriptionUploadText.innerHTML = "Adding dataset description...";
  guidedUploadStatusIcon("guided-dataset-description-upload-status", "loading");

  let descriptionArray = [];

  descriptionArray.push("**Study Purpose:** " + studyPurpose + "\n\n");
  descriptionArray.push("**Data Collection:** " + dataCollection + "\n\n");
  descriptionArray.push("**Primary Conclusion:** " + dataConclusion + "\n\n");

  const description = descriptionArray.join("");

  const previouslyUploadedDescription =
    window.sodaJSONObj["previously-uploaded-data"]["description"];

  if (previouslyUploadedDescription === description) {
    datasetDescriptionUploadText.innerHTML = "Dataset description already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
    return;
  }

  try {
    await client.put(
      `/manage_datasets/datasets/${datasetName}/readme`,
      { updated_readme: description },
      { params: { selected_account: bfAccount } }
    );

    datasetDescriptionUploadText.innerHTML = `Successfully added dataset description!`;
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["description"] = description;
    await guidedSaveProgress();

    // Send successful dataset description upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.README_TXT,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    // Send failed dataset description upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.README_TXT,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      guidedGetDatasetId(window.sodaJSONObj)
    );

    datasetDescriptionUploadText.innerHTML = "Failed to add a dataset description.";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "error");
    throw new Error(userErrorMessage(error));
  }
};

const uploadValidBannerImage = async (bfAccount, datasetName, bannerImagePath) => {
  document.getElementById("guided-dataset-banner-image-upload-tr").classList.remove("hidden");
  const datasetBannerImageUploadText = document.getElementById(
    "guided-dataset-banner-image-upload-text"
  );
  datasetBannerImageUploadText.innerHTML = "Adding dataset banner image...";
  guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "loading");

  const previouslyUploadedBannerImagePath =
    window.sodaJSONObj["previously-uploaded-data"]["banner-image-path"];

  if (previouslyUploadedBannerImagePath === bannerImagePath) {
    datasetBannerImageUploadText.innerHTML = "Dataset banner image already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
    return;
  }

  // Get the banner image size for Kombucha
  // If there is an error getting the banner image size, "Unable to retrieve size"
  // will be sent to Kombucha
  let bannerImageSize;
  try {
    bannerImageSize = fs.statSync(bannerImagePath).size;
  } catch (error) {
    bannerImageSize = "Unable to retrieve size";
  }

  try {
    await client.put(
      `/manage_datasets/bf_banner_image`,
      {
        input_banner_image_path: bannerImagePath,
      },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
        },
      }
    );
    datasetBannerImageUploadText.innerHTML = `Successfully added dataset banner image!`;
    guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["banner-image-path"] = bannerImagePath;
    await guidedSaveProgress();

    // Send successful banner image upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.BANNER_SIZE,
      kombuchaEnums.Status.SUCCESS,
      {
        value: bannerImageSize,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    console.error(error);
    datasetBannerImageUploadText.innerHTML = "Failed to add a dataset banner image.";
    guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "error");

    // Send failed banner image upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.BANNER_SIZE,
      kombuchaEnums.Status.FAIL,
      {
        value: bannerImageSize,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      guidedGetDatasetId(window.sodaJSONObj)
    );

    throw new Error(userErrorMessage(error));
  }
};

const skipBannerImageUpload = () => {
  document.getElementById("guided-dataset-banner-image-upload-tr").classList.remove("hidden");
  const datasetBannerImageUploadText = document.getElementById(
    "guided-dataset-banner-image-upload-text"
  );
  datasetBannerImageUploadText.innerHTML = "Skipped optional banner image...";
  guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
};

const guidedAddDatasetBannerImage = async (bfAccount, datasetName, bannerImagePath) => {
  if (!bannerImagePath) {
    skipBannerImageUpload();
    return;
  }

  await uploadValidBannerImage(bfAccount, datasetName, bannerImagePath);
};
const guidedAddDatasetLicense = async (bfAccount, datasetName, datasetLicense) => {
  document.getElementById("guided-dataset-license-upload-tr").classList.remove("hidden");
  const datasetLicenseUploadText = document.getElementById("guided-dataset-license-upload-text");
  datasetLicenseUploadText.innerHTML = "Adding dataset license...";
  guidedUploadStatusIcon("guided-dataset-license-upload-status", "loading");

  const previouslyUploadedLicense = window.sodaJSONObj["previously-uploaded-data"]["license"];

  if (previouslyUploadedLicense === datasetLicense) {
    datasetLicenseUploadText.innerHTML = "Dataset license already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
    return;
  }

  try {
    await client.put(
      `/manage_datasets/bf_license`,
      {
        input_license: datasetLicense,
      },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
        },
      }
    );
    datasetLicenseUploadText.innerHTML = `Successfully added dataset license: ${datasetLicense}`;
    guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["license"] = datasetLicense;
    await guidedSaveProgress();

    // Send successful license upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.LICENSE,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    console.error(error);
    datasetLicenseUploadText.innerHTML = "Failed to add a dataset license.";
    guidedUploadStatusIcon("guided-dataset-license-upload-status", "error");

    // Send failed license upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.LICENSE,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
      guidedGetDatasetId(window.sodaJSONObj)
    );
    throw new Error(userErrorMessage(error));
  }
};

const guidedAddDatasetTags = async (bfAccount, datasetName, tags) => {
  document.getElementById("guided-dataset-tags-upload-tr").classList.remove("hidden");
  const datasetTagsUploadText = document.getElementById("guided-dataset-tags-upload-text");
  datasetTagsUploadText.innerHTML = "Adding dataset tags...";
  guidedUploadStatusIcon("guided-dataset-tags-upload-status", "loading");

  const previouslyUploadedTags = window.sodaJSONObj["previously-uploaded-data"]["tags"];

  if (JSON.stringify(previouslyUploadedTags) === JSON.stringify(tags)) {
    datasetTagsUploadText.innerHTML = "Dataset tags already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
    return;
  }

  try {
    await client.put(
      `/manage_datasets/datasets/${datasetName}/tags`,
      { tags },
      {
        params: {
          selected_account: bfAccount,
        },
      }
    );

    datasetTagsUploadText.innerHTML = `Successfully added dataset tags: ${tags.join(", ")}`;
    guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["tags"] = tags;
    await guidedSaveProgress();

    // Send successful tags upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.TAGS,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    datasetTagsUploadText.innerHTML = "Failed to add dataset tags.";
    guidedUploadStatusIcon("guided-dataset-tags-upload-status", "error");

    // Send failed tags upload event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.TAGS,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      guidedGetDatasetId(window.sodaJSONObj)
    );

    throw new Error(userErrorMessage(error));
  }
};

const guidedGrantUserPermission = async (
  bfAccount,
  datasetName,
  userName,
  userUUID,
  selectedRole
) => {
  let userPermissionUploadElement = "";
  if (selectedRole === "remove current permissions") {
    window.log.info("Removing a permission for a user on a dataset");
    userPermissionUploadElement = `
      <tr id="guided-dataset-${userUUID}-permissions-upload-tr" class="permissions-upload-tr">
        <td class="middle aligned" id="guided-dataset-${userUUID}-permissions-upload-text">
          Removing permissions for: ${userName}
        </td>
        <td class="middle aligned text-center collapsing border-left-0 p-0">
          <div
            class="guided--container-upload-status"
            id="guided-dataset-${userUUID}-permissions-upload-status"
          ></div>
        </td>
      </tr>
    `;
  } else {
    window.log.info("Adding a permission for a user on a dataset");
    userPermissionUploadElement = `
      <tr id="guided-dataset-${userUUID}-permissions-upload-tr" class="permissions-upload-tr">
        <td class="middle aligned" id="guided-dataset-${userUUID}-permissions-upload-text">
          Granting ${userName} ${selectedRole} permissions...
        </td>
        <td class="middle aligned text-center collapsing border-left-0 p-0">
          <div
            class="guided--container-upload-status"
            id="guided-dataset-${userUUID}-permissions-upload-status"
          ></div>
        </td>
      </tr>`;
  }

  //apend the upload element to the end of the table body
  document
    .getElementById("guided-tbody-pennsieve-metadata-upload")
    .insertAdjacentHTML("beforeend", userPermissionUploadElement);

  const userPermissionUploadStatusText = document.getElementById(
    `guided-dataset-${userUUID}-permissions-upload-text`
  );

  guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "loading");

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
          scope: "user",
          name: userUUID,
        },
      }
    );

    if (selectedRole === "remove current permissions") {
      guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "success");
      userPermissionUploadStatusText.innerHTML = `${selectedRole} permissions removed for user: ${userName}`;
      window.log.info(`${selectedRole} permissions granted to ${userName}`);
    } else {
      guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "success");
      userPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to user: ${userName}`;
      window.log.info(`${selectedRole} permissions granted to ${userName}`);
    }

    // Send successful user permissions modification event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.USER_PERMISSIONS,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "error");
    if (selectedRole === "remove current permissions") {
      userPermissionUploadStatusText.innerHTML = `Failed to remove permissions for ${userName}`;
    } else {
      userPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${userName}`;
    }
    let emessage = userErrorMessage(error);
    window.log.error(emessage);

    // Send failed user permissions modification event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.USER_PERMISSIONS,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
      guidedGetDatasetId(window.sodaJSONObj)
    );
    throw emessage;
  }
};

const guidedAddUserPermissions = async (bfAccount, datasetName, userPermissionsArray) => {
  //filter user permissions with loggedInUser key
  const promises = userPermissionsArray.map((userPermission) => {
    if (userPermission?.["deleteFromPennsieve"] === true) {
      return guidedGrantUserPermission(
        bfAccount,
        datasetName,
        userPermission.userName,
        userPermission.UUID,
        "remove current permissions"
      );
    } else {
      return guidedGrantUserPermission(
        bfAccount,
        datasetName,
        userPermission.userName,
        userPermission.UUID,
        userPermission.permission
      );
    }
  });
  await Promise.allSettled(promises);
};

const guidedGrantTeamPermission = async (
  bfAccount,
  datasetName,
  teamUUID,
  teamString,
  selectedRole
) => {
  let teamPermissionUploadElement = "";
  if (selectedRole === "remove current permissions") {
    teamPermissionUploadElement = `
        <tr id="guided-dataset-${teamString}-permissions-upload-tr" class="permissions-upload-tr">
          <td class="middle aligned" id="guided-dataset-${teamString}-permissions-upload-text">
            Remove permissions from: ${teamString}.
          </td>
          <td class="middle aligned text-center collapsing border-left-0 p-0">
            <div
              class="guided--container-upload-status"
              id="guided-dataset-${teamString}-permissions-upload-status"
            ></div>
          </td>
        </tr>
      `;
  } else {
    teamPermissionUploadElement = `
      <tr id="guided-dataset-${teamString}-permissions-upload-tr" class="permissions-upload-tr">
        <td class="middle aligned" id="guided-dataset-${teamString}-permissions-upload-text">
          Granting ${teamString} ${selectedRole} permissions.
        </td>
        <td class="middle aligned text-center collapsing border-left-0 p-0">
          <div
            class="guided--container-upload-status"
            id="guided-dataset-${teamString}-permissions-upload-status"
          ></div>
        </td>
      </tr>
    `;
  }

  //apend the upload element to the end of the table body
  document
    .getElementById("guided-tbody-pennsieve-metadata-upload")
    .insertAdjacentHTML("beforeend", teamPermissionUploadElement);

  const teamPermissionUploadStatusText = document.getElementById(
    `guided-dataset-${teamString}-permissions-upload-text`
  );
  guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "loading");

  try {
    await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
          scope: "team",
          name: teamUUID,
        },
      }
    );
    guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "success");
    if (selectedRole === "remove current permissions") {
      teamPermissionUploadStatusText.innerHTML = `Permissions removed from team: ${teamString}`;
      window.log.info(`Permissions remove from: ${teamString}`);
    } else {
      teamPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to team: ${teamString}`;
      window.log.info(`${selectedRole} permissions granted to ${teamString}`);
    }

    // Send successful team permissions modification event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.TEAM_PERMISSIONS,
      kombuchaEnums.Status.SUCCESS,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
  } catch (error) {
    if (selectedRole === "remove current permissions") {
      teamPermissionUploadStatusText.innerHTML = `Failed to remove permissions for ${teamString}`;
    } else {
      teamPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${teamString}`;
    }
    guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "error");
    let emessage = userErrorMessage(error);
    window.log.error(emessage);

    // Send failed team permissions modification event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
      kombuchaEnums.Label.TEAM_PERMISSIONS,
      kombuchaEnums.Status.FAIL,
      {
        value: 1,
        dataset_name: guidedGetDatasetName(window.sodaJSONObj),
        dataset_id: guidedGetDatasetId(window.sodaJSONObj),
        dataset_int_id: window.defaultBfDatasetIntId,
      }
    );
    window.electron.ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
      guidedGetDatasetId(window.sodaJSONObj)
    );
    throw emessage;
  }
};

const guidedAddTeamPermissions = async (bfAccount, datasetName, teamPermissionsArray) => {
  const promises = teamPermissionsArray.map((teamPermission) => {
    if (teamPermission?.["deleteFromPennsieve"] === true) {
      return guidedGrantTeamPermission(
        bfAccount,
        datasetName,
        teamPermission.UUID,
        teamPermission.teamString,
        "remove current permissions"
      );
    } else {
      return guidedGrantTeamPermission(
        bfAccount,
        datasetName,
        teamPermission.UUID,
        teamPermission.teamString,
        teamPermission.permission
      );
    }
  });
  await Promise.allSettled(promises);
};

//********************************************************************************************************
// Add click event listener to the button triggering local dataset generation
document.querySelectorAll(".button-starts-local-dataset-copy-generation").forEach((button) => {
  button.addEventListener("click", () => {
    // Send an IPC message to select the local dataset generation path
    window.electron.ipcRenderer.send("guided-select-local-dataset-generation-path");
  });
});

const convertBytesToGb = (bytes) => {
  return roundToHundredth(bytes / 1024 ** 3);
};

// Counts the number of files in the dataset structure
// Note: This function should only be used for local datasets (Not datasets pulled from Pennsieve)
const countFilesInDatasetStructure = (datasetStructure) => {
  let totalFiles = 0;
  const keys = Object.keys(datasetStructure);
  for (const key of keys) {
    if (key === "files") {
      totalFiles += Object.keys(datasetStructure[key]).length;
    }
    if (key === "folders") {
      const folders = Object.keys(datasetStructure[key]);
      for (const folder of folders) {
        totalFiles += countFilesInDatasetStructure(datasetStructure[key][folder]);
      }
    }
  }
  return totalFiles;
};

// Listen for the selected path for local dataset generation
window.electron.ipcRenderer.on(
  "selected-guided-local-dataset-generation-path",
  async (event, filePath) => {
    guidedSetNavLoadingState(true); // Lock the nav while local dataset generation is in progress
    guidedResetLocalGenerationUI();
    try {
      // Get the dataset name based on the sodaJSONObj
      const guidedDatasetName = guidedGetDatasetName(window.sodaJSONObj);

      const filePathToGenerateAt = window.path.join(filePath, guidedDatasetName);
      if (window.fs.existsSync(filePathToGenerateAt)) {
        throw new Error(
          `
            A folder named ${guidedDatasetName} already exists at the selected location.
            Please remove the folder at the selected location or choose a new location.
          `
        );
      }
      // Reset and show the progress bar
      setGuidedProgressBarValue("local", 0);
      updateDatasetUploadProgressTable("local", {
        "Current action": `Checking available free space on disk`,
      });
      unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");

      // Get available free memory on disk
      const freeMemoryInBytes = await window.electron.ipcRenderer.invoke("getDiskSpace", filePath);

      // Get the size of the dataset to be generated
      const localDatasetSizeReq = await client.post(
        "/curate_datasets/dataset_size",
        { soda_json_structure: window.sodaJSONObj },
        { timeout: 0 }
      );
      const localDatasetSizeInBytes = localDatasetSizeReq.data.dataset_size;

      // Check if there is enough free space on disk for the dataset
      if (freeMemoryInBytes < localDatasetSizeInBytes) {
        const diskSpaceInGb = convertBytesToGb(freeMemoryInBytes);
        const datasetSizeInGb = convertBytesToGb(localDatasetSizeInBytes);
        throw new Error(
          `Not enough free space on disk. Free space: ${diskSpaceInGb}GB. Dataset size: ${datasetSizeInGb}GB`
        );
      }

      // Attach manifest files to the dataset structure before local generation
      await guidedCreateManifestFilesAndAddToDatasetStructure();

      // Create a temporary copy of sodaJSONObj for local dataset generation
      const sodaJSONObjCopy = JSON.parse(JSON.stringify(window.sodaJSONObj));
      sodaJSONObjCopy["generate-dataset"] = {
        "dataset-name": guidedDatasetName,
        destination: "local",
        "generate-option": "new",
        "if-existing": "new",
        path: filePath,
      };
      // Remove unnecessary key from sodaJSONObjCopy since we don't need to
      // check if the account details are valid during local generation
      delete sodaJSONObjCopy["bf-account-selected"];
      delete sodaJSONObjCopy["bf-dataset-selected"];

      updateDatasetUploadProgressTable("local", {
        "Current action": `Preparing dataset for local generation`,
      });

      // Start the local dataset generation process
      client.post(
        `/curate_datasets/curation`,
        { soda_json_structure: sodaJSONObjCopy, resume: false },
        { timeout: 0 }
      );

      let userHasBeenScrolledToProgressTable = false;

      // Track the status of local dataset generation
      const trackLocalDatasetGenerationProgress = async () => {
        // Get the number of files that need to be generated to calculate the progress
        const numberOfFilesToGenerate = countFilesInDatasetStructure(
          window.datasetStructureJSONObj
        );
        while (true) {
          try {
            const response = await client.get(`/curate_datasets/curation/progress`);
            const { data } = response;
            const main_curate_progress_message = data["main_curate_progress_message"];
            const main_curate_status = data["main_curate_status"];
            if (
              main_curate_progress_message === "Success: COMPLETED!" ||
              main_curate_status === "Done"
            ) {
              break; // Exit the loop when generation is done
            }
            const elapsed_time_formatted = data["elapsed_time_formatted"];
            const totalUploadedFiles = data["total_files_uploaded"];

            // Get the current progress of local dataset generation
            // Note: The progress is calculated based on the number of files that have been generated
            // and the total number of files that need to be generated
            const localGenerationProgressPercentage = Math.min(
              100,
              Math.max(0, (totalUploadedFiles / numberOfFilesToGenerate) * 100)
            );
            setGuidedProgressBarValue("local", localGenerationProgressPercentage);
            updateDatasetUploadProgressTable("local", {
              "Files generated": `${totalUploadedFiles} of ${numberOfFilesToGenerate}`,
              "Percent generated": `${localGenerationProgressPercentage.toFixed(2)}%`,
              "Elapsed time": `${elapsed_time_formatted}`,
            });

            // Scroll the user down to the progress table if they haven't been scrolled down yet
            // (This only happens once)
            if (!userHasBeenScrolledToProgressTable) {
              unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");
              userHasBeenScrolledToProgressTable = true;
            }

            // Wait 1 second before checking the progress again
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          } catch (error) {
            console.error("Error tracking progress:", error);
            throw new Error(userErrorMessage(error)); // Re-throw with user-friendly message
          }
        }
      };

      // set a timeout for .5 seconds to allow the server to start generating the dataset
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await trackLocalDatasetGenerationProgress();

      setGuidedProgressBarValue("local", 100);
      updateDatasetUploadProgressTable("local", {
        "Current action": `Generating metadata files`,
      });

      // Generate all dataset metadata files
      await guidedGenerateSubjectsMetadata(
        window.path.join(filePath, guidedDatasetName, "subjects.xlsx")
      );
      await guidedGenerateSamplesMetadata(
        window.path.join(filePath, guidedDatasetName, "samples.xlsx")
      );
      await guidedGenerateSubmissionMetadata(
        window.path.join(filePath, guidedDatasetName, "submission.xlsx")
      );
      await guidedGenerateDatasetDescriptionMetadata(
        window.path.join(filePath, guidedDatasetName, "dataset_description.xlsx")
      );
      await guidedGenerateReadmeMetadata(
        window.path.join(filePath, guidedDatasetName, "README.txt")
      );
      await guidedGenerateChangesMetadata(
        window.path.join(filePath, guidedDatasetName, "CHANGES.txt")
      );
      await guidedGenerateCodeDescriptionMetadata(
        window.path.join(filePath, guidedDatasetName, "code_description.xlsx")
      );

      // Save the location of the generated dataset to the sodaJSONObj
      window.sodaJSONObj["path-to-local-dataset-copy"] = window.path.join(
        filePath,
        guidedDatasetName
      );

      // Update UI for successful local dataset generation
      updateDatasetUploadProgressTable("local", {
        Status: `Dataset successfully generated locally`,
      });
      unHideAndSmoothScrollToElement("guided-section-post-local-generation-success");
    } catch (error) {
      // Handle and log errors
      const errorMessage = userErrorMessage(error);
      console.error(errorMessage);
      guidedResetLocalGenerationUI();
      await swalShowError("Error generating dataset locally", errorMessage);
      // Show and scroll down to the local dataset generation retry button
      unHideAndSmoothScrollToElement("guided-section-retry-local-generation");
    }
    guidedSetNavLoadingState(false); // Unlock the nav after local dataset generation is done
  }
);

const guidedGenerateSubjectsMetadata = async (destination) => {
  // Early return if subjects metadata table is empty or the tab is skipped
  if (subjectsTableData.length === 0 || pageIsSkipped("guided-create-subjects-metadata-tab")) {
    return;
  }

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const subjectsMetadataGenerationText = document.getElementById(
    `guided-subjects-metadata-pennsieve-genration-text`
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById(`guided-subjects-metadata-pennsieve-genration-tr`)
      .classList.remove("hidden");
    subjectsMetadataGenerationText.innerHTML = "Uploading subjects metadata...";
    guidedUploadStatusIcon(`guided-subjects-metadata-pennsieve-genration-status`, "loading");
  }

  try {
    // Generate the subjects metadata file
    await client.post(
      `/prepare_metadata/subjects_file`,
      {
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        selected_account: window.defaultBfAccount,
        selected_dataset:
          generationDestination === "Pennsieve" ? guidedGetDatasetName(window.sodaJSONObj) : "",
        subjects_header_row: window.subjectsTableData,
      },
      {
        params: {
          upload_boolean: generationDestination === "Pennsieve",
        },
      }
    );

    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(`guided-subjects-metadata-pennsieve-genration-status`, "success");
      subjectsMetadataGenerationText.innerHTML = `Subjects metadata successfully generated`;
    }
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBJECTS_XLSX,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    userErrorMessage(error);
    userErrorMessage(error);
    userErrorMessage(error);
    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(`guided-subjects-metadata-pennsieve-genration-status`, "error");
      subjectsMetadataGenerationText.innerHTML = `Failed to generate subjects metadata`;
    }
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBJECTS_XLSX,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage); // Re-throw for further handling
  }
};
const guidedGenerateSamplesMetadata = async (destination) => {
  // Early return if samples metadata table is empty or the tab is skipped
  if (window.samplesTableData.length === 0 || pageIsSkipped("guided-create-samples-metadata-tab")) {
    return;
  }

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const samplesMetadataUploadText = document.getElementById(
    "guided-samples-metadata-pennsieve-genration-text"
  );

  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-samples-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");

    samplesMetadataUploadText.innerHTML = "Uploading samples metadata...";
    guidedUploadStatusIcon("guided-samples-metadata-pennsieve-genration-status", "loading");
  }

  try {
    await client.post(
      `/prepare_metadata/samples_file`,
      {
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        selected_account: window.defaultBfAccount,
        selected_dataset:
          generationDestination === "Pennsieve" ? guidedGetDatasetName(window.sodaJSONObj) : "",
        samples_str: window.samplesTableData,
      },
      {
        params: {
          upload_boolean: generationDestination === "Pennsieve",
        },
      }
    );
    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-samples-metadata-pennsieve-genration-status", "success");
      samplesMetadataUploadText.innerHTML = `Samples metadata successfully uploaded`;
    }

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SAMPLES_XLSX,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-samples-metadata-pennsieve-genration-status", "error");
      samplesMetadataUploadText.innerHTML = `Failed to upload samples metadata`;
    }
    // Send failed samples metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SAMPLES_XLSX,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage); // Re-throw for further handling
  }
};

const guidedGenerateSubmissionMetadata = async (destination) => {
  // Build the submission metadata array
  const guidedMilestones =
    window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
  const submissionMetadataArray = [];
  submissionMetadataArray.push({
    fundingConsortium: sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"],
    consortiumDataStandard:
      window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"],
    award: window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"],
    date: window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] || "N/A",
    milestone: guidedMilestones[0] || "N/A",
  });
  if (window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"].length > 1) {
    for (let i = 1; i < guidedMilestones.length; i++) {
      submissionMetadataArray.push({
        fundingConsortium: "",
        consortiumDataStandard: "",
        award: "",
        date: "",
        milestone: guidedMilestones[i],
      });
    }
  }

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const submissionMetadataUploadText = document.getElementById(
    "guided-submission-metadata-pennsieve-genration-text"
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-submission-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");
    submissionMetadataUploadText.innerHTML = "Uploading submission metadata...";
    guidedUploadStatusIcon("guided-submission-metadata-pennsieve-genration-status", "loading");
  }

  try {
    await client.post(
      `/prepare_metadata/submission_file`,
      {
        submission_file_rows: submissionMetadataArray,
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        upload_boolean: generationDestination === "Pennsieve",
      },
      {
        params: {
          selected_account: window.defaultBfAccount,
          selected_dataset: guidedGetDatasetName(window.sodaJSONObj),
        },
      }
    );
    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-submission-metadata-pennsieve-genration-status", "success");
      submissionMetadataUploadText.innerHTML = `Submission metadata successfully uploaded`;
    }

    // Send successful submission metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBMISSION_XLSX,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-submission-metadata-pennsieve-genration-status", "error");
      submissionMetadataUploadText.innerHTML = `Failed to upload submission metadata`;
    }

    // Send failed submission metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.SUBMISSION_XLSX,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage); // Re-throw for further handling
  }
};

const guidedGetDatasetLinks = () => {
  return [
    ...sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"],
    ...sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"],
  ];
};

const guidedGetContributorInformation = () => {
  let guidedContributorInformation = {
    ...sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"],
  };
  const guidedSparcAward = window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
  if (datasetIsSparcFunded()) {
    // Move the SPARC award to the front of the funding array
    guidedContributorInformation["funding"] = guidedContributorInformation["funding"].filter(
      (funding) => funding !== guidedSparcAward
    );
    guidedContributorInformation["funding"].unshift(guidedSparcAward);
  }

  const guidedContributorsArray = window.sodaJSONObj["dataset-metadata"]["description-metadata"][
    "contributors"
  ].map((contributor) => {
    return {
      conAffliation: contributor["conAffliation"].join(", "),
      conID: contributor["conID"],
      conName: contributor["conName"],
      conRole: contributor["conRole"].join(", "),
      contributorFirstName: contributor["contributorFirstName"],
      contributorLastName: contributor["contributorLastName"],
    };
  });
  guidedContributorInformation["contributors"] = guidedContributorsArray;

  return guidedContributorInformation;
};

const guidedGenerateDatasetDescriptionMetadata = async (destination) => {
  const guidedDatasetInformation =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"];
  const guidedStudyInformation =
    window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"];

  const guidedContributorInformation = guidedGetContributorInformation();
  const datasetLinks = guidedGetDatasetLinks();
  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const datasetDescriptionMetadataUploadText = document.getElementById(
    "guided-dataset-description-metadata-pennsieve-genration-text"
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-dataset-description-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");

    datasetDescriptionMetadataUploadText.innerHTML = "Uploading dataset description metadata...";
    guidedUploadStatusIcon(
      "guided-dataset-description-metadata-pennsieve-genration-status",
      "loading"
    );
  }

  try {
    await client.post(
      `/prepare_metadata/dataset_description_file`,
      {
        selected_account: window.defaultBfAccount,
        selected_dataset: guidedGetDatasetName(window.sodaJSONObj),
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        dataset_str: guidedDatasetInformation,
        study_str: guidedStudyInformation,
        contributor_str: guidedContributorInformation,
        related_info_str: datasetLinks,
      },
      {
        params: {
          upload_boolean: generationDestination === "Pennsieve",
        },
      }
    );

    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(
        "guided-dataset-description-metadata-pennsieve-genration-status",
        "success"
      );
      datasetDescriptionMetadataUploadText.innerHTML =
        "Dataset description metadata successfully uploaded";
    }

    // Send successful dataset_description metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.DATASET_DESCRIPTION_XLSX,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);

    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(
        "guided-dataset-description-metadata-pennsieve-genration-status",
        "error"
      );
      datasetDescriptionMetadataUploadText.innerHTML = `Failed to upload dataset description metadata`;
    }

    // Send failed dataset_description metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.DATASET_DESCRIPTION_XLSX,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );

    throw new Error(emessage); // Re-throw for further handling
  }
};

const guidedGenerateCodeDescriptionMetadata = async (destination) => {
  if (pageIsSkipped("guided-add-code-metadata-tab")) {
    return;
  }
  const codeDescriptionFilePath =
    window.sodaJSONObj["dataset-metadata"]?.["code-metadata"]?.["code_description"];
  if (!codeDescriptionFilePath) {
    return;
  }

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const codeDescriptionMetadataUploadText = document.getElementById(
    "guided-code-description-metadata-pennsieve-genration-text"
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-code-description-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");

    codeDescriptionMetadataUploadText.innerHTML = "Uploading code description metadata...";
    guidedUploadStatusIcon(
      "guided-code-description-metadata-pennsieve-genration-status",
      "loading"
    );
  }
  try {
    if (generationDestination === "Pennsieve") {
      await client.post("/prepare_metadata/code_description_file", {
        filepath: codeDescriptionFilePath,
        selected_account: window.defaultBfAccount,
        selected_dataset: guidedGetDatasetName(window.sodaJSONObj),
      });
    } else {
      await fs.copyFile(codeDescriptionFilePath, destination);
    }

    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(
        "guided-code-description-metadata-pennsieve-genration-status",
        "success"
      );
      codeDescriptionMetadataUploadText.innerHTML = "Code description metadata added to Pennsieve";
    }

    // Send successful code_description metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.CODE_DESCRIPTION_XLSX,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon(
        "guided-code-description-metadata-pennsieve-genration-status",
        "error"
      );
      codeDescriptionMetadataUploadText.innerHTML = `Failed to upload code description metadata`;
    }
    // Send failed code_description metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.CODE_DESCRIPTION_XLSX,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage);
  }
};
const guidedGenerateReadmeMetadata = async (destination) => {
  const guidedReadMeMetadata = window.sodaJSONObj["dataset-metadata"]["README"];

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const readmeMetadataUploadText = document.getElementById(
    "guided-readme-metadata-pennsieve-genration-text"
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-readme-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");
    readmeMetadataUploadText.innerHTML = "Uploading README metadata...";
    guidedUploadStatusIcon("guided-readme-metadata-pennsieve-genration-status", "loading");
  }

  try {
    if (generationDestination === "Pennsieve") {
      await client.post(
        `/prepare_metadata/readme_changes_file`,
        {
          text: guidedReadMeMetadata,
        },
        {
          params: {
            file_type: "README.txt",
            selected_account: window.defaultBfAccount,
            selected_dataset: guidedGetDatasetName(window.sodaJSONObj),
          },
        }
      );
    } else {
      await window.fs.writeFileAsync(destination, guidedReadMeMetadata);
    }

    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-readme-metadata-pennsieve-genration-status", "success");
      readmeMetadataUploadText.innerHTML = "README metadata successfully uploaded";
    }

    // Send successful README metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.README_TXT,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    console.error("Error generating README metadata: ", emessage);
    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-readme-metadata-pennsieve-genration-status", "error");
      readmeMetadataUploadText.innerHTML = "Failed to upload README metadata";
    }

    // Send failed README metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.README_TXT,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage); // Re-throw for further handling
  }
};
const guidedGenerateChangesMetadata = async (destination) => {
  // Early return if changes metadata table is empty or the tab is skipped
  if (pageIsSkipped("guided-create-changes-metadata-tab")) {
    return;
  }
  const guidedChangesMetadata = window.sodaJSONObj["dataset-metadata"]["CHANGES"];

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";

  // Prepare UI elements for Pennsieve upload (if applicable)
  const changesMetadataUploadText = document.getElementById(
    "guided-changes-metadata-pennsieve-genration-text"
  );
  if (generationDestination === "Pennsieve") {
    document
      .getElementById("guided-changes-metadata-pennsieve-genration-tr")
      .classList.remove("hidden");
    changesMetadataUploadText.innerHTML = "Uploading CHANGES metadata...";
    guidedUploadStatusIcon("guided-changes-metadata-pennsieve-genration-status", "loading");
  }

  try {
    if (generationDestination === "Pennsieve") {
      await client.post(
        `/prepare_metadata/readme_changes_file`,
        {
          text: guidedChangesMetadata,
        },
        {
          params: {
            file_type: "CHANGES.txt",
            selected_account: window.defaultBfAccount,
            selected_dataset: guidedGetDatasetName(window.sodaJSONObj),
          },
        }
      );
    } else {
      await window.fs.writeFileAsync(destination, guidedChangesMetadata);
    }

    // Update UI for successful generation (Pennsieve) and send success event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-changes-metadata-pennsieve-genration-status", "success");
      changesMetadataUploadText.innerHTML = "CHANGES metadata successfully uploaded";
    }

    // Send successful CHANGES metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.CHANGES_TXT,
      kombuchaEnums.Status.SUCCESS,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
  } catch (error) {
    const emessage = userErrorMessage(error);
    // Update UI for generation failure (Pennsieve) and send failure event
    if (generationDestination === "Pennsieve") {
      guidedUploadStatusIcon("guided-changes-metadata-pennsieve-genration-status", "error");
      changesMetadataUploadText.innerHTML = "Failed to upload CHANGES metadata";
    }

    // Send failed CHANGES metadata generation event to Kombucha
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.CHANGES_TXT,
      kombuchaEnums.Status.FAIL,
      guidedCreateEventDataPrepareMetadata(generationDestination, 1)
    );
    throw new Error(emessage); // Re-throw for further handling
  }
};

const hideDatasetMetadataGenerationTableRows = (destination) => {
  let tableIdToHide = "";
  if (destination === "pennsieve") {
    tableIdToHide = "guided-tbody-pennsieve-dataset-metadata-generation";
  }
  if (destination === "local") {
    tableIdToHide = "guided-tbody-local-dataset-metadata-generation";
  }
  const tableToHide = document.getElementById(tableIdToHide);
  const tableRowsToHide = tableToHide.children;
  for (const row of tableRowsToHide) {
    row.classList.add("hidden");
  }
};

const guidedPennsieveDatasetUpload = async () => {
  guidedSetNavLoadingState(true);
  try {
    const guidedBfAccount = window.defaultBfAccount;
    const guidedDatasetName = window.sodaJSONObj["digital-metadata"]["name"];
    const guidedDatasetSubtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
    const guidedUsers = window.sodaJSONObj["digital-metadata"]["user-permissions"];
    //const guidedPIOwner = window.sodaJSONObj["digital-metadata"]["pi-owner"];
    const guidedTeams = window.sodaJSONObj["digital-metadata"]["team-permissions"];

    const guidedPennsieveStudyPurpose =
      window.sodaJSONObj["digital-metadata"]["description"]["study-purpose"];
    const guidedPennsieveDataCollection =
      window.sodaJSONObj["digital-metadata"]["description"]["data-collection"];
    const guidedPennsievePrimaryConclusion =
      window.sodaJSONObj["digital-metadata"]["description"]["primary-conclusion"];
    const guidedTags = window.sodaJSONObj["digital-metadata"]["dataset-tags"];
    const guidedLicense = window.sodaJSONObj["digital-metadata"]["license"];
    const guidedBannerImagePath = window.sodaJSONObj["digital-metadata"]?.["banner-image-path"];

    //Hide the upload tables
    document.querySelectorAll(".guided-upload-table").forEach((table) => {
      table.classList.add("hidden");
    });

    //Remove any permissions rows from the UI that may have been added from a previous upload
    const pennsieveMetadataUploadTable = document.getElementById(
      "guided-tbody-pennsieve-metadata-upload"
    );
    const pennsieveMetadataUploadTableRows = pennsieveMetadataUploadTable.children;
    for (const row of pennsieveMetadataUploadTableRows) {
      if (row.classList.contains("permissions-upload-tr")) {
        //delete the row to reset permissions UI
        row.remove();
      } else {
        row.classList.add("hidden");
      }
    }

    //Display the Pennsieve metadata upload table
    window.unHideAndSmoothScrollToElement(
      "guided-div-pennsieve-metadata-pennsieve-genration-status-table"
    );

    // Create the dataset on Pennsieve
    await guidedCreateOrRenameDataset(guidedBfAccount, guidedDatasetName);

    await guidedAddDatasetSubtitle(guidedBfAccount, guidedDatasetName, guidedDatasetSubtitle);
    await guidedAddDatasetDescription(
      guidedBfAccount,
      guidedDatasetName,
      guidedPennsieveStudyPurpose,
      guidedPennsieveDataCollection,
      guidedPennsievePrimaryConclusion
    );
    await guidedAddDatasetBannerImage(guidedBfAccount, guidedDatasetName, guidedBannerImagePath);
    await guidedAddDatasetLicense(guidedBfAccount, guidedDatasetName, guidedLicense);
    await guidedAddDatasetTags(guidedBfAccount, guidedDatasetName, guidedTags);
    await guidedAddUserPermissions(guidedBfAccount, guidedDatasetName, guidedUsers);
    await guidedAddTeamPermissions(guidedBfAccount, guidedDatasetName, guidedTeams);

    hideDatasetMetadataGenerationTableRows("pennsieve");

    window.unHideAndSmoothScrollToElement(
      "guided-div-dataset-metadata-pennsieve-genration-status-table"
    );

    await guidedGenerateSubjectsMetadata("Pennsieve");
    await guidedGenerateSamplesMetadata("Pennsieve");
    await guidedGenerateSubmissionMetadata("Pennsieve");
    await guidedGenerateDatasetDescriptionMetadata("Pennsieve");
    await guidedGenerateReadmeMetadata("Pennsieve");
    await guidedGenerateChangesMetadata("Pennsieve");

    await guidedGenerateCodeDescriptionMetadata("Pennsieve");

    //Reset Upload Progress Bar and then scroll to it
    setGuidedProgressBarValue("pennsieve", 0);

    updateDatasetUploadProgressTable("pennsieve", {
      "Upload status": `Preparing dataset for upload`,
    });
    window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

    await guidedCreateManifestFilesAndAddToDatasetStructure();

    //Upload the dataset files
    await guidedUploadDatasetToPennsieve();
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    //make an unclosable sweet alert that forces the user to close out of the app
    let res = await Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      title: "An error occurred during your upload",
      html: `
        <p>Error message: ${emessage}</p>
        <p>
        You may retry the upload now or save and exit.
        If you choose to save and exit you will be able to resume your upload by returning to Guided Mode and clicking the "Resume Upload"
        button on your dataset's progress card.
        </p>
      `,
      showCancelButton: true,
      cancelButtonText: "Save and Exit",
      confirmButtonText: "Retry Upload",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (res.isConfirmed) {
      window.retryGuidedMode = true; //set the retry flag to true
      let supplementary_checks = await window.run_pre_flight_checks(
        "guided-mode-pre-generate-pennsieve-agent-check"
      );
      if (!supplementary_checks) {
        console.error("Failed supplementary checks");
        return;
      }

      // check if the user made it to the last step
      if (
        !document
          .querySelector("#guided-div-dataset-upload-status-table")
          .classList.contains("hidden")
      ) {
        // scroll to the upload status table
        window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
        // upload on the last step
        await guidedUploadDatasetToPennsieve();
      } else {
        // restart the whole process
        await guidedPennsieveDatasetUpload();
        return;
      }
    }

    const currentPageID = window.CURRENT_PAGE.id;
    try {
      await savePageChanges(currentPageID);
    } catch (error) {
      window.log.error("Error saving page changes", error);
    }
    guidedTransitionToHome();
  }
  guidedSetNavLoadingState(false);
};

document
  .querySelector("#guided--verify-file-status-retry-upload")
  .addEventListener("click", async () => {
    window.retryGuidedMode = true; //set the retry flag to true
    let supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // hide the verify files sections
    document.querySelector("#guided--verify-files").classList.add("hidden");
    document.querySelector("#guided--question-validate-dataset-upload-2").classList.add("hidden");
    document.querySelector("#guided--validate-dataset-upload").classList.add("hidden");

    // check if the user made it to the last step
    if (
      !document
        .querySelector("#guided-div-dataset-upload-status-table")
        .classList.contains("hidden")
    ) {
      // scroll to the upload status table
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
      // upload on the last step
      await guidedUploadDatasetToPennsieve();
    } else {
      // restart the whole process
      await guidedPennsieveDatasetUpload();
    }
  });

const openGuidedDatasetRenameSwal = async () => {
  const currentDatasetUploadName = window.sodaJSONObj["digital-metadata"]["name"];

  const { value: newDatasetName } = await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    title: "Rename your dataset",
    html: `<b>Current dataset name:</b> ${currentDatasetUploadName}<br /><br />Enter a new name for your dataset below:`,
    input: "text",
    inputPlaceholder: "Enter a new name for your dataset",
    inputAttributes: {
      autocapitalize: "off",
    },
    inputValue: currentDatasetUploadName,
    showCancelButton: true,
    confirmButtonText: "Rename",
    confirmButtonColor: "#3085d6 !important",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    preConfirm: (inputValue) => {
      if (inputValue === "") {
        Swal.showValidationMessage("Please enter a name for your dataset!");
        return false;
      }
      if (inputValue === currentDatasetUploadName) {
        Swal.showValidationMessage("Please enter a new name for your dataset!");
        return false;
      }
    },
  });
  if (newDatasetName) {
    window.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;

    guidedPennsieveDatasetUpload();
  }
};

const guidedUploadDatasetToPennsieve = async () => {
  window.updateJSONStructureDSstructure();

  // Initiate curation by calling Python function
  let main_curate_status = "Solving";
  let main_total_generate_dataset_size;

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let dataset_name;
  let dataset_destination;

  if (window.sodaJSONObj["generate-dataset"]["destination"] == "bf") {
    //Replace files and folders since guided mode always uploads to an existing Pennsieve dataset
    window.sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
    window.sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
    dataset_name = window.sodaJSONObj["digital-metadata"]["name"];
    window.sodaJSONObj["bf-dataset-selected"] = {};
    window.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = dataset_name;
    window.sodaJSONObj["bf-account-selected"]["account-name"] = window.defaultBfAccount;
    dataset_destination = "Pennsieve";
  }

  // if uploading to Pennsieve start a tracking session for the dataset upload
  if (dataset_destination == "Pennsieve") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }
  guidedSetNavLoadingState(true);
  client
    .post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: window.sodaJSONObj,
        resume: !!window.retryGuidedMode,
      },
      { timeout: 0 }
    )
    .then(async (curationRes) => {
      // if the upload succeeds reset the retry guided mode flag
      window.retryGuidedMode = false;
      guidedSetNavLoadingState(false);

      let { data } = curationRes;
      window.pennsieveManifestId = data["origin_manifest_id"];
      window.totalFilesCount = data["main_curation_total_files"];

      $("#sidebarCollapse").prop("disabled", false);
      window.log.info("Completed curate function");

      // log that a dataset upload was successful
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.SUCCCESS,
        {
          value: 1,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          destination: "Pennsieve",
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      // log the difference again to Google Analytics
      let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;
      if (finalFilesCount > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: finalFilesCount,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            destination: "Pennsieve",
            upload_session: datasetUploadSession.id,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Guided Mode - Generate - Dataset - Number of Files",
        `${datasetUploadSession.id}`,
        finalFilesCount
      );

      let differenceInBytes = main_total_generate_dataset_size - bytesOnPreviousLogPage;

      if (differenceInBytes > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.SIZE,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: differenceInBytes,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            destination: "Pennsieve",
            upload_session: datasetUploadSession.id,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Guided Mode - Generate - Dataset - Size",
        `${datasetUploadSession.id}`,
        differenceInBytes
      );

      updateDatasetUploadProgressTable("pennsieve", {
        "Upload status": "Dataset successfully uploaded to Pennsieve!",
      });

      // Clear the saved upload progress data because the dataset has been successfully
      // uploaded to Pennsieve, and any future uploads will upload using new data
      window.sodaJSONObj["previously-uploaded-data"] = {};

      window.sodaJSONObj["previous-guided-upload-dataset-name"] =
        window.sodaJSONObj["digital-metadata"]["name"];

      // Save the window.sodaJSONObj after a successful upload
      await guidedSaveProgress();

      //Display the click next text
      document.getElementById("guided--verify-files").classList.remove("hidden");

      // enable the verify files button
      document.querySelector("#guided--verify-files-button").disabled = false;
      document.querySelector("#guided--skip-verify-btn").disabled = false;

      scrollToBottomOfGuidedBody();

      //Show the next button
      $("#guided-next-button").css("visibility", "visible");

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: window.defaultBfAccount,
          },
        });
        window.datasetList = [];
        window.datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
      }
    })
    .catch(async (error) => {
      guidedSetNavLoadingState(false);
      clientError(error);

      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.TOTAL_UPLOADS,
        kombuchaEnums.Status.FAIL,
        {
          value: 1,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          destination: "Pennsieve",
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      // log the difference again to Google Analytics
      let finalFilesCount = uploadedFiles - filesOnPreviousLogPage;

      if (finalFilesCount > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: finalFilesCount,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            destination: "Pennsieve",
            upload_session: datasetUploadSession.id,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Guided Mode - Generate - Dataset - Number of Files",
        `${datasetUploadSession.id}`,
        finalFilesCount
      );

      let differenceInBytes = main_total_generate_dataset_size - bytesOnPreviousLogPage;

      if (differenceInBytes > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.SIZE,
          kombuchaEnums.Status.SUCCCESS,
          {
            value: differenceInBytes,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            destination: "Pennsieve",
            upload_session: datasetUploadSession.id,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        "Guided Mode - Generate - Dataset - Size",
        `${datasetUploadSession.id}`,
        differenceInBytes
      );

      // log the amount of files we attempted to upload -- good for knowing if a certain file amount poses the agent/our own code problems
      if (uploadedFiles > 0) {
        window.electron.ipcRenderer.send(
          "track-kombucha",
          kombuchaEnums.Category.GUIDED_MODE,
          kombuchaEnums.Action.GENERATE_DATASET,
          kombuchaEnums.Label.FILES,
          kombuchaEnums.Status.FAIL,
          {
            value: uploadedFiles,
            dataset_id: guidedGetDatasetId(window.sodaJSONObj),
            dataset_name: guidedGetDatasetName(window.sodaJSONObj),
            origin: guidedGetDatasetOrigin(window.sodaJSONObj),
            destination: "Pennsieve",
            upload_session: datasetUploadSession.id,
            dataset_int_id: window.defaultBfDatasetIntId,
          }
        );
      }

      // log the size of the dataset we attempted to upload
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.SIZE,
        kombuchaEnums.Status.FAIL,
        {
          value: main_total_generate_dataset_size,
          dataset_id: guidedGetDatasetId(window.sodaJSONObj),
          dataset_name: guidedGetDatasetName(window.sodaJSONObj),
          origin: guidedGetDatasetOrigin(window.sodaJSONObj),
          destination: "Pennsieve",
          upload_session: datasetUploadSession.id,
          dataset_int_id: window.defaultBfDatasetIntId,
        }
      );

      let emessage = userErrorMessage(error);
      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: window.defaultBfAccount,
          },
        });
        window.datasetList = [];
        window.datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
      }

      //make an unclosable sweet alert that forces the user to close out of the app
      let res = await Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        title: "An error occurred during your upload",
        html: `
          <p>Error message: ${emessage}</p>
          <p>
          You may retry the upload now or save and exit.
          If you choose to save and exit you will be able to resume your upload by returning to Guided Mode and clicking the "Resume Upload"
          button on your dataset's progress card.
          </p>
        `,
        showCancelButton: true,
        cancelButtonText: "Save and Exit",
        confirmButtonText: "Retry Upload",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      if (res.isConfirmed) {
        window.retryGuidedMode = true; //set the retry flag to true
        let supplementary_checks = await window.run_pre_flight_checks(
          "guided-mode-pre-generate-pennsieve-agent-check"
        );
        if (!supplementary_checks) {
          return;
        }

        // check if the user made it to the last step
        if (
          !document
            .querySelector("#guided-div-dataset-upload-status-table")
            .classList.contains("hidden")
        ) {
          // scroll to the upload status table
          window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
          // upload on the last step
          await guidedUploadDatasetToPennsieve();
          return;
        } else {
          // restart the whole process
          await guidedPennsieveDatasetUpload();
          return;
        }
      }

      const currentPageID = window.CURRENT_PAGE.id;
      try {
        await savePageChanges(currentPageID);
      } catch (error) {
        window.log.error("Error saving page changes", error);
      }
      guidedTransitionToHome();
    });

  const guidedUpdateUploadStatus = async () => {
    let mainCurationProgressResponse;
    try {
      mainCurationProgressResponse = await client.get(`/curate_datasets/curation/progress`);
    } catch (error) {
      const emessage = userErrorMessage(error);
      console.error("Error getting curation progress", emessage);
      clearInterval(timerProgress);
      throw emessage;
    }

    let { data } = mainCurationProgressResponse;

    main_curate_status = data["main_curate_status"];
    const start_generate = data["start_generate"];
    const main_curate_progress_message = data["main_curate_progress_message"];
    main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
    const main_generated_dataset_size = data["main_generated_dataset_size"];
    const elapsed_time_formatted = data["elapsed_time_formatted"];
    const totalUploadedFiles = data["total_files_uploaded"];
    uploadedFiles = totalUploadedFiles;

    if (start_generate === 1) {
      $("#guided-progress-bar-new-curate").css("display", "block");
      //Case when the dataset upload is complete
      if (main_curate_progress_message.includes("Success: COMPLETED!")) {
        setGuidedProgressBarValue("pennsieve", 100);
      } else {
        const percentOfDatasetUploaded =
          (main_generated_dataset_size / main_total_generate_dataset_size) * 100;
        setGuidedProgressBarValue("pennsieve", percentOfDatasetUploaded);

        if (main_curate_progress_message.includes("Renaming files...")) {
          updateDatasetUploadProgressTable("pennsieve", {
            "Upload status": `${main_curate_progress_message}`,
            "Percent uploaded": `${percentOfDatasetUploaded.toFixed(2)}%`,
            "Elapsed time": `${elapsed_time_formatted}`,
            "Files Renamed": `${main_generated_dataset_size} of ${main_total_generate_dataset_size}`,
          });
        } else {
          updateDatasetUploadProgressTable("pennsieve", {
            "Upload status": `${main_curate_progress_message}`,
            "Percent uploaded": `${percentOfDatasetUploaded.toFixed(2)}%`,
            "Elapsed time": `${elapsed_time_formatted}`,
            "Files Uploaded": `${totalUploadedFiles}`,
          });
        }
      }
    } else {
      updateDatasetUploadProgressTable("pennsieve", {
        "Upload status": `${main_curate_progress_message}`,
        "Elapsed time": `${elapsed_time_formatted}`,
      });
    }

    //If the curate function is complete, clear the interval
    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      window.log.info("Done curate track");
      // then show the sidebar again
      // forceActionSidebar("show");
      clearInterval(timerProgress);
      // electron.powerSaveBlocker.stop(prevent_sleep_id)
    }
  };

  // Progress tracking function for main curate
  let timerProgress = setInterval(() => guidedUpdateUploadStatus(), 1000);

  let bytesOnPreviousLogPage = 0;
  let filesOnPreviousLogPage = 0;
};

$("#guided-add-subject-button").on("click", () => {
  $("#guided-subjects-intro").hide();
  $("#guided-add-subject-div").show();
});

$("#guided-button-edit-protocol-fields").on("click", () => {
  enableElementById("protocols-container");
  enableElementById("guided-button-add-protocol");
  //switch button from edit to save
  document.getElementById("guided-button-edit-protocol-fields").style.display = "none";
  document.getElementById("guided-button-save-protocol-fields").style.display = "flex";
  unPulseNextButton();
});
$("#guided-button-save-other-link-fields").on("click", () => {
  let allInputsValid = true;
  //get all contributor fields
  const otherLinkFields = document.querySelectorAll(".guided-other-links-field-container");
  //check if contributorFields is empty
  if (otherLinkFields.length === 0) {
    window.notyf.error("Please add at least one other link");
    return;
  }

  //loop through contributor fields and get values
  const otherLinkFieldsArray = Array.from(otherLinkFields);
  ///////////////////////////////////////////////////////////////////////////////
  otherLinkFieldsArray.forEach((otherLinkField) => {
    const linkUrl = otherLinkField.querySelector(".guided-other-link-url-input");
    const linkDescription = otherLinkField.querySelector(".guided-other-link-description-input");
    const linkRelation = otherLinkField.querySelector(".guided-other-link-relation-dropdown");

    const textInputs = [linkUrl, linkDescription];

    //check if all text inputs are valid
    textInputs.forEach((textInput) => {
      if (textInput.value === "") {
        textInput.style.setProperty("border-color", "red", "important");
        allInputsValid = false;
      } else {
        textInput.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
      }
    });
    if (linkRelation.value === "Select") {
      linkRelation.style.setProperty("border-color", "red", "important");
      allInputsValid = false;
    } else {
      linkRelation.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
    }
  });
  ///////////////////////////////////////////////////////////////////////////////
  if (!allInputsValid) {
    window.notyf.error("Please fill out all link fields");
    return;
  }

  //set opacity and remove pointer events for table and show edit button
  disableElementById("other-links-container");
  disableElementById("guided-button-add-other-link");

  //switch button from save to edit
  document.getElementById("guided-button-save-other-link-fields").style.display = "none";
  document.getElementById("guided-button-edit-other-link-fields").style.display = "flex";
  pulseNextButton();
});
$("#guided-button-add-additional-link").on("click", async () => {
  openAddAdditionLinkSwal();
});
$("#guided-button-edit-other-link-fields").on("click", () => {
  enableElementById("other-links-container");
  enableElementById("guided-button-add-other-link");
  //switch button from edit to save
  document.getElementById("guided-button-edit-other-link-fields").style.display = "none";
  document.getElementById("guided-button-save-other-link-fields").style.display = "flex";
  unPulseNextButton();
});

const guidedGenerateRCFilesHelper = (type) => {
  let textValue = $(`#guided-textarea-create-${type}`).val().trim();
  if (textValue === "") {
    Swal.fire({
      title: "Incomplete information",
      text: "Plase fill in the textarea.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
      showCancelButton: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
    return "empty";
  }
};
const guidedSaveRCFile = async (type) => {
  var result = guidedGenerateRCFilesHelper(type);
  if (result === "empty") {
    return;
  }
  var { value: continueProgress } = await Swal.fire({
    title: `Any existing ${type.toUpperCase()}.txt file in the specified location will be replaced.`,
    text: "Are you sure you want to continue?",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Yes",
  });
  if (!continueProgress) {
    return;
  }
  let data = $(`#guided-textarea-create-${type}`).val().trim();
  let destinationPath;
  if (type === "changes") {
    destinationPath = window.path.join($("#guided-dataset-path").text().trim(), "CHANGES.xlsx");
  } else {
    destinationPath = window.path.join($("#guided-dataset-path").text().trim(), "README.xlsx");
  }
  window.fs.writeFile(destinationPath, data, (err) => {
    if (err) {
      console.log(err);
      window.log.error(err);
      var emessage = userErrorMessage(err);
      Swal.fire({
        title: `Failed to generate the existing ${type}.txt file`,
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
        didOpen: () => {
          Swal.hideLoading();
        },
      });
    } else {
      var newName =
        type === "changes"
          ? window.path.join(window.path.dirname(destinationPath), "CHANGES.txt")
          : window.path.join(window.path.dirname(destinationPath), "README.txt");
      window.fs.rename(destinationPath, newName, async (err) => {
        if (err) {
          console.log(err);
          window.log.error(err);
          Swal.fire({
            title: `Failed to generate the ${type}.txt file`,
            html: err,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            icon: "error",
            didOpen: () => {
              Swal.hideLoading();
            },
          });
        } else {
          Swal.fire({
            title: `The ${type.toUpperCase()}.txt file has been successfully generated at the specified location.`,
            icon: "success",
            showConfirmButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            didOpen: () => {
              Swal.hideLoading();
            },
          });
        }
      });
    }
  });
};
$("#guided-generate-subjects-file").on("click", () => {
  window.addSubject("guided");
  window.clearAllSubjectFormFields(window.guidedSubjectsFormDiv);
});

$("#guided-generate-submission-file").on("click", () => {
  guidedSaveSubmissionFile();
});
$("#guided-generate-readme-file").on("click", () => {
  guidedSaveRCFile("readme");
});
$("#guided-generate-changes-file").on("click", () => {
  guidedSaveRCFile("changes");
});

document.getElementById("guided-generate-dataset-button").addEventListener("click", async () => {
  // Ensure that the current workspace is the workspace the user confirmed
  const currentWorkspace = guidedGetCurrentUserWorkSpace();
  const datasetWorkspace = window.sodaJSONObj["digital-metadata"]["dataset-workspace"];

  if (!currentWorkspace) {
    Swal.fire({
      width: 700,
      icon: "info",
      title: "You are not logged in to any workspace.",
      html: `
          Please select a workspace by clicking on the pencil icon to the right of the Dataset workspace field
          on this page.
        `,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `OK`,
      focusConfirm: true,
      allowOutsideClick: false,
    });
    return;
  }

  if (currentWorkspace != datasetWorkspace) {
    if (window.sodaJSONObj?.["starting-point"]?.["type"] === "bf") {
      Swal.fire({
        width: 700,
        icon: "info",
        title: "You are not logged in to the workspace you pulled this dataset from.",
        html: `
          <p class="text-left">
            You pulled this dataset from the workspace <b>${datasetWorkspace}</b>, but you are currently
            logged in to the workspace <b>${currentWorkspace}</b>.
          </p>
          <br />
          <br />
          <p class="text-left">
            To push the changes you made to this dataset to Pennsieve, please select
            the workspace <b>${datasetWorkspace}</b> by clicking the pencil icon to
            the right of the Dataset workspace field on this page.
          </p>
        `,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: `OK`,
        focusConfirm: true,
        allowOutsideClick: false,
      });
    } else {
      Swal.fire({
        width: 700,
        icon: "info",
        title: "You are not logged in to the workspace you confirmed earlier.",
        html: `
          You previously confirmed that the Dataset workspace is <b>${datasetWorkspace}</b>.
          <br />
          <br />
          <p class="text-left">
            If the workspace you would like to upload the dataset to is still <b>${datasetWorkspace}</b>,
            you can change the workspace by clicking the pencil icon to the right of the Dataset workspace field
            on this page.
          </p>
          <br />
          <br />
          <p class="text-left">
            If you would like to change the dataset workspace to <b>${currentWorkspace}</b>, you can do so by
            by clicking the Pennsieve metadata item in the left sidebar, selecting Pennsieve log in, and then
            change your workspace to <b>${currentWorkspace}</b>.
          </p>
        `,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: `OK`,
        focusConfirm: true,
        allowOutsideClick: false,
      });
    }
    return;
  }

  //run pre flight checks and abort if any fail
  let supplementary_checks = await window.run_pre_flight_checks(
    "guided-mode-pre-generate-pennsieve-agent-check"
  );
  if (!supplementary_checks) {
    return;
  }
  await window.openPage("guided-dataset-generation-tab");
  guidedPennsieveDatasetUpload();
});

const guidedSaveBannerImage = async () => {
  $("#guided-para-dataset-banner-image-status").html("Please wait...");
  //Save cropped image locally and check size
  let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
  let imageType = "";

  if (!window.fs.existsSync(imageFolder)) {
    window.fs.mkdirSync(imageFolder, { recursive: true });
  }

  if (window.imageExtension == "png") {
    imageType = "image/png";
  } else {
    imageType = "image/jpeg";
  }
  let datasetName = window.sodaJSONObj["digital-metadata"]["name"];
  let imagePath = window.path.join(imageFolder, `${datasetName}.` + window.imageExtension);
  let croppedImageDataURI = window.myCropper.getCroppedCanvas().toDataURL(imageType);

  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
    let image_file_size = window.fs.fileSizeSync(imagePath);
    if (image_file_size < 5 * 1024 * 1024) {
      $("#guided-para-dataset-banner-image-status").html("");
      setGuidedBannerImage(imagePath);
      $("#guided-banner-image-modal").modal("hide");
      $("#guided-button-add-banner-image").text("Edit banner image");
    } else {
      //image needs to be scaled
      $("#guided-para-dataset-banner-image-status").html("");
      let scaledImagePath = await window.scaleBannerImage(imagePath);
      setGuidedBannerImage(scaledImagePath);
      $("#guided-banner-image-modal").modal("hide");
      $("#guided-button-add-banner-image").text("Edit banner image");
    }

    // hide the skip btn as it is no longer relvant
    document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
  });
};
// /**************************************/
$("#guided-save-banner-image").click(async () => {
  $("#guided-para-dataset-banner-image-status").html("");

  if (window.guidedBfViewImportedImage.src.length > 0) {
    if (window.guidedFormBannerHeight.value > 511) {
      Swal.fire({
        icon: "warning",
        text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(async () => {
        if (window.guidedFormBannerHeight.value < 1024) {
          Swal.fire({
            icon: "warning",
            text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${window.guidedFormBannerHeight.value} px. Would you like to continue?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: window.reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then(async (result) => {
            if (result.isConfirmed) {
              guidedSaveBannerImage();
            }
          });
        } else if (window.guidedFormBannerHeight.value > 2048) {
          Swal.fire({
            icon: "warning",
            text: `Your cropped image is ${window.formBannerHeight.value} px and is bigger than the 2048px standard. Would you like to scale this image down to fit the entire cropped image?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: window.reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then(async (result) => {
            if (result.isConfirmed) {
              guidedSaveBannerImage();
            }
          });
        } else {
          guidedSaveBannerImage();
        }
      });
    } else {
      $("#guided-para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Dimensions of cropped area must be at least 512 px" +
          "</span>"
      );
    }
  } else {
    $("#guided-para-dataset-banner-image-status").html(
      "<span style='color: red;'> " + "Please import an image first" + "</span>"
    );
  }
});

const getNextPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);

  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != siblingPages.length - 1) {
    return document.getElementById(siblingPages[currentPageIndex + 1]);
  } else {
    const nextParentContainer = parentContainer.nextElementSibling;
    return getNonSkippedGuidedModePages(nextParentContainer)[0];
  }
};

//next button click handler
$("#guided-next-button").on("click", async function () {
  //Get the ID of the current page to handle actions on page leave (next button pressed)
  window.pageBeingLeftID = window.CURRENT_PAGE.id;

  if (window.pageBeingLeftID === "guided-dataset-generation-tab") {
    guidedUnSkipPage("guided-dataset-dissemination-tab");
    await window.openPage("guided-dataset-dissemination-tab");
    return;
  }

  try {
    await savePageChanges(window.pageBeingLeftID);

    //Mark page as completed in JSONObj so we know what pages to load when loading local saves
    //(if it hasn't already been marked complete)
    if (!window.sodaJSONObj["completed-tabs"].includes(window.pageBeingLeftID)) {
      window.sodaJSONObj["completed-tabs"].push(window.pageBeingLeftID);
    }

    //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
    //if more tabs in parent tab, go to next tab and update capsule
    let targetPage = getNextPageNotSkipped(window.CURRENT_PAGE.id);
    let targetPageID = targetPage.id;

    await window.openPage(targetPageID);
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

// Save and exit button click handlers
document.getElementById("guided-button-save-and-exit").addEventListener("click", async () => {
  await guidedSaveAndExit();
});

const getPrevPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);
  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != 0) {
    return document.getElementById(siblingPages[currentPageIndex - 1]);
  } else {
    const prevParentContainer = parentContainer.previousElementSibling;
    const prevParentContainerPages = getNonSkippedGuidedModePages(prevParentContainer);
    return prevParentContainerPages[prevParentContainerPages.length - 1];
  }
};

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
  await window.openPage(targetPageID);
});

//tagify initializations
const guidedOtherFundingSourcesInput = document.getElementById("guided-ds-other-funding");
guidedOtherFundingsourcesTagify = new Tagify(guidedOtherFundingSourcesInput, {
  duplicates: false,
});
window.createDragSort(guidedOtherFundingsourcesTagify);
const guidedStudyOrganSystemsInput = document.getElementById("guided-ds-study-organ-system");
guidedStudyOrganSystemsTagify = new Tagify(guidedStudyOrganSystemsInput, {
  whitelist: [
    "autonomic ganglion",
    "brain",
    "colon",
    "heart",
    "intestine",
    "kidney",
    "large intestine",
    "liver",
    "lower urinary tract",
    "lung",
    "nervous system",
    "pancreas",
    "peripheral nervous system",
    "small intestine",
    "spinal cord",
    "spleen",
    "stomach",
    "sympathetic nervous system",
    "urinary bladder",
  ],
  duplicates: false,
  dropdown: {
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
window.createDragSort(guidedStudyOrganSystemsTagify);

const guidedDatasetKeyWordsInput = document.getElementById("guided-ds-dataset-keywords");
guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeyWordsInput, {
  duplicates: false,
  maxTags: 5,
});

window.createDragSort(guidedDatasetKeywordsTagify);

const guidedStudyApproachInput = document.getElementById("guided-ds-study-approach");
guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, {
  duplicates: false,
});
window.createDragSort(guidedStudyApproachTagify);

const guidedStudyTechniquesInput = document.getElementById("guided-ds-study-technique");
guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, {
  duplicates: false,
});
window.createDragSort(guidedStudyTechniquesTagify);

/// back button Curate
$("#guided-button-back").on("click", function () {
  var slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = window.getGlobalPath(window.organizeDSglobalPath);
    if (filtered.length === 1) {
      window.organizeDSglobalPath.value = filtered[0] + "/";
    } else {
      window.organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
    }
    var myPath = window.datasetStructureJSONObj;
    for (var item of filtered.slice(1, filtered.length - 1)) {
      myPath = myPath["folders"][item];
    }
    // construct UI with files and folders
    $("#items").empty();
    window.already_created_elem = [];
    let items = window.loadFileFolder(myPath); //array -
    //we have some items to display
    window.listItems(myPath, "#items", 500, true);
    window.organizeLandingUIEffect();
    // reconstruct div with new elements
    window.getInFolder(
      ".single-item",
      "#items",
      window.organizeDSglobalPath,
      window.datasetStructureJSONObj
    );
  }
});

$("#guided-new-folder").on("click", () => {
  event.preventDefault();
  var slashCount = window.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var newFolderName = "New Folder";
    Swal.fire({
      title: "Add new folder...",
      text: "Enter a name below:",
      heightAuto: false,
      input: "text",
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: "Cancel",
      confirmButtonText: "Add folder",
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        let swal_container = document.getElementsByClassName("swal2-popup")[0];
        swal_container.style.width = "600px";
        swal_container.style.padding = "1.5rem";
        $(".swal2-input").attr("id", "add-new-folder-input");
        $(".swal2-confirm").attr("id", "add-new-folder-button");
        $("#add-new-folder-input").keyup(function () {
          let val = $("#add-new-folder-input").val();
          const folderNameIsValid = window.evaluateStringAgainstSdsRequirements(
            val,
            "folder-or-file-name-is-valid"
          );
          if (folderNameIsValid) {
            $("#add-new-folder-button").attr("disabled", false);
          } else {
            Swal.showValidationMessage(`The folder name contains non-allowed characters.`);
            $("#add-new-folder-button").attr("disabled", true);
            return;
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.value) {
        if (result.value !== null && result.value !== "") {
          newFolderName = result.value.trim();
          // check for duplicate or files with the same name
          var duplicate = false;
          var itemDivElements = document.getElementById("items").children;
          for (var i = 0; i < itemDivElements.length; i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true;
              break;
            }
          }
          if (duplicate) {
            Swal.fire({
              icon: "error",
              text: "Duplicate folder name: " + newFolderName,
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });

            window.logCurationForAnalytics(
              "Error",
              window.PrepareDatasetsAnalyticsPrefix.CURATE,
              window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );
          } else {
            var currentPath = window.organizeDSglobalPath.value;
            var jsonPathArray = currentPath.split("/");
            var filtered = jsonPathArray.slice(1).filter(function (el) {
              return el != "";
            });

            var myPath = window.getRecursivePath(filtered, window.datasetStructureJSONObj);
            // update Json object with new folder created
            var renamedNewFolder = newFolderName;
            myPath["folders"][renamedNewFolder] = newEmptyFolderObj();

            window.listItems(myPath, "#items", 500, true);
            window.getInFolder(
              ".single-item",
              "#items",
              window.organizeDSglobalPath,
              window.datasetStructureJSONObj
            );

            // log that the folder was successfully added
            window.logCurationForAnalytics(
              "Success",
              window.PrepareDatasetsAnalyticsPrefix.CURATE,
              window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );

            window.hideMenu(
              "folder",
              window.menuFolder,
              window.menuHighLevelFolders,
              window.menuFile
            );
            window.hideMenu(
              "high-level-folder",
              window.menuFolder,
              window.menuHighLevelFolders,
              window.menuFile
            );
          }
        }
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
});

$("#guided-imoprt-file").on("click", () => {
  window.electron.ipcRenderer.send("open-files-organize-datasets-dialog");
});
$("#guided-import-folder").on("click", () => {
  window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog");
});

const guidedSaveDescriptionDatasetInformation = () => {
  const title = window.sodaJSONObj["digital-metadata"]["name"];
  const subtitle = window.sodaJSONObj["digital-metadata"]["subtitle"];
  let studyType = window.sodaJSONObj["dataset-type"] || "";
  //get the keywords from the keywords textarea
  const keywordArray = window.getTagsFromTagifyElement(guidedDatasetKeywordsTagify);
  if (keywordArray.length < 3) {
    throw "Please enter at least 3 keywords";
  }

  //Get the count of all subjects in and outside of pools
  const [subjectsInPools, subjectsOutsidePools] = window.sodaJSONObj.getAllSubjects();
  const numSubjects = [...subjectsInPools, ...subjectsOutsidePools].length;

  //Get the count of all samples
  const [samplesInPools, samplesOutsidePools] = window.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  const numSamples = [...samplesInPools, ...samplesOutsidePools].length;

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {
    name: title,
    description: subtitle,
    type: studyType,
    keywords: keywordArray,
    "number of samples": numSamples,
    "number of subjects": numSubjects,
  };

  // Save keywords as the tags to be uploaded as the Pennsieve dataset tags
  window.sodaJSONObj["digital-metadata"]["dataset-tags"] = keywordArray;
};

const guidedSaveDescriptionStudyInformation = () => {
  const studyOrganSystemTags = window.getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
  const studyApproachTags = window.getTagsFromTagifyElement(guidedStudyApproachTagify);
  const studyTechniqueTags = window.getTagsFromTagifyElement(guidedStudyTechniquesTagify);

  const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
  const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
  const studyPrimaryConclusionInput = document.getElementById("guided-ds-study-primary-conclusion");
  const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");
  //Initialize the study information variables
  let studyPurpose = null;
  let studyDataCollection = null;
  let studyPrimaryConclusion = null;
  let studyCollectionTitle = null;

  //Throw an error if any study information variables are not filled out
  if (!studyPurposeInput.value.trim()) {
    throw "Please add a study purpose";
  } else {
    studyPurpose = studyPurposeInput.value.trim();
  }
  if (!studyDataCollectionInput.value.trim()) {
    throw "Please add a study data collection";
  } else {
    studyDataCollection = studyDataCollectionInput.value.trim();
  }
  if (!studyPrimaryConclusionInput.value.trim()) {
    throw "Please add a study primary conclusion";
  } else {
    studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim();
  }
  if (studyOrganSystemTags.length < 1) {
    throw "Please add at least one study organ system";
  }
  if (studyApproachTags.length < 1) {
    throw "Please add at least one study approach";
  }
  if (studyTechniqueTags.length < 1) {
    throw "Please add at least one study technique";
  }

  studyCollectionTitle = studyCollectionTitleInput.value.trim();

  //After validation, add the study information to the JSON object
  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {
    "study organ system": studyOrganSystemTags,
    "study approach": studyApproachTags,
    "study technique": studyTechniqueTags,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle,
  };

  // Generate the dataset description to be added to Pennsieve based off of the dd metadata
  window.sodaJSONObj["digital-metadata"]["description"] = {
    "study-purpose": studyPurpose,
    "data-collection": studyDataCollection,
    "primary-conclusion": studyPrimaryConclusion,
  };
};
const guidedSaveDescriptionContributorInformation = () => {
  const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
  const acknowledgements = acknowledgementsInput.value.trim();

  // Get tags from other funding tagify
  const otherFunding = window.getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);

  window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"] = {
    funding: otherFunding,
    acknowledgment: acknowledgements,
  };
};

const continueHackGm = true;

const doTheHack = async () => {
  console.log("Doing the hack");
  // wait for a second
  await new Promise((resolve) => setTimeout(resolve, 5000));
  document.getElementById("button-homepage-guided-mode").click();
  document.getElementById("guided-button-resume-progress-file").click();
  // wait for 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Search the dom for a button with the classes "ui positive button guided--progress-button-resume-curation"
  const resumeCurationButton = document.querySelector(
    ".ui.positive.button.guided--progress-button-resume-curation"
  );
  if (resumeCurationButton) {
    resumeCurationButton.click();
  } else {
    // wait for 3 more seconds then click
    await new Promise((resolve) => setTimeout(resolve, 3000));
    document.querySelector(".ui.positive.button.guided--progress-button-resume-curation").click();
  }
  // wait for 4 seconds then click the next button
  await new Promise((resolve) => setTimeout(resolve, 4000));
  document.querySelector(".primary-selection-aside-item.selection-aside-item").click();
};
if (continueHackGm) {
  doTheHack();
}
