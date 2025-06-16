import { setGuidedProgressBarValue, updateDatasetUploadProgressTable } from "./uploadProgressBar";
import { guidedCreateManifestFilesAndAddToDatasetStructure } from "../manifests/manifest";
import { guidedSetNavLoadingState } from "../pages/navigationUtils/pageLoading";
import { clientError, userErrorMessage } from "../../others/http-error-handler/error-handler";
import { guidedTransitionToHome, scrollToBottomOfGuidedBody } from "../pages/navigate";
import { savePageChanges, guidedSaveProgress } from "../pages/savePageChanges";
import client from "../../client";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import { successCheck, errorMark } from "../../../assets/lotties/lotties";
import {
  guidedGetDatasetName,
  guidedGetDatasetId,
  datasetIsSparcFunded,
  guidedGetDatasetOrigin,
} from "../utils/sodaJSONObj";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";

import datasetUploadSession from "../../analytics/upload-session-tracker";
import { pageIsSkipped } from "../pages/navigationUtils/pageSkipping";
import kombuchaEnums from "../../analytics/analytics-enums";
import Swal from "sweetalert2";
import lottie from "lottie-web";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 *
 * @returns {Promise<void>}
 * @description This function is called when the user clicks the "Generate Dataset" button at the end of the Prepare Dataset Step-by-Step workflows.
 *              It will create the dataset on Pennsieve and upload the dataset files. If the upload fails the user will be prompted to retry the upload or save and exit.
 *              When retrying the upload progress is resumed from where last left off - incompletely uploaded files will be restarted but finished files will be skipped.
 *
 */
export const guidedPennsieveDatasetUpload = async () => {
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

    if (userMadeItToLastStep() && window.retryGuidedMode) {
      // scroll to the upload status table
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
      // upload on the last step
      await guidedUploadDatasetToPennsieve();
      return;
    }

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
    amountOfTimesPennsieveUploadFailed = 0; //reset the upload failed counter
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);

    amountOfTimesPennsieveUploadFailed += 1;
    window.retryGuidedMode = true; //set the retry flag to true
    // run pre flight checks until they pass or fail 3 times
    let supplementaryChecks = false;
    while (!supplementaryChecks && amountOfTimesPennsieveUploadFailed <= 3) {
      supplementaryChecks = await window.run_pre_flight_checks(
        "guided-mode-pre-generate-pennsieve-agent-check"
      );
      if (!supplementaryChecks) amountOfTimesPennsieveUploadFailed += 1;
    }

    // if upload failed 3 times give user option to save and exit or try again
    if (amountOfTimesPennsieveUploadFailed > 3) {
      //make an unclosable sweet alert that forces the user to retry or close the app
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

      // save & exit the upload
      if (!res.isConfirmed) {
        const currentPageID = window.CURRENT_PAGE.id;
        try {
          await savePageChanges(currentPageID);
        } catch (error) {
          window.log.error("Error saving page changes", error);
        }
        guidedTransitionToHome();
        return;
      }
    }

    // retry the upload
    await guidedPennsieveDatasetUpload();
  }
  guidedSetNavLoadingState(false);
};

let amountOfTimesPennsieveUploadFailed = 0;

const userMadeItToLastStep = () => {
  return !document
    .querySelector("#guided-div-dataset-upload-status-table")
    .classList.contains("hidden");
};

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
      kombuchaEnums.Action.ADD_EDIT_DATASET_METADATA,
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

    datasetDescriptionUploadText.innerHTML = "Failed to add a dataset description.";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "error");
    throw new Error(userErrorMessage(error));
  }
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
    throw new Error(userErrorMessage(error));
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

export const guidedGenerateSubjectsMetadata = async (destination) => {
  // Get the list of existing subjects from the datasetEntityObj
  const existingSubjects = getExistingSubjects();
  console.log("Existing subjects:", existingSubjects);
  // Early return if subjects metadata table is empty or the tab is skipped
  if (existingSubjects.length === 0 || pageIsSkipped("guided-subjects-metadata-tab")) {
    return;
  }

  const generationDestination = destination === "Pennsieve" ? "Pennsieve" : "local";
  console.log("Generation destination:", generationDestination);

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

  // TODO: SDS3 normalize so that we only use one way of storing dataset name and account name
  window.sodaJSONObj["dataset_metadata"]["subjects"] = window.subjectsTableData;
  if (!window.sodaJSONObj["ps-account-selected"]) window.sodaJSONObj["ps-account-selected"] = {};
  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );

  try {
    // Generate the subjects metadata file
    await client.post(
      `/prepare_metadata/subjects_file`,
      {
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        soda: window.sodaJSONObj,
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

export const guidedGenerateSamplesMetadata = async (destination) => {
  // Early return if samples metadata table is empty or the tab is skipped
  if (window.samplesTableData.length === 0 || pageIsSkipped("guided-samples-metadata-tab")) {
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

  if (!window.sodaJSONObj["ps-account-selected"]) window.sodaJSONObj["ps-account-selected"] = {};
  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );
  window.sodaJSONObj["dataset_metadata"]["samples"] = window.samplesTableData;

  try {
    await client.post(
      `/prepare_metadata/samples_file`,
      {
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        soda: window.sodaJSONObj,
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

export const guidedGenerateSubmissionMetadata = async (destination) => {
  // Build the submission metadata array
  const guidedMilestones =
    window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["milestones"];
  const submissionMetadataArray = [];
  submissionMetadataArray.push({
    fundingConsortium:
      window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["funding-consortium"],
    consortiumDataStandard:
      window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["consortium-data-standard"],
    award: window.sodaJSONObj["dataset_metadata"]["shared-metadata"]["sparc-award"],
    date: window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["completion-date"] || "N/A",
    milestone: guidedMilestones[0] || "N/A",
  });
  if (window.sodaJSONObj["dataset_metadata"]["submission-metadata"]["milestones"].length > 1) {
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

  if (!window.sodaJSONObj["ps-account-selected"]) window.sodaJSONObj["ps-account-selected"] = {};
  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );
  window.sodaJSONObj["dataset_metadata"]["submission"] = submissionMetadataArray;

  try {
    await client.post(`/prepare_metadata/submission_file`, {
      soda: window.sodaJSONObj,
      filepath: generationDestination === "Pennsieve" ? "" : destination,
      upload_boolean: generationDestination === "Pennsieve",
    });
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

export const guidedGenerateDatasetDescriptionMetadata = async (destination) => {
  const guidedDatasetInformation =
    window.sodaJSONObj["dataset_metadata"]["description-metadata"]["dataset-information"];
  const guidedStudyInformation =
    window.sodaJSONObj["dataset_metadata"]["description-metadata"]["study-information"];

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

  if (!window.sodaJSONObj["ps-account-selected"]) window.sodaJSONObj["ps-account-selected"] = {};
  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );

  let basic_information = {
    title: guidedDatasetInformation["title"],
    description: guidedDatasetInformation["description"],
    keywords: guidedDatasetInformation["keywords"],
    subtitle: guidedDatasetInformation["subtitle"] || "",
    license: guidedDatasetInformation["license"] || "",
    funding: guidedDatasetInformation["funding"] || [],
    acknowledgments: guidedDatasetInformation["acknowledgments"] || [],
  };

  let funding_information = {
    funding_consortium: guidedDatasetInformation["funding-consortium"] || [],
    funding_agency: guidedDatasetInformation["funding-agency"] || [],
    award_number: guidedDatasetInformation["funding"] || [],
  };

  let study_information = {
    study_purpose: guidedStudyInformation["study-purpose"] || "",
    study_data_collection: guidedStudyInformation["study-data-collection"] || "",
    study_primary_conclusion: guidedStudyInformation["study-primary-conclusion"] || "",
    study_organ_system: guidedStudyInformation["study-organ-system"] || [],
    study_approach: guidedStudyInformation["study-approach"] || [],
    study_technique: guidedStudyInformation["study-technique"] || [],
    study_collection_title: guidedStudyInformation["study-collection-title"] || "",
  };

  let participant_information = {
    number_of_subjects: guidedStudyInformation["number-of-subjects"] || "",
    number_of_samples: guidedStudyInformation["number-of-samples"] || "",
    number_of_sites: guidedStudyInformation["number-of-sites"] || "",
    number_of_performances: guidedStudyInformation["number-of-performances"] || "",
  };

  let data_dictionary_information = {
    data_dictionary: guidedDatasetInformation["data-dictionary"] || [],
    data_dictionary_description: guidedDatasetInformation["data-dictionary-description"] || "",
    data_dictionary_type: guidedDatasetInformation["data-dictionary-link"] || "",
  };

  // TODO: SDS3 has more fields and not all of the existing fields align with that either now. Fix this before release.
  // REMAINING: datasetLinks and contributrorInformation key names
  window.sodaJSONObj["dataset_metadata"]["dataset_description"] = {
    type: guidedDatasetInformation["type"],
    standards_information: {
      data_standard: "SDS",
      data_standard_version: "3.0.1",
    },
    study_information: study_information,
    contributor_information: guidedContributorInformation,
    basic_information: basic_information,
    related_information: datasetLinks,
    funding_information: funding_information,
    participant_information: participant_information,
    data_dictionary_information: data_dictionary_information,
  };

  try {
    await client.post(
      `/prepare_metadata/dataset_description_file`,
      {
        soda: window.sodaJSONObj,
        filepath: generationDestination === "Pennsieve" ? "" : destination,
        soda: window.sodaJSONObj,
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

export const guidedGenerateReadmeMetadata = async (destination) => {
  const guidedReadMeMetadata = window.sodaJSONObj["dataset_metadata"]["README"];

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

  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );
  window.sodaJSONObj["dataset_metadata"]["README"] = guidedReadMeMetadata;

  try {
    if (generationDestination === "Pennsieve") {
      await client.post(
        `/prepare_metadata/readme_changes_file`,
        {
          soda: window.sodaJSONObj,
        },
        {
          params: {
            file_type: "README.txt",
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
export const guidedGenerateChangesMetadata = async (destination) => {
  // Early return if changes metadata table is empty or the tab is skipped
  if (pageIsSkipped("guided-create-changes-metadata-tab")) {
    return;
  }
  const guidedChangesMetadata = window.sodaJSONObj["dataset_metadata"]["CHANGES"];

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

  window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
  window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = guidedGetDatasetName(
    window.sodaJSONObj
  );
  window.sodaJSONObj["dataset_metadata"]["CHANGES"] = guidedChangesMetadata;

  try {
    if (generationDestination === "Pennsieve") {
      await client.post(
        `/prepare_metadata/readme_changes_file`,
        {
          soda: window.sodaJSONObj,
        },
        {
          params: {
            file_type: "CHANGES.txt",
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

export const guidedGenerateCodeDescriptionMetadata = async (destination) => {
  if (pageIsSkipped("guided-add-code-metadata-tab")) {
    return;
  }
  const codeDescriptionFilePath =
    window.sodaJSONObj["dataset_metadata"]?.["code-metadata"]?.["code_description"];
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
      await window.fs.copyFile(codeDescriptionFilePath, destination);
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

const guidedUploadDatasetToPennsieve = async () => {
  window.updateJSONStructureDSstructure();

  // Initiate curation by calling Python function
  let main_curate_status = "Solving";
  let main_total_generate_dataset_size;

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let dataset_name;
  let dataset_destination;

  if (window.sodaJSONObj["generate-dataset"]["destination"] == "ps") {
    //Replace files and folders since guided mode always uploads to an existing Pennsieve dataset
    window.sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
    window.sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
    dataset_name = window.sodaJSONObj["digital-metadata"]["name"];
    window.sodaJSONObj["ps-dataset-selected"] = {};
    window.sodaJSONObj["ps-dataset-selected"]["dataset-name"] = dataset_name;
    window.sodaJSONObj["ps-account-selected"]["account-name"] = window.defaultBfAccount;
    dataset_destination = "Pennsieve";
  }

  // if uploading to Pennsieve start a tracking session for the dataset upload
  if (dataset_destination == "Pennsieve") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }

  // create a copy of the window.sodaJSONobj that does not have the dataset_metadata key as it has already been uploaded
  // and we do not want to upload it again
  let datasetUploadObj = JSON.parse(JSON.stringify(window.sodaJSONObj));
  delete datasetUploadObj["dataset_metadata"];

  guidedSetNavLoadingState(true);
  client
    .post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: datasetUploadObj,
        resume: !!window.retryGuidedMode,
      },
      { timeout: 0 }
    )
    .then(async (curationRes) => {
      // if the upload succeeds reset the retry guided mode flag
      window.retryGuidedMode = false;
      // reset the amount of times the upload has failed
      amountOfTimesPennsieveUploadFailed = 0;
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

//Add  spinner to element
export const guidedUploadStatusIcon = (elementID, status) => {
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

const skipBannerImageUpload = () => {
  document.getElementById("guided-dataset-banner-image-upload-tr").classList.remove("hidden");
  const datasetBannerImageUploadText = document.getElementById(
    "guided-dataset-banner-image-upload-text"
  );
  datasetBannerImageUploadText.innerHTML = "Skipped optional banner image...";
  guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
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
    bannerImageSize = window.fs.statSync(bannerImagePath).size;
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

const guidedGetContributorInformation = () => {
  let guidedContributorInformation = {
    ...window.sodaJSONObj["dataset_metadata"]["description-metadata"]["contributor-information"],
  };
  const guidedSparcAward = window.sodaJSONObj["dataset_metadata"]["shared-metadata"]["sparc-award"];
  if (datasetIsSparcFunded()) {
    // Move the SPARC award to the front of the funding array
    guidedContributorInformation["funding"] = guidedContributorInformation["funding"].filter(
      (funding) => funding !== guidedSparcAward
    );
    guidedContributorInformation["funding"].unshift(guidedSparcAward);
  }

  const guidedContributorsArray = window.sodaJSONObj["dataset_metadata"]["description-metadata"][
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

const guidedGetDatasetLinks = () => {
  return [
    ...window.sodaJSONObj["dataset_metadata"]["description-metadata"]["additional-links"],
    ...window.sodaJSONObj["dataset_metadata"]["description-metadata"]["protocols"],
  ];
};

export const guidedPrepareDatasetStructureAndMetadataForUpload = async (sodaObj) => {
  console.log("baz");
  console.log("Preparing dataset structure and metadata for upload...");
  console.log("sodaObj", sodaObj);
  console.log("dataset-metadata", sodaObj["dataset_metadata"]);
  // Prepare the subject metadata
  const subjects = getExistingSubjects();
  const subjectsMetadata = subjects.map((subject) => {
    return subject.metadata;
  });
  console.log("subjectsMetadata", subjectsMetadata);
  sodaObj["dataset_metadata"]["subjects_metadata"] = subjectsMetadata;

  // Prepare the samples metadata
  const samples = getExistingSamples();
  const samplesMetadata = samples.map((sample) => {
    return sample.metadata;
  });
  console.log("samplesMetadata", samplesMetadata);
  sodaObj["dataset_metadata"]["samples_metadata"] = samplesMetadata;

  const sites = getExistingSites();
  const sitesMetadata = sites.map((site) => ({
    ...site.metadata,
    specimen_id: `${site.metadata.subject_id} ${site.metadata.sample_id}`,
  }));
  console.log("sitesMetadata", sitesMetadata);
  sodaObj["dataset_metadata"]["sites_metadata"] = sitesMetadata;
};
