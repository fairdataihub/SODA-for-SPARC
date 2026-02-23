import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading";
import {
  getDatasetEntityObj,
  getCategorizedEntityFileList,
  removeEntityFromEntityList,
  removeEntityType,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import {
  getSelectedDataCategoriesByEntityType,
  getOxfordCommaSeparatedListOfEntities,
} from "../../../stores/slices/datasetContentSelectorSlice";
import { startOrStopAnimationsInContainer } from "../lotties/lottie";
import { savePageDatasetStructure } from "./datasetStructure/savePage";
import { savePageCurationPreparation } from "./curationPreparation/savePage";
import { savePagePrepareMetadata } from "./prepareMetadata/savePage";
import { savePagePennsieveDetails } from "./pennsieveDetails/savePage";
import { savePageGenerateDataset } from "./generateDataset/savePage";
import { countFilesInDatasetStructure, getFilesByEntityType } from "../../utils/datasetStructure";
import {
  guidedSkipPage,
  guidedUnSkipPage,
  guidedSkipPageSet,
  guidedUnSkipPageSet,
} from "./navigationUtils/pageSkipping";
import { isCheckboxCardChecked } from "../../../stores/slices/checkboxCardSlice";
import useGlobalStore from "../../../stores/globalStore";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { swalListDoubleAction, swalListSingleAction } from "../../utils/swal-utils";
import { addEntityNameToEntityType } from "../../../stores/slices/datasetEntitySelectorSlice";

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
  const appVersion = useGlobalStore.getState().appVersion;
  window.sodaJSONObj["last-version-of-soda-used"] = appVersion;

  window.fs.writeFileSync(guidedFilePath, JSON.stringify(window.sodaJSONObj, null, 2));
};

/**
 *
 * @param {string} pageBeingLeftID  - The id of the html page that the user is leaving
 * @description Validate and save user progress for the page being left in the Prepare Dataset Step-by-Step workflow.
 *              Progress is saved in a progress file the user can access to resume their work after exiting their active workflow.
 */
window.savePageChanges = async (pageBeingLeftID) => {
  // This function is used by both the navigation bar and the side buttons,
  // and whenever it is being called, we know that the user is trying to save the changes on the current page.
  // this function is async because we sometimes need to make calls to validate data before the page is ready to be left.
  guidedSetNavLoadingState(true);

  const errorArray = [];
  try {
    //save changes to the current page
    const datasetEntityArray = useGlobalStore.getState().datasetEntityArray;
    window.sodaJSONObj["dataset-entity-array"] = datasetEntityArray;
    // Save progress early because a lot of work managing entities could have happened here
    // and we don't want the user to lost it.
    await guidedSaveProgress();

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

        // Check for performances with invalid protocol URL or DOI format
        // (This is to throw an error for old progress files that may have invalid protocol formats)
        const performancesWithInvalidProtocol = performanceList
          .filter((performance) => {
            const protocolValue = performance.protocol_url_or_doi;

            return (
              protocolValue &&
              protocolValue.trim() !== "" &&
              !window.evaluateStringAgainstSdsRequirements(
                protocolValue,
                "string-is-valid-url-or-doi"
              )
            );
          })
          .map((performance) => performance.performance_id);
        if (performancesWithInvalidProtocol.length > 0) {
          await swalListSingleAction(
            performancesWithInvalidProtocol,
            "Invalid Protocol URL or DOI Format",
            "The following performances have invalid protocol URL or DOI formats. Please update them to use valid HTTPS URLs, DOIs (e.g., 10.1000/xyz123), or DOI URLs (e.g., https://doi.org/10.1000/xyz123).",
            "Please correct the protocol URL or DOI format for each performance in the list above."
          );
          errorArray.push({
            type: "notyf",
            message: `Please correct the protocol URL or DOI format for all performances before continuing.`,
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
        const userSelectedTheyHaveMultipleModalities =
          isCheckboxCardChecked("modality-selection-yes");
        const userSelectedTheyDoNotHaveMultipleModalities =
          isCheckboxCardChecked("modality-selection-no");

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

        if (entityType === "non-data-folders") {
          const userSelectedNonDataFolders = window.sodaJSONObj["non-data-folders"];
          // Make sure the user categorized at least one file into each of the non-data folders
          // that should have files categorized into them
          for (const folder of userSelectedNonDataFolders) {
            const categorizedFileCount = getCategorizedEntityFileList(
              "non-data-folders",
              folder
            ).length;
            if (categorizedFileCount === 0) {
              errorArray.push({
                type: "notyf",
                message: `You indicated that your dataset contains ${folder} files, but you have not categorized any files into the ${folder} folder. Please categorize all of your ${folder} files before continuing.`,
              });
              throw errorArray;
            }
          }

          // Check to make sure all files were not selected here (if they have subjects) because then there would
          // be no experimental data
          const nonDataFileCount = getFilesByEntityType(["non-data-folders"]);
          const nonDataFileCountLength = nonDataFileCount.length;

          if (nonDataFileCountLength >= datasetFileCount) {
            if (selectedEntities.includes("subjects")) {
              errorArray.push({
                type: "notyf",
                message: `You indicated that your dataset contains subject-related data (experimental), but all files are categorized as non-data folders (code, docs, protocol). Please decategorize the experimental data files from the non-data folders before continuing.`,
              });
              throw errorArray;
            }
          }
        }

        if (entityType === "experimental") {
          const experimentalFileCount = getCategorizedEntityFileList(
            "experimental",
            "experimental"
          ).length;

          if (experimentalFileCount === 0) {
            errorArray.push({
              type: "notyf",
              message: "Please select your experimental data files before continuing.",
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

        if (entityType === "subjects") {
          // Get a list of files that were marked as experimental but not assigned to any entities
          const experimentalFiles = getFilesByEntityType("experimental");
          const entityAssociatedFiles = getFilesByEntityType([
            "sites",
            "derived-samples",
            "samples",
            "subjects",
          ]);
          // Find items that were associated to experimentalFiles but not in entityAssociatedFiles
          const unassociatedExperimentalFiles = experimentalFiles.filter(
            (file) => !entityAssociatedFiles.includes(file)
          );
          const previousBypassedExperimentalFiles =
            window.sodaJSONObj["bypassed-experimental-files"];
          if (unassociatedExperimentalFiles.length > 0) {
            // Check if the arrays are different by comparing their contents
            const arraysAreDifferent =
              !previousBypassedExperimentalFiles ||
              previousBypassedExperimentalFiles.length !== unassociatedExperimentalFiles.length ||
              !unassociatedExperimentalFiles.every((file) =>
                previousBypassedExperimentalFiles.includes(file)
              );

            if (arraysAreDifferent) {
              const hierarchyEntitiesList = getOxfordCommaSeparatedListOfEntities("or");
              const continueWithUnassociatedExperimentalFiles = await swalListDoubleAction(
                unassociatedExperimentalFiles.map((file) =>
                  file.startsWith("data/") ? file.substring(5) : file
                ),
                "Unassociated Experimental Files Detected",
                `The following experimental files have not been associated with any ${hierarchyEntitiesList}. 
                You can choose to continue without associating these files, or go back to associate them with entities.`,
                "Continue without associating these files",
                "Go back to associate files",
                "What would you like to do with these unassociated experimental files?"
              );

              if (continueWithUnassociatedExperimentalFiles) {
                // User chose to continue - save the bypassed files
                window.sodaJSONObj["bypassed-experimental-files"] = unassociatedExperimentalFiles;
              } else {
                // User chose to go back - throw error to prevent navigation
                errorArray.push({
                  type: "notyf",
                  message:
                    "Please associate all experimental files with entities before continuing.",
                });
                throw errorArray;
              }
            }
          }
        }

        if (entityType !== "remaining-data-categorization") {
          // Whenever leaving a data categorization page, check the count of the
          // non-data-folders (e.g. code, docs) combined with the experimentally
          // marked files, and if they are not equal, we can assume that their are files that
          // were not categorized therefore remaining.

          const countOfNonRemainingDataCategories = getFilesByEntityType([
            "experimental",
            "non-data-folders",
          ]).length;

          if (countOfNonRemainingDataCategories >= datasetFileCount) {
            guidedSkipPageSet("guided-remaining-data-categorization-page-set");
          } else {
            guidedUnSkipPageSet("guided-remaining-data-categorization-page-set");
          }
        }
      }

      if (pageBeingLeftComponentType === "data-categories-questionnaire-page") {
        const questionnaireEntityType = pageBeingLeftDataSet.questionnaireEntityType;

        if (questionnaireEntityType === "experimental-data-categorization") {
          const categorizeExperimentalDataYes = isCheckboxCardChecked(
            "categorize-experimental-data-yes"
          );
          const categorizeExperimentalDataNo = isCheckboxCardChecked(
            "categorize-experimental-data-no"
          );
          if (!categorizeExperimentalDataYes && !categorizeExperimentalDataNo) {
            errorArray.push({
              type: "notyf",
              message: "Please indicate if you would like to categorize your Experimental data.",
            });
            throw errorArray;
          }

          if (categorizeExperimentalDataYes) {
            guidedUnSkipPage("experimental-data-categorization-tab");
            addEntityNameToEntityType("experimental-data-categorization", "Source");
            addEntityNameToEntityType("experimental-data-categorization", "Derivative");
          } else {
            guidedSkipPage("experimental-data-categorization-tab");
            removeEntityType("experimental-data-categorization");
          }
        }

        if (questionnaireEntityType === "remaining-data-categorization") {
          const categorizeRemainingDataYes = isCheckboxCardChecked("categorize-remaining-data-yes");
          const categorizeRemainingDataNo = isCheckboxCardChecked("categorize-remaining-data-no");
          if (!categorizeRemainingDataYes && !categorizeRemainingDataNo) {
            errorArray.push({
              type: "notyf",
              message: "Please indicate if you would like to categorize your remaining data.",
            });
            throw errorArray;
          }

          if (categorizeRemainingDataYes) {
            guidedUnSkipPage("remaining-data-categorization-tab");
            addEntityNameToEntityType("remaining-data-categorization", "Source");
            addEntityNameToEntityType("remaining-data-categorization", "Derivative");
          } else {
            guidedSkipPage("remaining-data-categorization-tab");
            removeEntityType("remaining-data-categorization");
          }
        }
      }

      if (
        pageBeingLeftComponentType === "entity-metadata-page" ||
        pageBeingLeftComponentType === "entity-spreadsheet-import-page"
      ) {
        const datasetEntityArray = useGlobalStore.getState().datasetEntityArray;
        window.sodaJSONObj["dataset-entity-array"] = datasetEntityArray;
        // Save progress early because a lot of work managing entities could have happened here
        // and we don't want the user to lost it.
        await guidedSaveProgress();

        if (datasetEntityArray.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "You must add at least one subject to your dataset before continuing",
          });
          throw errorArray;
        }

        // Check that the species was added for each subject in the datasetEntityArray
        // (This is to throw an error for old progress files that did not require species)
        const subjectsWithoutSpecies = datasetEntityArray
          .filter((entity) => !entity.metadata.species || entity.metadata.species.trim() === "")
          .map((entity) => entity.metadata.subject_id);
        if (subjectsWithoutSpecies.length > 0) {
          await swalListSingleAction(
            subjectsWithoutSpecies,
            "Required Species Information Missing",
            "Species information is now mandatory for all subjects in SPARC datasets. The following subject IDs are missing this required field. Please specify the taxonomic species (e.g., Homo sapiens, Rattus norvegicus, Mus musculus) for each subject.",
            "Please provide a species for each subject in the list above."
          );
          errorArray.push({
            type: "notyf",
            message: `Please complete species information for all subjects before continuing.`,
          });
          throw errorArray;
        }

        // Get a list of the entities that the user said they had on the dataset content page
        const selectedEntities = window.sodaJSONObj["selected-entities"];
        const subjects = getExistingSubjects();

        // This should always be true if the user is leaving this page but check just in case
        if (selectedEntities.includes("subjects")) {
          if (subjects.length === 0) {
            errorArray.push({
              type: "notyf",
              message: "You must add at least one subject to your dataset before continuing",
            });
            throw errorArray;
          }
        }

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
        // If the user said they had derived samples but did not add or import any, throw an error
        if (selectedEntities.includes("derivedSamples")) {
          if (getExistingSamples("derived-from-samples").length === 0) {
            errorArray.push({
              type: "notyf",
              message:
                "You indicated that your dataset contains derived samples (samples derived from other samples), but did not add any samples derived from other samples.",
            });
            throw errorArray;
          }
        }

        if (selectedEntities.includes("subjectSites")) {
          const subjectSites = getExistingSites().filter((site) =>
            site.specimen_id.startsWith("sub-")
          );
          if (subjectSites.length === 0) {
            errorArray.push({
              type: "notyf",
              message:
                "You indicated that you collected data from specific locations within your subjects, but did not add any site IDs for those subjects.",
            });
            throw errorArray;
          }
        }

        if (selectedEntities.includes("sampleSites")) {
          const sampleSites = getExistingSites().filter((site) =>
            site.specimen_id.startsWith("sam-")
          );
          if (sampleSites.length === 0) {
            errorArray.push({
              type: "notyf",
              message:
                "You indicated that you collected data from specific locations within your samples, but did not add any site IDs for those samples.",
            });
            throw errorArray;
          }
        }

        if (selectedEntities.includes("subjectSites") || selectedEntities.includes("sampleSites")) {
          const sites = getExistingSites();
          const sitesCopy = structuredClone(sites);
          const sitesMetadata = sitesCopy.map((site) => ({
            ...site.metadata,
          }));
          window.sodaJSONObj["dataset_metadata"]["sites"] = sitesMetadata;
        } else {
          // If sites metadata has been added, remove it (It shouldn't be there but just in case)
          if (window.sodaJSONObj["dataset_metadata"]?.["sites"]) {
            delete window.sodaJSONObj["dataset_metadata"]["sites"];
          }
        }
      }
    }

    // Handle page exit logic for pages that are not controlled by React components
    await savePageDatasetStructure(pageBeingLeftID);
    await savePageCurationPreparation(pageBeingLeftID);
    await savePagePrepareMetadata(pageBeingLeftID);
    await savePagePennsieveDetails(pageBeingLeftID);
    await savePageGenerateDataset(pageBeingLeftID);

    const datasetEntityArrayCopy = useGlobalStore.getState().datasetEntityArray;
    window.sodaJSONObj["dataset-entity-array"] = datasetEntityArrayCopy;

    const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
    window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;

    if (pageBeingLeftID === "guided-entity-addition-method-selection-tab") {
      const userSelectedAddEntitiesFromSpreadsheet = isCheckboxCardChecked(
        "guided-button-add-entities-via-spreadsheet"
      );
      const userSelectedAddEntitiesManually = isCheckboxCardChecked(
        "guided-button-add-entities-manually"
      );

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
    if (Array.isArray(error)) {
      for (const err of error) {
        if (err?.message) {
          window.log.error("Error saving page " + pageBeingLeftID + " changes:" + err.message);
        }
        if (err?.errorText) {
          window.log.error("Error saving page " + pageBeingLeftID + " changes:" + err.errorText);
        }
      }
    }
    window.log.error("Error saving page changes:", JSON.stringify(error, null, 2));
    guidedSetNavLoadingState(false);
    throw error;
  }

  guidedSetNavLoadingState(false);
};
