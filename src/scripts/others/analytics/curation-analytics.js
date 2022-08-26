/*
    Purpose: Logging analytics for our 'main_curation_function' used to generate datasets in Organize Dataset feature is becoming too complicated
             to justify keeping it outside of its own functions. 

*/
const { determineDatasetLocation } = require("./analytics-utils");

const BUCKET_SIZE = 500;

// check if the user is modifying an existing local dataset for Curation
// Has to be called after Step 6
const editingExistingLocalDataset = () => {
  // check if the dataset is being generated locally
  if (sodaJSONObj["generate-dataset"]["destination"] !== "local") {
    return false;
  }

  // check if the dataset has merge set as the value for handling existing files
  if (sodaJSONObj["generate-dataset"]["if-existing"] === "merge") {
    return true;
  }

  // else this is a new local dataset generation
  return false;
};

// Sends detailed information about failures that occur when using the Organize Dataset's upload/generation feature to Analytics; Used for providing usage numbers to NIH
const logCurationErrorsToAnalytics = async (
  uploadedFiles,
  uploadedFilesSize,
  dataset_destination,
  mainTotalGenerateDatasetSize,
  increaseInFileSize
) => {
  logCurationForAnalytics(
    "Error",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.PREFIX,
    [],
    determineDatasetLocation()
  );

  logCurationForAnalytics(
    "Error",
    PrepareDatasetsAnalyticsPrefix.CURATE,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    ["Step 7", "Generate", "dataset", `${dataset_destination}`],
    determineDatasetLocation()
  );

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

  // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
  ipcRenderer.send(
    "track-event",
    "Error",
    `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
    "Number of Files",
    file_counter
  );

  // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
  // does not need to be logged for Success as that isn't a good way to log the size of the aggregate successful uploads
  ipcRenderer.send(
    "track-event",
    "Error",
    "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
    "Size",
    mainTotalGenerateDatasetSize
  );

  let datasetLocation = determineDatasetLocation();

  // log failed Local, Saved, or New dataset generation to Google Analytics
  if (datasetLocation !== "Pennsieve") {
    // when we fail we want to know how many files were generated
    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      datasetLocation,
      uploadedFiles
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      datasetLocation,
      file_counter
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
      datasetLocation,
      file_counter
    );

    // log the size that was successfully generated
    // TODO: Make this the last uploaded chunk
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      datasetLocation,
      uploadedFilesSize
    );

    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      datasetLocation,
      mainTotalGenerateDatasetSize
    );

    // get dataset id if available
    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
      datasetLocation,
      mainTotalGenerateDatasetSize
    );
  } else {
    // log the Pennsieve upload session information
    // TODO: Check when an upload has started instead of assuming we fail on upload to Pennsieve
    // some files have been successfully uploaded before the crash occurred. Reasonable to say half of the bucket.
    ipcRenderer.send(
      "track-event",
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE +
        " - Step 7 - Generate - Dataset - Number of Files",
      `${datasetUploadSession.id}`,
      Math.floor(BUCKET_SIZE / 2)
    );

    // track that a session failed so we can answer: "How many files were uploaded in a session before failure?" and "Did any session fail?"
    // the last question is analagous to "Did any uploads to Pennsieve fail?" but has the benefit of helping us answer question one;
    // without an explicit log of a session failing with the amount of files that were attempted that this provides we couldn't answer
    // the first question.
    ipcRenderer.send(
      "track-event",
      "Error",
      PrepareDatasetsAnalyticsPrefix.CURATE +
        " - Step 7 - Generate - Dataset - Number of Files",
      `${datasetUploadSession.id}`,
      file_counter
    );

    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      `${datasetUploadSession.id}`,
      // doesn't need to be incremented like uploadedFiles as this represents the final amount returned from the upload progress function;
      // or just a little less
      increaseInFileSize
    );

    // log the size that was attempted to be uploaded for the given session
    // as above this helps us answer how much was uploaded out of the total before the session failed
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      `${datasetUploadSession.id}`,
      mainTotalGenerateDatasetSize
    );
  }
};

/**
 * If curation was successful for a given dataset, log important information regarding size and number of files that were uploaded.
 * @param {boolean} manifest_files_requested
 * @param {number} main_total_generate_dataset_size
 * @param {string} dataset_name
 * @param {string} dataset_destination
 * @param {number} uploadedFiles
 * @param {boolean} guidedMode
 */
const logCurationSuccessToAnalytics = async (
  manifest_files_requested,
  main_total_generate_dataset_size,
  dataset_name,
  dataset_destination,
  uploadedFiles,
  guidedMode
) => {
  // get dataset id if available
  let datasetLocation = determineDatasetLocation();

  if (manifest_files_requested) {
    let high_level_folder_num = 0;
    if ("dataset-structure" in sodaJSONObj) {
      if ("folders" in sodaJSONObj["dataset-structure"]) {
        for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
          high_level_folder_num += 1;
        }
      }
    }

    if (!guidedMode) {
      ipcRenderer.send(
        "track-event",
        "Success",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest",
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        high_level_folder_num
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest - ${dataset_destination}`,
        datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
        high_level_folder_num
      );
    } else {
      ipcRenderer.send(
        "track-event",
        "Success",
        "Guided Mode - Generate - Manifest",
        defaultBfDatasetId,
        high_level_folder_num
      );
    }
  }

  // TODO: Move this to inititate generate functions
  if (dataset_destination == "Pennsieve" && !guidedMode) {
    show_curation_shortcut();
  }

  if (!guidedMode) {
    // track that a successful upload has occurred
    logCurationForAnalytics(
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.PREFIX,
      [],
      determineDatasetLocation()
    );

    // uploaded to Pennsieve so use an upload session ID
    logCurationForAnalytics(
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      ["Step 7", "Generate", "Dataset", `${dataset_destination}`],
      datasetLocation
    );

    // tracks the total size of datasets that have been generated to Pennsieve and on the user machine
    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
      datasetLocation,
      main_total_generate_dataset_size
    );

    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
      datasetLocation,
      uploadedFiles
    );
  } else {
    // track that a successful upload has occurred
    ipcRenderer.send(
      "track-event",
      "Success",
      `Guided Mode - Generate - Dataset`,
      "Generate",
      1
    );
  }

  // log the dataset name if it was locally generated
  if (dataset_destination === "Local") {
    // log the dataset name as a label. Rationale: Easier to get all unique datasets touched when keeping track of the local dataset's name upon creation in a log.
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Local",
      dataset_name
    );
  }

  if (dataset_destination !== "Pennsieve") {
    // for tracking the total size of all the "saved", "new", "local" datasets by category
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      datasetLocation,
      main_total_generate_dataset_size
    );

    // track amount of files for datasets by ID or Local
    ipcRenderer.send(
      "track-event",
      "Success",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      datasetLocation,
      uploadedFiles
    );
  }
  if (!guidedMode) {
    // log the preview card instructions for any files and folders being generated on Pennsieve
    Array.from(document.querySelectorAll(".generate-preview")).forEach(
      (card) => {
        let header = card.querySelector("h5");
        if (header.textContent.includes("folders")) {
          let instruction = card.querySelector("p");
          // log the folder instructions to analytics
          ipcRenderer.send(
            "track-event",
            "Success",
            `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent}`,
            datasetLocation === "Pennsieve"
              ? defaultBfDatasetId
              : datasetLocation,
            1
          );
        } else if (header.textContent.includes("existing files")) {
          let instruction = card.querySelector("p");
          ipcRenderer.send(
            "track-event",
            "Success",
            `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent} `,
            datasetLocation === "Pennsieve"
              ? defaultBfDatasetId
              : datasetLocation,
            1
          );
        }
      }
    );
  }
};

module.exports = {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
};
