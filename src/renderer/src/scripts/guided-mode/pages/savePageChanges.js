import { guidedSetNavLoadingState } from "./navigationUtils/pageLoading";
import { getDatasetEntityObj } from "../../../stores/slices/datasetEntitySelectorSlice";
import { startOrStopAnimationsInContainer } from "../lotties/lottie";
import { savePageCurationPreparation } from "./curationPreparation/savePage";
import { savePagePrepareMetadata } from "./prepareMetadata/savePage";
import { guidedSkipPage, guidedUnSkipPage } from "./navigationUtils/pageSkipping";
import useGlobalStore from "../../../stores/globalStore";
import { contentOptionsMap } from "../../../components/pages/DatasetContentSelector";

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
          errorArray.push({
            type: "notyf",
            message: "Please select at least one modality",
          });
          throw errorArray;
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

        // If subjects is selected, verify all questions were answered
        if (selectedEntities.includes("subjects")) {
          // Check if all questions have been answered
          for (const entity of Object.keys(contentOptionsMap)) {
            if (!selectedEntities.includes(entity) && !deSelectedEntities.includes(entity)) {
              errorArray.push({
                type: "notyf",
                message:
                  "Please answer all questions (select Yes or No for each option) before continuing.",
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

      if (pageBeingLeftComponentType === "dataset-entity-metadata-page") {
        const datasetEntityArray = useGlobalStore.getState().datasetEntityArray;

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

    // if (pageBeingLeftID === "guided-primary-data-organization-tab") {
    //   cleanUpEmptyFoldersFromGeneratedGuidedStructure("primary");
    // }

    // if (pageBeingLeftID === "guided-source-data-organization-tab") {
    //   cleanUpEmptyFoldersFromGeneratedGuidedStructure("source");
    // }

    // if (pageBeingLeftID === "guided-derivative-data-selection-tab") {
    //   cleanUpEmptyFoldersFromGeneratedGuidedStructure("derivative");
    // }

    // if (pageBeingLeftID === "guided-code-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-protocol-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-docs-folder-tab") {
    // }

    // if (pageBeingLeftID === "guided-create-subjects-metadata-tab") {
    //   //Save the subject metadata from the subject currently being modified
    //   window.addSubject("guided");

    //   const subjectsAsideItemsCount = document.querySelectorAll(
    //     ".subjects-metadata-aside-item"
    //   ).length;
    //   const subjectsInTableDataCount = window.subjectsTableData.length - 1;
    //   if (subjectsAsideItemsCount !== subjectsInTableDataCount) {
    //     let result = await Swal.fire({
    //       heightAuto: false,
    //       backdrop: "rgba(0,0,0,0.4)",
    //       title: "Continue without adding subject metadata to all subjects?",
    //       text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add subject metadata for all subjects.",
    //       icon: "warning",
    //       showCancelButton: true,
    //       confirmButtonColor: "#3085d6",
    //       cancelButtonColor: "#d33",
    //       confirmButtonText: "Finish adding metadata to all subjects",
    //       cancelButtonText: "Continue without adding metadata to all subjects",
    //     });
    //     if (result.isConfirmed) {
    //       throw new Error("Returning to subject metadata addition page to complete all fields");
    //     }
    //   }
    // }

    // if (pageBeingLeftID === "guided-create-samples-metadata-tab") {
    //   //Save the sample metadata from the sample currently being modified
    //   window.addSample("guided");

    //   const samplesAsideItemsCount = document.querySelectorAll(
    //     ".samples-metadata-aside-item"
    //   ).length;
    //   const samplesInTableDataCount = window.samplesTableData.length - 1;
    //   if (samplesAsideItemsCount !== samplesInTableDataCount) {
    //     let result = await Swal.fire({
    //       heightAuto: false,
    //       backdrop: "rgba(0,0,0,0.4)",
    //       title: "Continue without adding sample metadata to all samples?",
    //       text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add sample metadata for all samples.",
    //       icon: "warning",
    //       showCancelButton: true,
    //       confirmButtonColor: "#3085d6",
    //       cancelButtonColor: "#d33",
    //       confirmButtonText: "Finish adding metadata to all samples",
    //       cancelButtonText: "Continue without adding metadata to all samples",
    //     });
    //     if (result.isConfirmed) {
    //       throw new Error("Returning to sample metadata addition page to complete all fields");
    //     }
    //   }
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

    // if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
    //   const confirmAccountbutton = document.getElementById(
    //     "guided-confirm-pennsieve-account-button"
    //   );
    //   if (!confirmAccountbutton.classList.contains("selected")) {
    //     if (!window.defaultBfAccount) {
    //       // If the user has not logged in, throw an error
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please sign in to Pennsieve before continuing",
    //       });
    //       throw errorArray;
    //     } else {
    //       // If the user has not confirmed their account, throw an error
    //       errorArray.push({
    //         type: "notyf",
    //         message: "Please confirm your account before continuing",
    //       });
    //       throw errorArray;
    //     }
    //   }

    //   const confirmOrganizationButton = document.getElementById(
    //     "guided-confirm-pennsieve-organization-button"
    //   );
    //   const userSelectedWorkSpace = guidedGetCurrentUserWorkSpace();

    //   if (!userSelectedWorkSpace) {
    //     // If the user has not selected an organization, throw an error
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please select an organization before continuing",
    //     });
    //     throw errorArray;
    //   } else {
    //     window.sodaJSONObj["digital-metadata"]["dataset-workspace"] = userSelectedWorkSpace;
    //   }

    //   if (!confirmOrganizationButton.classList.contains("selected")) {
    //     // If the user has not confirmed their organization, throw an error
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please confirm your organization before continuing",
    //     });
    //     throw errorArray;
    //   }

    //   const pennsieveAgentChecksPassed = await window.getPennsieveAgentStatus();
    //   if (!pennsieveAgentChecksPassed) {
    //     window.unHideAndSmoothScrollToElement("guided-mode-post-log-in-pennsieve-agent-check");
    //     errorArray.push({
    //       type: "notyf",
    //       message: "The Pennsieve Agent must be installed and running to continue.",
    //     });
    //     throw errorArray;
    //   }

    //   window.sodaJSONObj["last-confirmed-bf-account-details"] = window.defaultBfAccount;
    //   window.sodaJSONObj["last-confirmed-pennsieve-workspace-details"] = userSelectedWorkSpace;
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

    // if (pageBeingLeftID === "guided-dataset-structure-review-tab") {
    //   //if folders and files in datasetStruture json obj are empty, warn the user
    //   if (
    //     Object.keys(window.datasetStructureJSONObj["folders"]).length === 0 &&
    //     Object.keys(window.datasetStructureJSONObj["files"]).length === 0
    //   ) {
    //     errorArray.push({
    //       type: "swal",
    //       message: `
    //         You have not added any files or folders to your dataset structure.
    //         <br/><br/>
    //         Please add files and folders to your dataset structure before continuing.
    //       `,
    //     });
    //     throw errorArray;
    //   }
    // }

    // if (pageBeingLeftID === "guided-create-submission-metadata-tab") {
    //   const award = document.getElementById("guided-submission-sparc-award-manual").value;
    //   const milestones = window.getTagsFromTagifyElement(window.guidedSubmissionTagsTagifyManual);
    //   const completionDate = document.getElementById(
    //     "guided-submission-completion-date-manual"
    //   ).value;

    //   const fundingConsortiumIsSparc = datasetIsSparcFunded();

    //   if (fundingConsortiumIsSparc && award === "") {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please add a SPARC award number to your submission metadata",
    //     });
    //     throw errorArray;
    //   }

    //   // save the award string to JSONObj to be shared with other award inputs
    //   window.sodaJSONObj["dataset_metadata"]["shared-metadata"]["sparc-award"] = award;
    //   //Save the data and milestones to the window.sodaJSONObj
    //   window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["milestones"] = milestones;
    //   window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["completion-date"] =
    //     completionDate;
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

    // if (pageBeingLeftID === "guided-create-description-metadata-tab") {
    //   try {
    //     guidedSaveDescriptionDatasetInformation();
    //     guidedSaveDescriptionStudyInformation();
    //     guidedSaveDescriptionContributorInformation();
    //   } catch (error) {
    //     console.log(error);
    //     errorArray.push({
    //       type: "notyf",
    //       message: error,
    //     });
    //     throw errorArray;
    //   }
    // }

    // if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
    //   const readMeTextArea = document.getElementById("guided-textarea-create-readme");
    //   if (readMeTextArea.value.trim() === "") {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please enter a README for your dataset",
    //     });
    //     throw errorArray;
    //   } else {
    //     const readMe = readMeTextArea.value.trim();
    //     window.sodaJSONObj["dataset_metadata"]["README"] = readMe;
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
    // if (pageBeingLeftID === "guided-create-local-copy-tab") {
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
