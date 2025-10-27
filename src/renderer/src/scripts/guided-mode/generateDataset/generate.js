import { setGuidedProgressBarValue, updateDatasetUploadProgressTable } from "./uploadProgressBar";
import { guidedSetNavLoadingState } from "../pages/navigationUtils/pageLoading";
import { clientError, userErrorMessage } from "../../others/http-error-handler/error-handler";
import { guidedTransitionToHome } from "../pages/navigate";
import { guidedSaveProgress } from "../pages/savePageChanges";
import client from "../../client";
import { checkIfDatasetExistsOnPennsieve } from "../pennsieveUtils";
import { successCheck, errorMark } from "../../../assets/lotties/lotties";
import { guidedGetDatasetName, guidedGetDatasetId } from "../utils/sodaJSONObj";
import { getExistingSubjects } from "../../../stores/slices/datasetEntityStructureSlice";
import { createStandardizedDatasetStructure } from "../../utils/datasetStructure";
import api from "../../others/api/api";

import { guidedResetLocalGenerationUI } from "../guided-curate-dataset";

import datasetUploadSession from "../../analytics/upload-session-tracker";
import { guidedUnSkipPage, pageIsSkipped } from "../pages/navigationUtils/pageSkipping";
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
    const pennsieveDatasetName = window.sodaJSONObj["generate-dataset"]["dataset-name"];
    // Create standardized structure
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      window.sodaJSONObj["dataset-entity-obj"]
    );

    // Set the standardized dataset structure in the global SODA JSON object (used on the backend)
    window.sodaJSONObj["soda_json_structure"] = standardizedDatasetStructure;

    // If retrying upload, skip to upload step
    if (window.retryGuidedMode) {
      if (window.sodaJSONObj["pennsieve-generation-target"] === "new") {
        // Show Pennsieve metadata upload table
        await uploadPennsieveMetadata(
          window.defaultBfAccount,
          window.sodaJSONObj["generate-dataset"]["dataset-name"],
          window.sodaJSONObj["pennsieve-dataset-subtitle"],
          window.sodaJSONObj?.["digital-metadata"]?.["banner-image-path"],
          window.sodaJSONObj?.["digital-metadata"]?.["license"],
          window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.[
            "study_information"
          ]?.["study_purpose"],
          window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.[
            "study_information"
          ]?.["study_data_collection"],
          window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.[
            "study_information"
          ]?.["study_primary_conclusion"]
        );
      }
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
      // --- Ensure all required keys are set for retry upload ---
      window.sodaJSONObj["generate-dataset"] = {
        "dataset-name": window.sodaJSONObj["generate-dataset"]["dataset-name"],
        destination: "ps",
        "generate-option": "existing-ps",
        "if-existing": "merge",
        "if-existing-files": "skip",
      };
      window.sodaJSONObj["ps-dataset-selected"] = {
        "dataset-name": window.sodaJSONObj["generate-dataset"]["dataset-name"],
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
        .then(async (response) => {
          // ANYTHING THAT HAPPENS HERE IS AFTER THE UPLOAD IS COMPLETED SUCCESSFULLY

          const { data } = response;

          // Verify files setup section
          window.pennsieveManifestId = data["origin_manifest_id"];
          window.totalFilesCount = data["main_curation_total_files"];

          // show verify files section
          document.getElementById("guided--verify-files").classList.remove("hidden");

          window.retryGuidedMode = false; // Reset the retry flag

          // Clear the saved upload progress data because the dataset has been successfully
          window.sodaJSONObj["previously-uploaded-data"] = {};

          // Mark "dataset-successfully-uploaded-to-pennsieve" as true in the sodaJSONObj
          // to denote the dataset was successfully uploaded to Pennsieve
          window.sodaJSONObj["dataset-successfully-uploaded-to-pennsieve"] = true;

          // enable the verify files button
          document.querySelector("#guided--verify-files-button").disabled = false;
          document.querySelector("#guided--skip-verify-btn").disabled = false;

          let uploadedFiles = data["main_curation_uploaded_files"];
          let mainTotalGenerateDatasetSize = data["main_total_generate_dataset_size"];

          logProgressPostUpload(uploadedFiles, mainTotalGenerateDatasetSize);

          // reset the log values
          bytesOnPreviousLogPage = 0;
          filesOnPreviousLogPage = 0;

          // Show the next button
          $("#guided-next-button").css("visibility", "visible");

          // Save the window.sodaJSONObj after a successful upload
          await guidedSaveProgress();
        })
        .catch((error) => {
          console.error("Dataset upload failed:", error);
        });

      await window.wait(1000);

      await trackPennsieveDatasetGenerationProgress(standardizedDatasetStructure);
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

    // Only update Pennsieve Metadata if the user is creating a new dataset
    if (window.sodaJSONObj["pennsieve-generation-target"] === "new") {
      // Show Pennsieve metadata upload table
      await uploadPennsieveMetadata(
        window.defaultBfAccount,
        window.sodaJSONObj["generate-dataset"]["dataset-name"],
        window.sodaJSONObj["pennsieve-dataset-subtitle"],
        window.sodaJSONObj?.["digital-metadata"]?.["banner-image-path"],
        window.sodaJSONObj?.["digital-metadata"]?.["license"],
        window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.["study_information"]?.[
          "study_purpose"
        ],
        window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.["study_information"]?.[
          "study_data_collection"
        ],
        window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.["study_information"]?.[
          "study_primary_conclusion"
        ]
      );
    }

    hideDatasetMetadataGenerationTableRows("pennsieve");

    // Reset upload progress bar and scroll to it
    setGuidedProgressBarValue("pennsieve", 0);
    updateDatasetUploadProgressTable("pennsieve", {
      "Upload status": `Preparing dataset for upload`,
    });
    window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

    window.sodaJSONObj["ps-dataset-selected"] = {
      "dataset-name": window.sodaJSONObj["generate-dataset"]["dataset-name"],
    };
    window.sodaJSONObj["ps-account-selected"] = {
      "account-name": window.defaultBfAccount,
    };
    window.sodaJSONObj["dataset-structure"] = standardizedDatasetStructure;

    datasetUploadSession.startSession();
    let datasetUploadObj = JSON.parse(JSON.stringify(window.sodaJSONObj));

    // If the user is uploading to an existing dataset, set the dataset title
    // in the dataset_description file to the title of the existing dataset
    if (
      window.sodaJSONObj["pennsieve-generation-target"] === "existing" &&
      datasetUploadObj?.["dataset_metadata"]?.["dataset_description"]?.["basic_information"]
    ) {
      datasetUploadObj["dataset_metadata"]["dataset_description"]["basic_information"]["title"] =
        pennsieveDatasetName;
    }

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
      .then(async (response) => {
        // ANYTHING THAT HAPPENS HERE IS AFTER THE UPLOAD IS COMPLETED SUCCESSFULLY

        const { data } = response;

        // Verify files setup section
        window.pennsieveManifestId = data["origin_manifest_id"];
        window.totalFilesCount = data["main_curation_total_files"];
        window.retryGuidedMode = false; // Reset the retry flag

        // show verify files section
        document.getElementById("guided--verify-files").classList.remove("hidden");

        // Clear the saved upload progress data because the dataset has been successfully
        window.sodaJSONObj["previously-uploaded-data"] = {};

        // Mark "dataset-successfully-uploaded-to-pennsieve" as true in the sodaJSONObj
        // to denote the dataset was successfully uploaded to Pennsieve
        window.sodaJSONObj["dataset-successfully-uploaded-to-pennsieve"] = true;

        // enable the verify files button
        document.querySelector("#guided--verify-files-button").disabled = false;
        document.querySelector("#guided--skip-verify-btn").disabled = false;

        let uploadedFiles = data["main_curation_uploaded_files"];
        let mainTotalGenerateDatasetSize = data["main_total_generate_dataset_size"];

        logProgressPostUpload(uploadedFiles, mainTotalGenerateDatasetSize);

        // reset the log values
        bytesOnPreviousLogPage = 0;
        filesOnPreviousLogPage = 0;

        // Show the next button
        $("#guided-next-button").css("visibility", "visible");

        // Save the window.sodaJSONObj after a successful upload
        await guidedSaveProgress();
      })
      .catch((error) => {
        console.error("Dataset upload failed:", error);
      });

    await window.wait(1000);

    await trackPennsieveDatasetGenerationProgress(standardizedDatasetStructure);

    guidedSetNavLoadingState(false);
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error, false);
    amountOfTimesPennsieveUploadFailed += 1;
    window.retryGuidedMode = true;
    let supplementaryChecks = false;
    automaticRetry(supplementaryChecks, emessage);
    guidedSetNavLoadingState(false);
  }
  guidedSetNavLoadingState(false);
};

const uploadPennsieveMetadata = async (
  guidedBfAccount,
  pennsieveDatasetName,
  pennsieveDatasetSubtitle,
  guidedBannerImagePath,
  guidedLicense,
  guidedPennsieveStudyPurpose,
  guidedPennsieveDataCollection,
  guidedPennsievePrimaryConclusion
) => {
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
  if (guidedLicense) {
    await guidedAddDatasetLicense(guidedBfAccount, pennsieveDatasetName, guidedLicense);
  }
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

const createEventData = (value, destination, origin, dataset_name, dataset_id) => {
  if (destination === "Pennsieve") {
    return {
      value: value,
      dataset_id: dataset_id,
      dataset_name: dataset_name,
      origin: origin,
      destination: destination,
      dataset_int_id: window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"],
    };
  }

  return {
    value: value,
    dataset_name: dataset_name,
    origin: origin,
    destination: destination,
  };
};

// Used to properly track the Progress of the upload to Pennsieve
let bytesOnPreviousLogPage = 0;
let filesOnPreviousLogPage = 0;

const logProgressPostUpload = (files, bytes) => {
  let fileValueToLog = 0;
  let fileSizeValueToLog = 0;

  let finalFilesCount = files - filesOnPreviousLogPage;
  let differenceInBytes = bytes - bytesOnPreviousLogPage;

  fileValueToLog = finalFilesCount;
  fileSizeValueToLog = differenceInBytes;

  // log the file and file size values to analytics
  if (fileValueToLog > 0) {
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.SUCCESS,
      createEventData(
        fileValueToLog,
        "Pennsieve",
        "Local",
        window.sodaJSONObj["generate-dataset"]["dataset-name"],
        guidedGetDatasetId(window.sodaJSONObj)
      )
    );
  }

  if (fileSizeValueToLog > 0) {
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.SUCCESS,
      createEventData(
        fileSizeValueToLog,
        "Pennsieve",
        "Local",
        window.sodaJSONObj["generate-dataset"]["dataset-name"],
        guidedGetDatasetId(window.sodaJSONObj)
      )
    );
  }
};

const logProgressToAnalyticsGM = (files, bytes) => {
  // log every 500 files -- will log on success/failure as well so if there are less than 500 files we will log what we uploaded ( all in success case and some of them in failure case )
  if (files >= filesOnPreviousLogPage + 500) {
    filesOnPreviousLogPage += 500;
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.SUCCESS,
      createEventData(
        500,
        "Pennsieve",
        "Local",
        window.sodaJSONObj["generate-dataset"]["dataset-name"],
        guidedGetDatasetId(window.sodaJSONObj)
      )
    );

    let differenceInBytes = bytes - bytesOnPreviousLogPage;
    bytesOnPreviousLogPage = bytes;

    if (differenceInBytes > 0) {
      window.electron.ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.SIZE,
        kombuchaEnums.Status.SUCCESS,
        createEventData(
          differenceInBytes,
          "Pennsieve",
          "Local",
          window.sodaJSONObj["generate-dataset"]["dataset-name"],
          guidedGetDatasetId(window.sodaJSONObj)
        )
      );
    }
  }
};

// Track the status of Pennsieve dataset upload
const trackPennsieveDatasetGenerationProgress = async (standardizedDatasetStructure) => {
  window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

  const fetchProgressData = async () => {
    const { data } = await client.get(`/curate_datasets/curation/progress`);
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

      logProgressToAnalyticsGM(uploadedFiles, mainGeneratedDatasetSize);

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
      width: 800,
      icon: "error",
      title: "An error occurred during your upload",
      html: `
          <div style="text-align: left;">
           <p style="overflow-y: auto; max-height: 120px; text-align: left; margin-bottom: 10px;">Error: ${errorMessage}</p>
            <p>
              SODA has retried the upload three times without success. You have two options: 
              <br/>
              <ol> 
                <li>Manually retry the upload now - may resolve the problem if the issue was temporary (e.g., network issue)</li>
                <li>Save and exit and optionally contact the SODA team for help by following the instructions found <a href="https://docs.sodaforsparc.io/docs/miscellaneous/common-errors/sending-log-files-to-soda-team" target="_blank">here.</a></li>
              </ol>
            </p>
          </div>
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
        await window.savePageChanges(currentPageID);
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
      await window.savePageChanges(currentPageID);
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
  guidedSetNavLoadingState(true); // Lock the nav while local dataset generation is in progress
  guidedResetLocalGenerationUI();

  try {
    // Sanitize the dataset name to ensure it's valid for saving to the filesystem
    const sanitizedDatasetName = window.sanitizeStringForSaveFileSystemSave(
      guidedGetDatasetName(window.sodaJSONObj)
    );

    // Create standardized structure
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      window.sodaJSONObj["dataset-entity-obj"]
    );
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
      "dataset-name": sanitizedDatasetName,
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
      sanitizedDatasetName
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

/**
 * Creates or renames a Pennsieve dataset during Guided Mode setup.
 * - If an existing dataset is found (by stored Pennsieve ID), renames it if needed.
 * - If no dataset exists, creates a new one.
 * - Updates UI status and tracks events accordingly.
 */
const guidedCreateOrRenameDataset = async (bfAccount, datasetName) => {
  // Show progress UI
  const uploadRow = document.getElementById("guided-dataset-name-upload-tr");
  const uploadText = document.getElementById("guided-dataset-name-upload-text");
  const statusId = "guided-dataset-name-upload-status";

  uploadRow.classList.remove("hidden");
  uploadText.innerHTML = "Creating or renaming dataset...";
  guidedUploadStatusIcon(statusId, "loading");

  // Retrieve stored Pennsieve dataset ID (if any)
  const datasetId = window.sodaJSONObj["digital-metadata"]?.["pennsieve-dataset-id"];
  let existingDatasetName = null;

  // Attempt to fetch existing dataset info
  if (datasetId) {
    try {
      const existingInfo = await api.getDatasetInformation(datasetId);
      existingDatasetName = existingInfo?.content?.name;
    } catch (error) {
      // Dataset may have been deleted from Pennsieve
      console.info(
        "[guidedCreateOrRenameDataset] Could not fetch dataset info, possibly deleted:",
        error
      );
    }
  }

  // If an existing dataset is found, rename if needed
  if (existingDatasetName) {
    if (existingDatasetName !== datasetName) {
      try {
        await client.put(
          `/manage_datasets/ps_rename_dataset`,
          { input_new_name: datasetName },
          { params: { selected_account: bfAccount, selected_dataset: datasetId } }
        );

        // Update UI to indicate successful rename
        uploadText.innerHTML = `Successfully renamed dataset to: ${datasetName}`;
        guidedUploadStatusIcon(statusId, "success");
      } catch (error) {
        const emessage = userErrorMessage(error);
        uploadText.innerHTML = "Failed to rename existing dataset.";
        guidedUploadStatusIcon(statusId, "error");
        throw new Error(emessage);
      }
    } else {
      // Dataset already exists with the correct name
      uploadText.innerHTML = "Dataset already exists on Pennsieve";
      guidedUploadStatusIcon(statusId, "success");
    }

    return;
  }

  // Otherwise, create a new dataset
  try {
    const response = await client.post(
      `/manage_datasets/datasets`,
      { input_dataset_name: datasetName },
      { params: { selected_account: bfAccount } }
    );

    const { id: newId, int_id: intId } = response.data;

    // Store new dataset IDs globally
    window.defaultBfDatasetId = newId;
    window.defaultBfDatasetIntId = intId;
    window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = newId;
    window.sodaJSONObj["digital-metadata"]["pennsieve-int-id"] = intId;

    // Update UI and tracking
    uploadText.innerHTML = `Successfully created dataset with name: ${datasetName}`;
    guidedUploadStatusIcon(statusId, "success");

    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.CREATE_NEW_DATASET,
      datasetName,
      kombuchaEnums.Status.SUCCESS,
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

    // Refresh dataset list and save progress
    window.refreshDatasetList();
    window.addNewDatasetToList(datasetName);
    await guidedSaveProgress();

    return newId;
  } catch (error) {
    const emessage = userErrorMessage(error);
    uploadText.innerHTML = "Failed to create a new dataset.";
    guidedUploadStatusIcon(statusId, "error");
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

  // If studyPurpose, dataCollection, or dataConclusion are empty, skip adding the description
  if (!studyPurpose && !dataCollection && !dataConclusion) {
    datasetDescriptionUploadText.innerHTML = "Skipped optional dataset description...";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
    return;
  }
  datasetDescriptionUploadText.innerHTML = "Adding dataset description...";
  guidedUploadStatusIcon("guided-dataset-description-upload-status", "loading");

  let descriptionArray = [];

  studyPurpose && descriptionArray.push("**Study Purpose:** " + studyPurpose + "\n\n");
  dataCollection && descriptionArray.push("**Data Collection:** " + dataCollection + "\n\n");
  dataConclusion && descriptionArray.push("**Primary Conclusion:** " + dataConclusion + "\n\n");

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
  const bannerRow = document.getElementById("guided-dataset-banner-image-upload-tr");
  const bannerText = document.getElementById("guided-dataset-banner-image-upload-text");
  const bannerStatusId = "guided-dataset-banner-image-upload-status";

  bannerRow.classList.remove("hidden");

  if (!bannerImagePath) {
    bannerText.innerHTML = "Skipped optional banner image...";
    guidedUploadStatusIcon(bannerStatusId, "success");
    return;
  }

  bannerText.innerHTML = "Adding dataset banner image...";
  guidedUploadStatusIcon(bannerStatusId, "loading");

  const previouslyUploadedBannerImagePath =
    window.sodaJSONObj["previously-uploaded-data"]?.["banner-image-path"];

  if (previouslyUploadedBannerImagePath === bannerImagePath) {
    bannerText.innerHTML = "Dataset banner image already added on Pennsieve";
    guidedUploadStatusIcon(bannerStatusId, "success");
    return;
  }

  let bannerImageSize;
  try {
    bannerImageSize = window.fs.statSync(bannerImagePath).size;
  } catch {
    bannerImageSize = "Unable to retrieve size";
  }

  try {
    await client.put(
      `/manage_datasets/bf_banner_image`,
      { input_banner_image_path: bannerImagePath },
      {
        params: {
          selected_account: bfAccount,
          selected_dataset: datasetName,
        },
      }
    );

    bannerText.innerHTML = "Successfully added dataset banner image!";
    guidedUploadStatusIcon(bannerStatusId, "success");

    window.sodaJSONObj["previously-uploaded-data"]["banner-image-path"] = bannerImagePath;
    await guidedSaveProgress();

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

    bannerText.innerHTML = "Failed to add a dataset banner image.";
    guidedUploadStatusIcon(bannerStatusId, "error");

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
