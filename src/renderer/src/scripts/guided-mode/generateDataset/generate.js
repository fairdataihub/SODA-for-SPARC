import { setGuidedProgressBarValue, updateDatasetUploadProgressTable } from "./uploadProgressBar";
import { guidedSetNavLoadingState } from "../pages/navigationUtils/pageLoading";
import { clientError, userErrorMessage } from "../../others/http-error-handler/error-handler";
import { guidedTransitionToHome } from "../pages/navigate";
import { savePageChanges, guidedSaveProgress } from "../pages/savePageChanges";
import client from "../../client";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import { successCheck, errorMark } from "../../../assets/lotties/lotties";
import { guidedGetDatasetName, guidedGetDatasetId } from "../utils/sodaJSONObj";
import { getExistingSubjects } from "../../../stores/slices/datasetEntityStructureSlice";
import { createStandardizedDatasetStructure } from "../../utils/datasetStructure";

import { guidedResetLocalGenerationUI } from "../guided-curate-dataset";

import datasetUploadSession from "../../analytics/upload-session-tracker";
import { pageIsSkipped } from "../pages/navigationUtils/pageSkipping";
import kombuchaEnums from "../../analytics/analytics-enums";
import Swal from "sweetalert2";
import { swalShowError } from "../../utils/swal-utils";
import lottie from "lottie-web";
import { getGuidedDatasetName } from "../pages/curationPreparation/utils";

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
export const guidedGenerateDatasetOnPennsieve = async () => {
  guidedSetNavLoadingState(true);
  try {
    // Gather all required dataset info from window.sodaJSONObj
    const guidedBfAccount = window.defaultBfAccount;
    const pennsieveDatasetName = window.sodaJSONObj["pennsieve-dataset-name"];
    const pennsieveDatasetSubtitle = window.sodaJSONObj["pennsieve-dataset-subtitle"];
    const guidedLicense = window.sodaJSONObj["digital-metadata"]["license"];
    const guidedPennsieveStudyPurpose =
      window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["study_information"]?.[
        "study_purpose"
      ] || "";
    const guidedPennsieveDataCollection =
      window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["study_information"]?.[
        "study_data_collection"
      ] || "";
    const guidedPennsievePrimaryConclusion =
      window.sodaJSONObj["dataset_metadata"]?.["dataset_description"]?.["description"]?.[
        "study_primary_conclusion"
      ] || "";
    const guidedBannerImagePath =
      window.sodaJSONObj["dataset_metadata"]?.["banner-image-path"] || "";
    // Create standardized structure
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      window.sodaJSONObj["dataset-entity-obj"]
    );

    // Set the standardized dataset structure in the global SODA JSON object (used on the backend)
    window.sodaJSONObj["soda_json_structure"] = standardizedDatasetStructure;

    // If retrying upload, skip to upload step
    if (window.retryGuidedMode) {
      console.log("Retry guided mode block being called");
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
      // --- Ensure all required keys are set for retry upload ---
      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": window.sodaJSONObj["pennsieve-dataset-name"],
        destination: "ps",
        "generate-option": "existing-ps",
        "if-existing": "merge",
        "if-existing-files": "skip",
      };
      window.sodaJSONObj["ps-dataset-selected"] = {
        "dataset-name": window.sodaJSONObj["pennsieve-dataset-name"],
      };
      window.sodaJSONObj["ps-account-selected"] = {
        "account-name": window.defaultBfAccount,
      };
      datasetUploadSession.startSession();
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
        .then((response) => {
          let { data } = response;

          // Verify files setup section
          window.pennsieveManifestId = data["origin_manifest_id"];
          window.totalFilesCount = data["main_curation_total_files"];

          // show verify files section
          document.getElementById("guided--verify-files").classList.remove("hidden");
        });

      trackPennsieveDatasetGenerationProgress(standardizedDatasetStructure);
      guidedSetNavLoadingState(false);
      return;
    }

    // Hide all upload tables
    document
      .querySelectorAll(".guided-upload-table")
      .forEach((table) => table.classList.add("hidden"));

    // Remove any permissions rows from the UI that may have been added from a previous upload
    const pennsieveMetadataUploadTable = document.getElementById(
      "guided-tbody-pennsieve-metadata-upload"
    );
    const pennsieveMetadataUploadTableRows = pennsieveMetadataUploadTable.children;
    for (const row of pennsieveMetadataUploadTableRows) {
      if (row.classList.contains("permissions-upload-tr")) {
        row.remove();
      } else {
        row.classList.add("hidden");
      }
    }

    // Show Pennsieve metadata upload table
    window.unHideAndSmoothScrollToElement(
      "guided-div-pennsieve-metadata-pennsieve-generation-status-table"
    );

    // Create or rename dataset, then add metadata
    await guidedCreateOrRenameDataset(guidedBfAccount, pennsieveDatasetName);
    await guidedAddDatasetSubtitle(guidedBfAccount, pennsieveDatasetName, pennsieveDatasetSubtitle);
    await guidedAddDatasetDescription(
      guidedBfAccount,
      pennsieveDatasetName,
      guidedPennsieveStudyPurpose,
      guidedPennsieveDataCollection,
      guidedPennsievePrimaryConclusion
    );
    await guidedAddDatasetBannerImage(guidedBfAccount, pennsieveDatasetName, guidedBannerImagePath);
    await guidedAddDatasetLicense(guidedBfAccount, pennsieveDatasetName, guidedLicense);

    hideDatasetMetadataGenerationTableRows("pennsieve");

    // Reset upload progress bar and scroll to it
    setGuidedProgressBarValue("pennsieve", 0);
    updateDatasetUploadProgressTable("pennsieve", {
      "Upload status": `Preparing dataset for upload`,
    });
    window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

    // --- Ensure all required keys are set for initial upload ---
    window.sodaJSONObj["generate-dataset"] = {
      "dataset-name": window.sodaJSONObj["pennsieve-dataset-name"],
      destination: "ps",
      "generate-option": "new",
      "if-existing": "new",
      "if-existing-files": "new",
    };
    window.sodaJSONObj["ps-dataset-selected"] = {
      "dataset-name": window.sodaJSONObj["pennsieve-dataset-name"],
    };
    window.sodaJSONObj["ps-account-selected"] = {
      "account-name": window.defaultBfAccount,
    };
    window.sodaJSONObj["dataset-structure"] = standardizedDatasetStructure;
    datasetUploadSession.startSession();
    let datasetUploadObj = JSON.parse(JSON.stringify(window.sodaJSONObj));
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
      .then((response) => {
        let { data } = response;

        // Verify files setup section
        window.pennsieveManifestId = data["origin_manifest_id"];
        window.totalFilesCount = data["main_curation_total_files"];

        // show verify files section
        document.getElementById("guided--verify-files").classList.remove("hidden");
      });
    await trackPennsieveDatasetGenerationProgress(standardizedDatasetStructure);

    // ANYTHING THAT HAPPENS HERE IS AFTER THE UPLOAD IS COMPLETED SUCCESSFULLY

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

    //Show the next button
    $("#guided-next-button").css("visibility", "visible");
    guidedSetNavLoadingState(false);
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    amountOfTimesPennsieveUploadFailed += 1;
    window.retryGuidedMode = true;
    let supplementaryChecks = false;
    automaticRetry(supplementaryChecks, emessage);
    guidedSetNavLoadingState(false);
  }
  guidedSetNavLoadingState(false);
};

const roundToHundredth = (num) => {
  return Math.round(num * 100) / 100;
};

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

// Track the status of local dataset generation
const trackLocalDatasetGenerationProgress = async (standardizedDatasetStructure) => {
  const numberOfFilesToGenerate = countFilesInDatasetStructure(standardizedDatasetStructure);

  window.unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");

  const fetchProgressData = async () => {
    const { data } = await client.get(`/curate_datasets/curation/progress`);
    return {
      status: data["main_curate_status"],
      message: data["main_curate_progress_message"],
      elapsedTime: data["elapsed_time_formatted"],
      uploadedFiles: data["total_files_uploaded"],
    };
  };

  const updateProgressUI = (uploadedFiles, elapsedTime) => {
    const progress = Math.min(100, Math.max(0, (uploadedFiles / numberOfFilesToGenerate) * 100));
    setGuidedProgressBarValue("local", progress);
    updateDatasetUploadProgressTable("local", {
      "Files generated": `${uploadedFiles} of ${numberOfFilesToGenerate}`,
      "Percent generated": `${progress.toFixed(2)}%`,
      "Elapsed time": elapsedTime,
    });
  };

  while (true) {
    try {
      const { status, message, elapsedTime, uploadedFiles } = await fetchProgressData();

      if (message === "Success: COMPLETED!" || status === "Done") break;

      updateProgressUI(uploadedFiles, elapsedTime);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error tracking progress:", error);
      throw new Error(userErrorMessage(error));
    }
  }
};

// Track the status of Pennsieve dataset upload
const trackPennsieveDatasetGenerationProgress = async (standardizedDatasetStructure) => {
  let numberOfFilesToUpload = countFilesInDatasetStructure(standardizedDatasetStructure);
  // Count the number of keys in the dataset_metadata obj and add it to the number of files to upload
  const numberOfMetadataFilesToUpload = Object.keys(
    window.sodaJSONObj["dataset_metadata"] || {}
  ).length;
  // console.log(
  //   "[Pennsieve Progress] Number of metadata files to upload:",
  //   numberOfMetadataFilesToUpload
  // );
  numberOfFilesToUpload += numberOfMetadataFilesToUpload;
  // console.log("[Pennsieve Progress] Total number of files to upload:", numberOfFilesToUpload);

  // Get dataset size
  const localDatasetSizeReq = await client.post(
    "/curate_datasets/dataset_size",
    { soda_json_structure: window.sodaJSONObj },
    { timeout: 0 }
  );
  const localDatasetSizeInBytes = localDatasetSizeReq.data.dataset_size;
  // console.log("[Local] Dataset size in bytes:", localDatasetSizeInBytes);

  window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

  const fetchProgressData = async () => {
    const { data } = await client.get(`/curate_datasets/curation/progress`);
    // console.log("[Pennsieve Progress] Raw progress data:", data);
    return {
      status: data["main_curate_status"],
      message: data["main_curate_progress_message"],
      elapsedTime: data["elapsed_time_formatted"],
      uploadedFiles: data["total_files_uploaded"],
      startGenerate: data["start_generate"],
      mainTotalGenerateDatasetSize: data["main_total_generate_dataset_size"],
      mainGeneratedDatasetSize: data["main_generated_dataset_size"],
    };
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(2)} ${sizes[i]}`;
  };

  while (true) {
    try {
      const {
        status,
        message,
        elapsedTime,
        uploadedFiles,
        startGenerate,
        mainTotalGenerateDatasetSize,
        mainGeneratedDatasetSize,
      } = await fetchProgressData();

      if (message && message.includes("Preparing files to be renamed")) {
        setGuidedProgressBarValue("pennsieve", 0);
        updateDatasetUploadProgressTable("pennsieve", {
          "Current action": "Preparing files to be renamed...",
        });
      } else if (message && message.includes("Renaming files")) {
        setGuidedProgressBarValue(
          "pennsieve",
          (mainGeneratedDatasetSize / mainTotalGenerateDatasetSize) * 100
        );
        updateDatasetUploadProgressTable("pennsieve", {
          "Current action": "Renaming files...",
          "files renamed": `${mainGeneratedDatasetSize} of ${mainTotalGenerateDatasetSize}`,
        });
      } else {
        if (mainGeneratedDatasetSize && mainTotalGenerateDatasetSize) {
          // Default progress update
          const progress = Math.min(
            100,
            Math.max(0, (mainGeneratedDatasetSize / mainTotalGenerateDatasetSize) * 100)
          );
          setGuidedProgressBarValue("pennsieve", progress);
          updateDatasetUploadProgressTable("pennsieve", {
            "Current action": message || "",
            "Data Uploaded": `${formatBytes(mainGeneratedDatasetSize)} of ${formatBytes(
              mainTotalGenerateDatasetSize
            )}`,
            "Percent uploaded": `${progress.toFixed(2)}%`,
            "Elapsed time": elapsedTime,
          });
        } else {
          // Fallback for when mainGeneratedDatasetSize or mainTotalGenerateDatasetSize is not available
          setGuidedProgressBarValue("pennsieve", 0);
          updateDatasetUploadProgressTable("pennsieve", {
            "Current action": message || "Preparing dataset for upload",
          });
        }
      }

      if (status === "Done" && message == "Success: COMPLETED!") {
        console.log("[Pennsieve Progress] Finalizing upload progress UI.");
        amountOfTimesPennsieveUploadFailed = 0;

        setGuidedProgressBarValue("pennsieve", 100);
        updateDatasetUploadProgressTable("pennsieve", {
          Status: "Dataset successfully uploaded to Pennsieve",
        });
        // Break the loop to stop tracking progress (upload is complete)
        break;
      } else if (status === "Done" && message !== "Success: COMPLETED!") {
        console.error("The upload monitor noticed the upload failed");
        // Handle the case where upload error happens
        setGuidedProgressBarValue("pennsieve", 0);
        updateDatasetUploadProgressTable("pennsieve", {
          Status: "Dataset upload failed",
          "Error message": message,
        });
        amountOfTimesPennsieveUploadFailed += 1;
        window.retryGuidedMode = true;
        let supplementaryChecks = false;
        automaticRetry(supplementaryChecks, message);
        break;
      }

      // Wait for a second before fetching the next progress update
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("[Pennsieve Progress] Error tracking upload progress:", error);
      throw new Error(userErrorMessage(error));
    }
  }
};

const automaticRetry = async (supplementaryChecks = false, errorMessage = "") => {
  if (amountOfTimesPennsieveUploadFailed <= 3) {
    await Swal.fire({
      title: `Retrying upload ${amountOfTimesPennsieveUploadFailed} of 3 times`,
      icon: "error",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
      timer: 5000,
      timerProgressBar: true,
    });
    while (!supplementaryChecks && amountOfTimesPennsieveUploadFailed <= 3) {
      supplementaryChecks = await window.run_pre_flight_checks(
        "guided-mode-pre-generate-pennsieve-agent-check"
      );
      if (!supplementaryChecks) amountOfTimesPennsieveUploadFailed += 1;
    }
  } else {
    let res = await Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      title: "An error occurred during your upload",
      html: `
        <p>Error message: ${errorMessage}</p>
        <p>
        SODA has retried the upload three times but was not successful. You may manually retry the upload now or save and exit.
        If you choose to save and exit you will be able to resume your upload by returning to Prepare Dataset Step-by-Step and clicking the "Resume Upload"
        button on your dataset's progress card. If this issue persists, please contact support by using the Contact Us page in the sidebar
        after you Save and Exit.
        </p>
      `,
      showCancelButton: true,
      cancelButtonText: "Save and Exit",
      confirmButtonText: "Retry Upload",
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    });
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
    supplementaryChecks = await window.run_pre_flight_checks(
      "guided-mode-pre-generate-pennsieve-agent-check"
    );
  }

  if (!supplementaryChecks) {
    Swal.fire({
      icon: "error",
      title: "Could not complete upload due to pre-flight check failures",
      text: "Please return to the home page to try the upload again. If the problem persists, please contact support by using the Contact Us page in the sidebar.",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: { popup: "animate__animated animate__zoomIn animate__faster" },
      hideClass: { popup: "animate__animated animate__zoomOut animate__faster" },
    });
    const currentPageID = window.CURRENT_PAGE.id;
    try {
      await savePageChanges(currentPageID);
    } catch (error) {
      window.log.error("Error saving page changes", error);
    }
    guidedTransitionToHome();
    return;
  }

  // call self so this failure code can run up to 3 times automatically
  guidedGenerateDatasetOnPennsieve();
};

export const guidedGenerateDatasetLocally = async (filePath) => {
  console.log("Generating dataset at filePath:", filePath);
  guidedSetNavLoadingState(true); // Lock the nav while local dataset generation is in progress
  guidedResetLocalGenerationUI();

  try {
    // Get the dataset name based on the sodaJSONObj
    const guidedDatasetName = guidedGetDatasetName(window.sodaJSONObj);

    // Create standardized structure
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      window.sodaJSONObj["dataset-entity-obj"]
    );
    console.log("standardizedDatasetStructure", standardizedDatasetStructure);

    // Set the standardized dataset structure in the global SODA JSON object (used on the backend)
    window.sodaJSONObj["soda_json_structure"] = standardizedDatasetStructure;

    // Prepare progress UI
    setGuidedProgressBarValue("local", 0);
    updateDatasetUploadProgressTable("local", {
      "Current action": "Checking available free space on disk",
    });
    window.unHideAndSmoothScrollToElement("guided-section-local-generation-status-table");

    // Get available disk space
    const freeMemoryInBytes = await window.electron.ipcRenderer.invoke("getDiskSpace", filePath);

    // Get dataset size
    const localDatasetSizeReq = await client.post(
      "/curate_datasets/dataset_size",
      { soda_json_structure: window.sodaJSONObj },
      { timeout: 0 }
    );
    const localDatasetSizeInBytes = localDatasetSizeReq.data.dataset_size;

    console.log("localDatasetSizeInBytes", localDatasetSizeInBytes);
    console.log("freeMemoryInBytes", freeMemoryInBytes);

    // Check available space
    if (freeMemoryInBytes < localDatasetSizeInBytes) {
      throw new Error(
        `Not enough free space on disk. Free space: ${convertBytesToGb(
          freeMemoryInBytes
        )}GB. Dataset size: ${convertBytesToGb(localDatasetSizeInBytes)}GB`
      );
    }

    // Copy and prepare SODA object
    const sodaJSONObjCopy = JSON.parse(JSON.stringify(window.sodaJSONObj));
    sodaJSONObjCopy["generate-dataset"] = {
      "dataset-name": getGuidedDatasetName(),
      destination: "local",
      "generate-option": "new",
      "if-existing": "new",
      path: filePath,
    };

    // Remove unnecessary key from sodaJSONObjCopy since we don't need to
    // check if the account details are valid during local generation
    delete sodaJSONObjCopy["ps-account-selected"];
    delete sodaJSONObjCopy["ps-dataset-selected"];

    updateDatasetUploadProgressTable("local", {
      "Current action": "Preparing dataset for local generation",
    });

    // Start local generation
    console.log("[Local] soda_json_structure being sent:", sodaJSONObjCopy.soda_json_structure);
    client.post(
      "/curate_datasets/curation",
      { soda_json_structure: sodaJSONObjCopy, resume: false },
      { timeout: 0 }
    );

    await trackLocalDatasetGenerationProgress(standardizedDatasetStructure);

    setGuidedProgressBarValue("local", 100);
    updateDatasetUploadProgressTable("local", {
      "Current action": "Generating metadata files",
    });

    // Metadata file generation is temporarily disabled
    /*
    const datasetPath = window.path.join(filePath, guidedDatasetName);
    await guidedGenerateSubjectsMetadata(window.path.join(datasetPath, "subjects.xlsx"));
    await guidedGenerateSamplesMetadata(window.path.join(datasetPath, "samples.xlsx"));
    await guidedGenerateSubmissionMetadata(window.path.join(datasetPath, "submission.xlsx"));
    await guidedGenerateDatasetDescriptionMetadata(window.path.join(datasetPath, "dataset_description.xlsx"));
    await guidedGenerateReadmeMetadata(window.path.join(datasetPath, "README.txt"));
    await guidedGenerateChangesMetadata(window.path.join(datasetPath, "CHANGES.txt"));
    await guidedGenerateCodeDescriptionMetadata(window.path.join(datasetPath, "code_description.xlsx"));
    */

    // Save dataset path
    window.sodaJSONObj["path-to-local-dataset-copy"] = window.path.join(
      filePath,
      guidedDatasetName
    );

    // Final UI update
    updateDatasetUploadProgressTable("local", {
      Status: "Dataset successfully generated locally",
    });
    window.unHideAndSmoothScrollToElement("guided-section-post-local-generation-success");
  } catch (error) {
    console.error("Error during local dataset generation:", error);
    const errorMessage = userErrorMessage(error);
    console.error(errorMessage);
    guidedResetLocalGenerationUI();
    await swalShowError("Error generating dataset locally", errorMessage);
    window.unHideAndSmoothScrollToElement("guided-section-retry-local-generation");
  } finally {
    guidedSetNavLoadingState(false); // Always unlock nav
  }
};

let amountOfTimesPennsieveUploadFailed = 0;

const userMadeItToLastStep = () => {
  return !document
    .querySelector("#guided-div-dataset-upload-status-table")
    .classList.contains("hidden");
};

const guidedCreateOrRenameDataset = async (bfAccount, datasetName) => {
  console.log("[guidedCreateOrRenameDataset] called with:", { bfAccount, datasetName });

  const uploadRow = document.getElementById("guided-dataset-name-upload-tr");
  const uploadText = document.getElementById("guided-dataset-name-upload-text");
  const statusId = "guided-dataset-name-upload-status";

  uploadRow.classList.remove("hidden");
  uploadText.innerHTML = "Creating dataset...";
  guidedUploadStatusIcon(statusId, "loading");

  const datasetId = window.sodaJSONObj["digital-metadata"]?.["pennsieve-dataset-id"];
  // If the dataset ID already exists, return and set the progress table
  if (datasetId) {
    console.log("[guidedCreateOrRenameDataset] Dataset ID already exists:", datasetId);
    uploadText.innerHTML = "Dataset already exists on Pennsieve";
    guidedUploadStatusIcon(statusId, "success");
    return datasetId;
  }

  // If the dataset ID does not exist, create a new dataset
  try {
    const response = await client.post(
      `/manage_datasets/datasets`,
      { input_dataset_name: datasetName },
      { params: { selected_account: bfAccount } }
    );

    const newId = response.data.id;
    const intId = response.data.int_id;

    window.defaultBfDatasetId = newId;
    window.defaultBfDatasetIntId = intId;
    window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = newId;

    uploadText.innerHTML = `Successfully created dataset with name: ${datasetName}`;
    guidedUploadStatusIcon(statusId, "success");

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.CREATE_NEW_DATASET,
      datasetName,
      kombuchaEnums.Status.SUCCCESS,
      {
        value: 1,
        dataset_id: newId,
        dataset_name: datasetName,
        dataset_int_id: intId,
      }
    );

    window.electron.ipcRenderer.send(
      "track-event",
      "Dataset ID to Dataset Name Map",
      newId,
      datasetName
    );

    window.refreshDatasetList();
    window.addNewDatasetToList(datasetName);

    await guidedSaveProgress();
    return newId;
  } catch (error) {
    const emessage = userErrorMessage(error);
    console.error("[guidedCreateOrRenameDataset] Create failed:", emessage);
    uploadText.innerHTML = "Failed to create a new dataset.";

    if (emessage === "Dataset name already exists") {
      uploadText.innerHTML = `A dataset with the name <b>${datasetName}</b> already exists on Pennsieve.<br />
        Please rename your dataset and try again.`;

      document.getElementById(statusId).innerHTML = `
        <button
          class="ui positive button guided--button"
          id="guided-button-rename-dataset"
          style="margin: 5px !important; background-color: var(--color-light-green) !important; width: 140px !important;"
        >
          Rename dataset
        </button>
      `;

      $("#guided-button-rename-dataset").on("click", openGuidedDatasetRenameSwal);
    }

    throw new Error(emessage);
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

    guidedGenerateDatasetOnPennsieve();
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
