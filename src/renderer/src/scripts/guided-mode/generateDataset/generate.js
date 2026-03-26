import { setGuidedProgressBarValue, updateDatasetUploadProgressTable } from "./uploadProgressBar";
import { guidedSetNavLoadingState } from "../pages/navigationUtils/pageLoading";
import { clientError, userErrorMessage } from "../../others/http-error-handler/error-handler";
import { transitionFromGuidedModeToHome } from "../pages/navigate";
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
import { swalShowError, swalShowInfo } from "../../utils/swal-utils";
import lottie from "lottie-web";
import { getGuidedDatasetName } from "../pages/curationPreparation/utils";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const fetchProgressData = async () => {
  const { data } = await client.get(`/curate_datasets/curation/progress`);
  return {
    status: data["main_curate_status"],
    message: data["main_curate_progress_message"],
    elapsedTime: data["elapsed_time_formatted"],
    uploadedFiles: data["total_files_uploaded"],
    curationErrorMessage: data["curation_error_message"],
  };
};

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
    const pennsieveDatasetName = window.sodaJSONObj["generate-dataset"]["dataset-name"];

    // Create standardized dataset structure and store globally
    const standardizedDatasetStructure = createStandardizedDatasetStructure(
      window.datasetStructureJSONObj,
      window.sodaJSONObj["dataset-entity-obj"]
    );
    window.sodaJSONObj["soda_json_structure"] = standardizedDatasetStructure;

    // Code that runs after a successful upload to Pennsieve (whether initial upload or retry)
    const finalizeUpload = async (data) => {
      console.log("Upload finalized with response data:", data);
      window.pennsieveManifestId = data["origin_manifest_id"];
      window.totalFilesCount = data["main_curation_total_files"];
      window.sodaJSONObj["previously-uploaded-data"] = {};
      window.sodaJSONObj["dataset-successfully-uploaded-to-pennsieve"] = true;
      window.retryGuidedMode = false;

      // If the message indicates that no files were uploaded (which can happen when
      // uploading to an existing Pennsieve dataset with the "skip" option selected for existing files and
      // the dataset being generated has the same files as the existing dataset), do not show
      // the verify files section because there are no files to verify.
      const { message } = await fetchProgressData();
      if (message !== "No files were uploaded in this session") {
        document.getElementById("guided--verify-files").classList.remove("hidden");
        document.querySelector("#guided--verify-files-button").disabled = false;
        document.querySelector("#guided--skip-verify-btn").disabled = false;
      }

      logProgressPostUpload(
        data["main_curation_uploaded_files"],
        data["main_total_generate_dataset_size"]
      );

      bytesOnPreviousLogPage = 0;
      filesOnPreviousLogPage = 0;

      $("#guided-next-button").css("visibility", "visible");
      if (window.sodaJSONObj["curation-mode"] === "free-form") {
        $("#guided-button-save-and-exit").css("visibility", "hidden");
      }

      await guidedSaveProgress();
    };

    // --- Helper: perform the upload request ---
    const performUpload = async () => {
      datasetUploadSession.startSession();
      guidedSetNavLoadingState(true);

      client
        .post(
          `/curate_datasets/curation`,
          { soda_json_structure: window.sodaJSONObj, resume: !!window.retryGuidedMode },
          { timeout: 0 }
        )
        .then(async (response) => {
          const { data } = response;
          console;
          await finalizeUpload(data);
        })
        .catch((error) => console.error("Dataset upload failed:", error));

      await window.wait(1000);
      await trackPennsieveDatasetGenerationProgress(standardizedDatasetStructure);
      guidedSetNavLoadingState(false);
    };

    // --- Helper: prepare upload object for Pennsieve ---
    const prepareUploadObj = () => {
      window.sodaJSONObj["ps-dataset-selected"] = { "dataset-name": pennsieveDatasetName };
      window.sodaJSONObj["ps-account-selected"] = { "account-name": window.defaultBfAccount };
      window.sodaJSONObj["dataset-structure"] = standardizedDatasetStructure;

      if (window.retryGuidedMode) {
        const previousExistingHandling = window.sodaJSONObj?.["generate-dataset"]?.["if-existing"];
        const previousExistingFileHandling =
          window.sodaJSONObj?.["generate-dataset"]?.["if-existing-files"];
        window.sodaJSONObj["generate-dataset"] = {
          "dataset-name": pennsieveDatasetName,
          destination: "ps",
          "generate-option": "existing-ps",
          "if-existing":
            previousExistingHandling === "new" ? "merge" : previousExistingHandling || "merge",
          "if-existing-files":
            previousExistingFileHandling === "new"
              ? "skip"
              : previousExistingFileHandling || "skip",
        };
      }

      // Update the title in the dataset metadata to match the Pennsieve dataset name if the user is generating a new dataset on Pennsieve and has already entered dataset metadata information in the previous steps
      if (
        window.sodaJSONObj["pennsieve-generation-target"] === "existing" &&
        window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.["basic_information"]
      ) {
        window.sodaJSONObj["dataset_metadata"]["dataset_description"]["basic_information"][
          "title"
        ] = pennsieveDatasetName;
      }
    };

    // --- Prepare UI for normal upload ---
    if (!window.retryGuidedMode) {
      document
        .querySelectorAll(".guided-upload-table")
        .forEach((table) => table.classList.add("hidden"));

      const metadataTableRows = document.getElementById(
        "guided-tbody-pennsieve-metadata-upload"
      ).children;
      for (const row of metadataTableRows) {
        row.classList.add("hidden");
      }

      hideDatasetMetadataGenerationTableRows("pennsieve");
      setGuidedProgressBarValue("pennsieve", 0);
      updateDatasetUploadProgressTable("pennsieve", {
        "Upload status": "Preparing dataset for upload",
      });
      window.unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");
    }

    if (window.sodaJSONObj["pennsieve-generation-target"] === "new") {
      await uploadPennsieveMetadata(
        window.defaultBfAccount,
        pennsieveDatasetName,
        window.sodaJSONObj["pennsieve-dataset-subtitle"],
        window.sodaJSONObj?.["digital-metadata"]?.["banner-image-path"],
        window.sodaJSONObj?.["digital-metadata"]?.["license"],
        window.sodaJSONObj?.["dataset_metadata"]?.["dataset_description"]?.["basic_information"]?.[
          "description"
        ]
      );
    }

    prepareUploadObj();
    await performUpload();
  } catch (error) {
    clientError(error);
    const emessage = userErrorMessage(error, false);
    amountOfTimesPennsieveUploadFailed += 1;
    window.retryGuidedMode = true;
    automaticRetry(false, emessage);
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
  guidedDatasetDescription
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
    guidedDatasetDescription
  );
  await guidedAddDatasetBannerImage(guidedBfAccount, pennsieveDatasetName, guidedBannerImagePath);
  if (guidedLicense) {
    await guidedAddDatasetLicense(guidedBfAccount, pennsieveDatasetName, guidedLicense);
  }
};

const roundToHundredth = (num) => {
  return Math.round(num * 100) / 100;
};

export const convertBytesToGb = (bytes) => {
  return roundToHundredth(bytes / 1024 ** 3);
};

export const bytesToReadableSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const k = 1000;
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];

  const unitIndex = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, unitIndex);

  return `${Math.round(value)} ${units[unitIndex]}`;
};
// Counts the number of files in the dataset structure
// Note: This function should only be used for local datasets (Not datasets pulled from Pennsieve)
export const countFilesInDatasetStructure = (datasetStructure) => {
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
      const { status, message, elapsedTime, uploadedFiles, curationErrorMessage } =
        await fetchProgressData();

      if (curationErrorMessage !== undefined && curationErrorMessage !== "") {
        console.error("Error message during local dataset generation:", curationErrorMessage);
      }

      if (curationErrorMessage) {
        throw new Error(
          "An error occurred during local dataset generation: " + curationErrorMessage
        );
      }

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
const trackPennsieveDatasetGenerationProgress = async () => {
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
      console.log("Progress data fetched:", {
        status,
        message,
        elapsedTime,
        uploadedFiles,
        startGenerate,
        mainTotalGenerateDatasetSize,
        mainGeneratedDatasetSize,
      });

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
      } else if (status === "Done" && message.includes("No files were uploaded in this session")) {
        // Handle the special case where no files were uploaded but it's not an error
        // (e.g., skip existing files option was selected and all files already exist on Pennsieve)
        amountOfTimesPennsieveUploadFailed = 0;

        setGuidedProgressBarValue("pennsieve", 100);
        updateDatasetUploadProgressTable("pennsieve", {
          Status: "Dataset upload complete (no new files)",
        });

        swalShowInfo(
          "No files were uploaded in this session",
          `
          <div style="text-align: left;">
            When uploading to an existing dataset with "Skip existing files" selected, no files are uploaded if the files you imported into SODA match what is already on Pennsieve.
            <br><br>
            If you believe this is a mistake, please contact the SODA team using the Contact Us page in the sidebar or follow the documentation <a href="https://docs.sodaforsparc.io/docs/miscellaneous/common-errors/sending-log-files-to-soda-team" target="_blank">here.</a>
           </div>
           `
        );

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
      // Check for network error
      if (!error.response && error.request && error.isAxiosError) {
        const currentPageID = window.CURRENT_PAGE.id;
        await window.savePageChanges(currentPageID);
        clientError(error);
        await swalShowError(
          "Network Error",
          "The server did not respond. Please close SODA and reopen it to try the upload again. SODA will remember any progress in the upload you have made. If the problem persists, please contact support."
        );
        guidedSetNavLoadingState(false);
        transitionFromGuidedModeToHome();
        return;
      }
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
      transitionFromGuidedModeToHome();
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
    transitionFromGuidedModeToHome();
    return;
  }

  // call self so this failure code can run up to 3 times automatically
  guidedGenerateDatasetOnPennsieve();
};

// Handle local generation failure UI + logging in one place
const handleLocalGenerationFailure = async (error) => {
  window.log.error("Error during local dataset generation:", error);
  const errorMessage = userErrorMessage(error);
  guidedResetLocalGenerationUI();
  await swalShowError("Error generating dataset locally", errorMessage);
  guidedSetNavLoadingState(false);
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
        `Not enough free space on disk. Free space: ${bytesToReadableSize(
          freeMemoryInBytes
        )}GB. Dataset size: ${bytesToReadableSize(localDatasetSizeInBytes)}GB`
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

    // Start local generation - catch immediate errors (like validation) without blocking
    client
      .post(
        "/curate_datasets/curation",
        { soda_json_structure: sodaJSONObjCopy, resume: false },
        { timeout: 0 }
      )
      .catch(async (error) => {
        console.error("Error during local dataset generation:", error);
        await handleLocalGenerationFailure(error);
      });

    await trackLocalDatasetGenerationProgress(standardizedDatasetStructure);

    setGuidedProgressBarValue("local", 100);
    updateDatasetUploadProgressTable("local", {
      "Current action": "Generating metadata files",
    });

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
    console.error("Error during local dataset generation:2", error);

    await handleLocalGenerationFailure(error);
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
  if (!datasetSubtitle) {
    return;
  }

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

const guidedAddDatasetDescription = async (bfAccount, datasetName, guidedDatasetDescription) => {
  if (!guidedDatasetDescription) {
    return;
  }

  document.getElementById("guided-dataset-description-upload-tr").classList.remove("hidden");
  const datasetDescriptionUploadText = document.getElementById(
    "guided-dataset-description-upload-text"
  );
  datasetDescriptionUploadText.innerHTML = "Adding dataset description...";
  guidedUploadStatusIcon("guided-dataset-description-upload-status", "loading");

  const previouslyUploadedDescription =
    window.sodaJSONObj["previously-uploaded-data"]["description"];

  if (previouslyUploadedDescription === guidedDatasetDescription) {
    datasetDescriptionUploadText.innerHTML = "Dataset description already added on Pennsieve";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
    return;
  }

  try {
    await client.put(
      `/manage_datasets/datasets/${datasetName}/readme`,
      { updated_readme: guidedDatasetDescription },
      { params: { selected_account: bfAccount } }
    );

    datasetDescriptionUploadText.innerHTML = `Successfully added dataset description!`;
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
    window.sodaJSONObj["previously-uploaded-data"]["description"] = guidedDatasetDescription;
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
    return;
  }

  const bannerRow = document.getElementById("guided-dataset-banner-image-upload-tr");
  const bannerText = document.getElementById("guided-dataset-banner-image-upload-text");
  const bannerStatusId = "guided-dataset-banner-image-upload-status";

  bannerRow.classList.remove("hidden");

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
  if (!datasetLicense) {
    return;
  }

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
};
