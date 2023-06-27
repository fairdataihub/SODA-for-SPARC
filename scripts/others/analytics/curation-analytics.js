/*
    Purpose: Logging analytics for our 'main_curation_function' used to generate datasets in Organize Dataset feature is becoming too complicated
             to justify keeping it outside of its own functions. 

*/
const { determineDatasetLocation } = require("./analytics-utils");
const { getDatasetName, getDatasetOrigin } = require("../../guided-mode/guided-curate-dataset");

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
  increaseInFileSize,
  guidedMode
) => {
  if (!guidedMode) {
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
  } else {
    // track that an Error in the upload has occurred
    let kombuchaEventData = {
      value: 1,
      dataset_id: getDatasetId(sodaJSONObj),
      dataset_name: getDatasetName(sodaJSONObj),
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );

    ipcRenderer.send("track-event", "Error", `Guided Mode - Generate - Dataset`, "Generate", 1);
  }

  file_counter = 0;
  folder_counter = 0;
  get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

  if (!guidedMode) {
    
    let datasetName = "";

    if (sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"] === undefined) {
      // Existing dataset for Pennsieve
      datasetName = sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"];
    } else {
      // New dataset for Pennsieve
      datasetName = sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
    }
    // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    let kombuchaEventData = {
      value: file_counter,
      dataset_name: datasetName,
      origin: determineDatasetLocation(),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_DATASETS,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );
    
    ipcRenderer.send(
      "track-event",
      "Error",
      `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
      "Number of Files",
      file_counter
    );

    // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    // does not need to be logged for Success as that isn't a good way to log the size of the aggregate successful uploads
    kombuchaEventData = {
      value: mainTotalGenerateDatasetSize,
      dataset_name: datasetName,
      origin: determineDatasetLocation(),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_DATASETS,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );
    
    ipcRenderer.send(
      "track-event",
      "Error",
      "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
      "Size",
      mainTotalGenerateDatasetSize
    );
  } else {
    // when we fail we want to know the total amount of files we were trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    let kombuchaEventData = {
      value: file_counter,
      dataset_name: datasetName,
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.FILES,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );
    
    ipcRenderer.send(
      "track-event",
      "Error",
      `Guided Mode - Generate - Dataset - Number of Files`,
      "Number of Files",
      file_counter
    );

    // when we fail we want to know the total size that we are trying to generate; whether not not we did a Pennsieve upload or Local, New, Saved
    // does not need to be logged for Success as that isn't a good way to log the size of the aggregate successful uploads
    kombuchaEventData = {
      value: mainTotalGenerateDatasetSize,
      dataset_name: datasetName,
      origin: getDatasetOrigin(sodaJSONObj),
      destination: dataset_destination,
    };

    ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.GUIDED_MODE,
      kombuchaEnums.Action.GENERATE_DATASET,
      kombuchaEnums.Label.SIZE,
      kombuchaEnums.Status.FAIL,
      kombuchaEventData
    );
    
    ipcRenderer.send(
      "track-event",
      "Error",
      "Guided Mode - Generate - Dataset - Size",
      "Size",
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
      let datasetName = "";

      if (sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"] === undefined) {
        // Existing dataset for Pennsieve
        datasetName = sodaJSONObj?.["bf-dataset-selected"]?.["dataset-name"];
      } else {
        // New dataset for Pennsieve
        datasetName = sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
      }

      const kombuchaEventData = {
        value: high_level_folder_num,
        dataset_id: defaultBfDatasetId,
        dataset_name: datasetName,
        origin: dataset_destination,
        destination: datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
      };

      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.PREPARE_DATASETS,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.MANIFEST_XLSX,
        kombuchaEnums.Status.SUCCESS,
        kombuchaEventData
      );

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
      const kombuchaEventData = {
        value: high_level_folder_num,
        dataset_id: defaultBfDatasetId,
        dataset_name: getDatasetName(sodaJSONObj),
        origin: getDatasetOrigin(sodaJSONObj),
        destination: "Pennsieve",
      };

      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.MANIFEST_XLSX,
        kombuchaEnums.Status.SUCCCESS,
        kombuchaEventData
      );

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

    // log files and bytes uploaded for local dataset generation
    if (dataset_destination == "Local") {
      // local logging
      // log the dataset name as a label. Rationale: Easier to get all unique datasets touched when keeping track of the local dataset's name upon creation in a log.
      let kombuchaEventData = {
        value: mainTotalGenerateDatasetSize,
        dataset_name: dataset_name,
        origin: determineDatasetLocation(),
        destination: dataset_destination,
      };
  
      ipcRenderer.send(
        "track-kombucha",
        kombuchaEnums.Category.GUIDED_MODE,
        kombuchaEnums.Action.GENERATE_DATASET,
        kombuchaEnums.Label.SIZE,
        kombuchaEnums.Status.SUCCESS,
        kombuchaEventData
      );
      
      ipcRenderer.send(
        "track-event",
        "Success",
        "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Local",
        dataset_name
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
    }
  } else {
    // track that a successful upload has occurred
    ipcRenderer.send("track-event", "Success", `Guided Mode - Generate - Dataset`, "Generate", 1);
  }

  if (guidedMode) {
    // for tracking the total size of all the "saved", "new", "local", "pennsieve" datasets by category
    ipcRenderer.send(
      "track-event",
      "Success",
      "Guided Mode - Generate - Dataset - Size",
      datasetLocation,
      main_total_generate_dataset_size
    );

    // track amount of files for datasets by ID or Local
    ipcRenderer.send(
      "track-event",
      "Success",
      `Guided Mode - Generate - Dataset - Number of Files`,
      datasetLocation,
      uploadedFiles
    );
  } else {
    // Free Form Mode
    // for tracking the total size of all the "saved", "new", "local", "pennsieve" datasets by category
    if (dataset_destination !== "Pennsieve" && dataset_destination !== "bf") {
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
      Array.from(document.querySelectorAll(".generate-preview")).forEach((card) => {
        let header = card.querySelector("h5");
        if (header.textContent.includes("folders")) {
          let instruction = card.querySelector("p");
          // log the folder instructions to analytics
          ipcRenderer.send(
            "track-event",
            "Success",
            `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent}`,
            datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
            1
          );
        } else if (header.textContent.includes("existing files")) {
          let instruction = card.querySelector("p");
          ipcRenderer.send(
            "track-event",
            "Success",
            `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Pennsieve - ${instruction.textContent} `,
            datasetLocation === "Pennsieve" ? defaultBfDatasetId : datasetLocation,
            1
          );
        }
      });
    }
  }
};

module.exports = {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
};
