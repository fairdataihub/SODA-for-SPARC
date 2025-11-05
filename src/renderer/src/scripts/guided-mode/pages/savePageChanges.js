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
import { swalConfirmAction } from "../../utils/swal-utils";

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
  const guidedProgressFileName = window.sodaJSONObj?.["save-file-name"];
  // If there is no guidedProgressFileName, return (nothing to save)
  if (!window.sodaJSONObj?.["save-file-name"]) {
    return;
  }

  //Destination: HOMEDIR/SODA/Guided-Progress
  window.sodaJSONObj["last-modified"] = new Date();

  const guidedFilePath = window.path.join(guidedProgressFilePath, guidedProgressFileName + ".json");

  // Store global variable values to the progress file before saving
  window.sodaJSONObj["dataset-structure"] = window.datasetStructureJSONObj;

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

        if (userSelectedTheyHaveMultipleModalities) {
          const selectedModalities = useGlobalStore.getState()["selectedModalities"];
          if (selectedModalities.length === 0) {
            errorArray.push({
              type: "notyf",
              message:
                "Please select at least one modality in the list above. If your modalities are not listed, indicate that your dataset does not have multiple modalities.",
            });
            throw errorArray;
          }
          window.sodaJSONObj["selected-modalities"] = selectedModalities;
          guidedUnSkipPage("guided-modalities-data-selection-tab");
        } else {
          window.sodaJSONObj["selected-modalities"] = [];
          guidedSkipPage("guided-modalities-data-selection-tab");
        }
      }

      if (pageBeingLeftComponentType === "data-categorization-page") {
        const entityType = pageBeingLeftDataSet.entityType;
        const datasetEntityObj = getDatasetEntityObj();
        const selectedEntities = window.sodaJSONObj["selected-entities"] || [];
        const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);

        if (entityType === "supporting-folders") {
          const possibleSupportingFolders = ["protocol", "docs"];
          const supplementaryFolders = possibleSupportingFolders.filter((folder) =>
            selectedEntities.includes(folder)
          );

          // Only require categorization if there are multiple supplementary folders
          if (supplementaryFolders.length > 1) {
            const supportingData = datasetEntityObj?.["supporting-folders"];
            if (!supportingData) {
              errorArray.push({
                type: "notyf",
                message: "Please categorize your supporting data files before continuing.",
              });
              throw errorArray;
            }
          }
        }
        if (entityType === "data-folders") {
          // Make sure all of the files were categorized into a high-level folder
          const categorizedData = datasetEntityObj?.["data-folders"];
          const categorizedFileCount = Object.keys(categorizedData).reduce((acc, key) => {
            const files = categorizedData[key];
            return acc + Object.keys(files).length;
          }, 0);

          // Add supplementary data to the count of categorized files
          const supplementaryData = datasetEntityObj?.["supporting-folders"];
          const supplementaryFileCount = supplementaryData
            ? Object.keys(supplementaryData).reduce((acc, key) => {
                const files = supplementaryData[key];
                return acc + Object.keys(files).length;
              }, 0)
            : 0;

          const totalCategorizedFiles = categorizedFileCount + supplementaryFileCount;

          // If the user has not categorized any files, throw an error
          if (totalCategorizedFiles === 0) {
            errorArray.push({
              type: "notyf",
              message: "Please categorize your data files before continuing.",
            });
            throw errorArray;
          }

          const countOfFilesCategorizedAsCode = Object.keys(categorizedData["Code"] || {}).length;

          if (selectedEntities.includes("code")) {
            if (countOfFilesCategorizedAsCode === 0) {
              errorArray.push({
                type: "notyf",
                message:
                  "You must classify at least one file in your dataset as code on this step.",
              });
              throw errorArray;
            }
          }

          // If the user has not categorized all of the files, throw an error
          if (datasetFileCount !== totalCategorizedFiles) {
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

            // Skip performances that have no associated files
            if (!performanceFiles) {
              performance.participants = [];
              return;
            }

            // Participants grouped by subject
            const groupedParticipants = {};

            // Collect parent subjects and samples from matching sites (exclude site IDs)
            for (const site of sites) {
              const siteId = site.metadata.site_id;
              const siteFiles = datasetEntityObj?.sites?.[siteId] || {};

              if (sharesAtLeastOneKey(performanceFiles, siteFiles)) {
                const { parentSample, parentSubject } = site;
                if (parentSubject) {
                  if (!groupedParticipants[parentSubject]) {
                    groupedParticipants[parentSubject] = new Set();
                  }
                  if (parentSample) {
                    groupedParticipants[parentSubject].add(parentSample);
                  }
                }
              }
            }

            // Collect samples and their parent subjects
            for (const sample of samples) {
              const sampleId = sample.metadata.sample_id;
              const sampleFiles = datasetEntityObj?.samples?.[sampleId] || {};
              const parentSubject = sample.metadata.subject_id || sample.parentSubject;

              if (sharesAtLeastOneKey(performanceFiles, sampleFiles)) {
                if (!groupedParticipants[parentSubject]) {
                  groupedParticipants[parentSubject] = new Set();
                }
                groupedParticipants[parentSubject].add(sampleId);
              }
            }

            // Add subjects that have direct files or already have related samples
            for (const subject of subjects) {
              const subjectId = subject.metadata.subject_id;
              const subjectFiles = datasetEntityObj?.subjects?.[subjectId] || {};

              if (sharesAtLeastOneKey(performanceFiles, subjectFiles)) {
                if (!groupedParticipants[subjectId]) {
                  groupedParticipants[subjectId] = new Set();
                }
              }
            }

            // Build ordered participant list (subject first, then samples)
            const orderedParticipants = [];
            for (const subject of subjects) {
              const subjectId = subject.metadata.subject_id;
              const samplesForSubject = groupedParticipants[subjectId];
              if (samplesForSubject) {
                orderedParticipants.push(subjectId);
                samplesForSubject.forEach((sampleId) => {
                  orderedParticipants.push(sampleId);
                });
              }
            }

            // Assign ordered participants list to performance
            performance.participants = orderedParticipants;
          });

          // Update dataset metadata
          window.sodaJSONObj["dataset_metadata"]["performances"] = performanceMetadata;
        }
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
    saveEntityFileMappingChanges();

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
    console.error("Error saving page changes:", error);
    window.log.error("Error saving page changes:", error);
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
  console.log("Saving datasetEntityObj:", JSON.stringify(datasetEntityObj, null, 2));

  // Save the entire datasetEntityObj to window.sodaJSONObj
  window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
};
