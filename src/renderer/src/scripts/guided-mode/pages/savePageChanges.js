import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading";
import { getDatasetEntityObj } from "../../../stores/slices/datasetEntitySelectorSlice";
import { startOrStopAnimationsInContainer } from "../lotties/lottie";
import { savePageCurationPreparation } from "./curationPreparation/savePage";
import { savePagePrepareMetadata } from "./prepareMetadata/savePage";
import { guidedSkipPage, guidedUnSkipPage } from "./navigationUtils/pageSkipping";
import useGlobalStore from "../../../stores/globalStore";
import { contentOptionsMap } from "../../../components/pages/DatasetContentSelector";
import {
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

/**
 *
 * @returns {Promise<void>}
 * @description Save the user's progress in the active Prepare Dataset Step-by-Step workflow to a progress file stored in the user's home directory under the SODA folder.
 *              Creates the directory if it does not exist. The progress file is named after the dataset the user is working on.
 *
 */
export const guidedSaveProgress = async () => {
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

/**
 *
 * @param {string} pageBeingLeftID  - The id of the html page that the user is leaving
 * @description Validate and save user progress for the page being left in the Prepare Dataset Step-by-Step workflow.
 *              Progress is saved in a progress file the user can access to resume their work after exiting their active workflow.
 */
export const savePageChanges = async (pageBeingLeftID) => {
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
      if (pageBeingLeftComponentType === "performance-id-management-page") {
        const performanceList = useGlobalStore.getState()["performanceList"];
        if (performanceList.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please add at least one performance",
          });
          throw errorArray;
        }
        console.log("performanceList", performanceList);
        window.sodaJSONObj["performance-list"] = performanceList;
      }

      if (pageBeingLeftComponentType === "modality-selection-page") {
        const selectedModalities = useGlobalStore.getState()["selectedModalities"];
        console.log("selectedModalities", selectedModalities);
        if (selectedModalities.length === 0) {
          guidedSkipPage("guided-modalities-data-selection-tab");
        } else {
          guidedUnSkipPage("guided-modalities-data-selection-tab");
        }
        window.sodaJSONObj["selected-modalities"] = selectedModalities;
      }

      if (pageBeingLeftComponentType === "data-categorization-page") {
        const entityType = pageBeingLeftDataSet.entityType;
        const datasetEntityObj = getDatasetEntityObj();
        console.log("datasetEntityObj when leaving" + pageBeingLeftID, datasetEntityObj);
        console.log("pageBeingLeftDataSet.entityType", entityType);
        const entityItems = Object.keys(datasetEntityObj?.[entityType] || {});
        console.log("entityItems", entityItems);

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
      }

      if (pageBeingLeftComponentType === "entity-file-mapping-page") {
        const datasetEntityObj = getDatasetEntityObj();
        console.log("datasetEntityObj when leaving" + pageBeingLeftID, datasetEntityObj);
        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
      }

      if (pageBeingLeftComponentType === "dataset-content-selector") {
        const selectedEntities = useGlobalStore.getState()["selectedEntities"];
        const deSelectedEntities = useGlobalStore.getState()["deSelectedEntities"];

        // Check if any selections were made
        if (selectedEntities.length === 0) {
          errorArray.push({
            type: "notyf",
            message:
              "Please select 'Yes' for at least one dataset content option before continuing.",
          });
          throw errorArray;
        }

        // If subjects is selected, verify all questions that should be visible were answered
        if (selectedEntities.includes("subjects")) {
          // Determine which questions should be visible based on dependencies
          const visibleQuestions = Object.keys(contentOptionsMap).filter((key) => {
            const option = contentOptionsMap[key];
            // If this option has dependencies, check them all
            if (option.dependsOn && option.dependsOn.length > 0) {
              for (const dependency of option.dependsOn) {
                if (
                  deSelectedEntities.includes(dependency) ||
                  !selectedEntities.includes(dependency)
                ) {
                  return false; // This question shouldn't be visible
                }
              }
            }
            return true; // This question should be visible
          });

          // Now check if all visible questions were answered
          for (const entity of visibleQuestions) {
            if (!selectedEntities.includes(entity) && !deSelectedEntities.includes(entity)) {
              errorArray.push({
                type: "notyf",
                message: "Please answer all questions before continuing.",
              });
              throw errorArray;
            }
          }
        } else {
          // If subjects is not selected, it must be explicitly marked as No
          if (!deSelectedEntities.includes("subjects")) {
            errorArray.push({
              type: "notyf",
              message: "Please answer the question about subjects (select Yes or No).",
            });
            throw errorArray;
          }

          // If subjects is No, code must be Yes
          if (!selectedEntities.includes("code")) {
            errorArray.push({
              type: "notyf",
              message:
                "Your dataset must contain either subjects or code. Please select 'Yes' for at least one of these options.",
            });
            throw errorArray;
          }
        }

        // Store selections
        window.sodaJSONObj["selected-entities"] = selectedEntities;
        window.sodaJSONObj["deSelected-entities"] = deSelectedEntities;

        if (!selectedEntities.includes("subjects") && !selectedEntities.includes("code")) {
          errorArray.push({
            type: "notyf",
            message: "You must indicate that your dataset contains subjects and/or code",
          });
          throw errorArray;
        }

        if (selectedEntities.includes("subjects")) {
          guidedUnSkipPage("guided-subjects-entity-addition-tab");
          guidedUnSkipPage("guided-subjects-selection-tab");
          guidedUnSkipPage("guided-unstructured-data-import-tab");
          guidedUnSkipPage("guided-create-subjects-metadata-tab");
        } else {
          guidedSkipPage("guided-subjects-entity-addition-tab");
          guidedSkipPage("guided-subjects-selection-tab");
          guidedSkipPage("guided-unstructured-data-import-tab");
          guidedSkipPage("guided-create-subjects-metadata-tab");
        }

        if (selectedEntities.includes("samples")) {
          guidedUnSkipPage("guided-samples-entity-addition-tab");
          guidedUnSkipPage("guided-samples-selection-tab");
          guidedUnSkipPage("guided-create-samples-metadata-tab");
        } else {
          guidedSkipPage("guided-samples-entity-addition-tab");
          guidedSkipPage("guided-samples-selection-tab");
          guidedSkipPage("guided-create-samples-metadata-tab");
        }

        if (selectedEntities.includes("sites")) {
          guidedUnSkipPage("guided-sites-entity-addition-tab");
          guidedUnSkipPage("guided-sites-selection-tab");
          guidedUnSkipPage("guided-create-sites-metadata-tab");
        } else {
          guidedSkipPage("guided-sites-entity-addition-tab");
          guidedSkipPage("guided-sites-selection-tab");
          guidedSkipPage("guided-create-sites-metadata-tab");
        }

        if (selectedEntities.includes("performances")) {
          guidedUnSkipPage("guided-performances-entity-addition-tab");
          guidedUnSkipPage("guided-Performances-selection-tab");
          guidedUnSkipPage("guided-create-performances-metadata-tab");
        } else {
          guidedSkipPage("guided-performances-entity-addition-tab");
          guidedSkipPage("guided-Performances-selection-tab");
          guidedSkipPage("guided-create-performances-metadata-tab");
        }

        if (selectedEntities.includes("code")) {
          guidedUnSkipPage("guided-code-folder-tab");
        } else {
          guidedSkipPage("guided-code-folder-tab");
        }
      }

      if (
        pageBeingLeftComponentType === "dataset-entity-manual-addition-page" ||
        pageBeingLeftComponentType === "dataset-entity-spreadsheet-import-page"
      ) {
        const datasetEntityArray = useGlobalStore.getState().datasetEntityArray;
        if (datasetEntityArray.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "You must add at least one subject to your dataset before continuing",
          });
          throw errorArray;
        }

        // Get a list of the entities that the user said they had on the dataset content page
        const selectedEntities = window.sodaJSONObj["selected-entities"];

        // If the user said they had samples but did not add or import any, throw an error
        if (selectedEntities.includes("samples")) {
          if (getExistingSamples().length === 0) {
            errorArray.push({
              type: "notyf",
              message: "You must add at least one sample to your dataset before continuing",
            });
            throw errorArray;
          }
        }

        if (selectedEntities.includes("sites")) {
          if (getExistingSites().length === 0) {
            errorArray.push({
              type: "notyf",
              message: "You must add at least one site to your dataset before continuing",
            });
            throw errorArray;
          }
        }

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-array"] = datasetEntityArray;
      }
    }

    await savePageCurationPreparation(pageBeingLeftID);
    await savePagePrepareMetadata(pageBeingLeftID);

    if (pageBeingLeftID === "guided-entity-addition-method-selection-tab") {
      const userSelectedAddEntitiesFromSpreadsheet = document
        .getElementById("guided-button-add-entities-via-spreadsheet")
        .classList.contains("selected");
      const userSelectedAddEntitiesManually = document
        .getElementById("guided-button-add-entities-manually")
        .classList.contains("selected");

      if (!userSelectedAddEntitiesFromSpreadsheet && !userSelectedAddEntitiesManually) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate how you would like to add your entity IDs",
        });
        throw errorArray;
      }

      if (userSelectedAddEntitiesFromSpreadsheet) {
        guidedSkipPage("guided-manual-dataset-entity-and-metadata-tab");
        guidedUnSkipPage("guided-spreadsheet-import-dataset-entity-and-metadata-tab");
      }

      if (userSelectedAddEntitiesManually) {
        guidedSkipPage("guided-spreadsheet-import-dataset-entity-and-metadata-tab");
        guidedUnSkipPage("guided-manual-dataset-entity-and-metadata-tab");
      }
    }

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

/**
 * Save entity file mapping changes to the SODA JSON object
 */
export const saveEntityFileMappingChanges = () => {
  // Get the current datasetEntityObj from the store
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;

  // Save the entire datasetEntityObj to window.sodaJSONObj
  window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;

  // If you need to do any reverse conversion (map to array) for backwards compatibility, do it here:
  // const compatDatasetEntityObj = { ...datasetEntityObj };
  // if (compatDatasetEntityObj["entity-to-file-mapping"]) {
  //   Object.keys(compatDatasetEntityObj["entity-to-file-mapping"]).forEach(entityId => {
  //     const entityFileMap = compatDatasetEntityObj["entity-to-file-mapping"][entityId];
  //     compatDatasetEntityObj["entity-to-file-mapping"][entityId] = Object.keys(entityFileMap);
  //   });
  // }
  // window.sodaJSONObj["dataset-entity-obj-compat"] = compatDatasetEntityObj;

  console.log("Entity file mapping saved:", datasetEntityObj);
  return true;
};
