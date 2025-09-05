import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading";
import { getDatasetEntityObj } from "../../../stores/slices/datasetEntitySelectorSlice";
import { startOrStopAnimationsInContainer } from "../lotties/lottie";
import { savePageDatasetStructure } from "./datasetStructure/savePage";
import { savePageCurationPreparation } from "./curationPreparation/savePage";
import { savePagePrepareMetadata } from "./prepareMetadata/savePage";
import { savePagePennsieveDetails } from "./pennsieveDetails/savePage";
import { savePageGenerateDataset } from "./generateDataset/savePage";
import { countFilesInDatasetStructure } from "../../utils/datasetStructure";
import { guidedSkipPage, guidedUnSkipPage } from "./navigationUtils/pageSkipping";
import useGlobalStore from "../../../stores/globalStore";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
const guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");
if (!window.fs.existsSync(guidedProgressFilePath)) {
  window.fs.mkdirSync(guidedProgressFilePath, { recursive: true });
}

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

  const guidedFilePath = window.path.join(guidedProgressFilePath, guidedProgressFileName + ".json");

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

        window.sodaJSONObj["dataset_performances"] = performanceList;

        // Deep copy to avoid mutating the original list in the global store
        const performanceListCopy = structuredClone(performanceList);

        // Set the date property for each performance based on start_datetime
        performanceListCopy.forEach((performance) => {
          if (performance.start_datetime) {
            performance.date = performance.start_datetime.split("T")[0];
          }
        });

        window.sodaJSONObj["dataset_metadata"]["performances"] = performanceListCopy;
      }

      if (pageBeingLeftComponentType === "modality-selection-page") {
        const userSelectedTheyHaveMultipleModalities = document
          .getElementById("modality-selection-yes")
          .classList.contains("selected");
        const userSelectedTheyDoNotHaveMultipleModalities = document
          .getElementById("modality-selection-no")
          .classList.contains("selected");

        if (
          !userSelectedTheyDoNotHaveMultipleModalities &&
          !userSelectedTheyHaveMultipleModalities
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset has multiple modalities.",
          });
          throw errorArray;
        }

        const selectedModalities = useGlobalStore.getState()["selectedModalities"];
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

        if (entityType === "high-level-folder-data-categorization") {
          // Make sure all of the files were categorized into a high-level folder
          const categorizedData = datasetEntityObj?.["high-level-folder-data-categorization"];
          const categorizedFileCount = Object.keys(categorizedData).reduce((acc, key) => {
            const files = categorizedData[key];
            return acc + Object.keys(files).length;
          }, 0);

          // If the user has not categorized any files, throw an error
          if (categorizedFileCount === 0) {
            errorArray.push({
              type: "notyf",
              message: "Please categorize your data files before continuing.",
            });
            throw errorArray;
          }

          const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);

          // If the user has not categorized all of the files, throw an error
          if (datasetFileCount !== categorizedFileCount) {
            errorArray.push({
              type: "notyf",
              message: "You must categorize all of your data files before continuing.",
            });
            throw errorArray;
          }
        }

        if (entityType === "performances") {
          // Clone current performances metadata to avoid mutating the original reference
          const performanceMetadata = structuredClone(
            window.sodaJSONObj.dataset_metadata.performances
          );

          // Utility: check if two objects share at least one common key
          const sharesAtLeastOneKey = (objA, objB) => Object.keys(objA).some((key) => key in objB);

          // Get existing entities
          const sites = getExistingSites();
          const samples = getExistingSamples();
          const subjects = getExistingSubjects();

          performanceMetadata.forEach((performance) => {
            const performanceId = performance.performance_id;
            const performanceFiles = datasetEntityObj?.performances?.[performanceId];

            if (!performanceFiles) {
              performance.participants = [];
              return;
            }

            const performanceParticipants = [];

            // Add sites and their parents
            for (const site of sites) {
              const siteId = site.metadata.site_id;
              const siteFiles = datasetEntityObj?.sites?.[siteId] || {};
              if (sharesAtLeastOneKey(performanceFiles, siteFiles)) {
                performanceParticipants.push(siteId);
                if (site.parentSample) performanceParticipants.push(site.parentSample);
                if (site.parentSubject) performanceParticipants.push(site.parentSubject);
              }
            }

            // Add samples and their parents
            for (const sample of samples) {
              const sampleId = sample.metadata.sample_id;
              const sampleFiles = datasetEntityObj?.samples?.[sampleId] || {};
              if (sharesAtLeastOneKey(performanceFiles, sampleFiles)) {
                performanceParticipants.push(sampleId);
                if (sample.parentSubject) performanceParticipants.push(sample.parentSubject);
              }
            }

            // Add subjects
            for (const subject of subjects) {
              const subjectId = subject.metadata.subject_id;
              const subjectFiles = datasetEntityObj?.subjects?.[subjectId] || {};
              if (sharesAtLeastOneKey(performanceFiles, subjectFiles)) {
                performanceParticipants.push(subjectId);
              }
            }

            // Assign participants as array (duplicates allowed)
            performance.participants = performanceParticipants;
          });

          // Update dataset metadata
          window.sodaJSONObj.dataset_metadata.performances = performanceMetadata;
        }

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
        const categorizedData = datasetEntityObj?.["high-level-folder-data-categorization"];

        let categorizedFileCount = 0;
        if (categorizedData) {
          categorizedFileCount = Object.keys(categorizedData).reduce((acc, key) => {
            const files = categorizedData[key];
            return acc + Object.keys(files).length;
          }, 0);
        }

        if (categorizedFileCount === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please categorize your data files before continuing.",
          });
          throw errorArray;
        }

        const countOfFilesCategorizedAsCode = Object.keys(categorizedData["Code"] || {}).length;
        const countOfFilesCategorizedAsExperimental = Object.keys(
          categorizedData["Experimental"] || {}
        ).length;

        if (window.sodaJSONObj["selected-entities"].includes("code")) {
          if (countOfFilesCategorizedAsCode === 0) {
            errorArray.push({
              type: "notyf",
              message: "You must classify at least one file in your dataset as code on this step.",
            });
            throw errorArray;
          }
        }

        if (window.sodaJSONObj["selected-entities"].includes("subjects")) {
          if (countOfFilesCategorizedAsExperimental === 0) {
            errorArray.push({
              type: "notyf",
              message:
                "You must classify at least one file in your dataset as experimental data on this step.",
            });
            throw errorArray;
          }
        }
      }

      if (pageBeingLeftComponentType === "entity-file-mapping-page") {
        const datasetEntityObj = getDatasetEntityObj();
        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
      }

      if (
        pageBeingLeftComponentType === "entity-metadata-page" ||
        pageBeingLeftComponentType === "entity-spreadsheet-import-page"
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
          const sites = getExistingSites();
          if (sites.length === 0) {
            errorArray.push({
              type: "notyf",
              message: "You must add at least one site to your dataset before continuing",
            });
            throw errorArray;
          }
          // Prepare the sites metadata
          const sitesCopy = structuredClone(sites);
          const sitesMetadata = sitesCopy.map((site) => ({
            ...site.metadata,
            specimen_id: `${site.metadata.sample_id} ${site.metadata.subject_id}`,
          }));
          window.sodaJSONObj["dataset_metadata"]["sites"] = sitesMetadata;
        } else {
          // If sites metadata has been added, remove it (It shouldn't be there but just in case)
          if (window.sodaJSONObj["dataset_metadata"]?.["sites"]) {
            delete window.sodaJSONObj["dataset_metadata"]["sites"];
          }
        }

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-array"] = datasetEntityArray;
      }
    }

    // Handle page exit logic for pages that are not controlled by React components
    await savePageDatasetStructure(pageBeingLeftID);
    await savePageCurationPreparation(pageBeingLeftID);
    await savePagePrepareMetadata(pageBeingLeftID);
    await savePagePennsieveDetails(pageBeingLeftID);
    await savePageGenerateDataset(pageBeingLeftID);

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
  return true;
};
