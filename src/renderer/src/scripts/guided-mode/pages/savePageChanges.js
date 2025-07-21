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
        window.sodaJSONObj["dataset_performances"] = performanceList;
      }

      if (pageBeingLeftComponentType === "modality-selection-page") {
        const userSelectedTheyHaveMultipleModalities = document
          .getElementById("modality-selection-yes")
          .classList.contains("selected");
        const userSelectedTheyDoNotHaveMultipleModalities = document
          .getElementById("modality-selection-no")
          .classList.contains("selected");
        console.log(
          "userSelectedTheyHaveMultipleModalities",
          userSelectedTheyHaveMultipleModalities
        );
        console.log(
          "userSelectedTheyDoNotHaveMultipleModalities",
          userSelectedTheyDoNotHaveMultipleModalities
        );

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

        // Save the dataset entity object to the progress file
        window.sodaJSONObj["dataset-entity-obj"] = datasetEntityObj;
        console.log("Validating data categorization page");

        const datasetFileCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
        const categorizedData = datasetEntityObj?.["high-level-folder-data-categorization"];
        console.log("dataset file count", datasetFileCount);
        console.log("datasetEntityObj2", JSON.stringify(datasetEntityObj, null, 2));
        console.log(
          "datasetStructureJSONObj",
          JSON.stringify(window.datasetStructureJSONObj, null, 2)
        );
        console.log("categorizedData", categorizedData);

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
        console.log("datasetEntityObj when leaving" + pageBeingLeftID, datasetEntityObj);
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

        // Save the Sites metadata since all site addition and metadata intake is done
        // on this page

        // Prepare the sites metadata
        const sites = getExistingSites();
        const sitesMetadata = sites.map((site) => ({
          ...site.metadata,
          specimen_id: `${site.metadata.subject_id} ${site.metadata.sample_id}`,
        }));
        console.log("sitesMetadata", sitesMetadata);
        window.sodaJSONObj["dataset_metadata"]["sites_metadata"] = sitesMetadata;
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
    // if (pageBeingLeftID === "guided-subjects-addition-tab") {
    //   if (window.getExistingSubjectNames().length === 0) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please add at least one subject",
    //     });
    //     throw errorArray;
    //   }
    // }

    // if (pageBeingLeftID === "guided-samples-addition-tab") {
    //   const userSelectedDatasetHasSamples = document
    //     .getElementById("guided-button-samples-page-subjects-have-samples")
    //     .classList.contains("selected");
    //   const userSelectedDatasetDoesNotHaveSamples = document
    //     .getElementById("guided-button-samples-page-subjects-do-not-have-samples")
    //     .classList.contains("selected");

    //   if (!userSelectedDatasetHasSamples && !userSelectedDatasetDoesNotHaveSamples) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please indicate whether or not the dataset contains samples",
    //     });
    //     throw errorArray;
    //   }

    //   const samples = getExistingSampleNames();

    //   if (userSelectedDatasetHasSamples) {
    //     if (samples.length === 0) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please add at least one sample to a subject",
    //       });
    //       throw errorArray;
    //     }
    //     //Unskip the sample file annotation page

    //     //Unskip the samples metadata page
    //     guidedUnSkipPage(`guided-create-samples-metadata-tab`);
    //   }
    //   if (userSelectedDatasetDoesNotHaveSamples) {
    //     if (samples.length > 0) {
    //       document.getElementById("guided-button-samples-page-subjects-have-samples").click();
    //       errorArray.push({
    //         type: "notyf",
    //         message:
    //           "Please indicate that your dataset contains samples or delete the samples you have added.",
    //       });
    //       throw errorArray;
    //     }

    //     //Skip the sample data organization pages
    //     //Skip the samples metadata page
    //     guidedSkipPage(`guided-create-samples-metadata-tab`);
    //   }

    //   const userSelectedDatasetIsReJoinFunded = document
    //     .getElementById("guided-button-dataset-is-re-join-funded")
    //     .classList.contains("selected");

    //   if (userSelectedDatasetIsReJoinFunded) {
    //     window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["consortium-data-standard"] =
    //       "HEAL";
    //     window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"] =
    //       "REJOIN-HEAL";
    //   }
    // }

    // if (pageBeingLeftID === "guided-subject-structure-spreadsheet-importation-tab") {
    //   const userChoseToImportSubsSamsPoolsViaSpreadsheet = document
    //     .getElementById("guided-button-import-subject-structure-from-spreadsheet")
    //     .classList.contains("selected");
    //   const userChoseToEnterSubsSamsPoolsManually = document
    //     .getElementById("guided-button-add-subject-structure-manually")
    //     .classList.contains("selected");

    //   if (!userChoseToImportSubsSamsPoolsViaSpreadsheet && !userChoseToEnterSubsSamsPoolsManually) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please indicate how you would like to add your subject structure",
    //     });
    //     throw errorArray;
    //   }

    //   if (userChoseToImportSubsSamsPoolsViaSpreadsheet) {
    //     const userSelectedDatasetHasPools = document
    //       .getElementById("guided-button-spreadsheet-subjects-are-pooled")
    //       .classList.contains("selected");
    //     const userSelectedDatasetDoesNotHavePools = document
    //       .getElementById("guided-button-spreadsheet-subjects-are-not-pooled")
    //       .classList.contains("selected");
    //     if (!userSelectedDatasetHasPools && !userSelectedDatasetDoesNotHavePools) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please indicate whether or not the dataset contains pools",
    //       });
    //       throw errorArray;
    //     }

    //     const userSelectedSubjectsHaveSamples = document
    //       .getElementById("guided-button-spreadsheet-subjects-have-samples")
    //       .classList.contains("selected");
    //     const userSelectedSubjectsDoNotHaveSamples = document
    //       .getElementById("guided-button-spreadsheet-subjects-do-not-have-samples")
    //       .classList.contains("selected");
    //     if (!userSelectedSubjectsHaveSamples && !userSelectedSubjectsDoNotHaveSamples) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please indicate whether or not the dataset contains samples",
    //       });
    //       throw errorArray;
    //     }

    //     const subjects = window.getExistingSubjectNames();
    //     if (subjects.length === 0) {
    //       errorArray.push({
    //         type: "swal",
    //         message: `
    //           You indicated that you would like to import your subject structure from a spreadsheet, however,
    //           you have not added any subjects.
    //           <br/><br/>
    //           Please fill out and import the spreadsheet or select that you would not like to add your subject structure via a spreadsheet.
    //         `,
    //       });
    //       throw errorArray;
    //     }
    //   }
    // }

    // if (pageBeingLeftID === "guided-code-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-protocol-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-docs-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-add-code-metadata-tab") {
    //   const startNewCodeDescYesNoContainer = document.getElementById(
    //     "guided-section-start-new-code-metadata-query"
    //   );
    //   const startPennsieveCodeDescYesNoContainer = document.getElementById(
    //     "guided-section-start-from-pennsieve-code-metadata-query"
    //   );

    //   if (!startNewCodeDescYesNoContainer.classList.contains("hidden")) {
    //     const buttonYesComputationalModelingData = document.getElementById(
    //       "guided-button-has-computational-modeling-data"
    //     );
    //     const buttonNoComputationalModelingData = document.getElementById(
    //       "guided-button-no-computational-modeling-data"
    //     );

    //     if (
    //       !buttonYesComputationalModelingData.classList.contains("selected") &&
    //       !buttonNoComputationalModelingData.classList.contains("selected")
    //     ) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please specify if your dataset contains computational modeling data",
    //       });
    //       throw errorArray;
    //     }

    //     if (buttonYesComputationalModelingData.classList.contains("selected")) {
    //       const codeDescriptionPathElement = document.getElementById(
    //         "guided-code-description-para-text"
    //       );
    //       //check if the innerhtml of the code description path element is a valid path
    //       if (codeDescriptionPathElement.innerHTML === "") {
    //         errorArray.push({
    //           type: "notyf",
    //           message: "Please import your code description file",
    //         });
    //         throw errorArray;
    //       }

    //       const codeDescriptionPath = codeDescriptionPathElement.innerHTML;
    //       //Check if the code description file is valid
    //       if (!window.fs.existsSync(codeDescriptionPath)) {
    //         errorArray.push({
    //           type: "notyf",
    //           message: "The imported code_description file does not exist at the selected path",
    //         });
    //         throw errorArray;
    //       }
    //     }

    //     if (buttonNoComputationalModelingData.classList.contains("selected")) {
    //       //If the user had imported a code description file, remove it
    //       if (window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"]) {
    //         delete window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"];
    //       }
    //     }
    //   }
    //   if (!startPennsieveCodeDescYesNoContainer.classList.contains("hidden")) {
    //     const buttonUpdateCodeDescription = document.getElementById(
    //       "guided-button-update-code-description-on-pennsieve"
    //     );
    //     const buttonKeepCodeDescription = document.getElementById(
    //       "guided-button-keep-code-description-on-pennsieve"
    //     );

    //     if (
    //       !buttonUpdateCodeDescription.classList.contains("selected") &&
    //       !buttonKeepCodeDescription.classList.contains("selected")
    //     ) {
    //       errorArray.push({
    //         type: "notyf",
    //         message:
    //           "Please specify if you would like to update your code_description file on Pennsieve",
    //       });
    //       throw errorArray;
    //     }

    //     if (buttonUpdateCodeDescription.classList.contains("selected")) {
    //       const codeDescriptionPathElement = document.getElementById(
    //         "guided-code-description-para-text"
    //       );
    //       //check if the innerhtml of the code description path element is a valid path
    //       if (codeDescriptionPathElement.innerHTML === "") {
    //         errorArray.push({
    //           type: "notyf",
    //           message: "Please import your code description file",
    //         });
    //         throw errorArray;
    //       }

    //       const codeDescriptionPath = codeDescriptionPathElement.innerHTML;
    //       //Check if the code description file is valid
    //       if (!window.fs.existsSync(codeDescriptionPath)) {
    //         errorArray.push({
    //           type: "notyf",
    //           message: "The imported code_description file does not exist at the selected path",
    //         });
    //         throw errorArray;
    //       }
    //     }

    //     if (buttonKeepCodeDescription.classList.contains("selected")) {
    //       //If the user had imported a code description file, remove it
    //       if (window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"]) {
    //         delete window.sodaJSONObj["dataset_metadata"]["code-metadata"]["code_description"];
    //       }
    //     }
    //   }
    // }

    // if (pageBeingLeftID === "guided-assign-license-tab") {
    //   const licenseRadioButtonContainer = document.getElementById(
    //     "guided-license-radio-button-container"
    //   );
    //   // Get the button that contains the class selected
    //   const selectedLicenseButton =
    //     licenseRadioButtonContainer.getElementsByClassName("selected")[0];
    //   if (!selectedLicenseButton) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please select a license",
    //     });
    //     throw errorArray;
    //   }
    //   const selectedLicense = selectedLicenseButton.dataset.value;
    //   window.sodaJSONObj["digital-metadata"]["license"] = selectedLicense;
    // }

    // if (pageBeingLeftID === "guided-contributors-tab") {
    //   // Make sure the user has added at least one contributor
    //   const contributors =
    //     window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributors"];
    //   if (contributors.length === 0) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please add at least one contributor to your dataset",
    //     });
    //     throw errorArray;
    //   }

    //   // Make sure that all contributors have a valid fields
    //   for (const contributor of contributors) {
    //     if (!window.contributorDataIsValid(contributor)) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please make sure all contributors have valid metadata",
    //       });
    //       throw errorArray;
    //     }
    //   }
    // }

    // if (pageBeingLeftID === "guided-protocols-tab") {
    //   const buttonYesUserHasProtocols = document.getElementById("guided-button-user-has-protocols");
    //   const buttonNoDelayProtocolEntry = document.getElementById(
    //     "guided-button-delay-protocol-entry"
    //   );
    //   if (
    //     !buttonYesUserHasProtocols.classList.contains("selected") &&
    //     !buttonNoDelayProtocolEntry.classList.contains("selected")
    //   ) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please indicate if protocols are ready to be added to your dataset",
    //     });
    //     throw errorArray;
    //   }

    //   if (buttonYesUserHasProtocols.classList.contains("selected")) {
    //     const protocols =
    //       window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"];

    //     if (protocols.length === 0) {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please add at least one protocol",
    //       });
    //       throw errorArray;
    //     }

    //     const unFairProtocols = protocols.filter((protocol) => protocol["isFair"] === false);
    //     if (unFairProtocols.length > 0) {
    //       errorArray.push({
    //         type: "notyf",
    //         message:
    //           "Some of your protocols are missing data. Please edit all invalid rows in the table.",
    //       });
    //       throw errorArray;
    //     }
    //   }

    //   if (buttonNoDelayProtocolEntry.classList.contains("selected")) {
    //     window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"] = [];
    //   }
    // }

    // if (pageBeingLeftID === "guided-create-changes-metadata-tab") {
    //   const changesTextArea = document.getElementById("guided-textarea-create-changes");
    //   if (changesTextArea.value.trim() === "") {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please enter CHANGES for your dataset",
    //     });
    //     throw errorArray;
    //   } else {
    //     const changes = changesTextArea.value.trim();
    //     window.sodaJSONObj["dataset_metadata"]["CHANGES"] = changes;
    //   }
    // }
    // if (pageBeingLeftID === "guided-generate-dataset-locally") {
    //   // If the user generated a local copy of the dataset, ask them if they would like to delete it
    //   if (window.fs.existsSync(window.sodaJSONObj["path-to-local-dataset-copy"])) {
    //     if (!window.sodaJSONObj["user-confirmed-to-keep-local-copy"]) {
    //       const deleteLocalCopy = await swalConfirmAction(
    //         null,
    //         "Would you like SODA to delete your local dataset copy?",
    //         "Deleting your local dataset copy will free up space on your computer.",
    //         "Yes",
    //         "No"
    //       );
    //       if (deleteLocalCopy) {
    //         // User chose to delete the local copy
    //         window.fs.rmdirSync(window.sodaJSONObj["path-to-local-dataset-copy"], {
    //           recursive: true,
    //         });
    //         delete window.sodaJSONObj["path-to-local-dataset-copy"];
    //         delete window.sodaJSONObj["user-confirmed-to-keep-local-copy"];
    //       } else {
    //         // User chose to keep the local copy so set the user-confirmed-to-keep-local-copy to true
    //         // So they don't get asked again
    //         window.sodaJSONObj["user-confirmed-to-keep-local-copy"] = true;
    //       }
    //     }
    //   }
    //   window.sodaJSONObj["path-to-local-dataset-copy"];
    // }

    // if (pageBeingLeftID === "guided-dataset-dissemination-tab") {
    //   //Save the DOI information of the dataset
    //   window.sodaJSONObj["digital-metadata"]["doi"] = $("#guided--para-doi-info").text();
    //   // Reset the share with curation UI and DOI UI
    //   $("#guided--prepublishing-checklist-container").addClass("hidden");
    //   $("#guided--para-doi-info").text("");
    //   $("#guided-button-unshare-dataset-with-curation-team");
    // }

    // if (pageBeingLeftID === "guided-dataset-validation-tab") {
    //   const guidedButtonRunValidation = document.getElementById(
    //     "guided-button-run-dataset-validation"
    //   );
    //   const guidedButtonSkipValidation = document.getElementById(
    //     "guided-button-skip-dataset-validation"
    //   );
    //   if (
    //     !guidedButtonRunValidation.classList.contains("selected") &&
    //     !guidedButtonSkipValidation.classList.contains("selected")
    //   ) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please indicate if you would like to run validation on your dataset",
    //     });
    //     throw errorArray;
    //   }

    //   if (guidedButtonRunValidation.classList.contains("selected")) {
    //     if (!window.sodaJSONObj["dataset-validated"] === "true") {
    //       errorArray.push({
    //         type: "notyf",
    //         message: "This check can be removed to make validation unnecessary",
    //       });
    //       throw errorArray;
    //     }
    //   }
    //   if (guidedButtonSkipValidation.classList.contains("selected")) {
    //     // We don't have to do anything here.
    //   }
    // }

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
