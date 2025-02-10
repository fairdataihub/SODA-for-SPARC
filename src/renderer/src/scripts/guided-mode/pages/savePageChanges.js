import { guidedSetNavLoadingState } from "../pageNavigation/pageLoading";
import { getDatasetEntityObj } from "../../../stores/slices/datasetEntitySelectorSlice";
import {
  guidedSkipPage,
  guidedUnSkipPage,
  getNonSkippedGuidedModePages,
} from "../pageNavigation/pageSkipping";
import { userErrorMessage } from "../../others/http-error-handler/error-handler";
import { startOrStopAnimationsInContainer } from "../lotties/lottie";
import api from "../../others/api/api";
import useGlobalStore from "../../../stores/globalStore";
import { openPage } from "../pages/openPage";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
let guidedProgressFilePath = window.path.join(homeDir, "SODA", "Guided-Progress");

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
        await openPage(firstPage.id);
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

        const datasetIsLocked = await api.isDatasetLocked(selectedPennsieveDataset);
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

    // if (pageBeingLeftID === "guided-prepare-dataset-structure-tab") {
    //   const selectedEntities = useGlobalStore.getState()["selectedEntities"];
    //   console.log("selectedEntities", selectedEntities);
    //   if (selectedEntities.length === 0) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "Please select at least one option that applies to your dataset",
    //     });
    //     throw errorArray;
    //   }
    //   console.log("selectedEntities", selectedEntities);
    //   window.sodaJSONObj["selected-entities"] = selectedEntities;
    //   console.log("selectedEntities", selectedEntities);

    //   if (!selectedEntities.includes("subjects") && !selectedEntities.includes("code")) {
    //     errorArray.push({
    //       type: "notyf",
    //       message: "You must indicate that your dataset contains subjects and/or code",
    //     });
    //     throw errorArray;
    //   }

    //   if (selectedEntities.includes("subjects")) {
    //     guidedUnSkipPage("guided-subjects-entity-addition-tab");
    //     guidedUnSkipPage("guided-subjects-entity-selection-tab");
    //     guidedUnSkipPage("guided-unstructured-data-import-tab");
    //     guidedUnSkipPage("guided-create-subjects-metadata-tab");
    //   } else {
    //     guidedSkipPage("guided-subjects-entity-addition-tab");
    //     guidedSkipPage("guided-subjects-entity-selection-tab");
    //     guidedSkipPage("guided-unstructured-data-import-tab");
    //     guidedSkipPage("guided-create-subjects-metadata-tab");
    //   }

    //   if (selectedEntities.includes("samples")) {
    //     guidedUnSkipPage("guided-samples-entity-addition-tab");
    //     guidedUnSkipPage("guided-samples-entity-selection-tab");
    //     guidedUnSkipPage("guided-create-samples-metadata-tab");
    //   } else {
    //     guidedSkipPage("guided-samples-entity-addition-tab");
    //     guidedSkipPage("guided-samples-entity-selection-tab");
    //     guidedSkipPage("guided-create-samples-metadata-tab");
    //   }

    //   if (selectedEntities.includes("sites")) {
    //     guidedUnSkipPage("guided-sites-entity-addition-tab");
    //     guidedUnSkipPage("guided-sites-entity-selection-tab");
    //     guidedUnSkipPage("guided-create-sites-metadata-tab");
    //   } else {
    //     guidedSkipPage("guided-sites-entity-addition-tab");
    //     guidedSkipPage("guided-sites-entity-selection-tab");
    //     guidedSkipPage("guided-create-sites-metadata-tab");
    //   }

    //   if (selectedEntities.includes("performances")) {
    //     guidedUnSkipPage("guided-performances-entity-addition-tab");
    //     guidedUnSkipPage("guided-performances-entity-selection-tab");
    //     guidedUnSkipPage("guided-create-performances-metadata-tab");
    //   } else {
    //     guidedSkipPage("guided-performances-entity-addition-tab");
    //     guidedSkipPage("guided-performances-entity-selection-tab");
    //     guidedSkipPage("guided-create-performances-metadata-tab");
    //   }

    //   if (selectedEntities.includes("code")) {
    //     guidedUnSkipPage("guided-code-folder-tab");
    //   } else {
    //     guidedSkipPage("guided-code-folder-tab");
    //   }
    // }

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
    //     guidedUnSkipPage(`guided-manifest-sample-entity-selector-tab`);

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
    //     guidedSkipPage(`guided-manifest-sample-entity-selector-tab`);
    //     //Skip the samples metadata page
    //     guidedSkipPage(`guided-create-samples-metadata-tab`);
    //   }

    //   const userSelectedDatasetIsReJoinFunded = document
    //     .getElementById("guided-button-dataset-is-re-join-funded")
    //     .classList.contains("selected");

    //   if (userSelectedDatasetIsReJoinFunded) {
    //     window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["consortium-data-standard"] =
    //       "HEAL";
    //     window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["funding-consortium"] =
    //       "REJOIN-HEAL";
    //   }
    // }

    // if (pageBeingLeftID === "guided-manifest-subject-entity-selector-tab") {
    //   window.sodaJSONObj["subject-related-folders-and-files"] = getEntityObjForEntityType(
    //     "subject-related-folders-and-files"
    //   );
    //   console.log(
    //     "subject-related-folders-and-files",
    //     window.sodaJSONObj["subject-related-folders-and-files"]
    //   );
    // }
    // if (pageBeingLeftID === "guided-manifest-sample-entity-selector-tab") {
    //   window.sodaJSONObj["sample-related-folders-and-files"] = getEntityObjForEntityType(
    //     "sample-related-folders-and-files"
    //   );
    //   console.log(
    //     "sample-related-folders-and-files",
    //     window.sodaJSONObj["sample-related-folders-and-files"]
    //   );
    // }
    // if (pageBeingLeftID === "guided-manifest-performance-entity-selector-tab") {
    //   window.sodaJSONObj["performance-related-folders-and-files"] = getEntityObjForEntityType(
    //     "performance-related-folders-and-files"
    //   );
    //   console.log(
    //     "performance-related-folders-and-files",
    //     window.sodaJSONObj["performance-related-folders-and-files"]
    //   );
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
    //       if (window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
    //         delete window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
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
    //       if (window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
    //         delete window.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
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
    //   window.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
    //   //Save the data and milestones to the window.sodaJSONObj
    //   window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
    //   window.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
    //     completionDate;
    // }

    // if (pageBeingLeftID === "guided-contributors-tab") {
    //   // Make sure the user has added at least one contributor
    //   const contributors =
    //     window.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
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
    //       window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

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
    //     window.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
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
    //     window.sodaJSONObj["dataset-metadata"]["README"] = readMe;
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
    //     window.sodaJSONObj["dataset-metadata"]["CHANGES"] = changes;
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
